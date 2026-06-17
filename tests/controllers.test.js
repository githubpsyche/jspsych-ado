// Tests for the mock and fixture adaptive controllers in isolation (no jsPsych).
//
// These two controllers back every JS integration test, so they need to honour
// the controller contract precisely: start() yields trial 0, update() advances
// the trial counter, and next_design stays inside the configured grid.

import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMockAdoController } from "../../experiments/delay_discounting/controllers/mock_ado_controller.js";
import { createFixtureAdoController } from "../../experiments/delay_discounting/controllers/fixture_ado_controller.js";
import { default_dd_config } from "../../experiments/delay_discounting/dd_config.js";

const DESIGN_FIELDS = ["t_ss", "t_ll", "r_ss", "r_ll"];

describe("mock controller", () => {
  it("start() returns trial 0 with a complete design", async () => {
    const controller = createMockAdoController(default_dd_config);
    const state = await controller.start({ session_id: "s1" });

    expect(state.session_id).toBe("s1");
    expect(state.trial_index).toBe(0);
    for (const field of DESIGN_FIELDS) {
      expect(typeof state.next_design[field]).toBe("number");
    }
  });

  it("update() advances the trial index", async () => {
    const controller = createMockAdoController(default_dd_config);
    await controller.start({ session_id: "s1" });

    const result = await controller.update({ ado_trial_index: 0 });
    expect(result.trial_index).toBe(1);

    const next = await controller.update({ ado_trial_index: 1 });
    expect(next.trial_index).toBe(2);
  });

  it("returns a posterior after the first update", async () => {
    const controller = createMockAdoController(default_dd_config);
    await controller.start({ session_id: "s1" });
    const result = await controller.update({ ado_trial_index: 0 });

    expect(typeof result.post_mean.k).toBe("number");
    expect(typeof result.post_mean.tau).toBe("number");
    expect(typeof result.post_sd.k).toBe("number");
    expect(typeof result.post_sd.tau).toBe("number");
  });

  it("varies the design across trials rather than repeating one", async () => {
    const controller = createMockAdoController(default_dd_config);
    await controller.start({ session_id: "s1" });

    const designs = [];
    for (let i = 0; i < 5; i++) {
      const result = await controller.update({ ado_trial_index: i });
      designs.push(JSON.stringify(result.next_design));
    }
    expect(new Set(designs).size).toBeGreaterThan(1);
  });

  it("draws designs from the configured grid", async () => {
    const controller = createMockAdoController(default_dd_config);
    const state = await controller.start({ session_id: "s1" });

    expect(default_dd_config.grid_design.t_ll).toContain(state.next_design.t_ll);
    expect(default_dd_config.grid_design.r_ss).toContain(state.next_design.r_ss);
  });
});

describe("fixture controller", () => {
  const fixtureData = {
    session_id: "fixture-1",
    trials: [
      {
        next_design: { t_ss: 0, t_ll: 1, r_ss: 100, r_ll: 800 },
        post_mean: { k: 0.01, tau: 1.0 },
        post_sd: { k: 0.02, tau: 0.5 },
      },
      {
        next_design: { t_ss: 0, t_ll: 26, r_ss: 400, r_ll: 800 },
        post_mean: { k: 0.02, tau: 1.1 },
        post_sd: { k: 0.015, tau: 0.4 },
      },
      {
        next_design: { t_ss: 0, t_ll: 260, r_ss: 600, r_ll: 800 },
        post_mean: { k: 0.03, tau: 1.2 },
        post_sd: { k: 0.01, tau: 0.3 },
      },
    ],
  };

  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({
      json: async () => fixtureData,
    }));
  });

  it("start() replays the first recorded state", async () => {
    const controller = createFixtureAdoController("any/path.json");
    const state = await controller.start({});

    expect(state.trial_index).toBe(0);
    expect(state.next_design).toEqual(fixtureData.trials[0].next_design);
  });

  it("update() advances through recorded states in order", async () => {
    const controller = createFixtureAdoController("any/path.json");
    await controller.start({});

    const second = await controller.update({ ado_trial_index: 0 });
    expect(second.trial_index).toBe(1);
    expect(second.next_design).toEqual(fixtureData.trials[1].next_design);

    const third = await controller.update({ ado_trial_index: 1 });
    expect(third.trial_index).toBe(2);
    expect(third.next_design).toEqual(fixtureData.trials[2].next_design);
  });

  it("surfaces the recorded posterior alongside the design", async () => {
    const controller = createFixtureAdoController("any/path.json");
    await controller.start({});
    const result = await controller.update({ ado_trial_index: 0 });

    expect(result.post_mean).toEqual(fixtureData.trials[1].post_mean);
    expect(result.post_sd).toEqual(fixtureData.trials[1].post_sd);
  });
});
