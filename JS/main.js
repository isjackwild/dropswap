(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  window.AudioAnalysisEngine = (function() {
    var _ticker;

    AudioAnalysisEngine.prototype._context = null;

    AudioAnalysisEngine.prototype._source = null;

    AudioAnalysisEngine.prototype._testAudio = null;

    AudioAnalysisEngine.prototype._alreadySetup = false;

    AudioAnalysisEngine.prototype._automatic = true;

    AudioAnalysisEngine.prototype._samplesPerSecond = 30;

    _ticker = null;

    AudioAnalysisEngine.prototype._frequencyData = [];

    AudioAnalysisEngine.prototype._averageFreqCalcArray = [];

    AudioAnalysisEngine.prototype._averageAmp = 0;

    AudioAnalysisEngine.prototype._lastAverageAmp = null;

    AudioAnalysisEngine.prototype._waitingForPeak = false;

    AudioAnalysisEngine.prototype._peakSensitivityOffset = 0.5;

    AudioAnalysisEngine.prototype._bassWaitingForPeak = false;

    AudioAnalysisEngine.prototype._bassCutoff = 1000;

    AudioAnalysisEngine.prototype._frequencyOfPeak = {
      frequency: 0,
      freq: null,
      lastFreq: null
    };

    AudioAnalysisEngine.prototype._averageFrequency = 0;

    AudioAnalysisEngine.prototype._frequencyVariationCheck = [];

    AudioAnalysisEngine.prototype._lastFrequencyVariation = null;

    AudioAnalysisEngine.prototype._sensivitityForHighPeak = 2;

    AudioAnalysisEngine.prototype._sensivitityForLowPeak = 2;

    AudioAnalysisEngine.prototype._sensitivityForHighFrequencyVariation = 3;

    AudioAnalysisEngine.prototype._lastPeakTime = null;

    AudioAnalysisEngine.prototype._thisPeakTime = null;

    AudioAnalysisEngine.prototype._timeSinceLastPeak = null;

    AudioAnalysisEngine.prototype._shortBreakLength = 750;

    AudioAnalysisEngine.prototype._longBreakLength = 2000;

    AudioAnalysisEngine.prototype._breakSensitivity = 2;

    AudioAnalysisEngine.prototype._bpmCalcArray = [];

    AudioAnalysisEngine.prototype._approxBPM = 0;

    AudioAnalysisEngine.prototype._lastBPM = null;

    AudioAnalysisEngine.prototype._dropJumpBPMSensitivity = 100;

    AudioAnalysisEngine.prototype._volCalcArray = [];

    AudioAnalysisEngine.prototype._averageVol = 0;

    AudioAnalysisEngine.prototype._visible = true;

    function AudioAnalysisEngine() {
      this.eventLogger = __bind(this.eventLogger, this);
      this.calculateAverageVol = __bind(this.calculateAverageVol, this);
      this.calculateAverageBpm = __bind(this.calculateAverageBpm, this);
      this.checkForBreak = __bind(this.checkForBreak, this);
      this.checkForFrequencyVariation = __bind(this.checkForFrequencyVariation, this);
      this.calculateAveragePeakFrequency = __bind(this.calculateAveragePeakFrequency, this);
      this.checkForBassPeak = __bind(this.checkForBassPeak, this);
      this.checkForPeak = __bind(this.checkForPeak, this);
      this.analyse = __bind(this.analyse, this);
      this.toggleAuto = __bind(this.toggleAuto, this);
      this.startAnalysis = __bind(this.startAnalysis, this);
      this.setupMic = __bind(this.setupMic, this);
      this.setupFilters = __bind(this.setupFilters, this);
      this.setupAnalyser = __bind(this.setupAnalyser, this);
      this.setupListeners = __bind(this.setupListeners, this);
      var e;
      try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this._context = new window.AudioContext();
      } catch (_error) {
        e = _error;
        alert('Web Audio Not Supported');
      }
      this.setupAnalyser();
      this.setupFilters();
      this.setupListeners();
    }

    AudioAnalysisEngine.prototype.setupListeners = function() {
      window.events.automatic.add(this.toggleAuto);
      return window.events.micAccepted.add(this.setupMic);
    };

    AudioAnalysisEngine.prototype.setupAnalyser = function() {
      this._analyserNode = this._context.createAnalyser();
      this._analyserNode.smoothingTimeConstant = 0.2;
      return this._frequencyData = new Uint8Array(this._analyserNode.frequencyBinCount);
    };

    AudioAnalysisEngine.prototype.setupFilters = function() {
      this._dynamicsCompressor = this._context.createDynamicsCompressor();
      this._dynamicsCompressor.threshold.value = -33;
      this._dynamicsCompressor.knee = 30;
      this._dynamicsCompressor.ratio = 12;
      this._dynamicsCompressor.reduction = 0;
      this._dynamicsCompressor.attack = 0.003;
      this._dynamicsCompressor.release = 0.250;
      this._biquadFilter = this._context.createBiquadFilter();
      this._biquadFilter.type = "lowshelf";
      this._biquadFilter.frequency.value = 300;
      return this._biquadFilter.gain.value = 5;
    };

    AudioAnalysisEngine.prototype.setupMic = function(stream) {
      console.log('setup mix');
      if (this._alreadySetup) {
        return;
      }
      this._source = this._context.createMediaStreamSource(stream);
      this._source.connect(this._dynamicsCompressor);
      this._dynamicsCompressor.connect(this._biquadFilter);
      this._biquadFilter.connect(this._analyserNode);
      this.startAnalysis();
      return this._alreadySetup = true;
    };

    AudioAnalysisEngine.prototype.startAnalysis = function() {
      return this._ticker = setInterval((function(_this) {
        return function() {
          return _this.analyse();
        };
      })(this), 1000 / this._samplesPerSecond);
    };

    AudioAnalysisEngine.prototype.toggleAuto = function(onOff) {
      if (onOff === 'on') {
        return this._automatic = true;
      } else if (onOff === 'off') {
        return this._automatic = false;
      }
    };

    AudioAnalysisEngine.prototype.analyse = function() {
      var i, _i, _j, _ref, _ref1, _ref2, _results;
      this._analyserNode.getByteFrequencyData(this._frequencyData);
      this._frequencyOfPeak.amp = 0;
      for (i = _i = 0, _ref = this._frequencyData.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (this._frequencyData[i] > this._frequencyOfPeak.amp) {
          this._frequencyOfPeak.freq = this.convertToRange(i, [0, 40], [0, 9]);
          this._frequencyOfPeak.amp = this._frequencyData[i];
        }
        if (i === 0) {
          this._lastAverageAmp = this._averageAmp;
          this._averageAmp = 0;
        }
        this._averageAmp += this._frequencyData[i];
        if (i === this._frequencyData.length - 1) {
          this._averageAmp = this._averageAmp / this._frequencyData.length;
          this._averageAmp = Math.ceil(this._averageAmp);
          this.calculateAverageVol();
          this.checkForPeak();
        }
      }
      _results = [];
      for (i = _j = _ref1 = this._bassCutoff, _ref2 = this._frequencyData.length; _ref1 <= _ref2 ? _j < _ref2 : _j > _ref2; i = _ref1 <= _ref2 ? ++_j : --_j) {
        if (i === this._bassCutoff) {
          this._lastBassAverageAmp = this._bassAverageAmp;
          this._bassAverageAmp = 0;
        }
        this._bassAverageAmp += this._frequencyData[i];
        if (i === this._frequencyData.length - 1) {
          this._bassAverageAmp = this._bassAverageAmp / (this._frequencyData.length - this._bassCutoff);
          this._bassAverageAmp = Math.ceil(this._bassAverageAmp);
          _results.push(this.checkForBassPeak());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    AudioAnalysisEngine.prototype.checkForPeak = function() {
      if (this._averageAmp > this._lastAverageAmp && !this._waitingForPeak) {
        this._waitingForPeak = true;
      }
      if (this._averageAmp + this._peakSensitivityOffset < this._lastAverageAmp && this._waitingForPeak) {
        this._waitingForPeak = false;
        this.checkForBreak();
        if (this._automatic === true) {
          this.calculateAveragePeakFrequency();
          this.calculateAverageBpm();
          this.checkForFrequencyVariation();
        }
        if (this._averageFrequency && this._frequencyOfPeak.freq > this._averageFrequency + this._sensivitityForHighPeak) {
          this.eventLogger("hiPeak");
          return window.events.peak.dispatch('hi');
        } else if (this._averageFrequency && this._frequencyOfPeak.freq < this._averageFrequency - this._sensivitityForLowPeak) {
          this.eventLogger("loPeak");
          return window.events.peak.dispatch('lo');
        } else if (this._averageAmp + this._peakSensitivityOffset * 3 < this._lastAverageAmp) {
          this.eventLogger('hardPeak');
          return window.events.peak.dispatch('hard');
        } else {
          this.eventLogger("softPeak");
          return window.events.peak.dispatch('soft');
        }
      }
    };

    AudioAnalysisEngine.prototype.checkForBassPeak = function() {
      if (this._bassAverageAmp > this._averageVol / 1.5) {
        if (this._bassAverageAmp > this._lastBassAverageAmp && !this._bassWaitingForPeak) {
          this._bassWaitingForPeak = true;
        }
        if (this._bassAverageAmp + this._peakSensitivityOffset < this._lastBassAverageAmp && this._bassWaitingForPeak) {
          this._bassWaitingForPeak = true;
          this.eventLogger("bass");
          return window.events.bass.dispatch();
        }
      }
    };

    AudioAnalysisEngine.prototype.calculateAveragePeakFrequency = function() {
      var i, tempAvFreq, _i, _ref, _results;
      this._averageFreqCalcArray.push(this._frequencyOfPeak.freq);
      if (this._averageFreqCalcArray.length === 10) {
        tempAvFreq = 0;
        _results = [];
        for (i = _i = 0, _ref = this._averageFreqCalcArray.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          tempAvFreq += this._averageFreqCalcArray[i];
          if (i === this._averageFreqCalcArray.length - 1) {
            tempAvFreq /= this._averageFreqCalcArray.length;
            this._averageFrequency = tempAvFreq;
            if (this._automatic === true) {
              console.log('send freq');
              window.events.frequency.dispatch(this._averageFrequency);
            }
            this._averageFreqCalcArray = [];
            _results.push(this._bassCutoff = this._averageFrequency + 3);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };

    AudioAnalysisEngine.prototype.checkForFrequencyVariation = function() {
      var avDifference, differenceInFreq, i, _i, _ref, _results;
      if (!this._frequencyOfPeak.lastFreq) {
        return this._frequencyOfPeak.lastFreq = this._frequencyOfPeak.freq;
      } else {
        differenceInFreq = Math.abs(this._frequencyOfPeak.freq - this._frequencyOfPeak.lastFreq);
        this._frequencyOfPeak.lastFreq = this._frequencyOfPeak.freq;
        this._frequencyVariationCheck.push(differenceInFreq);
        if (this._frequencyVariationCheck.length === 10) {
          _results = [];
          for (i = _i = 0, _ref = this._frequencyVariationCheck.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            if (i === 0) {
              avDifference = 0;
            }
            avDifference += this._frequencyVariationCheck[i];
            if (i === this._frequencyVariationCheck.length - 1) {
              avDifference /= this._frequencyVariationCheck.length;
              this._frequencyVariationCheck = [];
              if (avDifference > this._sensitivityForHighFrequencyVariation) {
                this._currentFrequencyVariation = 'high';
              } else {
                this._currentFrequencyVariation = 'low';
              }
              if (this._lastFrequencyVariation !== this._currentFrequencyVariation) {
                this.eventLogger("changeFreqVar");
                window.events.changeFreqVar.dispatch(this._currentFrequencyVariation);
                _results.push(this._lastFrequencyVariation = this._currentFrequencyVariation);
              } else {
                _results.push(void 0);
              }
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        }
      }
    };

    AudioAnalysisEngine.prototype.checkForBreak = function() {
      if (!this._lastPeakTime) {
        return this._lastPeakTime = new Date().getTime();
      } else if (this._lastAverageAmp > this._averageVol * this._breakSensitivity) {
        this._thisPeakTime = new Date().getTime();
        this._timeSinceLastPeak = this._thisPeakTime - this._lastPeakTime;
        this._lastPeakTime = this._thisPeakTime;
        if (this._timeSinceLastPeak > this._longBreakLength) {
          this.eventLogger("longBreak");
          return window.events["break"].dispatch('long');
        } else if (this._timeSinceLastPeak > this._shortBreakLength) {
          this.eventLogger("shortBreak");
          return window.events["break"].dispatch('short');
        }
      }
    };

    AudioAnalysisEngine.prototype.calculateAverageBpm = function() {
      var timeForTenPeaks;
      this._bpmCalcArray.push(new Date().getTime());
      if (this._bpmCalcArray.length === 10) {
        timeForTenPeaks = this._bpmCalcArray[this._bpmCalcArray.length - 1] - this._bpmCalcArray[0];
        this._bpmCalcArray = [];
        this._approxBPM = Math.floor((60000 / timeForTenPeaks) * 10);
        window.events.BPM.dispatch(this._approxBPM);
      }
      if (!this._lastBPM) {
        return this._lastBPM = this._approxBPM;
      } else {
        if (this._approxBPM > this._lastBPM + this._dropJumpBPMSensitivity) {
          window.events.BPMJump.dispatch(this._approxBPM);
          this.eventLogger('BPMJump');
        } else if (this._approxBPM < this._lastBPM - this._dropJumpBPMSensitivity) {
          window.events.BPMDrop.dispatch(this._approxBPM);
          this.eventLogger('BPMDrop');
        }
        return this._lastBPM = this._approxBPM;
      }
    };

    AudioAnalysisEngine.prototype.calculateAverageVol = function() {
      var i, tempAvVol, _i, _ref, _results;
      this._volCalcArray.push(this._averageAmp);
      if (this._volCalcArray.length === this._samplesPerSecond) {
        tempAvVol = 0;
        _results = [];
        for (i = _i = 0, _ref = this._volCalcArray.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          tempAvVol += this._volCalcArray[i];
          if (i === this._volCalcArray.length - 1) {
            tempAvVol /= this._volCalcArray.length;
            this._averageVol = Math.floor(tempAvVol);
            window.events.volume.dispatch(this._averageVol);
            _results.push(this._volCalcArray = []);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };

    AudioAnalysisEngine.prototype.eventLogger = function(event) {
      return;
      switch (event) {
        case "hiPeak":
          return console.log('high peak');
        case "loPeak":
          return console.log('low peak');
        case "hardPeak":
          return console.log('hard peak');
        case "softPeak":
          return console.log('soft peak');
        case "bass":
          return console.log('BASSSS');
        case "shortBreak":
          return console.log('short break');
        case "longBreak":
          return console.log('long break');
        case "BPMDrop":
          return console.log('drop in BPM');
        case "BPMJump":
          return console.log('jump in BPM');
        case "changeFreqVar":
          if (this._currentFrequencyVariation === "high") {
            return console.log('CRAZY');
          } else if (this._currentFrequencyVariation === "low") {
            return console.log('currently low frequency variation');
          }
      }
    };

    AudioAnalysisEngine.prototype.convertToRange = function(value, srcRange, dstRange) {
      var adjValue, dstMax, srcMax;
      if (value < srcRange[0]) {
        return dstRange[0];
      } else if (value > srcRange[1]) {
        return dstRange[1];
      } else {
        srcMax = srcRange[1] - srcRange[0];
        dstMax = dstRange[1] - dstRange[0];
        adjValue = value - srcRange[0];
        return (adjValue * dstMax / srcMax) + dstRange[0];
      }
    };

    return AudioAnalysisEngine;

  })();

}).call(this);

(function() {
  $(function() {
    window.msg = new Array();
    msg[0] = new Array(0, 0, 0, 0, 0, 0);
    msg[1] = new Array(1, 0, 0, 0, 0, 0);
    msg[2] = new Array(0, 1, 0, 0, 0, 0);
    msg[3] = new Array(1, 1, 0, 0, 0, 0);
    msg[4] = new Array(0, 0, 1, 0, 0, 0);
    msg[5] = new Array(1, 0, 1, 0, 0, 0);
    msg[6] = new Array(0, 1, 1, 0, 0, 0);
    msg[7] = new Array(1, 1, 1, 0, 0, 0);
    msg[8] = new Array(0, 0, 0, 1, 0, 0);
    msg[9] = new Array(1, 0, 0, 1, 0, 0);
    msg[10] = new Array(0, 1, 0, 1, 0, 0);
    msg[11] = new Array(1, 1, 0, 1, 0, 0);
    msg[12] = new Array(0, 0, 1, 1, 0, 0);
    msg[13] = new Array(1, 0, 1, 1, 0, 0);
    msg[14] = new Array(0, 1, 1, 1, 0, 0);
    msg[15] = new Array(1, 1, 1, 1, 0, 0);
    msg[16] = new Array(0, 0, 0, 0, 1, 0);
    msg[17] = new Array(1, 0, 0, 0, 1, 0);
    msg[18] = new Array(0, 1, 0, 0, 1, 0);
    msg[19] = new Array(1, 1, 0, 0, 1, 0);
    msg[20] = new Array(0, 0, 1, 0, 1, 0);
    msg[21] = new Array(1, 0, 1, 0, 1, 0);
    msg[22] = new Array(0, 1, 1, 0, 1, 0);
    msg[23] = new Array(1, 1, 1, 0, 1, 0);
    msg[24] = new Array(0, 0, 0, 1, 1, 0);
    msg[25] = new Array(1, 0, 0, 1, 1, 0);
    msg[26] = new Array(0, 1, 0, 1, 1, 0);
    msg[27] = new Array(1, 1, 0, 1, 1, 0);
    msg[28] = new Array(0, 0, 1, 1, 1, 0);
    msg[29] = new Array(1, 0, 1, 1, 1, 0);
    msg[30] = new Array(0, 1, 1, 1, 1, 0);
    msg[31] = new Array(1, 1, 1, 1, 1, 0);
    msg[32] = new Array(0, 0, 0, 0, 0, 1);
    msg[33] = new Array(1, 0, 0, 0, 0, 1);
    msg[34] = new Array(0, 1, 0, 0, 0, 1);
    msg[35] = new Array(1, 1, 0, 0, 0, 1);
    msg[36] = new Array(0, 0, 1, 0, 0, 1);
    msg[37] = new Array(1, 0, 1, 0, 0, 1);
    msg[38] = new Array(0, 1, 1, 0, 0, 1);
    msg[39] = new Array(1, 1, 1, 0, 0, 1);
    msg[40] = new Array(0, 0, 0, 1, 0, 1);
    msg[41] = new Array(1, 0, 0, 1, 0, 1);
    msg[42] = new Array(0, 1, 0, 1, 0, 1);
    msg[43] = new Array(1, 1, 0, 1, 0, 1);
    msg[44] = new Array(0, 0, 1, 1, 0, 1);
    msg[45] = new Array(1, 0, 1, 1, 0, 1);
    msg[46] = new Array(0, 1, 1, 1, 0, 1);
    msg[47] = new Array(1, 1, 1, 1, 0, 1);
    msg[48] = new Array(0, 0, 0, 0, 1, 1);
    msg[49] = new Array(1, 0, 0, 0, 1, 1);
    msg[50] = new Array(0, 1, 0, 0, 1, 1);
    msg[51] = new Array(1, 1, 0, 0, 1, 1);
    msg[52] = new Array(0, 0, 1, 0, 1, 1);
    msg[53] = new Array(1, 0, 1, 0, 1, 1);
    msg[54] = new Array(0, 1, 1, 0, 1, 1);
    msg[55] = new Array(1, 1, 1, 0, 1, 1);
    msg[56] = new Array(0, 0, 0, 1, 1, 1);
    msg[57] = new Array(1, 0, 0, 1, 1, 1);
    msg[58] = new Array(0, 1, 0, 1, 1, 1);
    msg[59] = new Array(1, 1, 0, 1, 1, 1);
    msg[60] = new Array(0, 0, 1, 1, 1, 1);
    msg[61] = new Array(1, 0, 1, 1, 1, 1);
    msg[62] = new Array(0, 1, 1, 1, 1, 1);
    msg[63] = new Array(1, 1, 1, 1, 1, 1);
    msg[" "] = new Array(0, 0);
    msg["A"] = new Array(62, 9, 9, 62);
    msg["B"] = new Array(63, 37, 37, 26);
    msg["C"] = new Array(30, 33, 33, 18);
    msg["D"] = new Array(63, 33, 33, 30);
    msg["E"] = new Array(63, 37, 37, 33);
    msg["F"] = new Array(63, 5, 5, 1);
    msg["G"] = new Array(30, 33, 41, 26);
    msg["H"] = new Array(63, 8, 8, 63);
    msg["I"] = new Array(33, 63, 33);
    msg["J"] = new Array(17, 33, 31, 1);
    msg["K"] = new Array(63, 4, 10, 49);
    msg["L"] = new Array(63, 32, 32);
    msg["M"] = new Array(63, 2, 4, 2, 63);
    msg["N"] = new Array(63, 2, 4, 8, 63);
    msg["O"] = new Array(30, 33, 33, 30);
    msg["P"] = new Array(63, 9, 9, 6);
    msg["Q"] = new Array(30, 33, 49, 30, 32);
    msg["R"] = new Array(63, 9, 25, 38);
    msg["S"] = new Array(34, 37, 37, 25);
    msg["T"] = new Array(1, 1, 63, 1, 1);
    msg["U"] = new Array(31, 32, 32, 31);
    msg["V"] = new Array(7, 24, 32, 24, 7);
    msg["W"] = new Array(31, 32, 28, 32, 31);
    msg["X"] = new Array(59, 4, 4, 59);
    msg["Y"] = new Array(3, 4, 56, 4, 3);
    msg["Z"] = new Array(33, 49, 45, 35);
    msg["!"] = new Array(47);
    msg["."] = new Array(32);
    msg[","] = new Array(32, 16);
    msg["'"] = new Array(2, 1);
    msg["?"] = new Array(2, 41, 9, 6);
    msg["-"] = new Array(8, 8, 8);
    msg[":"] = new Array(10);
    msg["("] = new Array(30, 33);
    msg[")"] = new Array(33, 30);
    msg["#"] = new Array(18, 63, 18, 63, 18);
    msg["n0"] = new Array(30, 33, 33, 30);
    msg["n1"] = new Array(34, 63, 32);
    msg["n2"] = new Array(50, 41, 37, 34);
    msg["n3"] = new Array(17, 37, 37, 27);
    msg["n4"] = new Array(15, 8, 60, 8);
    msg["n5"] = new Array(39, 37, 37, 25);
    msg["n6"] = new Array(30, 37, 37, 24);
    msg["n7"] = new Array(1, 57, 5, 3);
    msg["n8"] = new Array(26, 37, 37, 26);
    return msg["n9"] = new Array(6, 9, 9, 63);
  });

}).call(this);

(function() {
  var VisualEffect,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  VisualEffect = (function() {
    VisualEffect.prototype._el = null;

    VisualEffect.prototype._w = null;

    VisualEffect.prototype._h = null;

    VisualEffect.prototype._step = 0;

    VisualEffect.prototype._speed = 10;

    VisualEffect.prototype._ticker = void 0;

    VisualEffect.prototype._raf = void 0;

    function VisualEffect(el, w, h) {
      console.log(el, '<<');
      this._el = el;
      this._w = w;
      this._h = h;
      this.render();
    }

    VisualEffect.prototype.render = function() {};

    VisualEffect.prototype.onBeat = function() {
      return this._step += 1;
    };

    VisualEffect.prototype.remove = function() {
      if (this._el.canvas) {
        this._el.clearRect(0, 0, this._w, this._h);
      }
      if (this._ticker) {
        clearInterval(this._ticker);
      }
      if (this._raf) {
        cancelAnimationFrame(this._raf);
      }
      while (this._el.firstChild) {
        this._el.removeChild(this._el.firstChild);
      }
      return delete this;
    };

    return VisualEffect;

  })();

  window.Noise = (function(_super) {
    __extends(Noise, _super);

    function Noise() {
      Noise.__super__.constructor.apply(this, arguments);
      this._ticker = setInterval((function(_this) {
        return function() {
          return _this.render();
        };
      })(this), 77);
    }

    Noise.prototype.render = function() {
      var buffer32, i, image, length, _i;
      image = this._el.createImageData(this._w, this._h);
      buffer32 = new Uint32Array(image.data.buffer);
      length = buffer32.length;
      for (i = _i = 0; 0 <= length ? _i < length : _i > length; i = 0 <= length ? ++_i : --_i) {
        buffer32[i] = ((255 * Math.random()) | 0) << 24;
      }
      return this._el.putImageData(image, 0, 0);
    };

    return Noise;

  })(VisualEffect);

  window.HorizontalLines = (function(_super) {
    __extends(HorizontalLines, _super);

    HorizontalLines.prototype._stripes = [];

    function HorizontalLines() {
      var col, i, _i, _ref;
      HorizontalLines.__super__.constructor.apply(this, arguments);
      for (i = _i = 0, _ref = this._h; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (Math.random() > 0.5) {
          col = 'white';
        } else {
          col = 'black';
        }
        if (Math.random() > 0.99) {
          col = 'red';
        }
        this._stripes.push(col);
      }
      this._ticker = setInterval((function(_this) {
        return function() {
          return _this.render();
        };
      })(this), 20);
    }

    HorizontalLines.prototype.render = function() {
      var i, _i, _ref;
      this._el.save();
      this._el.translate(0.5, 0.5);
      for (i = _i = 0, _ref = this._h; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        this._el.beginPath();
        this._el.strokeStyle = this._stripes[i];
        this._el.moveTo(0, i);
        this._el.lineTo(this._w, i);
        this._el.stroke();
      }
      this._el.restore();
      return this.shiftStripes();
    };

    return HorizontalLines;

  })(VisualEffect);

  window.HorizontalLinesDown = (function(_super) {
    __extends(HorizontalLinesDown, _super);

    function HorizontalLinesDown() {
      return HorizontalLinesDown.__super__.constructor.apply(this, arguments);
    }

    HorizontalLinesDown.prototype.shiftStripes = function() {
      var col;
      if (Math.random() > 0.5) {
        col = 'white';
      } else {
        col = 'black';
      }
      if (Math.random() > 0.99) {
        col = 'red';
      }
      this._stripes.pop();
      return this._stripes.unshift(col);
    };

    return HorizontalLinesDown;

  })(window.HorizontalLines);

  window.HorizontalLinesUp = (function(_super) {
    __extends(HorizontalLinesUp, _super);

    function HorizontalLinesUp() {
      return HorizontalLinesUp.__super__.constructor.apply(this, arguments);
    }

    HorizontalLinesUp.prototype.shiftStripes = function() {
      var col;
      if (Math.random() > 0.5) {
        col = 'white';
      } else {
        col = 'black';
      }
      if (Math.random() > 0.99) {
        col = 'red';
      }
      this._stripes.shift();
      return this._stripes.push(col);
    };

    return HorizontalLinesUp;

  })(window.HorizontalLines);

  window.Counter = (function(_super) {
    __extends(Counter, _super);

    function Counter() {
      var i, pixel, wrapper, _i;
      Counter.__super__.constructor.apply(this, arguments);
      wrapper = document.createElement('div');
      wrapper.className = 'counter';
      if (Math.random() > 0.5) {
        wrapper.style.webkitTransform = "scale(5)";
      }
      this._el.appendChild(wrapper);
      this._el.classList.add('blackBg');
      for (i = _i = 0; _i < 15; i = ++_i) {
        pixel = document.createElement('div');
        pixel.className = 'pixel p' + i;
        wrapper.appendChild(pixel);
      }
      $('.p0, .p1, .p2, .p3, .p5, .p6, .p8, .p9, .p11, .p12, .p13, .p14').addClass('on');
    }

    Counter.prototype.onBeat = function() {
      var redPixel;
      Counter.__super__.onBeat.apply(this, arguments);
      this._el.classList.remove('blackBg');
      this._flashTimer = setTimeout((function(_this) {
        return function() {
          return _this._el.classList.add('blackBg');
        };
      })(this), 30);
      $('.pixel').removeClass('on');
      $('.pixel').removeClass('red');
      switch (this._step % 10) {
        case 0:
          $('.p0, .p1, .p2, .p3, .p5, .p6, .p8, .p9, .p11, .p12, .p13, .p14').addClass('on');
          break;
        case 1:
          $('.p0, .p1, .p4, .p7, .p10, .p12, .p13, .p14').addClass('on');
          break;
        case 2:
          $('.p0, .p1, .p2, .p5, .p7, .p9, .p12, .p13, .p14').addClass('on');
          break;
        case 3:
          $('.p0, .p1, .p2, .p5, .p7, .p8, .p11, .p12, .p13, .p14').addClass('on');
          break;
        case 4:
          $('.p0, .p2, .p3, .p5, .p6, .p7, .p8, .p11, .p14').addClass('on');
          break;
        case 5:
          $('.p0, .p1, .p2, .p3, .p6, .p7, .p8, .p11, .p12, .p13, .p14').addClass('on');
          break;
        case 6:
          $('.p0, .p1, .p2, .p3, .p6, .p7, .p8, .p9, .p11, .p12, .p13, .p14').addClass('on');
          break;
        case 7:
          $('.p0, .p1, .p2, .p5, .p8, .p11, .p14').addClass('on');
          break;
        case 8:
          $('.p0, .p1, .p2, .p3, .p5, .p6, .p7, .p8, .p9, .p11, .p12, .p13, .p14').addClass('on');
          break;
        case 9:
          $('.p0, .p1, .p2, .p3, .p5, .p6, .p7, .p8, .p11, .p12, .p13, .p14').addClass('on');
      }
      if (Math.random() > 0.5) {
        redPixel = Math.ceil(Math.random() * 14);
        redPixel = ".p" + redPixel;
        if ($(redPixel).hasClass('on')) {
          return $(redPixel).addClass('red');
        }
      }
    };

    Counter.prototype.remove = function() {
      Counter.__super__.remove.apply(this, arguments);
      clearTimeout(this._flashTimer);
      return this._el.classList.remove('blackBg');
    };

    return Counter;

  })(VisualEffect);

  window.WhiteRedFlash = (function(_super) {
    __extends(WhiteRedFlash, _super);

    function WhiteRedFlash() {
      this.remove = __bind(this.remove, this);
      WhiteRedFlash.__super__.constructor.apply(this, arguments);
      this._el.classList.add('whiteRedFlash');
    }

    WhiteRedFlash.prototype.onBeat = function() {
      WhiteRedFlash.__super__.onBeat.apply(this, arguments);
      this._el.classList.remove('fadeOut');
      this._el.classList.add('redBg');
      return this._flashTimeout = setTimeout((function(_this) {
        return function() {
          _this._el.classList.add('fadeOut');
          return _this._el.classList.remove('redBg');
        };
      })(this), 25);
    };

    WhiteRedFlash.prototype.remove = function() {
      WhiteRedFlash.__super__.remove.apply(this, arguments);
      clearTimeout(this._flashTimeout);
      this._el.classList.remove('redBg');
      this._el.classList.remove('fadeOut');
      return this._el.classList.remove('whiteRedFlash');
    };

    return WhiteRedFlash;

  })(VisualEffect);

  window.ScrollText = (function(_super) {
    __extends(ScrollText, _super);

    function ScrollText() {
      this.addChar = __bind(this.addChar, this);
      return ScrollText.__super__.constructor.apply(this, arguments);
    }

    ScrollText.prototype._ledPadding = 1;

    ScrollText.prototype._displayWidth = null;

    ScrollText.prototype._message = new Array();

    ScrollText.prototype.onOff = function(led, onOff) {
      var div;
      div = document.getElementById(led);
      if (onOff === 'on') {
        return div.classList.add('on');
      } else if (onOff === 'off') {
        return div.classList.remove('on');
      }
    };

    ScrollText.prototype.setMessage = function(msg) {
      var char, i, _i, _ref, _results;
      msg = msg.toUpperCase();
      _results = [];
      for (i = _i = 0, _ref = msg.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        char = msg.substr(i, 1);
        if (char === '0' || char === '1' || char === '2' || char === '3' || char === '4' || char === '5' || char === '6' || char === '7' || char === '8' || char === '9') {
          char = 'n' + char;
        }
        _results.push(this.addChar(char));
      }
      return _results;
    };

    ScrollText.prototype.addChar = function(char) {
      var x, _i, _ref;
      if (window.msg[char]) {
        for (x = _i = 0, _ref = window.msg[char].length; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
          this._message.push(window.msg[window.msg[char][x]]);
        }
        return this._message.push(window.msg[0]);
      }
    };

    ScrollText.prototype.onBeat = function() {
      var partialMessage, x, y, _i, _ref, _results;
      ScrollText.__super__.onBeat.apply(this, arguments);
      if (this._step > this._message.length) {
        this._step = 0;
      }
      partialMessage = this._message.slice(this._step, this._step + this._displayWidth);
      _results = [];
      for (x = _i = 0, _ref = partialMessage.length; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
        _results.push((function() {
          var _j, _ref1, _results1;
          _results1 = [];
          for (y = _j = 0, _ref1 = partialMessage[x].length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; y = 0 <= _ref1 ? ++_j : --_j) {
            if (partialMessage[x][y] === 1) {
              _results1.push(this.onOff('c' + x + 'p' + y + '' + this._el.id, 'on'));
            } else {
              _results1.push(this.onOff('c' + x + 'p' + y + '' + this._el.id, 'off'));
            }
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    return ScrollText;

  })(VisualEffect);

  window.ScrollTextLarge = (function(_super) {
    __extends(ScrollTextLarge, _super);

    function ScrollTextLarge() {
      var col, i, pixel, wrapper, x, _i, _j, _ref;
      ScrollTextLarge.__super__.constructor.apply(this, arguments);
      this._displayWidth = Math.ceil(this._w / (this._h / 6) + 1);
      wrapper = document.createElement('div');
      wrapper.className = 'ScrollTextLarge';
      this._el.appendChild(wrapper);
      for (i = _i = 0, _ref = this._displayWidth; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        col = document.createElement('div');
        col.className = 'col c' + i;
        col.style.width = this._h / 6;
        wrapper.appendChild(col);
        for (x = _j = 0; _j < 6; x = ++_j) {
          pixel = document.createElement('div');
          pixel.id = 'c' + i + 'p' + x + '' + this._el.id;
          pixel.className = 'pixel';
          col.appendChild(pixel);
        }
      }
      this.setMessage('transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin ');
    }

    return ScrollTextLarge;

  })(window.ScrollText);

  window.ScrollTextParagraph = (function(_super) {
    __extends(ScrollTextParagraph, _super);

    ScrollTextParagraph.prototype._numRows = 10;

    function ScrollTextParagraph() {
      var col, colNum, i, pixel, row, wrapper, x, y, _i, _j, _k, _ref, _ref1;
      ScrollTextParagraph.__super__.constructor.apply(this, arguments);
      this._displayWidth = Math.ceil(this._w / (this._h / this._numRows / 6));
      wrapper = document.createElement('div');
      wrapper.className = 'ScrollTextParagraph';
      this._el.appendChild(wrapper);
      colNum = 0;
      for (i = _i = 0, _ref = this._numRows; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        row = document.createElement('div');
        row.className = 'row r' + i;
        row.style.height = this._h / this._numRows;
        wrapper.appendChild(row);
        for (x = _j = 0, _ref1 = this._displayWidth; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; x = 0 <= _ref1 ? ++_j : --_j) {
          col = document.createElement('div');
          col.className = 'col c' + colNum;
          col.style.width = (this._h / 6) / this._numRows;
          row.appendChild(col);
          for (y = _k = 0; _k < 6; y = ++_k) {
            pixel = document.createElement('div');
            pixel.id = 'c' + colNum + 'p' + y + '' + this._el.id;
            pixel.className = 'pixel';
            col.appendChild(pixel);
          }
          colNum += 1;
        }
      }
      this.setMessage('transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin transport shy dolphin ');
    }

    ScrollTextParagraph.prototype.onBeat = function() {
      var partialMessage, x, y, _i, _ref, _results;
      this._step += 1;
      if (this._step > this._message.length) {
        this._step = 0;
      }
      partialMessage = this._message.slice(this._step, this._step + (this._displayWidth * 10));
      _results = [];
      for (x = _i = 0, _ref = partialMessage.length; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
        if (partialMessage[x]) {
          _results.push((function() {
            var _j, _ref1, _results1;
            _results1 = [];
            for (y = _j = 0, _ref1 = partialMessage[x].length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; y = 0 <= _ref1 ? ++_j : --_j) {
              if (partialMessage[x][y] === 1) {
                _results1.push(this.onOff('c' + x + 'p' + y + this._el.id, 'on'));
              } else {
                _results1.push(this.onOff('c' + x + 'p' + y + this._el.id, 'off'));
              }
            }
            return _results1;
          }).call(this));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return ScrollTextParagraph;

  })(window.ScrollText);

  window.ThreeDee = (function(_super) {
    __extends(ThreeDee, _super);

    ThreeDee.prototype._renderer = void 0;

    ThreeDee.prototype._scene = void 0;

    ThreeDee.prototype._camera = void 0;

    ThreeDee.prototype._startTime = void 0;

    ThreeDee.prototype._curTime = void 0;

    function ThreeDee() {
      var options;
      ThreeDee.__super__.constructor.apply(this, arguments);
      console.log('2');
      options = {
        antialias: true,
        canvas: this._el
      };
      this._renderer = new THREE.WebGLRenderer(options);
      this._renderer.setSize(this._w, this._h);
      this._scene = new THREE.Scene();
      this._startTime = new Date().getTime();
    }

    ThreeDee.prototype.render = function() {
      ThreeDee.__super__.render.apply(this, arguments);
      this._curTime = new Date().getTime() - this._startTime;
      return this._raf = requestAnimationFrame(this.render);
    };

    return ThreeDee;

  })(VisualEffect);

  window.SpinningCube = (function(_super) {
    __extends(SpinningCube, _super);

    SpinningCube.prototype._cube = void 0;

    SpinningCube.prototype._light = void 0;

    SpinningCube.prototype._topSpot = void 0;

    SpinningCube.prototype._bottomSpot = void 0;

    function SpinningCube() {
      var geo, material;
      SpinningCube.__super__.constructor.apply(this, arguments);
      console.log('SpinningCube');
      console.log(this._el, this._w, '<<<');
      this._camera = new THREE.PerspectiveCamera(75, 1, 1, 1000);
      this._camera.position.z = 300;
      this._camera.aspect = this._w / this._h;
      this._camera.updateProjectionMatrix();
      geo = new THREE.BoxGeometry(2, 2, 2);
      material = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        shading: THREE.FlatShading
      });
      this._cube = new THREE.Mesh(geo, material);
      this._light = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.8);
      this._topSpot = new THREE.SpotLight(0xffffff);
      this._topSpot.position.set(1000, 1000, 10);
      this._topSpot.angle = 1.5;
      this._topSpot.lookAt(this._cube.position);
      this._bottomSpot = new THREE.SpotLight(0xffffff);
      this._bottomSpot.position.set(200, -1000, 10);
      this._bottomSpot.angle = 0.5;
      this._bottomSpot.lookAt(this._cube.position);
      this._scene.add(this._cube);
      this._scene.add(this._light);
      this._scene.add(this._topSpot);
      this._scene.add(this._bottomSpot);
    }

    SpinningCube.prototype.onBeat = function() {
      SpinningCube.__super__.onBeat.apply(this, arguments);
      if (this._beat % 3 === 0) {
        this._topSpot.color.setHex(0xff0000);
        this._bottomSpot.color.setHex(0xff0000);
        return this._light.intensity = 0.18;
      } else {
        this._topSpot.color.setHex(0xffffff);
        this._bottomSpot.color.setHex(0xffffff);
        return this._light.intensity = 0.8;
      }
    };

    SpinningCube.prototype.render = function() {
      return;
      SpinningCube.__super__.render.apply(this, arguments);
      this._cube.rotation.y = this._curTime * 0.0003;
      this._camera.position.y = Math.sin(this._curTime / 1000) * 3;
      this._camera.position.z = Math.cos(this._curTime / 1000) * 3;
      this._camera.lookAt(this._cube.position);
      return this._renderer.render(this._scene, this._camera);
    };

    return SpinningCube;

  })(window.ThreeDee);

}).call(this);

(function() {
  var Signal, beatCount, h, leftCtx, leftCv, leftDiv, leftFX, onError, onPeak, rightCtx, rightCv, rightDiv, rightFX, setupMic, switchFX, w;

  Signal = signals.Signal;

  window.events = {
    micAccepted: new Signal(),
    automatic: new Signal(),
    peak: new Signal(),
    bass: new Signal(),
    "break": new Signal(),
    BPM: new Signal(),
    BPMDrop: new Signal(),
    BPMJump: new Signal(),
    changeFreqVar: new Signal(),
    volume: new Signal(),
    frequency: new Signal(),
    inverseCols: new Signal(),
    makeSpecial: new Signal(),
    makeShape: new Signal(),
    showText: new Signal(),
    showIllustration: new Signal(),
    filter: new Signal(),
    transform: new Signal(),
    angela: new Signal(),
    squishy: new Signal()
  };

  w = document.getElementById('leftMagic').clientWidth;

  h = document.getElementById('leftMagic').clientHeight;

  leftCv = document.getElementById('leftMagic');

  leftCv.width = w;

  leftCv.height = h;

  leftCtx = leftCv.getContext('2d');

  rightCv = document.getElementById('rightMagic');

  rightCv.width = w;

  rightCv.height = h;

  rightCtx = rightCv.getContext('2d');

  leftDiv = document.getElementById('leftDiv');

  rightDiv = document.getElementById('rightDiv');

  leftFX = null;

  rightFX = null;

  beatCount = 0;

  window.audioAnalysisEngine = new window.AudioAnalysisEngine();

  $('body').click(function() {
    console.log('???');
    return document.getElementById('fullscreen').webkitRequestFullScreen();
  });

  setupMic = function(stream) {
    return console.log('accepted mic');
  };

  onError = function(err) {
    return console.log('error setting up mic');
  };

  switchFX = (function(_this) {
    return function() {
      var FX, ctxOrDiv, leftOrRight, rand;
      console.log('switch');
      leftOrRight = null;
      FX = null;
      ctxOrDiv = null;
      rand = Math.ceil(Math.random() * 2);
      if (rand === 1) {
        leftOrRight = 'left';
      } else {
        leftOrRight = 'right';
      }
      rand = Math.ceil(Math.random() * 7);
      console.log(rand, 'rand');
      switch (rand) {
        case 1:
          FX = window.HorizontalLinesUp;
          if (leftOrRight === 'left') {
            ctxOrDiv = leftCtx;
          } else {
            ctxOrDiv = rightCtx;
          }
          break;
        case 2:
          FX = window.HorizontalLinesDown;
          if (leftOrRight === 'left') {
            ctxOrDiv = leftCtx;
          } else {
            ctxOrDiv = rightCtx;
          }
          break;
        case 3:
          FX = window.ScrollTextParagraph;
          if (leftOrRight === 'left') {
            ctxOrDiv = leftDiv;
          } else {
            ctxOrDiv = rightDiv;
          }
          break;
        case 4:
          FX = window.ScrollTextLarge;
          if (leftOrRight === 'left') {
            ctxOrDiv = leftDiv;
          } else {
            ctxOrDiv = rightDiv;
          }
          break;
        case 5:
          FX = window.Noise;
          if (leftOrRight === 'left') {
            ctxOrDiv = leftCtx;
          } else {
            ctxOrDiv = rightCtx;
          }
          break;
        case 6:
          FX = window.Counter;
          if (leftOrRight === 'left') {
            ctxOrDiv = leftDiv;
          } else {
            ctxOrDiv = rightDiv;
          }
          break;
        case 7:
          FX = window.WhiteRedFlash;
          if (leftOrRight === 'left') {
            ctxOrDiv = leftDiv;
          } else {
            ctxOrDiv = rightDiv;
          }
          break;
        case 8:
          FX = window.SpinningCube;
          if (leftOrRight === 'left') {
            ctxOrDiv = leftCv;
          } else {
            ctxOrDiv = rightCv;
          }
      }
      if (leftOrRight === 'left') {
        leftFX.remove();
        leftFX = null;
        return leftFX = new FX(ctxOrDiv, w, h);
      } else {
        rightFX.remove();
        rightFX = null;
        return rightFX = new FX(ctxOrDiv, w, h);
      }
    };
  })(this);

  onPeak = function(type) {
    if (type !== 'hard') {
      return;
    }
    beatCount += 1;
    leftFX.onBeat();
    rightFX.onBeat();
    if (beatCount % 10 === 0) {
      return switchFX();
    }
  };

  $(function() {
    window.events.peak.add(onPeak);
    navigator.webkitGetUserMedia({
      audio: true
    }, window.audioAnalysisEngine.setupMic, onError);
    leftFX = new window.SpinningCube(leftCv, w, h);
    return rightFX = new window.ScrollTextParagraph(rightDiv, w, h);
  });

}).call(this);
