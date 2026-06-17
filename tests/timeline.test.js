// End-to-end tests for the delay-discounting timeline.
//
// This file closes the "does it work as a real jsPsych experiment" gap. It
// registers the real jsPsych v8 plugins as globals (the timeline references
// `jsPsychHtmlButtonResponse` / `jsPsychCallFunction` as globals, exactly as
// index.html loads them via <script> tags), builds the timeline with a mock
// controller, runs it headlessly via jsPsych's data-only simulation, and
// inspects the resulting data rows.

import { describe, it, expect, beforeAll } from "vitest";
import { initJsPsych } from "jspsych";
import jsPsychHtmlButtonResponse from "@jspsych/plugin-html-button-response";
import jsPsychCallFunction from "@jspsych/plugin-call-function";

import { createDelayDiscountingTimeline } from "../../experiments/delay_discounting/delay_discounting_timeline.js";
import { createMockAdoController } from "../../experiments/delay_discounting/controllers/mock_ado_controller.js";
import { default_dd_config } from "../../experiments/delay_discounting/dd_config.js";

// The timeline reads these as globals, the same way the browser does.
beforeAll(() => {
  globalThis.jsPsychHtmlButtonResponse = jsPsychHtmlButtonResponse;
  globalThis.jsPsychCallFunction = jsPsychCallFunction;
});

const N_TRIALS = 3;

function makeConfig() {
  return { ...default_dd_config, n_trials: N_TRIALS };
}

// Wraps a controller so the test can count how often it is called.
function spyOn(controller) {
  const calls = { start: 0, update: 0 };
  return {
    calls,
    start: (ctx) => {
      calls.start += 1;
      return controller.start(ctx);
    },
    update: (td) => {
      calls.update += 1;
      return controller.update(td);
    },
  };
}

describe("timeline structure", () => {
  it("returns one init trial plus a choice/update pair per trial", () => {
    const jsPsych = initJsPsych();
    const controller = createMockAdoController(makeConfig());
    const trials = createDelayDiscountingTimeline(jsPsych, controller, makeConfig(), {});

    expect(Array.isArray(trials)).toBe(true);
    expect(trials).toHaveLength(1 + 2 * N_TRIALS);
  });

  it("alternates choice trials and update trials after initialization", () => {
    const jsPsych = initJsPsych();
    const controller = createMockAdoController(makeConfig());
    const trials = createDelayDiscountingTimeline(jsPsych, controller, makeConfig(), {});

    // trials[0] is the init call-function.
    expect(trials[0].type).toBe(jsPsychCallFunction);
    for (let i = 0; i < N_TRIALS; i++) {
      const choice = trials[1 + i * 2];
      const update = trials[2 + i * 2];
      expect(choice.type).toBe(jsPsychHtmlButtonResponse);
      expect(update.type).toBe(jsPsychCallFunction);
    }
  });
});

describe("timeline data flow (mock controller, simulated run)", () => {
  let rows;
  let calls;

  beforeAll(async () => {
    const jsPsych = initJsPsych();
    const controller = spyOn(createMockAdoController(makeConfig()));
    calls = controller.calls;
    const config = makeConfig();
    const trials = createDelayDiscountingTimeline(jsPsych, controller, config, {
      ado_mode: "mock",
    });

    await jsPsych.simulate(trials, "data-only");

    rows = jsPsych.data
      .get()
      .filter({ task: "delay_discounting" })
      .values();
  });

  it("produces one data row per choice trial", () => {
    expect(rows).toHaveLength(N_TRIALS);
  });

  it("calls the controller's start once and update once per trial", () => {
    expect(calls.start).toBe(1);
    expect(calls.update).toBe(N_TRIALS);
  });

  it("records the four design fields on every trial", () => {
    for (const row of rows) {
      for (const field of ["t_ss", "t_ll", "r_ss", "r_ll"]) {
        expect(typeof row[field]).toBe("number");
      }
    }
  });

  it("propagates a consistent session id to every trial", () => {
    const ids = new Set(rows.map((row) => row.ado_session_id));
    expect(ids.size).toBe(1);
    expect([...ids][0]).toBeTruthy();
  });

  it("advances ado_trial_index 0, 1, 2 across choice trials", () => {
    expect(rows.map((row) => row.ado_trial_index)).toEqual([0, 1, 2]);
  });

  it("records a binary choice with a matching label", () => {
    const config = makeConfig();
    for (const row of rows) {
      expect([0, 1]).toContain(row.choice);
      expect(row.choice_label).toBe(config.response_labels[row.choice]);
    }
  });

  it("attaches the posterior only once an update has occurred", () => {
    // On the first choice trial no update has run yet, so the controller's
    // posterior is still null and copyPosteriorFields adds nothing.
    expect(rows[0].post_mean_k).toBeUndefined();
    // Later trials carry the posterior forward from the preceding update.
    expect(typeof rows[1].post_mean_k).toBe("number");
    expect(typeof rows[1].post_mean_tau).toBe("number");
    expect(typeof rows[2].post_sd_k).toBe("number");
  });

  it("stores the presented design as an ado_design object", () => {
    for (const row of rows) {
      expect(row.ado_design).toMatchObject({
        t_ss: row.t_ss,
        t_ll: row.t_ll,
        r_ss: row.r_ss,
        r_ll: row.r_ll,
      });
    }
  });
});
