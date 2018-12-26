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
    return Experiment;
}());
exports.Experiment = Experiment;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBMkM7QUFJM0M7SUFJRTtRQUNFLElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxzQ0FBWSxHQUFaO1FBQ0UsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFDcEIsSUFBSSxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUM7SUFDekIsQ0FBQztJQUVELHNCQUFJLHFDQUFRO2FBQVo7WUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUN4QixDQUFDO2FBRUQsVUFBYSxPQUFjO1lBQ3pCLElBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDO1FBQzNCLENBQUM7OztPQUpBO0lBTUQseUNBQWUsR0FBZixVQUFnQixJQUFXO1FBQ3pCLElBQUksR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRCx3Q0FBYyxHQUFkO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDM0IsQ0FBQztJQUVELDhDQUFvQixHQUFwQjtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRCwwQ0FBZ0IsR0FBaEI7UUFDRSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQzFCLENBQUM7SUFwQ1UsZUFBZTtRQUQzQixpQkFBVSxFQUFFOztPQUNBLGVBQWUsQ0FzQzNCO0lBQUQsc0JBQUM7Q0FBQSxBQXRDRCxJQXNDQztBQXRDWSwwQ0FBZTtBQXdDNUIsSUFBWSxnQkFRWDtBQVJELFdBQVksZ0JBQWdCO0lBQzFCLCtDQUEyQixDQUFBO0lBQzNCLHNEQUFrQyxDQUFBO0lBQ2xDLG9EQUFnQyxDQUFBO0lBQ2hDLHVDQUFtQixDQUFBO0lBQ25CLHVDQUFtQixDQUFBO0lBQ25CLHVDQUFtQixDQUFBO0lBQ25CLHlDQUFxQixDQUFBO0FBQ3ZCLENBQUMsRUFSVyxnQkFBZ0IsR0FBaEIsd0JBQWdCLEtBQWhCLHdCQUFnQixRQVEzQjtBQUVEO0lBT0Usb0JBQVksSUFBVztRQUNyQixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztRQUM1QixJQUFJLENBQUMsT0FBTyxHQUFHLGdCQUFnQixDQUFDLFdBQVcsQ0FBQztJQUM5QyxDQUFDO0lBRUQsc0JBQUkscUNBQWE7YUFBakI7WUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUM5QixDQUFDOzs7T0FBQTtJQUVELHNCQUFJLHNDQUFjO2FBQWxCO1lBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztRQUMvQixDQUFDO2FBRUQsVUFBbUIsRUFBUztZQUMxQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO1FBQzdCLENBQUM7OztPQUpBO0lBTUQsc0JBQUkscUNBQWE7YUFBakI7WUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUM5QixDQUFDO2FBRUQsVUFBa0IsRUFBUztZQUN6QixJQUFJLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztRQUM1QixDQUFDOzs7T0FKQTtJQU1ELHNCQUFJLDRCQUFJO2FBQVI7WUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNwQixDQUFDO2FBRUQsVUFBUyxFQUFjO1lBQ3JCLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ2xCLENBQUM7OztPQUpBO0lBTUQsc0JBQUksOEJBQU07YUFBVjtZQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3RCLENBQUM7YUFFRCxVQUFXLENBQWtCO1lBQzNCLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLENBQUM7OztPQUpBO0lBTUgsaUJBQUM7QUFBRCxDQUFDLEFBaERELElBZ0RDO0FBaERZLGdDQUFVIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgR3JpZFRyYWNrZXIgfSBmcm9tICcuLi9ncmlkL2dyaWQnO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgU2Vzc2lvblByb3ZpZGVyIHtcbiAgcHJpdmF0ZSBfdXNlcm5hbWU6IHN0cmluZztcbiAgcHJpdmF0ZSBfZXhwZXJpbWVudHM6IEFycmF5PEV4cGVyaW1lbnQ+O1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX2V4cGVyaW1lbnRzID0gW107XG4gIH1cblxuICByZXNldFNlc3Npb24oKSB7XG4gICAgdGhpcy5fdXNlcm5hbWUgPSBcIlwiO1xuICAgIHRoaXMuX2V4cGVyaW1lbnRzID0gW107XG4gIH1cblxuICBnZXQgdXNlcm5hbWUoKTpzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl91c2VybmFtZTtcbiAgfVxuXG4gIHNldCB1c2VybmFtZShuZXduYW1lOnN0cmluZykge1xuICAgIHRoaXMuX3VzZXJuYW1lID0gbmV3bmFtZTtcbiAgfVxuXG4gIHN0YXJ0RXhwZXJpbWVudChmcmVxOm51bWJlcikge1xuICAgIGxldCBleHAgPSBuZXcgRXhwZXJpbWVudChmcmVxKTtcbiAgICB0aGlzLl9leHBlcmltZW50cy5wdXNoKGV4cCk7XG4gIH1cblxuICBnZXRFeHBlcmltZW50cygpOiBBcnJheTxFeHBlcmltZW50PiB7XG4gICAgcmV0dXJuIHRoaXMuX2V4cGVyaW1lbnRzO1xuICB9XG5cbiAgZ2V0Q3VycmVudEV4cGVyaW1lbnQoKTogRXhwZXJpbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX2V4cGVyaW1lbnRzW3RoaXMuX2V4cGVyaW1lbnRzLmxlbmd0aCAtIDFdO1xuICB9XG5cbiAgY2FuY2VsRXhwZXJpbWVudCgpIHtcbiAgICB0aGlzLl9leHBlcmltZW50cy5wb3AoKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBlbnVtIEV4cGVyaW1lbnRTdGF0dXMge1xuICBJbml0aWFsaXplZCA9IFwiaW5pdGlhbGl6ZWRcIixcbiAgTm9pc2VUaHJlc2hvbGQgPSBcIm5vaXNlX3RocmVzaG9sZFwiLFxuICBUb25lVGhyZXNob2xkID0gXCJ0b25lX3RocmVzaG9sZFwiLFxuICBTdGFydGVkID0gXCJzdGFydGVkXCIsXG4gIFJ1bm5pbmcgPSBcInJ1bm5pbmdcIixcbiAgQWJvcnRlZCA9IFwiYWJvcnRlZFwiLFxuICBGaW5pc2hlZCA9IFwiZmluaXNoZWRcIlxufVxuXG5leHBvcnQgY2xhc3MgRXhwZXJpbWVudCB7XG4gIHByaXZhdGUgX3Rlc3RfZnJlcXVlbmN5OiBudW1iZXI7XG4gIHByaXZhdGUgX25vaXNlX3RocmVzaG9sZDogbnVtYmVyO1xuICBwcml2YXRlIF90b25lX3RocmVzaG9sZDogbnVtYmVyO1xuICBwcml2YXRlIF9ncmlkOiBHcmlkVHJhY2tlcjtcbiAgcHJpdmF0ZSBfc3RhdHVzOiBFeHBlcmltZW50U3RhdHVzO1xuXG4gIGNvbnN0cnVjdG9yKGZyZXE6bnVtYmVyKSB7XG4gICAgdGhpcy5fdGVzdF9mcmVxdWVuY3kgPSBmcmVxO1xuICAgIHRoaXMuX3N0YXR1cyA9IEV4cGVyaW1lbnRTdGF0dXMuSW5pdGlhbGl6ZWQ7XG4gIH1cblxuICBnZXQgdGVzdEZyZXF1ZW5jeSgpOm51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3Rlc3RfZnJlcXVlbmN5O1xuICB9XG5cbiAgZ2V0IG5vaXNlVGhyZXNob2xkKCk6bnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fbm9pc2VfdGhyZXNob2xkO1xuICB9XG5cbiAgc2V0IG5vaXNlVGhyZXNob2xkKHRoOm51bWJlcikge1xuICAgIHRoaXMuX25vaXNlX3RocmVzaG9sZCA9IHRoO1xuICB9XG5cbiAgZ2V0IHRvbmVUaHJlc2hvbGQoKTpudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90b25lX3RocmVzaG9sZDtcbiAgfVxuXG4gIHNldCB0b25lVGhyZXNob2xkKHRoOm51bWJlcikge1xuICAgIHRoaXMuX3RvbmVfdGhyZXNob2xkID0gdGg7XG4gIH1cblxuICBnZXQgZ3JpZCgpOkdyaWRUcmFja2VyIHtcbiAgICByZXR1cm4gdGhpcy5fZ3JpZDtcbiAgfVxuXG4gIHNldCBncmlkKGd0OkdyaWRUcmFja2VyKSB7XG4gICAgdGhpcy5fZ3JpZCA9IGd0O1xuICB9XG5cbiAgZ2V0IHN0YXR1cygpOkV4cGVyaW1lbnRTdGF0dXMge1xuICAgIHJldHVybiB0aGlzLl9zdGF0dXM7XG4gIH1cblxuICBzZXQgc3RhdHVzKHM6RXhwZXJpbWVudFN0YXR1cykge1xuICAgIHRoaXMuX3N0YXR1cyA9IHM7XG4gIH1cblxufVxuIl19