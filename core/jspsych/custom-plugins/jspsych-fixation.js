// eslint-disable-next-line no-unused-vars
const jsPsychFixation = (function (jspsych) {
  'use strict'

  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

  const info = {
    name: 'fixation',
    parameters: {
      /**
             * The size (in pixels) of the SVG canvas.
             */
      canvas_size: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Canvas size',
        default: 800
      },
      /**
             * The size of each arm of the fixation cross (in pixels)
             */
      fixation_cross_size: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Fixation cross size',
        default: 10
      },
      /**
             * The time (in milliseconds) for the display of the fixation
             * cross. Set to zero if you want to skip the fixation period.
             */
      fixation_time: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Fixation time',
        default: 1000
      }
    }
  }

  class FixationPlugin {
    constructor (jsPsych) {
      this.jsPsych = jsPsych
      this.initialTime = null
      this.fixationDisplayTime = null
      this.fixationCrossElement = null
    }

    clearInternalVariables () {
      this.initialTime = null
      this.fixationDisplayTime = null
      this.fixationCrossElement = null
    }

    createCrossElement (parentSvg, id, xPos, yPos, armLength, colour) {
      const res = document.createElementNS(SVG_NAMESPACE, 'path')
      const dString =
                'M ' +
                (xPos - armLength) +
                ', ' +
                yPos +
                ' ' +
                'L ' +
                (xPos + armLength) +
                ', ' +
                yPos +
                ' ' +
                'M ' +
                xPos +
                ', ' +
                (yPos - armLength) +
                ' ' +
                'L ' +
                xPos +
                ', ' +
                (yPos + armLength)

      res.setAttribute('d', dString)
      res.setAttribute('stroke', colour)
      res.setAttribute('stroke-width', '2px')
      res.id = id
      res.style.visibility = 'hidden'
      parentSvg.appendChild(res)
      return res
    }

    displayFixationCross (fixationTime, nextFn) {
      if (fixationTime <= 0) {
        nextFn()
      } else {
        this.fixationDisplayTime = performance.now()
        this.fixationCrossElement.style.visibility = 'visible'
        this.jsPsych.pluginAPI.setTimeout(nextFn, fixationTime)
      }
    }

    trial (displayElement, trial) {
      this.clearInternalVariables()

      // Get the parameters for this trial, and check basic conditions
      // on whether they seem reasonable.
      const canvasSize = trial.canvas_size
      if (canvasSize < 10) {
        throw new Error('Specified canvas size is too small')
      }

      const fixationCrossSize = trial.fixation_cross_size
      if (fixationCrossSize < 2) {
        throw new Error('Fixation cross size is too small')
      }
      const fixationTime = trial.fixation_time
      if (fixationTime < 0) {
        throw new Error('Must have non-negative fixation time')
      }

      // Compute the positioning constants.
      const MIDPOINT_X = canvasSize / 2
      const MIDPOINT_Y = canvasSize / 2

      // Construct the SVG element, set attributes, etc.
      const svgElement = document.createElementNS(SVG_NAMESPACE, 'svg')
      svgElement.id = 'jspsych-lpl-recall-recog-probe'
      svgElement.setAttribute('height', canvasSize)
      svgElement.setAttribute('width', canvasSize)
      svgElement.setAttribute(
        'viewBox',
        '0 0 ' + canvasSize.toString() + ' ' + canvasSize.toString()
      )
      displayElement.appendChild(svgElement)

      // Construct the fixation cross.
      this.fixationCrossElement = this.createCrossElement(
        svgElement,
        'fixation-cross',
        MIDPOINT_X,
        MIDPOINT_Y,
        fixationCrossSize,
        'white'
      )

      // The function required to complete the trial.
      const endTrial = () => {
        const trialData = {
          load_time: this.initialTime,
          fixation_display_time: this.fixationDisplayTime
        }

        // Clear the timeouts.
        this.jsPsych.pluginAPI.clearAllTimeouts()

        // Clear the display.
        displayElement.innerHTML = ''

        // End the trial.
        this.jsPsych.finishTrial(trialData)
      }

      // Set the time indicating the plugin has loaded, and begin the
      // presentation.
      this.initialTime = performance.now()
      this.displayFixationCross(fixationTime, endTrial)
    }
  }
  FixationPlugin.info = info

  return FixationPlugin
// eslint-disable-next-line no-undef
})(jsPsychModule)
