(function() {
  var global,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  global = window || exports;

  global.DiscoballOptions = (function(_super) {

    __extends(DiscoballOptions, _super);

    function DiscoballOptions() {
      DiscoballOptions.__super__.constructor.apply(this, arguments);
    }

    DiscoballOptions.prototype.defaults = {
      "cascade": 1,
      "centrality-adjustment": 0,
      "centrality-attraction": 1,
      "color-bias-alpha": 0.75,
      "color-cycle-period": 250,
      "grid-rectangles": 50,
      "lifetime": 3,
      "size-variation": 1,
      "transparency": 1,
      "minima": {
        "cascade": 1,
        "centrality-adjustment": 0,
        "centrality-attraction": 0.01,
        "color-bias-alpha": 0,
        "color-cycle-period": 0,
        "grid-rectangles": 0,
        "lifetime": 1,
        "size-variation": 1,
        "transparency": 0
      },
      "maxima": {
        "cascade": 10,
        "centrality-adjustment": 100,
        "centrality-attraction": 10,
        "color-bias-alpha": 100,
        "color-cycle-period": 2000,
        "grid-rectangles": 200,
        "lifetime": 200,
        "size-variation": 2,
        "transparency": 1
      }
    };

    DiscoballOptions.prototype.randomize = function() {
      var _this = this;
      return this.bind("draw", function() {
        var maxima, maximum, minima, minimum, options, property, spread, _ref;
        options = {};
        maxima = _this.get("maxima");
        minima = _this.get("minima");
        for (property in _this.attributes) {
          if (property === "maxima" || property === "minima") continue;
          _ref = [maxima[property], minima[property]], maximum = _ref[0], minimum = _ref[1];
          spread = maximum - minimum;
          options[property] = Math.random() * spread + minimum;
        }
        return _this.set(options);
      });
    };

    DiscoballOptions.prototype.maxima = {};

    DiscoballOptions.prototype.minima = {};

    return DiscoballOptions;

  })(Backbone.Model);

  global.DiscoballOptionsView = (function(_super) {

    __extends(DiscoballOptionsView, _super);

    function DiscoballOptionsView(_arg) {
      var el;
      el = _arg.el, this.model = _arg.model;
      this.setElement(el);
      this.delegateEvents(this.defaultEvents);
      this.throttleUpdate();
    }

    DiscoballOptionsView.prototype.defaultEvents = {
      "change input": "update",
      "click button.randomize": "randomize",
      "click button.load": "load",
      "click button.pause": "pause",
      "click button.save": "save"
    };

    DiscoballOptionsView.prototype.inputValue = function(input) {
      return parseFloat($(input).val());
    };

    DiscoballOptionsView.prototype.randomize = function(evt) {
      var _this = this;
      evt.preventDefault();
      return this.$("input").each(function(index, input) {
        return _this.animateInputValue(input);
      });
    };

    DiscoballOptionsView.prototype.animateInputValue = function(input) {
      var currentValue, max, min, randomValue, step, stepper, steps;
      min = parseFloat($(input).attr("min"));
      max = parseFloat($(input).attr("max"));
      currentValue = this.inputValue(input);
      randomValue = parseFloat((Math.random() * (max - min) + min).toFixed(2));
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

    DiscoballOptionsView.prototype.load = function(event) {
      var name, options;
      event.preventDefault();
      name = prompt("What name do you want to load?");
      options = JSON.parse(localStorage.getItem(name));
      return this.model.set(options);
    };

    DiscoballOptionsView.prototype.pause = function() {
      return this.trigger("pause");
    };

    DiscoballOptionsView.prototype.save = function(event) {
      var name, options, property, value, _ref;
      event.preventDefault();
      name = prompt("What do you want to call this setting?");
      options = {};
      _ref = this.model.attributes;
      for (property in _ref) {
        value = _ref[property];
        if (property !== "maxima" && property !== "minima") {
          options[property] = value;
        }
      }
      return localStorage.setItem(name, JSON.stringify(options));
    };

    DiscoballOptionsView.prototype.throttleUpdate = function() {
      return this.update = _.throttle(this.update, 500);
    };

    DiscoballOptionsView.prototype.update = function(_arg) {
      var options, target;
      target = _arg.target;
      options = {};
      options[$(target).attr("id")] = this.inputValue($(target));
      return this.model.set(options);
    };

    return DiscoballOptionsView;

  })(Backbone.View);

}).call(this);
