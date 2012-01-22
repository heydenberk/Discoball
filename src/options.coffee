class MuralOptions extends Backbone.Model

	defaults:
		cascade: 1
		"centrality-adjustment": 0
		"color-bias-alpha": 0.75
		"color-cycle-period": 250
		"draw-interval": 10
		"grid-rectangles": 50
		lifetime: 3

class MuralOptionsView extends Backbone.View

	constructor: ({ @el, @model }) ->
		@delegateEvents(@defaultEvents)
		@getInitialValues()
		@throttleUpdate()

	defaultEvents:
		"change input" : "update"
		"click button.randomize" : "randomize"

	getInitialValues: ->
		for property of @options
			@model.set(property: @inputValue(@$("#" + property)))

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
		randomValue = Math.random() * (max - min) + min
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



	throttleUpdate: ->
		@update = _.throttle(@update, 500)
	
	update: ({ target }) ->
		options = {}
		options[$(target).attr("id")] = @inputValue($(target))
		@model.set(options)
