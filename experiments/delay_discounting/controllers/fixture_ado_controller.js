function createFixtureAdoController(fixture_path) {
  let fixture = null;
  let session_id = "fixture-session";
  let trial_index = 0;

  async function loadFixture() {
    if (fixture === null) {
      const response = await fetch(fixture_path);
      fixture = await response.json();
    }
    return fixture;
  }

  function getFixtureState(data, index) {
    const trials = data.trials || [];
    if (trials.length === 0) {
      throw new Error("Fixture has no trials.");
    }
    return trials[index % trials.length];
  }

  return {
    start: async function(context) {
      const data = await loadFixture();
      session_id = context.session_id || data.session_id || "fixture-session";
      trial_index = 0;
      const state = getFixtureState(data, trial_index);
      return {
        session_id,
        trial_index,
        next_design: state.next_design,
        post_mean: state.post_mean || null,
        post_sd: state.post_sd || null,
      };
    },

    update: async function(trial_data) {
      const data = await loadFixture();
      trial_index = trial_data.ado_trial_index + 1;
      const state = getFixtureState(data, trial_index);
      return {
        session_id,
        trial_index,
        next_design: state.next_design,
        post_mean: state.post_mean || null,
        post_sd: state.post_sd || null,
      };
    }
  };
}

export { createFixtureAdoController };

