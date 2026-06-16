const jsPsychItemPresentation = (function (jspsych) {
  'use strict'

  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

  const info = {
    name: 'item-presentation',
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
             * The initial word list to be displayed.
             */
      word_list: {
        type: jspsych.ParameterType.STRING,
        pretty_name: 'Word list',
        array: true,
        default: []
      },
      /**
             * The category list for the word list.
             */
      category_list: {
        type: jspsych.ParameterType.STRING,
        pretty_name: 'Category list',
        array: true,
        default: []
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
             * The letter height of the category strings.
             */
      category_size: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Category size',
        default: 24
      },
      /**
             * The time (in milliseconds) for the display of each word in
             * the memory list. Needs to be positive.
             */
      word_time: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Word time',
        default: 2000
      },
      /**
             * The time (in milliseconds) for the blank interval between
             * each word in the word list. If set to zero, each word is
             * immediately shown after the previous word.
             */
      inter_word_time: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Inter-word time',
        default: 1000
      }
    }
  }

  class ItemPresentationPlugin {
    constructor (jsPsych) {
      this.jsPsych = jsPsych
      this.initialTime = null
      this.wordListDisplayTimes = []
      this.wordListElements = []
      this.categoryListElements = []
    }

    clearInternalVariables () {
      this.initialTime = null
      this.wordListDisplayTimes = []
      this.wordListElements = []
      this.categoryListElements = []
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
      const res = document.createElementNS(SVG_NAMESPACE, 'text')
      res.setAttribute('x', xPos)
      res.setAttribute('y', yPos)
      res.setAttribute('font-size', fontSizePx.toString() + 'px')
      res.setAttribute('dominant-baseline', 'middle') // also try 'central'
      res.setAttribute('text-anchor', 'middle')
      if (colour) {
        res.setAttribute('fill', colour)
      }
      res.id = id
      res.style.visibility = 'hidden'
      res.innerHTML = string
      parentSvg.appendChild(res)
      return res
    }

    displayBlank () {
      for (let i = 0; i < this.wordListElements.length; i++) {
        this.wordListElements[i].style.visibility = 'hidden'
        if (this.categoryListElements.length > 0) {
          this.categoryListElements[i].style.visibility = 'hidden'
        }
      }
    }

    displayWordList (wordTime, interWordTime, nextFn) {
      const wordsShown = this.wordListDisplayTimes.length

      if (wordsShown >= this.wordListElements.length) {
        nextFn()
      } else {
        this.wordListElements[wordsShown].style.visibility = 'visible'
        if (this.categoryListElements.length > 0) {
          this.categoryListElements[wordsShown].style.visibility = 'visible'
        }
        this.wordListDisplayTimes.push(performance.now())

        if (interWordTime > 0) {
          this.jsPsych.pluginAPI.setTimeout(() => {
            this.displayBlank()
            this.jsPsych.pluginAPI.setTimeout(() => {
              this.displayWordList(wordTime, interWordTime, nextFn)
            }, interWordTime)
          }, wordTime)
        } else {
          this.jsPsych.pluginAPI.setTimeout(() => {
            this.displayWordList(wordTime, interWordTime, nextFn)
          }, wordTime)
        }
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

      const wordSize = trial.word_size
      if (wordSize < 5) {
        throw new Error('Word size is too small')
      }

      const categorySize = trial.category_size
      if (categorySize < 5) {
        throw new Error('Category size is too small')
      }

      const wordTime = trial.word_time
      if (wordTime <= 0) {
        throw new Error('Word list display time must be positive')
      }
      const interWordTime = trial.inter_word_time
      if (interWordTime < 0) {
        throw new Error('Inter-word display time must be non-negative')
      }

      const wordList = trial.word_list
      const categoryList = trial.category_list

      // Compute the positioning constants.
      const MIDPOINT_X = canvasSize / 2
      const MIDPOINT_Y = canvasSize / 2
      const TOP_THIRD_Y = canvasSize / 3

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

      // Construct the initial word list for display.
      for (let i = 0; i < wordList.length; i++) {
        const thisWord = this.createWordElement(
          svgElement,
          'word-list-' + (i + 1).toString(),
          MIDPOINT_X,
          MIDPOINT_Y,
          wordSize,
          wordList[i],
          'white'
        )
        thisWord.classList.add('stimulus-word')
        this.wordListElements.push(thisWord)
      }

      // Construct the category list for display.
      for (let i = 0; i < categoryList.length; i++) {
        const thisWord = this.createWordElement(
          svgElement,
          'category-list-' + (i + 1).toString(),
          MIDPOINT_X,
          TOP_THIRD_Y,
          categorySize,
          categoryList[i],
          'white'
        )
        thisWord.classList.add('stimulus-category')
        this.categoryListElements.push(thisWord)
      }

      // The function required to complete the trial.
      const endTrial = () => {
        const trialData = {
          load_time: this.initialTime,
          word_display_times: this.wordListDisplayTimes,
          word_list: wordList,
          category_list: categoryList
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
      this.displayWordList(wordTime, interWordTime, endTrial)
    }
  }

  ItemPresentationPlugin.info = info

  return ItemPresentationPlugin
// eslint-disable-next-line no-undef
})(jsPsychModule)
