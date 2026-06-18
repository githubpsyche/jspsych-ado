// Model-agnostic mock ADO controller. Satisfies the same start/update contract as
// the in-browser Stan controller, but without WASM — for fast timeline/UI work and
// browser smoke tests. It knows nothing about any specific task: designs are drawn
// from the candidate grid via the generic engine, and mock posteriors are emitted
// for whatever parameter names the model declares.

import { enumerateDesigns } from "../ado/mi_engine.js";

/**
 * Create a deterministic local controller for any registered model.
 *
 * @param {Object} options
 * @param {Object|Array} options.grid_design - Candidate design grid (object of value
 *   arrays, or a curated array of designs) — same shape the Stan controller takes.
 * @param {string[]} [options.params] - Parameter names to emit mock posteriors for
 *   (e.g. ["k", "tau"]); defaults to none.
 * @returns {Object} Controller with async start(context) and update(trial_data).
 */
function createMockAdoController({ grid_design, params = [] } = {}) {
  const designs = enumerateDesigns(grid_design);
  if (designs.length === 0) {
    throw new Error("createMockAdoController: grid_design produced no candidate designs.");
  }

  let session_id = "mock-session";
  let trial_index = 0;

  // Walk the candidate designs deterministically so successive trials differ.
  function mockDesign(index) {
    return designs[(index * 7) % designs.length];
  }

  // Deterministic per-parameter summaries that drift with the trial index, so the
  // live posterior charts have something monotone-ish to render.
  function mockPosterior(index) {
    const post_mean = {};
    const post_sd = {};
    params.forEach((param, p) => {
      post_mean[param] = 0.05 + index * 0.002 * (p + 1);
      post_sd[param] = Math.max(0.001, 0.05 - index * 0.001);
    });
    return { post_mean, post_sd };
  }

  return {
    /**
     * Start a mock ADO session and return the first deterministic design.
     *
     * @param {Object} context - Run context; session_id is used if present.
     * @returns {Promise<Object>} ADO state with next_design and null posteriors.
     */
    start: async function(context) {
      session_id = (context && context.session_id) || "mock-session";
      trial_index = 0;
      return {
        session_id,
        trial_index,
        next_design: mockDesign(trial_index),
        post_mean: null,
        post_sd: null,
        api_latency_ms: null,
      };
    },

    /**
     * Advance the mock controller after one completed jsPsych choice row.
     *
     * @param {Object} trial_data - Choice row with ado_trial_index.
     * @returns {Promise<Object>} Updated mock ADO state.
     */
    update: async function(trial_data) {
      trial_index = trial_data.ado_trial_index + 1;
      const { post_mean, post_sd } = mockPosterior(trial_index);
      return {
        session_id,
        trial_index,
        next_design: mockDesign(trial_index),
        post_mean,
        post_sd,
        api_latency_ms: null,
      };
    }
  };
}

export { createMockAdoController };
