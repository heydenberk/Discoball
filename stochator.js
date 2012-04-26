(function() {
  var Set, Stochator,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Set = (function() {

    function Set(values) {
      this.values = values;
      this.length = this.values.length;
    }

    Set.prototype.toString = function() {
      return "[object Set]";
    };

    Set.prototype.copy = function() {
      return this.values.slice(0, this.length);
    };

    Set.prototype.enumerate = function(depth) {
      var d, digits, e, enumeration, enumerations, enumerationsLength, i;
      if (depth == null) depth = this.length;
      enumerationsLength = Math.pow(this.length, depth);
      enumerations = [];
      for (enumeration = 0; 0 <= enumerationsLength ? enumeration < enumerationsLength : enumeration > enumerationsLength; 0 <= enumerationsLength ? enumeration++ : enumeration--) {
        e = enumeration;
        digits = [];
        for (i = 0; 0 <= depth ? i < depth : i > depth; 0 <= depth ? i++ : i--) {
          d = e % this.length;
          e -= d;
          e /= this.length;
          digits.push(this.values[d]);
        }
        enumerations.push(new Set(digits));
      }
      return new Set(enumerations);
    };

    Set.prototype.intersection = function(set) {
      var value;
      return new Set((function() {
        var _i, _len, _ref, _results;
        _ref = set.values;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          value = _ref[_i];
          if (__indexOf.call(this.values, value) >= 0) _results.push(value);
        }
        return _results;
      }).call(this));
    };

    Set.prototype.union = function(set) {
      return new Set(this.values.concat(this.difference(set).values));
    };

    Set.prototype.difference = function(set) {
      var value;
      return new Set((function() {
        var _i, _len, _ref, _results;
        _ref = set.values;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          value = _ref[_i];
          if (!(__indexOf.call(this.values, value) >= 0)) _results.push(value);
        }
        return _results;
      }).call(this));
    };

    Set.prototype.symmetricDifference = function(set) {
      return this.union(set).difference(this.intersection(set));
    };

    Set.prototype.reduce = function(iterator) {
      return this.values.reduce(iterator);
    };

    Set.prototype.reverse = function() {
      return new Set(this.copy().reverse());
    };

    Set.prototype.sort = function(compare) {
      return this.copy().sort(compare);
    };

    Set.prototype.sum = function() {
      var _ref;
      return (_ref = this._sum) != null ? _ref : this._sum = this.reduce(function(a, b) {
        return a + b;
      });
    };

    Set.prototype.mean = function() {
      var _ref;
      return (_ref = this._mean) != null ? _ref : this._mean = this.sum() / this.length;
    };

    Set.prototype.stdev = function() {
      var value, _ref;
      return (_ref = this._stdev) != null ? _ref : this._stdev = Math.sqrt(new Set((function() {
        var _i, _len, _ref2, _results;
        _ref2 = this.values;
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          value = _ref2[_i];
          _results.push(Math.pow(value - this.mean(), 2));
        }
        return _results;
      }).call(this)).mean());
    };

    Set.prototype.get = function(index, dflt) {
      if (this.values[index] != null) {
        return this.values[index];
      } else {
        return dflt;
      }
    };

    Set.prototype.each = function(iterator) {
      var index, value, _len, _ref, _results;
      _ref = this.values;
      _results = [];
      for (index = 0, _len = _ref.length; index < _len; index++) {
        value = _ref[index];
        _results.push(iterator(value, index));
      }
      return _results;
    };

    Set.prototype.map = function(iterator) {
      var index, value;
      return new Set((function() {
        var _len, _ref, _results;
        _ref = this.values;
        _results = [];
        for (index = 0, _len = _ref.length; index < _len; index++) {
          value = _ref[index];
          _results.push(iterator(value, index));
        }
        return _results;
      }).call(this));
    };

    return Set;

  })();

  Stochator = (function() {

    function Stochator(options) {
      if (options.name == null) options.name = "next";
      console.log(this);
      this.next = this._generator(options);
      if (options.name) this[options.name] = this.next;
    }

    Stochator.prototype.toString = function() {
      return "[object Stochator]";
    };

    Stochator.prototype._randomBoundedFloat = function(min, max, spread) {
      if (min == null) min = 0;
      if (max == null) max = 1;
      if (spread == null) spread = 1;
      return Math.random() * spread + min;
    };

    Stochator.prototype._randomBoundedInteger = function(min, max, spread) {
      return Math.floor(this._randomBoundedFloat(min, max, spread));
    };

    Stochator.prototype._randomColor = function() {
      var int;
      int = this._randomBoundedInteger(0, 16777215, 16777215);
      return {
        red: (int & 16777215) >> 16,
        green: (int & 65535) >> 8,
        blue: int & 255
      };
    };

    Stochator.prototype._randomNormallyDistributedFloat = function(mean, stdev, min, max) {
      var float;
      float = this._inverseNormalCumulativeDistribution(this._randomBoundedFloat()) * stdev + mean;
      if ((min != null) && (max != null)) {
        return Math.min(max, Math.max(min, float));
      } else {
        return float;
      }
    };

    Stochator.prototype._randomCharacter = function(lowercase) {
      var max, min, _ref;
      _ref = lowercase ? [97, 122] : [65, 90], min = _ref[0], max = _ref[1];
      return String.fromCharCode(this._randomBoundedInteger(min, max, 25));
    };

    Stochator.prototype._randomSetMember = function(set) {
      var max;
      max = set.length - 1;
      return set.get(this._randomBoundedInteger(0, max, max));
    };

    Stochator.prototype._randomSetMemberWithoutReplacement = function(set) {
      var index;
      if (!set.get(0)) return;
      set.length -= 1;
      index = this._randomBoundedInteger(0, set.length, set.length);
      return set.values.splice(index, 1)[0];
    };

    Stochator.prototype._randomWeightedSetMember = function(set, weights) {
      var float, member, weightSum, _ref;
      _ref = [void 0, 0, this._randomBoundedFloat()], member = _ref[0], weightSum = _ref[1], float = _ref[2];
      set.each(function(value, index) {
        var weight;
        if (member) return;
        weight = weights.get(index);
        if (float <= weightSum + weight && float >= weightSum) member = value;
        return weightSum += weight;
      });
      return member;
    };

    Stochator.prototype._inverseNormalCumulativeDistribution = function(probability) {
      var base, coefficient, denomCoeffcients, denomMaxExponent, denominator, high, low, numCoefficients, numMaxExponent, numerator, _ref, _ref2;
      high = probability > 0.97575;
      low = probability < 0.02425;
      if (low || high) {
        numCoefficients = new Set([-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968]);
        denomCoeffcients = new Set([7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416]);
        _ref = [5, 4], numMaxExponent = _ref[0], denomMaxExponent = _ref[1];
        coefficient = low ? 1 : -1;
        base = Math.sqrt(-2 * Math.log(low ? probability : 1 - probability));
      } else {
        numCoefficients = new Set([-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239]);
        denomCoeffcients = new Set([-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1]);
        _ref2 = [5, 5], numMaxExponent = _ref2[0], denomMaxExponent = _ref2[1];
        coefficient = probability - 0.5;
        base = Math.pow(coefficient, 2);
      }
      numerator = numCoefficients.map(function(value, index) {
        return value * Math.pow(base, numMaxExponent - index);
      }).sum();
      denominator = denomCoeffcients.map(function(value, index) {
        return value * Math.pow(base, denomMaxExponent - index);
      }).sum() + 1;
      return coefficient * numerator / denominator;
    };

    Stochator.prototype._shuffleSet = function(set) {
      var _this = this;
      return set.sort(function() {
        return _this._randomBoundedFloat();
      }).values;
    };

    Stochator.prototype._floatGenerator = function(min, max, mean, stdev) {
      var spread,
        _this = this;
      if (mean && stdev) {
        return function() {
          return _this._randomNormallyDistributedFloat(mean, stdev, min, max);
        };
      } else {
        spread = (max != null ? max : max = 1) - (min != null ? min : min = 0);
        return function() {
          return _this._randomBoundedFloat(min, max, spread);
        };
      }
    };

    Stochator.prototype._integerGenerator = function(min, max) {
      var spread,
        _this = this;
      if (min == null) min = 0;
      if (max == null) max = 1;
      max += 1;
      spread = max - min;
      return function() {
        return _this._randomBoundedInteger(min, max, spread);
      };
    };

    Stochator.prototype._mutatorGenerator = function(initialValue, stochator) {
      this._value = initialValue;
      return stochator.next;
    };

    Stochator.prototype._setGenerator = function(values, replacement, shuffle, weights) {
      var set,
        _this = this;
      if (replacement == null) replacement = true;
      if (shuffle == null) shuffle = false;
      if (weights == null) weights = null;
      set = new Set(values);
      if (shuffle) {
        return function() {
          return _this._shuffleSet(set);
        };
      } else if (replacement) {
        if (weights) {
          weights = new Set(weights);
          return function() {
            return _this._randomWeightedSetMember(set, weights);
          };
        } else {
          return function() {
            return _this._randomSetMember(set);
          };
        }
      } else {
        return function() {
          return _this._randomSetMemberWithoutReplacement(set);
        };
      }
    };

    Stochator.prototype._generator = function(_arg) {
      var combine, format, generator, kind, max, mean, min, mutator, replacement, shuffle, stdev, stochator, value, values, weights,
        _this = this;
      combine = _arg.combine, format = _arg.format, kind = _arg.kind, min = _arg.min, max = _arg.max, mean = _arg.mean, mutator = _arg.mutator, replacement = _arg.replacement, shuffle = _arg.shuffle, stdev = _arg.stdev, value = _arg.value, values = _arg.values, stochator = _arg.stochator, weights = _arg.weights;
      if (kind == null) kind = "float";
      generator = (function() {
        var _this = this;
        switch (kind) {
          case "float":
            return this._floatGenerator(min, max, mean, stdev);
          case "integer":
            return this._integerGenerator(min, max);
          case "set":
            return this._setGenerator(values, replacement, shuffle, weights);
          case "mutator":
            return this._mutatorGenerator(value, stochator, combine);
          case "color":
            return function() {
              return _this._randomColor();
            };
          case "a-z":
          case "A-Z":
            return function() {
              return _this._randomCharacter(kind === "a-z");
            };
        }
      }).call(this);
      if (mutator) {
        this._value = value;
        return function(times) {
          var _i, _results;
          if (times) {
            _results = [];
            for (_i = 0; 0 <= times ? _i < times : _i > times; 0 <= times ? _i++ : _i--) {
              _results.push(_this._value = mutator(generator(), _this._value));
            }
            return _results;
          } else {
            return mutator(generator(), _this._value);
          }
        };
      } else {
        return function(times) {
          var _i, _results;
          if (times) {
            _results = [];
            for (_i = 0; 0 <= times ? _i < times : _i > times; 0 <= times ? _i++ : _i--) {
              _results.push(generator());
            }
            return _results;
          } else {
            return generator();
          }
        };
      }
    };

    return Stochator;

  })();

  if (typeof module !== "undefined" && module !== null) {
    module.exports = Stochator;
  } else {
    this.Stochator = Stochator;
  }

}).call(this);
