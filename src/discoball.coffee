requestAnimationFrame = window.requestAnimationFrame or window.mozRequestAnimationFrame or  
    window.webkitRequestAnimationFrame or window.msRequestAnimationFrame

class Color

    constructor: (@color, @transparency) ->

    blendingModes =
        arithmetic: (color, blendColor, value) ->
            Math.round(color[value] * color.alpha + blendColor[value] * blendColor.alpha)
        geometric: (color, blendColor, value) ->
            Math.round(Math.pow(color[value], color.alpha) * Math.pow(blendColor[value], blendColor.alpha))

    blend: (blendColor, mode = "arithmetic") ->
#        return new Color(blendColor, @transparency) if blendColor.alpha is 1
#        return @ if blendColor.alpha is 0

        @color.alpha ||= 1 - blendColor.alpha
        blendValue = @getBlender(blendColor, mode)

        new Color({ red: blendValue("red"), green: blendValue("green"), blue: blendValue("blue") }, @transparency)

    getBlender: (blendColor, mode) ->
        (value) => blendingModes[mode](@color, blendColor, value)

    toString: -> "rgba(#{ @color.red },#{ @color.green },#{ @color.blue }, #{ @transparency })"

    inverse: ->
        new Color({ red: 255 - @color.red, green: 255 - @color.green, blue: 255 - @color.blue }, @transparency)

class Cycle

    getPosition: -> @count / @period

    next: -> @count = (@count + 1) % @period

    count: 0

class SizeCycle extends Cycle

    getAdjustedVariation: ->
        position = @getPosition()

        height: @getPosition() + 0.5
        width: @getPosition() + 0.5


    getSize: (grid) ->
        return grid.cellSize if @variation is 1

        adjustedVariation = @getAdjustedVariation()

        spread = (max = @variation) - (min = 1 / @variation)

        width: grid.cellSize.width * (adjustedVariation.width * spread + min)
        height: grid.cellSize.height * (adjustedVariation.height * spread + min)

    period: 3000

class CascadeCycle extends Cycle

    getOffset: ->
        cascade = (@cascade % 4 - 2) * (@count % @cascade) / @cascade * @cellHeight

        x: cascade, y: cascade

    period: 1000

class ColorCycle extends Cycle

    adjustForCentrality: (centrality) ->
        combinedCentrality = Math.pow(Math.pow(centrality.x, @centralityAttraction) + Math.pow(centrality.y, @centralityAttraction), 1/@centralityAttraction)
        (@getPosition() + combinedCentrality * @centralityWeight) % 1

    getColorBiasForCentrality: (centrality) ->
        centralityAdjustment = @adjustForCentrality(centrality)

        red: @getValueBiasForCentrality(centralityAdjustment, 0)
        green: @getValueBiasForCentrality(centralityAdjustment, 1 / 3)
        blue: @getValueBiasForCentrality(centralityAdjustment, 2 / 3)
        alpha: @bias

    _getColorBiasForCentrality: ->

        red: 255
        green: 255
        blue: 255
        alpha: @bias

    getValueBiasForCentrality: (centralityAdjustment, offset) ->
        adjustedPosition = centralityAdjustment + offset
        Math.abs(Math.round(Math.sin(Math.PI * adjustedPosition) * 100) / 100) * 255


    _cache: {}

class DrawCycle extends Cycle

    calculateFps: ->
        currentTime = new Date().getTime()
        if @_time
            $("#fps").text("#{ @period / ((currentTime - @_time) / 1000) }")

        @_time = currentTime

    period: 200

    getCellCount: ->
        Math.floor(@area / @lifetime)

    getCellStep: (reverse) ->
        if reverse then -@lifetime else @lifetime

    getCellStart: (reverse) ->
        start = @count % @lifetime
        if reverse then @area - start else start

    isReverseCycle: -> @count % 8 > 2 and Math.random() > 2/3

    each: (iterator, context) ->
        reverse = @isReverseCycle()
        step = @getCellStep(reverse)
        start = @getCellStart(reverse)
        cells = @getCellCount()

        for cell in [0..cells]
            iterator.apply(context, [start + (cell * step)])

    next: ->
        super()
        if @count is 0
            @calculateFps()

    startTimer: ->
        setInterval((=> @time += 0.001), 1)

    time: 0

class Discoball extends Mural

    biasColorByPosition: (position) ->
        centrality = @grid.positionCentrality(position)
        @colorCycle.getColorBiasForCentrality(centrality)

    draw: (options) ->
        @colorCycle.next()
        @drawCycle.next()
        options.trigger("draw")

        @drawCycle.each(@drawCell, @)
        #@drawCycle.calculateFps()

        setTimeout((=> @draw(options)), 5)

    drawCell: (index) ->
        @cascadeCycle.next()
        @sizeCycle.next()
        gridPosition = @grid.indexToPosition(index)

        @drawRect(
            new Color(@randomRgbColor(), @_transparency).blend(@biasColorByPosition(gridPosition)),
            @pixelPosition(gridPosition, @cascadeCycle.getOffset()),
            @varySize()
        )

    drawRect: (color, position, size) ->
        @context.fillStyle = "#{ color }"
        @context.fillRect(position.x, position.y, size.width, size.height)

    listenForOptionsChange: (options) ->
        optionsListeners =
            "cascade": -> @cascadeCycle.cascade = options.get("cascade")
            "color-bias-alpha": -> @colorCycle.bias = options.get("color-bias-alpha")
            "color-cycle-period": -> @colorCycle.period = options.get("color-cycle-period")
            "centrality-adjustment": -> @colorCycle.centralityWeight = options.get("centrality-adjustment")
            "centrality-attraction": -> @colorCycle.centralityAttraction = options.get("centrality-attraction")
            "grid-rectangles": ->
                @setGrid(options.get("grid-rectangles"), @)
                @cascadeCycle.cellHeight = @grid.cellSize.height
                @drawCycle.area = @grid.cells.area
            "lifetime": -> @drawCycle.lifetime = options.get("lifetime")
            "size-variation": -> @sizeCycle.variation = options.get("size-variation")
            "transparency": -> @_transparency = options.get("transparency")

        for option, listener of optionsListeners
            event = "change:#{ option }"
            options.on(event, listener, @)
            options.trigger(event)

        $(window).resize(=> @setGrid(options.get("grid-rectangles"), @))


    randomRgbColor: new Stochator(kind: "color").next

    pixelPosition: (position, cascade) ->
        rawPixelPosition = { x: position.x * @grid.cellSize.width, y: position.y * @grid.cellSize.height }

        @grid.offsetPosition(rawPixelPosition, cascade)

    run: (options) ->
        @drawCycle.startTimer()
        @listenForOptionsChange(options)
        @draw(options)

    varySize: -> @sizeCycle.getSize(@grid)

    cascadeCycle: new CascadeCycle()
    colorCycle: new ColorCycle()
    drawCycle: new DrawCycle()
    sizeCycle: new SizeCycle()
    _transparency: null
