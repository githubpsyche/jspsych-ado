// Tests for the pure utility functions and the participant-facing stimulus.
//
// `formatDelay`, `formatReward`, and `copyPosteriorFields` are not individually
// exported by the timeline module, so they are tested through their public
// surface: `makeChoiceStimulus` (which renders rewards/delays exactly as the
// participant sees them) and, for `copyPosteriorFields`, the end-to-end
// timeline test in timeline.test.js.

import { describe, it, expect } from "vitest";

import {
  linspace,
  logspace,
  range,
  default_dd_config,
} from "../../experiments/delay_discounting/dd_config.js";
import { makeChoiceStimulus } from "../../experiments/delay_discounting/delay_discounting_timeline.js";

describe("grid helpers", () => {
  it("linspace includes both endpoints with even spacing", () => {
    expect(linspace(0, 1, 5)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it("linspace returns the requested number of points", () => {
    expect(linspace(0, 10, 11)).toHaveLength(11);
  });

  it("logspace spans the requested powers of the base", () => {
    const values = logspace(-5, 0, 6, 10);
    expect(values).toHaveLength(6);
    expect(values[0]).toBeCloseTo(1e-5, 12);
    expect(values[values.length - 1]).toBeCloseTo(1, 12);
  });

  it("range starts at the start value and stays below the stop value", () => {
    const values = range(12.5, 800, 12.5);
    expect(values[0]).toBe(12.5);
    expect(Math.max(...values)).toBeLessThan(800);
  });
});

describe("makeChoiceStimulus", () => {
  const design = { t_ss: 0, t_ll: 520, r_ss: 437.5, r_ll: 800 };
  const html = makeChoiceStimulus(design);

  it("shows the smaller-sooner reward amount", () => {
    expect(html).toContain("$437.50");
  });

  it("shows the larger-later reward amount", () => {
    expect(html).toContain("$800");
  });

  it("labels an immediate smaller-sooner option as 'now'", () => {
    expect(html).toContain("now");
  });

  it("shows the larger-later delay in weeks", () => {
    expect(html).toContain("520 weeks");
  });

  it("labels both options for the participant", () => {
    expect(html).toContain("Smaller-sooner");
    expect(html).toContain("Larger-later");
  });

  it("renders whole-dollar amounts without trailing zeros", () => {
    // formatReward drops the ".00" so $800 reads cleanly.
    expect(html).not.toContain("$800.00");
  });
});

describe("default_dd_config", () => {
  it("offers the smaller-sooner reward immediately", () => {
    expect(default_dd_config.grid_design.t_ss).toEqual([0]);
  });

  it("maps button indices to SS and LL labels", () => {
    expect(default_dd_config.response_labels[0]).toBe("SS");
    expect(default_dd_config.response_labels[1]).toBe("LL");
  });
});
