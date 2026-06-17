// Manual smoke test: real Stan WASM inference + ADO loop, parameter recovery,
// sweeping BOTH k and tau to show the pipeline tracks each parameter.
//
// This is NOT part of `node --test` because it loads the BROWSER wasm module
// (compiled with -sENVIRONMENT=web) in node by shimming `fetch` for file: URLs.
// It exercises the full pipeline the browser uses minus the Web Worker: the
// hyperbolic.stan model, buildData, paramName extraction, summarizeDraws, MI design
// selection, and the (model-agnostic) simulator drawing from model.choiceProbLL.
//
// Run:  node tests/js/stan_recovery.smoke.mjs
//
// Expect: post-mean k recovers close to the true k across settings (ADO optimizes
// for k identifiability). tau is only weakly identifiable from a few dozen binary
// choices, so it is reported but not asserted — slow/partial tau recovery is
// expected, not a bug.

import { readFile } from "node:fs/promises";

// Make the web-only emscripten module loadable in node: pretend we are in a web
// environment and teach fetch to read the sibling .wasm from disk.
globalThis.window = globalThis.window || {};
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  const s = url.toString();
  if (s.startsWith("file:")) {
    const buf = await readFile(new URL(s));
    return {
      ok: true,
      status: 200,
      url: s,
      arrayBuffer: async () =>
        buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    };
  }
  return realFetch(url, opts);
};

const StanModel = (await import("../../core/tinystan/index.mjs")).default;
const hyp = (await import("../../experiments/delay_discounting/models/hyperbolic/model.js")).default;
const { enumerateDesigns, selectOptimalDesign, summarizeDraws, samplePriorDraws } = await import(
  "../../experiments/delay_discounting/ado/mi_engine.js"
);
const { createSeededRng, simulateDelayDiscountingChoice } = await import(
  "../../experiments/delay_discounting/dd_simulation.js"
);
const { default_dd_config } = await import("../../experiments/delay_discounting/dd_config.js");

const createModule = (await import(hyp.moduleUrl)).default;
const model = await StanModel.load(createModule, () => {});
console.log("stan version:", model.stanVersion());

const designs = enumerateDesigns(default_dd_config.grid_design);
const sample_config = { ...default_dd_config.stan };
const N_TRIALS = 30;

/**
 * Run the adaptive loop against a simulated participant with the given true
 * parameters and return the recovered posterior means.
 */
function runRecovery(trueParams, seed) {
  const prior_rng = createSeededRng(seed);
  const sim_rng = createSeededRng(seed + 1);
  const sim_config = { params: trueParams, rt: { choice: 0 } };

  let { design } = selectOptimalDesign(designs, samplePriorDraws(hyp.prior, 2000, prior_rng), hyp.choiceProbLL);
  const trials = [];
  let post_mean = null;

  for (let t = 0; t < N_TRIALS; t++) {
    const sim = simulateDelayDiscountingChoice(design, sim_config, sim_rng, hyp);
    trials.push({ ...design, choice: sim.response });

    const fit = model.sample({ data: hyp.buildData(trials), ...sample_config });
    const ki = fit.paramNames.indexOf("k");
    const ti = fit.paramNames.indexOf("tau");
    const draws = fit.draws[ki].map((k, s) => ({ k, tau: fit.draws[ti][s] }));

    ({ post_mean } = summarizeDraws(draws, hyp.params));
    ({ design } = selectOptimalDesign(designs, draws, hyp.choiceProbLL));
  }
  return post_mean;
}

// Change k (tau fixed), then change tau (k fixed). Each row is one full ADO run.
const settings = [
  { sweep: "k",   k: 1e-4, tau: 2.5 },
  { sweep: "k",   k: 1e-3, tau: 2.5 },
  { sweep: "k",   k: 1e-2, tau: 2.5 },
  { sweep: "tau", k: 5e-3, tau: 0.5 },
  { sweep: "tau", k: 5e-3, tau: 2.5 },
  { sweep: "tau", k: 5e-3, tau: 5.0 },
];

console.log(`\n${N_TRIALS} adaptive trials per run.\n`);
console.log("sweep | true k    true tau | rec k     rec tau | k within 5x?");
console.log("------+--------------------+-------------------+-------------");

let all_k_ok = true;
let seed = 100;
for (const s of settings) {
  const rec = runRecovery({ k: s.k, tau: s.tau }, seed);
  seed += 10;
  const k_ok = Math.abs(Math.log(rec.k) - Math.log(s.k)) < Math.log(5);
  all_k_ok = all_k_ok && k_ok;
  console.log(
    `${s.sweep.padEnd(5)} | ${s.k.toExponential(1).padEnd(9)} ${String(s.tau).padEnd(8)} | ` +
    `${rec.k.toExponential(1).padEnd(9)} ${rec.tau.toFixed(2).padEnd(7)} | ${k_ok ? "yes" : "NO"}`
  );
}

console.log(
  all_k_ok
    ? "\nPASS: k recovered within a factor of 5 for every setting (tau reported; weakly identified)."
    : "\nFAIL: k recovery off for at least one setting."
);
process.exit(all_k_ok ? 0 : 1);
