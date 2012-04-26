global = window or exports

class global.DiscoballOptions extends Backbone.Model

	defaults:
		"cascade": 1
		"centrality-adjustment": 0
		"centrality-attraction": 1
		"color-bias-alpha": 0.75
		"color-cycle-period": 250
		"grid-rectangles": 50
		"lifetime": 3
		"size-variation": 1
		"transparency": 1
		"minima":
			"cascade": 1
			"centrality-adjustment": 0
			"centrality-attraction": 0.01
			"color-bias-alpha": 0
			"color-cycle-period": 0
			"grid-rectangles": 0
			"lifetime": 1
			"size-variation": 1
			"transparency": 0
		"maxima":
			"cascade": 10
			"centrality-adjustment": 100
			"centrality-attraction": 10
			"color-bias-alpha": 100
			"color-cycle-period": 2000
			"grid-rectangles": 200
			"lifetime": 200
			"size-variation": 2
			"transparency": 1

	randomize: ->
		@bind("draw", =>
			options = {}
			maxima = @get("maxima")
			minima = @get("minima")
			for property of @attributes
				continue if property in ["maxima", "minima"]
				[maximum, minimum] = [maxima[property], minima[property]]
				spread = maximum - minimum
				options[property] = Math.random() * spread + minimum
			@set(options)
		)

	maxima: {}

	minima: {}

class global.DiscoballOptionsView extends Backbone.View

	constructor: ({ el, @model }) ->
		@setElement(el)
		@delegateEvents(@defaultEvents)
		@throttleUpdate()

	defaultEvents:
		"change input": "update"
		"click button.randomize": "randomize"
		"click button.load": "load"
		"click button.pause": "pause"
		"click button.save": "save"

	inputValue: (input) ->
		parseFloat($(input).val())

	randomize: (evt) ->
		evt.preventDefault()
		
		@$("input").each((index, input) =>
			@animateInputValue(input)
		)

	animateInputValue: (input) ->
		min = parseFloat($(input).attr("min"))
		max = parseFloat($(input).attr("max"))
		currentValue = @inputValue(input)
		randomValue = parseFloat((Math.random() * (max - min) + min).toFixed(2))
		steps = 100
		step = (randomValue - currentValue) / steps

		stepper = (current, increment, final) ->
			current += increment
			$(input).val(current)
			$(input).change()
			if current < final
				setTimeout(
					(-> stepper(current, increment, final)),
					100
				)

		stepper(currentValue, step, randomValue)

	load: (event) ->
		event.preventDefault()
		name = prompt("What name do you want to load?")
		options = JSON.parse(localStorage.getItem(name))
		@model.set(options)

	pause: ->
		@trigger("pause")

	save: (event) ->
		event.preventDefault()
		name = prompt("What do you want to call this setting?")
		options = {}
		for property, value of @model.attributes
			if property not in ["maxima", "minima"]
				options[property] = value
		localStorage.setItem(name, JSON.stringify(options))

	throttleUpdate: ->
		@update = _.throttle(@update, 500)
	
	update: ({ target }) ->
		options = {}
		options[$(target).attr("id")] = @inputValue($(target))
		@model.set(options)
