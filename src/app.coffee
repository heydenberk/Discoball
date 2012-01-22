$(->
    el = $("#settings")
    model = new MuralOptions()
    
    optionsView = new MuralOptionsView({ el, model })
    discoball = new Discoball($("#disco-ball"), optionsView.model)
    discoball.run()
)
