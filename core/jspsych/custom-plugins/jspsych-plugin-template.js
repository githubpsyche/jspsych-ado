// eslint-disable-next-line no-unused-vars
const jsCuedRecall = (function (jspsych) {
  'use strict'

  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

  const info = {
    name: 'cued-recall',
    parameters: {
      /**
       * The size (in pixels) of the SVG canvas.
       */
      canvas_size: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Canvas size',
        default: 800,
      },
      /**
       * The probe word used in the yes--no recognition.
       */
      probe_word: {
        type: jspsych.ParameterType.STRING,
        pretty_name: 'Probe word',
        default: undefined,
      },
      /**
       * The letter height of the strings throughout the trial (word
       * list, recognition probe, response, etc.).
       */
      word_size: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Word size',
        default: 48,
      },
      /**
       * The letter height of the instruction strings.
       */
      instruction_size: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Instruction size',
        default: 24,
      },
      /**
       * The maximum time (in milliseconds) for the display of the
       * recognition probe. Set to zero if you want unlimited time for
       * the participant to make a response.
       */
      maximum_recognition_time: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Maximum recognition time',
        default: 3000,
      },
    }
  }

  class PluginNamePlugin {
    constructor (jsPsych) {
      this.jsPsych = jsPsych
    }

    trial (displayElement, trial) {
      // data saving
      const trialData = {
        parameter_name: 'parameter value'
      }

      // end trial
      this.jsPsych.finishTrial(trialData)
    }
  }
  PluginNamePlugin.info = info
  return PluginNamePlugin
// eslint-disable-next-line no-undef
})(jsPsychModule)
