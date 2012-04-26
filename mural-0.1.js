(function() {
  var MuralGrid, global;

  global = window || exports;

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

  global.Mural = (function() {

    function Mural(canvas) {
      this.canvas = $(canvas);
      this.context = this.canvas[0].getContext("2d");
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
      return this.canvas.attr(this.deviceSize).css(this.windowSize);
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

}).call(this);
