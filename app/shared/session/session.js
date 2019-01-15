"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var SessionProvider = /** @class */ (function () {
    function SessionProvider() {
        this._experiments = [];
    }
    SessionProvider.prototype.resetSession = function () {
        this._username = "";
        this._experiments = [];
    };
    Object.defineProperty(SessionProvider.prototype, "username", {
        get: function () {
            return this._username;
        },
        set: function (newname) {
            this._username = newname;
        },
        enumerable: true,
        configurable: true
    });
    SessionProvider.prototype.startExperiment = function (freq) {
        var exp = new Experiment(freq);
        this._experiments.push(exp);
    };
    SessionProvider.prototype.getExperiments = function () {
        return this._experiments;
    };
    SessionProvider.prototype.getCurrentExperiment = function () {
        return this._experiments[this._experiments.length - 1];
    };
    SessionProvider.prototype.cancelExperiment = function () {
        this._experiments.pop();
    };
    SessionProvider = __decorate([
        core_1.Injectable(),
        __metadata("design:paramtypes", [])
    ], SessionProvider);
    return SessionProvider;
}());
exports.SessionProvider = SessionProvider;
var ExperimentStatus;
(function (ExperimentStatus) {
    ExperimentStatus["Initialized"] = "initialized";
    ExperimentStatus["NoiseThreshold"] = "noise_threshold";
    ExperimentStatus["ToneThreshold"] = "tone_threshold";
    ExperimentStatus["Started"] = "started";
    ExperimentStatus["Running"] = "running";
    ExperimentStatus["Aborted"] = "aborted";
    ExperimentStatus["Finished"] = "finished";
})(ExperimentStatus = exports.ExperimentStatus || (exports.ExperimentStatus = {}));
var ExperimentType;
(function (ExperimentType) {
    ExperimentType["Grid"] = "grid";
    ExperimentType["SingleRunNoGap"] = "singlerunnogap";
    ExperimentType["SingleRunWithGap"] = "sunglerunwithgap";
})(ExperimentType = exports.ExperimentType || (exports.ExperimentType = {}));
var Experiment = /** @class */ (function () {
    function Experiment(freq) {
        this._test_frequency = freq;
        this._status = ExperimentStatus.Initialized;
    }
    Object.defineProperty(Experiment.prototype, "testFrequency", {
        get: function () {
            return this._test_frequency;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Experiment.prototype, "noiseThreshold", {
        get: function () {
            return this._noise_threshold;
        },
        set: function (th) {
            this._noise_threshold = th;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Experiment.prototype, "toneThreshold", {
        get: function () {
            return this._tone_threshold;
        },
        set: function (th) {
            this._tone_threshold = th;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Experiment.prototype, "grid", {
        get: function () {
            return this._grid;
        },
        set: function (gt) {
            this._grid = gt;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Experiment.prototype, "status", {
        get: function () {
            return this._status;
        },
        set: function (s) {
            this._status = s;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Experiment.prototype, "type", {
        get: function () {
            return this._type;
        },
        set: function (t) {
            this._type = t;
        },
        enumerable: true,
        configurable: true
    });
    return Experiment;
}());
exports.Experiment = Experiment;
