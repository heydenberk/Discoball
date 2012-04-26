(function() {
  var CascadeCycle, Color, ColorCycle, Cycle, Discoball, DrawCycle, SizeCycle, requestAnimationFrame,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

  Color = (function() {
    var blendingModes;

    function Color(color, transparency) {
      this.color = color;
      this.transparency = transparency;
    }

    blendingModes = {
      arithmetic: function(color, blendColor, value) {
        return Math.round(color[value] * color.alpha + blendColor[value] * blendColor.alpha);
      },
      geometric: function(color, blendColor, value) {
        return Math.round(Math.pow(color[value], color.alpha) * Math.pow(blendColor[value], blendColor.alpha));
      }
    };

    Color.prototype.blend = function(blendColor, mode) {
      var blendValue, _base;
      if (mode == null) mode = "arithmetic";
      (_base = this.color).alpha || (_base.alpha = 1 - blendColor.alpha);
      blendValue = this.getBlender(blendColor, mode);
      return new Color({
        red: blendValue("red"),
        green: blendValue("green"),
        blue: blendValue("blue")
      }, this.transparency);
    };

    Color.prototype.getBlender = function(blendColor, mode) {
      var _this = this;
      return function(value) {
        return blendingModes[mode](_this.color, blendColor, value);
      };
    };

    Color.prototype.toString = function() {
      return "rgba(" + this.color.red + "," + this.color.green + "," + this.color.blue + ", " + this.transparency + ")";
    };

    Color.prototype.inverse = function() {
      return new Color({
        red: 255 - this.color.red,
        green: 255 - this.color.green,
        blue: 255 - this.color.blue
      }, this.transparency);
    };

    return Color;

  })();

  Cycle = (function() {

    function Cycle() {}

    Cycle.prototype.getPosition = function() {
      return this.count / this.period;
    };

    Cycle.prototype.next = function() {
      return this.count = (this.count + 1) % this.period;
    };

    Cycle.prototype.count = 0;

    return Cycle;

  })();

  SizeCycle = (function(_super) {

    __extends(SizeCycle, _super);

    function SizeCycle() {
      SizeCycle.__super__.constructor.apply(this, arguments);
    }

    SizeCycle.prototype.getAdjustedVariation = function() {
      var position;
      position = this.getPosition();
      return {
        height: this.getPosition() + 0.5,
        width: this.getPosition() + 0.5
      };
    };

    SizeCycle.prototype.getSize = function(grid) {
      var adjustedVariation, max, min, spread;
      if (this.variation === 1) return grid.cellSize;
      adjustedVariation = this.getAdjustedVariation();
      spread = (max = this.variation) - (min = 1 / this.variation);
      return {
        width: grid.cellSize.width * (adjustedVariation.width * spread + min),
        height: grid.cellSize.height * (adjustedVariation.height * spread + min)
      };
    };

    SizeCycle.prototype.period = 3000;

    return SizeCycle;

  })(Cycle);

  CascadeCycle = (function(_super) {

    __extends(CascadeCycle, _super);

    function CascadeCycle() {
      CascadeCycle.__super__.constructor.apply(this, arguments);
    }

    CascadeCycle.prototype.getOffset = function() {
      var cascade;
      cascade = (this.cascade % 4 - 2) * (this.count % this.cascade) / this.cascade * this.cellHeight;
      return {
        x: cascade,
        y: cascade
      };
    };

    CascadeCycle.prototype.period = 1000;

    return CascadeCycle;

  })(Cycle);

  ColorCycle = (function(_super) {

    __extends(ColorCycle, _super);

    function ColorCycle() {
      ColorCycle.__super__.constructor.apply(this, arguments);
    }

    ColorCycle.prototype.adjustForCentrality = function(centrality) {
      var combinedCentrality;
      combinedCentrality = Math.pow(Math.pow(centrality.x, this.centralityAttraction) + Math.pow(centrality.y, this.centralityAttraction), 1 / this.centralityAttraction);
      return (this.getPosition() + combinedCentrality * this.centralityWeight) % 1;
    };

    ColorCycle.prototype.getColorBiasForCentrality = function(centrality) {
      var centralityAdjustment;
      centralityAdjustment = this.adjustForCentrality(centrality);
      return {
        red: this.getValueBiasForCentrality(centralityAdjustment, 0),
        green: this.getValueBiasForCentrality(centralityAdjustment, 1 / 3),
        blue: this.getValueBiasForCentrality(centralityAdjustment, 2 / 3),
        alpha: this.bias
      };
    };

    ColorCycle.prototype._getColorBiasForCentrality = function() {
      return {
        red: 255,
        green: 255,
        blue: 255,
        alpha: this.bias
      };
    };

    ColorCycle.prototype.getValueBiasForCentrality = function(centralityAdjustment, offset) {
      var adjustedPosition;
      adjustedPosition = centralityAdjustment + offset;
      return Math.abs(Math.round(Math.sin(Math.PI * adjustedPosition) * 100) / 100) * 255;
    };

    ColorCycle.prototype._cache = {};

    return ColorCycle;

  })(Cycle);

  DrawCycle = (function(_super) {

    __extends(DrawCycle, _super);

    function DrawCycle() {
      DrawCycle.__super__.constructor.apply(this, arguments);
    }

    DrawCycle.prototype.calculateFps = function() {
      var currentTime;
      currentTime = new Date().getTime();
      if (this._time) {
        $("#fps").text("" + (this.period / ((currentTime - this._time) / 1000)));
      }
      return this._time = currentTime;
    };

    DrawCycle.prototype.period = 200;

    DrawCycle.prototype.getCellCount = function() {
      return Math.floor(this.area / this.lifetime);
    };

    DrawCycle.prototype.getCellStep = function(reverse) {
      if (reverse) {
        return -this.lifetime;
      } else {
        return this.lifetime;
      }
    };

    DrawCycle.prototype.getCellStart = function(reverse) {
      var start;
      start = this.count % this.lifetime;
      if (reverse) {
        return this.area - start;
      } else {
        return start;
      }
    };

    DrawCycle.prototype.isReverseCycle = function() {
      return this.count % 8 > 2 && Math.random() > 2 / 3;
    };

    DrawCycle.prototype.each = function(iterator, context) {
      var cell, cells, reverse, start, step, _results;
      reverse = this.isReverseCycle();
      step = this.getCellStep(reverse);
      start = this.getCellStart(reverse);
      cells = this.getCellCount();
      _results = [];
      for (cell = 0; 0 <= cells ? cell <= cells : cell >= cells; 0 <= cells ? cell++ : cell--) {
        _results.push(iterator.apply(context, [start + (cell * step)]));
      }
      return _results;
    };

    DrawCycle.prototype.next = function() {
      DrawCycle.__super__.next.call(this);
      if (this.count === 0) return this.calculateFps();
    };

    DrawCycle.prototype.startTimer = function() {
      var _this = this;
      return setInterval((function() {
        return _this.time += 0.001;
      }), 1);
    };

    DrawCycle.prototype.time = 0;

    return DrawCycle;

  })(Cycle);

  Discoball = (function(_super) {

    __extends(Discoball, _super);

    function Discoball() {
      Discoball.__super__.constructor.apply(this, arguments);
    }

    Discoball.prototype.biasColorByPosition = function(position) {
      var centrality;
      centrality = this.grid.positionCentrality(position);
      return this.colorCycle.getColorBiasForCentrality(centrality);
    };

    Discoball.prototype.draw = function(options) {
      var _this = this;
      this.colorCycle.next();
      this.drawCycle.next();
      options.trigger("draw");
      this.drawCycle.each(this.drawCell, this);
      return setTimeout((function() {
        return _this.draw(options);
      }), 5);
    };

    Discoball.prototype.drawCell = function(index) {
      var gridPosition;
      this.cascadeCycle.next();
      this.sizeCycle.next();
      gridPosition = this.grid.indexToPosition(index);
      return this.drawRect(new Color(this.randomRgbColor(), this._transparency).blend(this.biasColorByPosition(gridPosition)), this.pixelPosition(gridPosition, this.cascadeCycle.getOffset()), this.varySize());
    };

    Discoball.prototype.drawRect = function(color, position, size) {
      this.context.fillStyle = "" + color;
      return this.context.fillRect(position.x, position.y, size.width, size.height);
    };

    Discoball.prototype.listenForOptionsChange = function(options) {
      var event, listener, option, optionsListeners,
        _this = this;
      optionsListeners = {
        "cascade": function() {
          return this.cascadeCycle.cascade = options.get("cascade");
        },
        "color-bias-alpha": function() {
          return this.colorCycle.bias = options.get("color-bias-alpha");
        },
        "color-cycle-period": function() {
          return this.colorCycle.period = options.get("color-cycle-period");
        },
        "centrality-adjustment": function() {
          return this.colorCycle.centralityWeight = options.get("centrality-adjustment");
        },
        "centrality-attraction": function() {
          return this.colorCycle.centralityAttraction = options.get("centrality-attraction");
        },
        "grid-rectangles": function() {
          this.setGrid(options.get("grid-rectangles"), this);
          this.cascadeCycle.cellHeight = this.grid.cellSize.height;
          return this.drawCycle.area = this.grid.cells.area;
        },
        "lifetime": function() {
          return this.drawCycle.lifetime = options.get("lifetime");
        },
        "size-variation": function() {
          return this.sizeCycle.variation = options.get("size-variation");
        },
        "transparency": function() {
          return this._transparency = options.get("transparency");
        }
      };
      for (option in optionsListeners) {
        listener = optionsListeners[option];
        event = "change:" + option;
        options.on(event, listener, this);
        options.trigger(event);
      }
      return $(window).resize(function() {
        return _this.setGrid(options.get("grid-rectangles"), _this);
      });
    };

    Discoball.prototype.randomRgbColor = new Stochator({
      kind: "color"
    }).next;

    Discoball.prototype.pixelPosition = function(position, cascade) {
      var rawPixelPosition;
      rawPixelPosition = {
        x: position.x * this.grid.cellSize.width,
        y: position.y * this.grid.cellSize.height
      };
      return this.grid.offsetPosition(rawPixelPosition, cascade);
    };

    Discoball.prototype.run = function(options) {
      this.drawCycle.startTimer();
      this.listenForOptionsChange(options);
      return this.draw(options);
    };

    Discoball.prototype.varySize = function() {
      return this.sizeCycle.getSize(this.grid);
    };

    Discoball.prototype.cascadeCycle = new CascadeCycle();

    Discoball.prototype.colorCycle = new ColorCycle();

    Discoball.prototype.drawCycle = new DrawCycle();

    Discoball.prototype.sizeCycle = new SizeCycle();

    Discoball.prototype._transparency = null;

    return Discoball;

  })(Mural);

  $(function() {
    var canvasElement, discoball, optionsElement, optionsView;
    optionsElement = $("#options");
    canvasElement = $("#discoball");
    optionsView = new DiscoballOptionsView({
      el: optionsElement,
      model: new DiscoballOptions()
    });
    discoball = new Discoball(canvasElement);
    return discoball.run(optionsView.model);
  });

}).call(this);
