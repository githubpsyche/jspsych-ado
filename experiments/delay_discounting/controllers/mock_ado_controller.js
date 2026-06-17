function makeMockDesign(config, trial_index) {
  const delays = config.grid_design.t_ll;
  const rewards = config.grid_design.r_ss;
  return {
    t_ss: 0,
    t_ll: delays[trial_index % delays.length],
    r_ss: rewards[(trial_index * 7) % rewards.length],
    r_ll: 800,
  };
}

function makeMockPosterior(trial_index) {
  return {
    post_mean: {
      k: 0.05 + trial_index * 0.002,
      tau: 1.0 + trial_index * 0.01,
    },
    post_sd: {
      k: Math.max(0.001, 0.05 - trial_index * 0.001),
      tau: Math.max(0.01, 0.8 - trial_index * 0.01),
    }
  };
}

function createMockAdoController(config) {
  let session_id = "mock-session";
  let trial_index = 0;

  return {
    start: async function(context) {
      session_id = context.session_id || "mock-session";
      trial_index = 0;
      return {
        session_id,
        trial_index,
        next_design: makeMockDesign(config, trial_index),
        post_mean: null,
        post_sd: null,
        api_latency_ms: null,
      };
    },

    update: async function(trial_data) {
      trial_index = trial_data.ado_trial_index + 1;
      const posterior = makeMockPosterior(trial_index);
      return {
        session_id,
        trial_index,
        next_design: makeMockDesign(config, trial_index),
        post_mean: posterior.post_mean,
        post_sd: posterior.post_sd,
        api_latency_ms: null,
      };
    }
  };
}

export { createMockAdoController };
