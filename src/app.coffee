$(->
    optionsElement = $("#options")
    canvasElement = $("#discoball")

    optionsView = new DiscoballOptionsView({ el: optionsElement, model: new DiscoballOptions() })
    discoball = new Discoball(canvasElement)

    discoball.run(optionsView.model)
)
