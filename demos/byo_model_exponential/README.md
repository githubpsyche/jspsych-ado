# Bring your own model — exponential discounting

**Pattern 3** (see [`../README.md`](../README.md)): reuse a **packaged task**, supply
your **own model**. This demo is the [delay-discounting demo](../delay_discounting/)
with one change — it fits an **exponential** discounting model
(`V = R·e^(−k·t)`) instead of the packaged hyperbolic one (`V = R/(1+k·t)`). A task
and a model are independent, so the only line that changes is the model import.

Run it (serve the repo statically):

```text
demos/byo_model_exponential/index.html?controller=stan&strategy=ado&debug=1
```

## How the model was authored

The model lives in [`jspsych-ado/models/exponential/`](../../jspsych-ado/models/exponential/).
In your own project that folder would sit under your own `models/` directory — the
steps are the same:

1. **Write the Stan model** — [`exponential.stan`](../../jspsych-ado/models/exponential/exponential.stan).
   It mirrors `hyperbolic.stan` exactly except the value function:

   ```stan
   v_ss = r_ss .* exp(-k * t_ss);   // exponential:  V = R * exp(-k*t)
   v_ll = r_ll .* exp(-k * t_ll);   // (hyperbolic was r ./ (1 + k*t))
   y ~ bernoulli_logit(tau * (v_ll - v_ss));
   ```

2. **Compile it to WASM** (no local toolchain — the stan-playground server). The exact
   commands are in [`PROVENANCE.md`](../../jspsych-ado/models/exponential/PROVENANCE.md);
   commit the resulting `main.js` + `main.wasm`.

3. **Patch the glue** so the WASM survives a bundler: `npm run patch:wasm`.

4. **Write the adapter** — [`model.js`](../../jspsych-ado/models/exponential/model.js).
   It's small: `params`, a `prior` that matches the `.stan` priors, a `responseProb`
   that matches the `.stan` likelihood (this single JS function is what the MI engine
   and the simulator use), and a `stanData` map mirroring the `.stan` data block.

5. **Sanity-check it** — a real-WASM recovery smoke
   ([`exponential_recovery.smoke.mjs`](../../tests/js/exponential_recovery.smoke.mjs))
   confirms the compiled model recovers known parameters, and the likelihood-parity
   smoke confirms the JS `responseProb` matches the compiled Stan likelihood
   draw-for-draw.

## How it's used here

```js
import delayDiscountingTask from ".../tasks/delay_discounting/task.js"; // packaged task
import exponentialModel from ".../models/exponential/model.js";          // your model

jsPsychADO.registerTask(delayDiscountingTask.id, delayDiscountingTask);
jsPsychADO.registerModelPackage(exponentialModel, { stan, n_trials: 42 });
const ado = jsPsychADO.createTimeline(jsPsych, { task: delayDiscountingTask.id, model: exponentialModel.id });
```

(For runnability this demo page goes through the shared demo "experiment shell" — URL
switches + simulation — exactly like the delay-discounting demo. The interface itself
is the three calls above.)
