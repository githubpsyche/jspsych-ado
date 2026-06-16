// eslint-disable-next-line no-unused-vars
const jsPsychFreeRecall = (function (jspsych) {
  'use strict'

  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

  const info = {
    name: 'free-recall',
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
       * The letter height of the strings throughout the trial (word
       * list, recognition probe, response, etc.).
       */
      word_size: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Word size',
        default: 48
      },
      /**
       * The letter height of the instruction strings.
       */
      instruction_size: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Instruction size',
        default: 24
      },
      /**
       * The maximum time (in milliseconds) for the display of the
       * recall response stage. Set to zero if you want unlimited time
       * for the participant to make a response.
       */
      maximum_recall_time: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Maximum recall time',
        default: 60000
      },
      /**
       * The maximum time (in milliseconds) for the display of the
       * recall response stage. Set to zero if you want unlimited time
       * for the participant to make a response.
       */
      initial_category_cue: {
        type: jspsych.ParameterType.STRING,
        pretty_name: 'Category cue for recall',
        default: ''
      },
      /**
       * The maximum number of recall responses a participant can submit.
       * Once this limit is reached, the trial will end.
       */
      response_limit: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Response limit',
        default: 1
      }
    }
  }

  class FreeRecallPlugin {
    constructor (jsPsych) {
      this.jsPsych = jsPsych
      this.initialTime = null
      this.recallDisplayTime = null
      this.recallResponses = []
      this.recallWords = []
      this.recallWordResponseTimes = []
      this.boundingBoxElement = null
      this.recallResponseElement = null
      this.keyboardListener = null
      this.timeoutHandler = null
      this.newWord = true
      this.currentResponseEntry = ''
      this.initialRecallTopInstructions = null
      this.recallTopInstructions = null
      this.recallBottomInstructions = null
      this.initialRetrievalCue = ''
      this.retrievalCue = ''
      this.totalResponses = 0
      this.showBoundingBox = false
    }

    clearInternalVariables () {
      this.initialTime = null
      this.recallDisplayTime = null
      this.recallResponses = []
      this.recallWords = []
      this.recallWordResponseTimes = []
      this.recallResponseElement = null
      this.boundingBoxElement = null
      this.keyboardListener = null
      this.timeoutHandler = null
      this.newWord = true
      this.currentResponseEntry = ''
      this.initialRecallTopInstructions = null
      this.recallTopInstructions = null
      this.recallBottomInstructions = null
      this.initialRetrievalCue = ''
      this.retrievalCue = ''
      this.totalResponses = 0
      this.showBoundingBox = false
    }

    createWordElement (
      parentSvg,
      id,
      xPos,
      yPos,
      fontSizePx,
      string,
      colour
    ) {
      const text = document.createElementNS(SVG_NAMESPACE, 'text');
      text.setAttribute('x', xPos);
      text.setAttribute('y', yPos);
      text.setAttribute('font-size', `${fontSizePx}px`);
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('text-anchor', 'middle');
      if (colour) {
          text.setAttribute('fill', colour);
      }
      text.id = id;
      text.innerHTML = string;
      parentSvg.appendChild(text);
      return text;
    }

    createBorderForTextElement(parentSvg, textElement, paddingPx=5, strokeColor = 'purple', strokeWidth = '3') {
      return new Promise((resolve) => {
        setTimeout(() => {
            const bbox = textElement.getBBox();
            const rect = document.createElementNS(SVG_NAMESPACE, 'rect');
            rect.setAttribute('x', bbox.x - paddingPx);
            rect.setAttribute('y', bbox.y - paddingPx);
            rect.setAttribute('width', bbox.width + 2 * paddingPx);
            rect.setAttribute('height', bbox.height + 2 * paddingPx);
            rect.setAttribute('fill', 'none');
            rect.setAttribute('stroke', strokeColor);
            rect.setAttribute('stroke-width', strokeWidth);

            rect.id = `${textElement.id}-border`;

            parentSvg.insertBefore(rect, textElement);
            resolve(rect); // Resolve the promise with the created rect
        }, 0);
    });
    }
  

    displayBlank () {
      this.recallResponseElement.style.visibility = 'hidden'
      this.boundingBoxElement.style.visibility = 'hidden'
      this.initialRecallTopInstructions.style.visibility = 'hidden'
      this.recallTopInstructions.style.visibility = 'hidden'
      this.recallBottomInstructions.style.visibility = 'hidden'
    }

    displayRecallResponse (maxTime, keyboardResponseFn, cancelledFn) {
      this.displayBlank()
      if (this.totalResponses == 0) {
        if (this.showBoundingBox) {
          this.boundingBoxElement.style.visibility = 'visible'
        }
        this.initialRecallTopInstructions.style.visibility = 'visible'
      } else {
        this.recallTopInstructions.style.visibility = 'visible'
        this.boundingBoxElement.style.visibility = 'hidden'
      }
      this.recallBottomInstructions.style.visibility = 'visible'
      this.recallResponseElement.style.visibility = 'visible'
      this.keyboardListener = this.jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: keyboardResponseFn,
        valid_responses: [
          'A',
          'B',
          'C',
          'D',
          'E',
          'F',
          'G',
          'H',
          'I',
          'J',
          'K',
          'L',
          'M',
          'N',
          'O',
          'P',
          'Q',
          'R',
          'S',
          'T',
          'U',
          'V',
          'W',
          'X',
          'Y',
          'Z',
          'enter',
          'backspace',
          ' '
        ],
        rt_method: 'performance',
        persist: false,
        allow_held_key: false
      })

      if (maxTime > 0) {
          this.timeoutHandler = this.jsPsych.pluginAPI.setTimeout(
            cancelledFn,
            maxTime
          )
      }
      if (this.recallDisplayTime === null) {
        this.recallDisplayTime = performance.now()
      }
    }

    async trial (displayElement, trial) {
      this.clearInternalVariables()

      // Get the parameters for this trial, and check basic conditions
      // on whether they seem reasonable.
      const canvasSize = trial.canvas_size
      if (canvasSize < 10) {
        throw new Error('Specified canvas size is too small')
      }
      const wordSize = trial.word_size
      if (wordSize < 5) {
        throw new Error('Word size is too small')
      }
      const instructionSize = trial.instruction_size
      if (instructionSize < 5) {
        throw new Error('Instruction size is too small')
      }
      const maximumRecallTime = trial.maximum_recall_time
      if (maximumRecallTime < 0) {
        throw new Error('Maximum time for recall must be non-negative')
      }
      const categoryCue = trial.initial_category_cue
      if (typeof categoryCue !== 'string') {
        throw new Error('Category cue must be a string')
      }

      // Compute the positioning constants.
      const MIDPOINT_X = canvasSize / 2
      const MIDPOINT_Y = canvasSize / 2
      const TOP_THIRD_Y = canvasSize / 3
      const BOTTOM_THIRD_Y = (2 * canvasSize) / 3

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

      // Create holder for current recall response.
      this.recallResponseElement = this.createWordElement(
        svgElement,
        'recall-response',
        MIDPOINT_X,
        MIDPOINT_Y,
        wordSize,
        '_',
        'white'
      )

      // Create recall display instructions.
      if (categoryCue !== '') {
        this.initialRetrievalCue = 'Recall ' + categoryCue
        this.showBoundingBox = true
      } else {
        this.initialRetrievalCue = 'Recall ANY ITEM'
        this.showBoundingBox = false
      }
      this.retrievalCue = 'Recall ANY ITEM'
      console.log(this.initialRetrievalCue)

      this.initialRecallTopInstructions = this.createWordElement(
        svgElement,
        'recall-top-text',
        MIDPOINT_X,
        TOP_THIRD_Y,
        instructionSize,
        this.initialRetrievalCue,
        'white'
      )
      this.initialRecallTopInstructions.classList.add('instruction-text')

      this.boundingBoxElement = await this.createBorderForTextElement(
        svgElement,
        this.initialRecallTopInstructions,
      )

      this.recallTopInstructions = this.createWordElement(
        svgElement,
        'recall-top-text',
        MIDPOINT_X,
        TOP_THIRD_Y,
        instructionSize,
        this.retrievalCue,
        'white'
      )
      this.recallTopInstructions.classList.add('instruction-text')
      
      this.recallBottomInstructions = this.createWordElement(
        svgElement,
        'recall-bottom-text',
        MIDPOINT_X,
        BOTTOM_THIRD_Y,
        instructionSize,
        'Press ENTER to complete word.',
        'white'
      )
      this.recallBottomInstructions.classList.add('instruction-text')

      const receivedRecallInput = (ev, nextFn) => {
        this.jsPsych.pluginAPI.cancelKeyboardResponse(this.keyboardListener)
        const thisKey = ev.key.toLowerCase()
        const thisRt = ev.rt
  
        if (thisKey === 'enter') {
          this.newWord = true
          this.totalResponses += 1
          this.recallWords.push(this.currentResponseEntry)
          this.currentResponseEntry = ''
          this.recallResponses.push(['ENTER', thisRt])
          this.recallResponseElement.innerHTML = '_'

          // Check if the response limit has been reached
          if (this.totalResponses >= trial.response_limit) {
            endTrial();
            return;
          }
        } else if (thisKey === 'backspace') {
          if (this.currentResponseEntry.length > 0) {
            this.recallResponses.push([thisKey, thisRt])
            this.currentResponseEntry = this.currentResponseEntry.slice(0, -1)
            this.recallResponseElement.innerHTML = this.currentResponseEntry
          }
        } else {
          if (this.newWord) {
            this.recallWordResponseTimes.push(thisRt)
          }
          this.newWord = false
          this.recallResponses.push([thisKey, thisRt])
          this.currentResponseEntry += thisKey
          this.recallResponseElement.innerHTML = this.currentResponseEntry
        }
        
        startRecallResponseDisplay()
      }

      // The function required to complete the trial.
      const endTrial = () => {

        if (this.currentResponseEntry.length > 0) {
          this.totalResponses += 1;
          this.recallWords.push(this.currentResponseEntry);
          this.recallWordResponseTimes.push(0);
        }

        const trialData = {
          load_time: this.initialTime,
          recall_display_time: this.recallDisplayTime,
          category_cue: categoryCue,
          recall_responses: this.recallResponses,
          recall_words: this.recallWords,
          recall_word_response_times: this.recallWordResponseTimes
        }

        console.log(trialData)

        // Clear the timeouts.
        this.jsPsych.pluginAPI.clearAllTimeouts()

        // Clear the keyboard listener.
        // this.jsPsych.pluginAPI.cancelKeyboardResponse(keyboard_listener);
        this.jsPsych.pluginAPI.cancelAllKeyboardResponses() // Not really necessary!

        // Clear the display.
        displayElement.innerHTML = ''

        // Move on to next trial.
        this.jsPsych.finishTrial(trialData)
      }

      const cancelTrial = () => {
        this.jsPsych.pluginAPI.cancelKeyboardResponse(this.keyboardListener)
        this.jsPsych.pluginAPI.clearAllTimeouts()
        endTrial()
      }

      const startRecallResponseDisplay = () => {
        this.displayRecallResponse(
          maximumRecallTime,
          (ev) => receivedRecallInput(ev, () => endTrial()),
          cancelTrial
        )
      }

      // Set the time indicating the plugin has loaded, and begin
      // free recall response.
      this.initialTime = performance.now()
      startRecallResponseDisplay()
    }
  }

  FreeRecallPlugin.info = info

  return FreeRecallPlugin
// eslint-disable-next-line no-undef
})(jsPsychModule)
