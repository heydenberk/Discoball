class Mural

    constructor: (element) ->
        @element = $(element)
        @context = @element[0].getContext("2d")
        
        @initialize()
        @listenForResize()

    getPixelRatio: -> window.devicePixelRatio or 1

    getWindowSize: -> 
        height: $(window).height()
        width: $(window).width()

    getDeviceSize: -> 
        height: @windowSize.height * @pixelRatio
        width: @windowSize.width * @pixelRatio

    initializeElement: -> @element.attr(@deviceSize).css @windowSize

    scaleContext: -> @context.scale @pixelRatio, @pixelRatio

    listenForResize: -> $(window).resize(=> @initialize())

    setGrid: (size) -> @grid = new MuralGrid(size, @)

    initialize: ->
        @pixelRatio = @getPixelRatio()
        @windowSize = @getWindowSize()
        @deviceSize = @getDeviceSize()
        @initializeElement()
        @scaleContext()
      
class MuralGrid

    constructor: (rectangles, mural) ->
        @cells = @_cells(rectangles, mural)
        @cellSize = @_cellSize(mural)

    _cells: (rectangles, mural) ->
        @cells =
            x: rectangles
            y: rectangles
        
        if mural.windowSize.width > mural.windowSize.height
            @cells.y = Math.ceil(@cells.y * mural.windowSize.height / mural.windowSize.width)
        else
            @cells.x = Math.ceil(@cells.x * mural.windowSize.width / mural.windowSize.height)
        
        @cells.area = @cells.x * @cells.y
        
        @cells

    _cellSize: (mural) ->
        height: mural.windowSize.height / @cells.y
        width: mural.windowSize.width / @cells.x

    positionCentrality: (position) ->
        x: Math.abs(position.x - @cells.x / 2) / (@cells.x / 2)
        y: Math.abs(position.y - @cells.y / 2) / (@cells.y / 2)

    indexToPosition: (index) ->
        x: index % @cells.x
        y: Math.floor(index / @cells.x)

    offsetPosition: (position, offset) ->
        x: position.x + offset.x
        y: position.y + offset.y


class Discoball extends Mural

    constructor: (element, @options) ->
        super(element)

    adjustColorCylePosition: (colorCyclePosition, centrality) ->
        (colorCyclePosition + (centrality.x * centrality.y) * (@options.get("centrality-adjustment") / 100)) % 1

    averageColorBlend: (color, blendColor) ->
        red: Math.round(color.red * color.alpha + blendColor.red * blendColor.alpha)
        green: Math.round(color.green * color.alpha + blendColor.green * blendColor.alpha)
        blue: Math.round(color.blue * color.alpha + blendColor.blue * blendColor.alpha)

    biasedRandomColor: (colorCyclePosition, position) ->
        @blendColors(
            if @options.get("monochrome") then @randomMonochromeColor() else @randomRgbColor(),
            @colorBias(colorCyclePosition, position)
        )

    blendColors: (color, blendColor, mode) ->
        color.alpha = 1 - blendColor.alpha
        if mode? is "geometric" then @geometricColorBlend(color, blend) else @averageColorBlend(color, blendColor)

    cascadeOffset: (cascade) ->
        cascade = (cascade % 4 - 2) * (@drawCount % cascade) / cascade * @grid.cellSize.height

        x: cascade
        y: cascade

    colorBias: (colorCyclePosition, position) ->
        adjustedColorCylePosition = @adjustColorCylePosition(colorCyclePosition, @grid.positionCentrality(position))

        red: Math.abs(Math.round(Math.sin(Math.PI * adjustedColorCylePosition) * 100) / 100) * 255
        green: Math.abs(Math.round(Math.sin(Math.PI * (adjustedColorCylePosition + 1 / 3)) * 100) / 100) * 255
        blue: Math.abs(Math.round(Math.sin(Math.PI * (adjustedColorCylePosition + 2 / 3)) * 100) / 100) * 255
        alpha: @options.get("color-bias-alpha")

    colorCyclePosition: (period) -> (@drawCount % period) / period

    colorString: (color) -> "rgb(" + color.red + "," + color.green + "," + color.blue + ")"

    draw: ->
        colorCyclePosition = @colorCyclePosition(@options.get("color-cycle-period"))
        cascade = @cascadeOffset(@options.get("cascade"))
        lifetime = @options.get("lifetime")

        index = @drawCount % lifetime
        while index < @grid.cells.area
            @fillCell(index, colorCyclePosition, cascade)
            index += lifetime
        
        @drawCount += 1
        setTimeout((=> @draw()), @options.get("draw-interval"))

    drawCount: 0

    fillCell: (index, colorCyclePosition, cascade) ->
        gridPosition = @grid.indexToPosition(index)
        pixelPosition = @grid.offsetPosition(@pixelPosition(gridPosition), cascade)
        
        @context.fillStyle = @colorString(@biasedRandomColor(colorCyclePosition, gridPosition))
        @context.fillRect(pixelPosition.x, pixelPosition.y, @grid.cellSize.width, @grid.cellSize.height)
    
    geometricColorBlend: (color, blendColor) ->
        red: Math.round(Math.exp(color.alpha * Math.log(color.red) + blendColor.alpha * Math.log(blendColor.red)))
        green: Math.round(Math.exp(color.alpha * Math.log(color.green) + blendColor.alpha * Math.log(blendColor.green)))
        blue: Math.round(Math.exp(color.alpha * Math.log(color.blue) + blendColor.alpha * Math.log(blendColor.blue)))

    randomMonochromeColor: ->
        randomNumber = Math.floor(Math.random() * 256)

        red: randomNumber
        green: randomNumber
        blue: randomNumber

    randomRgbColor: ->
        randomNumber = Math.floor(Math.random() * 16777216)

        red: (randomNumber & 16777215) >> 16
        green: (randomNumber & 65535) >> 8
        blue: randomNumber & 255

    pixelPosition: (position) ->
        x: position.x * @grid.cellSize.width
        y: position.y * @grid.cellSize.height

    run: ->
        @setGrid()
        @draw()

    setGrid: ->
        _setGrid = => @grid = new MuralGrid(@options.get("grid-rectangles"), @)
        _setGrid()
        @options.bind("change:grid-rectangles", _setGrid)
        $(window).resize(_setGrid)

