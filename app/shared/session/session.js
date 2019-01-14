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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBMkM7QUFJM0M7SUFJRTtRQUNFLElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxzQ0FBWSxHQUFaO1FBQ0UsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFDcEIsSUFBSSxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUM7SUFDekIsQ0FBQztJQUVELHNCQUFJLHFDQUFRO2FBQVo7WUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUN4QixDQUFDO2FBRUQsVUFBYSxPQUFjO1lBQ3pCLElBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDO1FBQzNCLENBQUM7OztPQUpBO0lBTUQseUNBQWUsR0FBZixVQUFnQixJQUFXO1FBQ3pCLElBQUksR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRCx3Q0FBYyxHQUFkO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDM0IsQ0FBQztJQUVELDhDQUFvQixHQUFwQjtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRCwwQ0FBZ0IsR0FBaEI7UUFDRSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQzFCLENBQUM7SUFwQ1UsZUFBZTtRQUQzQixpQkFBVSxFQUFFOztPQUNBLGVBQWUsQ0FzQzNCO0lBQUQsc0JBQUM7Q0FBQSxBQXRDRCxJQXNDQztBQXRDWSwwQ0FBZTtBQXdDNUIsSUFBWSxnQkFRWDtBQVJELFdBQVksZ0JBQWdCO0lBQzFCLCtDQUEyQixDQUFBO0lBQzNCLHNEQUFrQyxDQUFBO0lBQ2xDLG9EQUFnQyxDQUFBO0lBQ2hDLHVDQUFtQixDQUFBO0lBQ25CLHVDQUFtQixDQUFBO0lBQ25CLHVDQUFtQixDQUFBO0lBQ25CLHlDQUFxQixDQUFBO0FBQ3ZCLENBQUMsRUFSVyxnQkFBZ0IsR0FBaEIsd0JBQWdCLEtBQWhCLHdCQUFnQixRQVEzQjtBQUVELElBQVksY0FJWDtBQUpELFdBQVksY0FBYztJQUN4QiwrQkFBYSxDQUFBO0lBQ2IsbURBQWlDLENBQUE7SUFDakMsdURBQXFDLENBQUE7QUFDdkMsQ0FBQyxFQUpXLGNBQWMsR0FBZCxzQkFBYyxLQUFkLHNCQUFjLFFBSXpCO0FBRUQ7SUFRRSxvQkFBWSxJQUFXO1FBQ3JCLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1FBQzVCLElBQUksQ0FBQyxPQUFPLEdBQUcsZ0JBQWdCLENBQUMsV0FBVyxDQUFDO0lBQzlDLENBQUM7SUFFRCxzQkFBSSxxQ0FBYTthQUFqQjtZQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQzlCLENBQUM7OztPQUFBO0lBRUQsc0JBQUksc0NBQWM7YUFBbEI7WUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBQy9CLENBQUM7YUFFRCxVQUFtQixFQUFTO1lBQzFCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7UUFDN0IsQ0FBQzs7O09BSkE7SUFNRCxzQkFBSSxxQ0FBYTthQUFqQjtZQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQzlCLENBQUM7YUFFRCxVQUFrQixFQUFTO1lBQ3pCLElBQUksQ0FBQyxlQUFlLEdBQUcsRUFBRSxDQUFDO1FBQzVCLENBQUM7OztPQUpBO0lBTUQsc0JBQUksNEJBQUk7YUFBUjtZQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ3BCLENBQUM7YUFFRCxVQUFTLEVBQWM7WUFDckIsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDbEIsQ0FBQzs7O09BSkE7SUFNRCxzQkFBSSw4QkFBTTthQUFWO1lBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDdEIsQ0FBQzthQUVELFVBQVcsQ0FBa0I7WUFDM0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7UUFDbkIsQ0FBQzs7O09BSkE7SUFNRCxzQkFBSSw0QkFBSTthQUFSO1lBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDcEIsQ0FBQzthQUVELFVBQVMsQ0FBZ0I7WUFDdkIsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDakIsQ0FBQzs7O09BSkE7SUFNSCxpQkFBQztBQUFELENBQUMsQUF6REQsSUF5REM7QUF6RFksZ0NBQVUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBHcmlkVHJhY2tlciB9IGZyb20gJy4uL2dyaWQvZ3JpZCc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBTZXNzaW9uUHJvdmlkZXIge1xuICBwcml2YXRlIF91c2VybmFtZTogc3RyaW5nO1xuICBwcml2YXRlIF9leHBlcmltZW50czogQXJyYXk8RXhwZXJpbWVudD47XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fZXhwZXJpbWVudHMgPSBbXTtcbiAgfVxuXG4gIHJlc2V0U2Vzc2lvbigpIHtcbiAgICB0aGlzLl91c2VybmFtZSA9IFwiXCI7XG4gICAgdGhpcy5fZXhwZXJpbWVudHMgPSBbXTtcbiAgfVxuXG4gIGdldCB1c2VybmFtZSgpOnN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX3VzZXJuYW1lO1xuICB9XG5cbiAgc2V0IHVzZXJuYW1lKG5ld25hbWU6c3RyaW5nKSB7XG4gICAgdGhpcy5fdXNlcm5hbWUgPSBuZXduYW1lO1xuICB9XG5cbiAgc3RhcnRFeHBlcmltZW50KGZyZXE6bnVtYmVyKSB7XG4gICAgbGV0IGV4cCA9IG5ldyBFeHBlcmltZW50KGZyZXEpO1xuICAgIHRoaXMuX2V4cGVyaW1lbnRzLnB1c2goZXhwKTtcbiAgfVxuXG4gIGdldEV4cGVyaW1lbnRzKCk6IEFycmF5PEV4cGVyaW1lbnQ+IHtcbiAgICByZXR1cm4gdGhpcy5fZXhwZXJpbWVudHM7XG4gIH1cblxuICBnZXRDdXJyZW50RXhwZXJpbWVudCgpOiBFeHBlcmltZW50IHtcbiAgICByZXR1cm4gdGhpcy5fZXhwZXJpbWVudHNbdGhpcy5fZXhwZXJpbWVudHMubGVuZ3RoIC0gMV07XG4gIH1cblxuICBjYW5jZWxFeHBlcmltZW50KCkge1xuICAgIHRoaXMuX2V4cGVyaW1lbnRzLnBvcCgpO1xuICB9XG5cbn1cblxuZXhwb3J0IGVudW0gRXhwZXJpbWVudFN0YXR1cyB7XG4gIEluaXRpYWxpemVkID0gXCJpbml0aWFsaXplZFwiLFxuICBOb2lzZVRocmVzaG9sZCA9IFwibm9pc2VfdGhyZXNob2xkXCIsXG4gIFRvbmVUaHJlc2hvbGQgPSBcInRvbmVfdGhyZXNob2xkXCIsXG4gIFN0YXJ0ZWQgPSBcInN0YXJ0ZWRcIixcbiAgUnVubmluZyA9IFwicnVubmluZ1wiLFxuICBBYm9ydGVkID0gXCJhYm9ydGVkXCIsXG4gIEZpbmlzaGVkID0gXCJmaW5pc2hlZFwiXG59XG5cbmV4cG9ydCBlbnVtIEV4cGVyaW1lbnRUeXBlIHtcbiAgR3JpZCA9IFwiZ3JpZFwiLFxuICBTaW5nbGVSdW5Ob0dhcCA9IFwic2luZ2xlcnVubm9nYXBcIixcbiAgU2luZ2xlUnVuV2l0aEdhcCA9IFwic3VuZ2xlcnVud2l0aGdhcFwiXG59XG5cbmV4cG9ydCBjbGFzcyBFeHBlcmltZW50IHtcbiAgcHJpdmF0ZSBfdGVzdF9mcmVxdWVuY3k6IG51bWJlcjtcbiAgcHJpdmF0ZSBfbm9pc2VfdGhyZXNob2xkOiBudW1iZXI7XG4gIHByaXZhdGUgX3RvbmVfdGhyZXNob2xkOiBudW1iZXI7XG4gIHByaXZhdGUgX2dyaWQ6IEdyaWRUcmFja2VyO1xuICBwcml2YXRlIF9zdGF0dXM6IEV4cGVyaW1lbnRTdGF0dXM7XG4gIHByaXZhdGUgX3R5cGU6IEV4cGVyaW1lbnRUeXBlO1xuXG4gIGNvbnN0cnVjdG9yKGZyZXE6bnVtYmVyKSB7XG4gICAgdGhpcy5fdGVzdF9mcmVxdWVuY3kgPSBmcmVxO1xuICAgIHRoaXMuX3N0YXR1cyA9IEV4cGVyaW1lbnRTdGF0dXMuSW5pdGlhbGl6ZWQ7XG4gIH1cblxuICBnZXQgdGVzdEZyZXF1ZW5jeSgpOm51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3Rlc3RfZnJlcXVlbmN5O1xuICB9XG5cbiAgZ2V0IG5vaXNlVGhyZXNob2xkKCk6bnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fbm9pc2VfdGhyZXNob2xkO1xuICB9XG5cbiAgc2V0IG5vaXNlVGhyZXNob2xkKHRoOm51bWJlcikge1xuICAgIHRoaXMuX25vaXNlX3RocmVzaG9sZCA9IHRoO1xuICB9XG5cbiAgZ2V0IHRvbmVUaHJlc2hvbGQoKTpudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90b25lX3RocmVzaG9sZDtcbiAgfVxuXG4gIHNldCB0b25lVGhyZXNob2xkKHRoOm51bWJlcikge1xuICAgIHRoaXMuX3RvbmVfdGhyZXNob2xkID0gdGg7XG4gIH1cblxuICBnZXQgZ3JpZCgpOkdyaWRUcmFja2VyIHtcbiAgICByZXR1cm4gdGhpcy5fZ3JpZDtcbiAgfVxuXG4gIHNldCBncmlkKGd0OkdyaWRUcmFja2VyKSB7XG4gICAgdGhpcy5fZ3JpZCA9IGd0O1xuICB9XG5cbiAgZ2V0IHN0YXR1cygpOkV4cGVyaW1lbnRTdGF0dXMge1xuICAgIHJldHVybiB0aGlzLl9zdGF0dXM7XG4gIH1cblxuICBzZXQgc3RhdHVzKHM6RXhwZXJpbWVudFN0YXR1cykge1xuICAgIHRoaXMuX3N0YXR1cyA9IHM7XG4gIH1cblxuICBnZXQgdHlwZSgpOkV4cGVyaW1lbnRUeXBlIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZTtcbiAgfVxuXG4gIHNldCB0eXBlKHQ6RXhwZXJpbWVudFR5cGUpIHtcbiAgICB0aGlzLl90eXBlID0gdDtcbiAgfVxuXG59XG4iXX0=