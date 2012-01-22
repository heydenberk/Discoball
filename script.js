(function() {
  var Discoball, Mural, MuralGrid, MuralOptions, MuralOptionsView,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  $(function() {
    var discoball, el, model, optionsView;
    el = $("#settings");
    model = new MuralOptions();
    optionsView = new MuralOptionsView({
      el: el,
      model: model
    });
    discoball = new Discoball($("#disco-ball"), optionsView.model);
    return discoball.run();
  });

  Mural = (function() {

    function Mural(element) {
      this.element = $(element);
      this.context = this.element[0].getContext("2d");
      this.initialize();
      this.listenForResize();
    }

    Mural.prototype.getPixelRatio = function() {
      return window.devicePixelRatio || 1;
    };

    Mural.prototype.getWindowSize = function() {
      return {
        height: $(window).height(),
        width: $(window).width()
      };
    };

    Mural.prototype.getDeviceSize = function() {
      return {
        height: this.windowSize.height * this.pixelRatio,
        width: this.windowSize.width * this.pixelRatio
      };
    };

    Mural.prototype.initializeElement = function() {
      return this.element.attr(this.deviceSize).css(this.windowSize);
    };

    Mural.prototype.scaleContext = function() {
      return this.context.scale(this.pixelRatio, this.pixelRatio);
    };

    Mural.prototype.listenForResize = function() {
      var _this = this;
      return $(window).resize(function() {
        return _this.initialize();
      });
    };

    Mural.prototype.setGrid = function(size) {
      return this.grid = new MuralGrid(size, this);
    };

    Mural.prototype.initialize = function() {
      this.pixelRatio = this.getPixelRatio();
      this.windowSize = this.getWindowSize();
      this.deviceSize = this.getDeviceSize();
      this.initializeElement();
      return this.scaleContext();
    };

    return Mural;

  })();

  MuralGrid = (function() {

    function MuralGrid(rectangles, mural) {
      this.cells = this._cells(rectangles, mural);
      this.cellSize = this._cellSize(mural);
    }

    MuralGrid.prototype._cells = function(rectangles, mural) {
      this.cells = {
        x: rectangles,
        y: rectangles
      };
      if (mural.windowSize.width > mural.windowSize.height) {
        this.cells.y = Math.ceil(this.cells.y * mural.windowSize.height / mural.windowSize.width);
      } else {
        this.cells.x = Math.ceil(this.cells.x * mural.windowSize.width / mural.windowSize.height);
      }
      this.cells.area = this.cells.x * this.cells.y;
      return this.cells;
    };

    MuralGrid.prototype._cellSize = function(mural) {
      return {
        height: mural.windowSize.height / this.cells.y,
        width: mural.windowSize.width / this.cells.x
      };
    };

    MuralGrid.prototype.positionCentrality = function(position) {
      return {
        x: Math.abs(position.x - this.cells.x / 2) / (this.cells.x / 2),
        y: Math.abs(position.y - this.cells.y / 2) / (this.cells.y / 2)
      };
    };

    MuralGrid.prototype.indexToPosition = function(index) {
      return {
        x: index % this.cells.x,
        y: Math.floor(index / this.cells.x)
      };
    };

    MuralGrid.prototype.offsetPosition = function(position, offset) {
      return {
        x: position.x + offset.x,
        y: position.y + offset.y
      };
    };

    return MuralGrid;

  })();

  Discoball = (function(_super) {

    __extends(Discoball, _super);

    function Discoball(element, options) {
      this.options = options;
      Discoball.__super__.constructor.call(this, element);
    }

    Discoball.prototype.adjustColorCylePosition = function(colorCyclePosition, centrality) {
      return (colorCyclePosition + (centrality.x * centrality.y) * (this.options.get("centrality-adjustment") / 100)) % 1;
    };

    Discoball.prototype.averageColorBlend = function(color, blendColor) {
      return {
        red: Math.round(color.red * color.alpha + blendColor.red * blendColor.alpha),
        green: Math.round(color.green * color.alpha + blendColor.green * blendColor.alpha),
        blue: Math.round(color.blue * color.alpha + blendColor.blue * blendColor.alpha)
      };
    };

    Discoball.prototype.biasedRandomColor = function(colorCyclePosition, position) {
      return this.blendColors(this.options.get("monochrome") ? this.randomMonochromeColor() : this.randomRgbColor(), this.colorBias(colorCyclePosition, position));
    };

    Discoball.prototype.blendColors = function(color, blendColor, mode) {
      color.alpha = 1 - blendColor.alpha;
      if ((mode != null) === "geometric") {
        return this.geometricColorBlend(color, blend);
      } else {
        return this.averageColorBlend(color, blendColor);
      }
    };

    Discoball.prototype.cascadeOffset = function(cascade) {
      cascade = (cascade % 4 - 2) * (this.drawCount % cascade) / cascade * this.grid.cellSize.height;
      return {
        x: cascade,
        y: cascade
      };
    };

    Discoball.prototype.colorBias = function(colorCyclePosition, position) {
      var adjustedColorCylePosition;
      adjustedColorCylePosition = this.adjustColorCylePosition(colorCyclePosition, this.grid.positionCentrality(position));
      return {
        red: Math.abs(Math.round(Math.sin(Math.PI * adjustedColorCylePosition) * 100) / 100) * 255,
        green: Math.abs(Math.round(Math.sin(Math.PI * (adjustedColorCylePosition + 1 / 3)) * 100) / 100) * 255,
        blue: Math.abs(Math.round(Math.sin(Math.PI * (adjustedColorCylePosition + 2 / 3)) * 100) / 100) * 255,
        alpha: this.options.get("color-bias-alpha")
      };
    };

    Discoball.prototype.colorCyclePosition = function(period) {
      return (this.drawCount % period) / period;
    };

    Discoball.prototype.colorString = function(color) {
      return "rgb(" + color.red + "," + color.green + "," + color.blue + ")";
    };

    Discoball.prototype.draw = function() {
      var cascade, colorCyclePosition, index, lifetime,
        _this = this;
      colorCyclePosition = this.colorCyclePosition(this.options.get("color-cycle-period"));
      cascade = this.cascadeOffset(this.options.get("cascade"));
      lifetime = this.options.get("lifetime");
      index = this.drawCount % lifetime;
      while (index < this.grid.cells.area) {
        this.fillCell(index, colorCyclePosition, cascade);
        index += lifetime;
      }
      this.drawCount += 1;
      return setTimeout((function() {
        return _this.draw();
      }), this.options.get("draw-interval"));
    };

    Discoball.prototype.drawCount = 0;

    Discoball.prototype.fillCell = function(index, colorCyclePosition, cascade) {
      var gridPosition, pixelPosition;
      gridPosition = this.grid.indexToPosition(index);
      pixelPosition = this.grid.offsetPosition(this.pixelPosition(gridPosition), cascade);
      this.context.fillStyle = this.colorString(this.biasedRandomColor(colorCyclePosition, gridPosition));
      return this.context.fillRect(pixelPosition.x, pixelPosition.y, this.grid.cellSize.width, this.grid.cellSize.height);
    };

    Discoball.prototype.geometricColorBlend = function(color, blendColor) {
      return {
        red: Math.round(Math.exp(color.alpha * Math.log(color.red) + blendColor.alpha * Math.log(blendColor.red))),
        green: Math.round(Math.exp(color.alpha * Math.log(color.green) + blendColor.alpha * Math.log(blendColor.green))),
        blue: Math.round(Math.exp(color.alpha * Math.log(color.blue) + blendColor.alpha * Math.log(blendColor.blue)))
      };
    };

    Discoball.prototype.randomMonochromeColor = function() {
      var randomNumber;
      randomNumber = Math.floor(Math.random() * 256);
      return {
        red: randomNumber,
        green: randomNumber,
        blue: randomNumber
      };
    };

    Discoball.prototype.randomRgbColor = function() {
      var randomNumber;
      randomNumber = Math.floor(Math.random() * 16777216);
      return {
        red: (randomNumber & 16777215) >> 16,
        green: (randomNumber & 65535) >> 8,
        blue: randomNumber & 255
      };
    };

    Discoball.prototype.pixelPosition = function(position) {
      return {
        x: position.x * this.grid.cellSize.width,
        y: position.y * this.grid.cellSize.height
      };
    };

    Discoball.prototype.run = function() {
      this.setGrid();
      return this.draw();
    };

    Discoball.prototype.setGrid = function() {
      var _setGrid,
        _this = this;
      _setGrid = function() {
        return _this.grid = new MuralGrid(_this.options.get("grid-rectangles"), _this);
      };
      _setGrid();
      this.options.bind("change:grid-rectangles", _setGrid);
      return $(window).resize(_setGrid);
    };

    return Discoball;

  })(Mural);

  MuralOptions = (function(_super) {

    __extends(MuralOptions, _super);

    function MuralOptions() {
      MuralOptions.__super__.constructor.apply(this, arguments);
    }

    MuralOptions.prototype.defaults = {
      cascade: 1,
      "centrality-adjustment": 0,
      "color-bias-alpha": 0.75,
      "color-cycle-period": 250,
      "draw-interval": 10,
      "grid-rectangles": 50,
      lifetime: 3
    };

    return MuralOptions;

  })(Backbone.Model);

  MuralOptionsView = (function(_super) {

    __extends(MuralOptionsView, _super);

    function MuralOptionsView(_arg) {
      this.el = _arg.el, this.model = _arg.model;
      this.delegateEvents(this.defaultEvents);
      this.getInitialValues();
      this.throttleUpdate();
    }

    MuralOptionsView.prototype.defaultEvents = {
      "change input": "update",
      "click button.randomize": "randomize"
    };

    MuralOptionsView.prototype.getInitialValues = function() {
      var property, _results;
      _results = [];
      for (property in this.options) {
        _results.push(this.model.set({
          property: this.inputValue(this.$("#" + property))
        }));
      }
      return _results;
    };

    MuralOptionsView.prototype.inputValue = function(input) {
      return parseFloat($(input).val());
    };

    MuralOptionsView.prototype.randomize = function(evt) {
      var _this = this;
      evt.preventDefault();
      return this.$("input").each(function(index, input) {
        return _this.animateInputValue(input);
      });
    };

    MuralOptionsView.prototype.animateInputValue = function(input) {
      var currentValue, max, min, randomValue, step, stepper, steps;
      min = parseFloat($(input).attr("min"));
      max = parseFloat($(input).attr("max"));
      currentValue = this.inputValue(input);
      randomValue = Math.random() * (max - min) + min;
      steps = 100;
      step = (randomValue - currentValue) / steps;
      stepper = function(current, increment, final) {
        current += increment;
        $(input).val(current);
        $(input).change();
        if (current < final) {
          return setTimeout((function() {
            return stepper(current, increment, final);
          }), 100);
        }
      };
      return stepper(currentValue, step, randomValue);
    };

    MuralOptionsView.prototype.throttleUpdate = function() {
      return this.update = _.throttle(this.update, 500);
    };

    MuralOptionsView.prototype.update = function(_arg) {
      var options, target;
      target = _arg.target;
      options = {};
      options[$(target).attr("id")] = this.inputValue($(target));
      return this.model.set(options);
    };

    return MuralOptionsView;

  })(Backbone.View);

}).call(this);
