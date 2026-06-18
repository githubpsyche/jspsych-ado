# Adding a model to jspsych-ado

> ⚠️ **WORK IN PROGRESS — starter draft.** The model interface and these instructions
> are still settling and will change. This is a first pass to capture the seam, not
> the final shape of the "build/add a model" documentation.

`jspsych-ado` is built so that adding a model is **dropping a folder and making one
`registerModel` call**. The engine (`../ado/mi_engine.js`), the Stan worker
(`../ado/stan_worker.js`), the controller (`../controllers/stan_ado_controller.js`),
and the generic timeline (`../ado/ado_timeline.js`) are model- and task-agnostic —
you never edit them.

A model package lives in `jspsych-ado/models/<name>/`:

| File | What it is |
| --- | --- |
| `<name>.stan` | the model — source of truth for the **likelihood + priors** |
| `main.js` + `main.wasm` | the compiled WebAssembly model (committed; see [models/README.md](README.md) for the no-toolchain compile steps) |
| `model.js` | the JS adapter the rest of the package reads |

The shipped **`jspsych-ado/models/hyperbolic/`** package is the reference
implementation — read it alongside this guide.

## The adapter (`model.js`)

The default export describes the model and how its task is shown:

| Field | Purpose |
| --- | --- |
| `id` | string id saved into the data |
| `params` | parameter names to estimate/summarize, e.g. `["k", "tau"]` |
| `prior` | `{ param: { dist, ... } }` — **must match the `.stan` priors**. The engine samples it to choose the first design before any data exist |
| `moduleUrl` | `new URL("./main.js", import.meta.url).href` |
| `buildData` | `(trials) => {…}` — assemble the `.stan` `data` block from the collected trials; **must match the `.stan` data block** |
| `choiceProbLL` | `(design, paramDraw) => probability` — the model's response likelihood; **must match the `.stan` likelihood**. The engine uses it to score candidate designs, and the simulated participant draws from it |
| `presentation` | how a design is rendered and a response collected (below) |
| `choices` | response labels/keys in index order |
| `response_labels` | human-readable labels for the recorded response |
| `posterior_display` | optional per-parameter chart labels/ranges for the debug view |
| `responseToOutcome` | optional `(design, response) => value` — map the collected response to the value your model scores; defaults to using the response as-is |

The adapter is the JS mirror of the `.stan` file. Keep `choiceProbLL`, `buildData`,
and `prior` in lockstep with it — the adapter unit test (`tests/js/<name>.test.mjs`)
pins `choiceProbLL` against the `.stan` formula.

```js
// jspsych-ado/models/<name>/model.js  (shape; see models/hyperbolic for a full one)
export default {
  id: "my_model",
  params: ["theta"],
  prior: { theta: { dist: "lognormal", meanlog: -1, sdlog: 1 } },
  moduleUrl: new URL("./main.js", import.meta.url).href,
  buildData: (trials) => ({ N: trials.length, /* the columns your .stan data block declares */ }),
  choiceProbLL: (design, draw) => { /* probability, matching your .stan likelihood */ },
  presentation: { /* see below */ },
  choices: [/* ... */],
  response_labels: { /* ... */ },
};
```

`choiceProbLL` returns the probability of the response your `.stan` model treats as
`y = 1` for that design under one parameter draw — the same quantity the `.stan`
likelihood describes, so the two stay in agreement.

## Presentation: rendering a design and collecting a response

`presentation` is the stimulus seam — the only place that knows what your task looks
like. Two ways to provide it:

- **Single response screen (convenience path):** supply `makeStimulus(design) => HTML`
  (plus optional `button_html(design)`, `keymap { key: index }`, `prompt`). The
  timeline builds the trial for you. This is what `models/hyperbolic` uses.
- **Custom / multi-frame:** supply `getChoiceTrials(ctx) => [jsPsych trials]`. Build
  the trials from the shipped factories (`htmlButtonChoice`, `canvasFrame`,
  `canvasResponse` in `../ado/ado_timeline.js`); exactly one trial collects the
  response. `ctx` exposes `getDesign()`, `getState()`, `choices`, `run_context`,
  `trial_number`, and `task`.

Optionally add `describeDesign(design) => string[]` for readable debug-log lines
(defaults to generic `key=value`).

## Register and run (the façade)

```js
import { jsPsychADO } from "../../jspsych-ado/index.js";
import model from "../../jspsych-ado/models/<name>/model.js";

jsPsychADO.registerModel(model.id, {
  moduleUrl: model.moduleUrl,
  prior: model.prior,
  params: model.params,
  design_grid,                                       // candidate designs: object of value arrays, or an array of designs
  linkProb: (theta, design) => model.choiceProbLL(design, theta),  // façade flips the argument order
  buildData: model.buildData,                        // the model's own data builder, used as-is
  response_labels: model.response_labels,
  presentation: model.presentation,
  choices: model.choices,
  posterior_display: model.posterior_display,
  stan, n_trials,
});

const timeline = jsPsychADO.createTimeline(jsPsych, { model: model.id, task: "<task>" }, run_context);
```

If you register from an inline Stan **source string** instead of a precompiled
`moduleUrl`, supply `toStanData(trials)` in place of `buildData` (the façade reshapes
the rows for you) and call `await jsPsychADO.prepareModels({ compileServer })` once
before building any timelines.

## Compiling the `.stan`

No local toolchain needed — use the curl / web app / Docker steps in
[models/README.md](README.md), then commit the resulting `main.js` + `main.wasm`.

## Checklist

- [ ] `<name>.stan` written; `main.js` + `main.wasm` compiled and committed.
- [ ] `model.js`: `choiceProbLL`, `buildData`, and `prior` agree with the `.stan` file.
- [ ] `presentation` supplies `makeStimulus` (single screen) or `getChoiceTrials` (custom).
- [ ] `tests/js/<name>.test.mjs` pins `choiceProbLL` against the `.stan` formula.
- [ ] register + run from an experiment page — nothing under `jspsych-ado/ado/`,
      `jspsych-ado/controllers/`, or `jspsych-ado/index.js` needed editing.
