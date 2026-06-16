function formatDelay(delay) {
  if (delay === 0) {
    return "now";
  }
  if (delay === 1) {
    return "1 week";
  }
  if (delay < 1) {
    return `${delay} weeks`;
  }
  return `${delay} weeks`;
}

function formatReward(reward) {
  return `$${Number(reward).toFixed(2).replace(".00", "")}`;
}

function makeChoiceStimulus(design) {
  return `
    <div style="max-width: 900px; margin: 0 auto;">
      <p style="font-size: 22px;">Choose the option you prefer.</p>
      <div style="display: flex; gap: 30px; justify-content: center; align-items: stretch;">
        <div style="border: 1px solid #ccc; padding: 24px; width: 320px;">
          <p style="font-size: 22px;"><strong>Smaller-sooner</strong></p>
          <p style="font-size: 36px;">${formatReward(design.r_ss)}</p>
          <p style="font-size: 22px;">${formatDelay(design.t_ss)}</p>
        </div>
        <div style="border: 1px solid #ccc; padding: 24px; width: 320px;">
          <p style="font-size: 22px;"><strong>Larger-later</strong></p>
          <p style="font-size: 36px;">${formatReward(design.r_ll)}</p>
          <p style="font-size: 22px;">${formatDelay(design.t_ll)}</p>
        </div>
      </div>
      <p style="font-size: 16px;">Press the button for the option you prefer.</p>
    </div>
  `;
}

function copyPosteriorFields(data, ado_state) {
  if (ado_state.post_mean) {
    data.post_mean_k = ado_state.post_mean.k;
    data.post_mean_tau = ado_state.post_mean.tau;
  }
  if (ado_state.post_sd) {
    data.post_sd_k = ado_state.post_sd.k;
    data.post_sd_tau = ado_state.post_sd.tau;
  }
}

function createDelayDiscountingTimeline(jsPsych, adaptive_controller, config, run_context = {}) {
  let ado_state = null;
  let current_design = null;
  let last_choice_data = null;

  const initialize_ado = {
    type: jsPsychCallFunction,
    async: true,
    func: function(done) {
      adaptive_controller.start(run_context).then(result => {
        ado_state = result;
        current_design = result.next_design;
        done({
          ado_event: "start",
          ado_session_id: result.session_id,
          ado_trial_index: result.trial_index,
          ado_mode: run_context.ado_mode,
        });
      });
    }
  };

  const trials = [initialize_ado];

  for (let i = 0; i < config.n_trials; i++) {
    trials.push({
      type: jsPsychHtmlButtonResponse,
      stimulus: function() {
        return makeChoiceStimulus(current_design);
      },
      choices: ["Smaller-sooner", "Larger-later"],
      data: function() {
        return {
          task: "delay_discounting",
          ado_session_id: ado_state.session_id,
          ado_trial_index: ado_state.trial_index,
          trial_number: i + 1,
          t_ss: current_design.t_ss,
          t_ll: current_design.t_ll,
          r_ss: current_design.r_ss,
          r_ll: current_design.r_ll,
        };
      },
      on_finish: function(data) {
        data.choice = data.response;
        data.choice_label = config.response_labels[data.choice];
        data.ado_design = {
          t_ss: data.t_ss,
          t_ll: data.t_ll,
          r_ss: data.r_ss,
          r_ll: data.r_ll,
        };
        copyPosteriorFields(data, ado_state);
        last_choice_data = data;
      }
    });

    trials.push({
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        adaptive_controller.update(last_choice_data).then(result => {
          ado_state = result;
          current_design = result.next_design;
          done({
            ado_event: "update",
            ado_session_id: result.session_id,
            ado_trial_index: result.trial_index,
            ado_next_design: result.next_design,
            ado_post_mean: result.post_mean,
            ado_post_sd: result.post_sd,
          });
        });
      }
    });
  }

  return trials;
}

export { createDelayDiscountingTimeline, makeChoiceStimulus };

