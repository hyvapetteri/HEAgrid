"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GridDirection;
(function (GridDirection) {
    GridDirection["Up"] = "up";
    GridDirection["Down"] = "down";
    GridDirection["Right"] = "right";
    GridDirection["Left"] = "left";
})(GridDirection = exports.GridDirection || (exports.GridDirection = {}));
var TrialAnswer;
(function (TrialAnswer) {
    TrialAnswer["Correct"] = "correct";
    TrialAnswer["Wrong"] = "wrong";
})(TrialAnswer = exports.TrialAnswer || (exports.TrialAnswer = {}));
var PhasedGridTracker = /** @class */ (function () {
    function PhasedGridTracker() {
        this.trackers = [];
    }
    PhasedGridTracker.prototype.addPhase = function (gt) {
        if (this.started) {
            throw new Error("Already running, cannot add more phases.");
        }
        this.trackers.push(gt);
    };
    PhasedGridTracker.prototype.initialize = function (xval, yval) {
        if (this.trackers.length < 1) {
            throw new Error("No GridTrackers available!");
        }
        this.started = true;
        this.activeTrackerIdx = 0;
        this._activeTracker = this.trackers[this.activeTrackerIdx];
        this._activeTracker.initialize(xval, yval, GridDirection.Up);
    };
    PhasedGridTracker.prototype.updatePosition = function (ans) {
        this._activeTracker.updatePosition(ans);
        var status = this._activeTracker.getStatus();
        var pos = this._activeTracker.getCurrentGridParameters();
        if (status.finished) {
            this.activeTrackerIdx += 1;
            if (this.activeTrackerIdx < this.trackers.length) {
                this._activeTracker = this.trackers[this.activeTrackerIdx];
                this._activeTracker.initialize(pos[0], pos[1], status.direction);
            }
            else {
                this.finished = true;
            }
        }
    };
    Object.defineProperty(PhasedGridTracker.prototype, "activeTracker", {
        get: function () {
            return this._activeTracker;
        },
        enumerable: true,
        configurable: true
    });
    PhasedGridTracker.prototype.getCurrentGridParameters = function () {
        return this._activeTracker.getCurrentGridParameters();
    };
    PhasedGridTracker.prototype.getStatus = function () {
        return this._activeTracker.getStatus();
    };
    PhasedGridTracker.prototype.getHistory = function () {
        var history = [];
        var max_idx = this.activeTrackerIdx;
        if (this.finished) {
            max_idx = this.trackers.length - 1;
        }
        for (var i = 0; i <= max_idx; i++) {
            history = history.concat(this.trackers[i].getHistory());
        }
        return history;
    };
    PhasedGridTracker.prototype.getXlim = function () {
        var xmin = Infinity, xmax = -Infinity;
        for (var i = 0; i < this.trackers.length; i++) {
            var xlim = this.trackers[i].getXlim();
            xmin = Math.min(xmin, xlim[0]);
            xmax = Math.max(xmax, xlim[1]);
        }
        return [xmin, xmax];
    };
    PhasedGridTracker.prototype.getYlim = function () {
        var ymin = Infinity, ymax = -Infinity;
        for (var i = 0; i < this.trackers.length; i++) {
            var ylim = this.trackers[i].getYlim();
            ymin = Math.min(ymin, ylim[0]);
            ymax = Math.max(ymax, ylim[1]);
        }
        return [ymin, ymax];
    };
    PhasedGridTracker.prototype.getXres = function () {
        var xres = 0;
        for (var i = 0; i < this.trackers.length; i++) {
            var tmpres = this.trackers[i].getXres();
            xres = Math.max(xres, tmpres);
        }
        return xres;
    };
    PhasedGridTracker.prototype.getYres = function () {
        var yres = 0;
        for (var i = 0; i < this.trackers.length; i++) {
            var tmpres = this.trackers[i].getYres();
            yres = Math.max(yres, tmpres);
        }
        return yres;
    };
    return PhasedGridTracker;
}());
exports.PhasedGridTracker = PhasedGridTracker;
var BasicGridTracker = /** @class */ (function () {
    function BasicGridTracker(params) {
        this.grid = params.g;
        this.m_up = params.m_up;
        this.n_down = params.n_down;
        this.answerBuffer = new Array(Math.max(params.m_up, params.n_down));
        for (var i = 0; i < this.answerBuffer.length; i++) {
            this.answerBuffer[i] = null;
        }
        this.n_max_reversals = params.n_revs;
        this.n_max_steps = params.n_step;
        this.initialized = false;
    }
    BasicGridTracker.prototype.getLastNAnswers = function (n) {
        var i = Math.min(this.answerBuffer.length, Math.abs(n));
        return this.answerBuffer.slice(-1 * i);
    };
    BasicGridTracker.prototype.clearAnswerBuffer = function () {
        this.answerBuffer = new Array(this.answerBuffer.length);
        for (var i = 0; i < this.answerBuffer.length; i++) {
            this.answerBuffer[i] = null;
        }
    };
    BasicGridTracker.prototype.getStatus = function () {
        return this.status;
    };
    BasicGridTracker.prototype.getHistory = function () {
        return this.history;
    };
    BasicGridTracker.prototype.getStepsize = function () {
        return this.status.stepsize;
    };
    BasicGridTracker.prototype.setStepsize = function (xstep, ystep) {
        this.status.stepsize = [xstep, ystep];
    };
    BasicGridTracker.prototype.initialize = function (x, y, direction) {
        // let x_position = x;
        // if (x < 0) {
        //   x_position = this.grid.getMaxIndices()[0] + x;
        // }
        // let y_position = y;
        // if (y < 0) {
        //   y_position = this.grid.getMaxIndices()[1] + y;
        // }
        var x_position, y_position;
        _a = this.grid.getGridCoordinates(x, y), x_position = _a[0], y_position = _a[1];
        var xval, yval;
        _b = this.grid.getGridValues(x_position, y_position), xval = _b[0], yval = _b[1];
        this.status = {
            xidx: x_position,
            yidx: y_position,
            xval: xval,
            yval: yval,
            stepsize: [1, 1],
            direction: direction,
            adjust_difficulty: 0,
            finished: false
        };
        this.history = [];
        this.reversal_counter = 0;
        this.initialized = true;
        var _a, _b;
    };
    BasicGridTracker.prototype.updatePosition = function (ans) {
        if (!this.initialized) {
            throw new Error('Tracker not initialized.');
        }
        if (this.status.finished) {
            throw new Error('Tracker has already finished. Re-initialize to start a new run.');
        }
        this.answerBuffer.shift();
        this.answerBuffer.push(ans);
        this.status.answer = ans;
        console.log(this.answerBuffer);
        // compute the m-up-n-down rule
        if (ans == TrialAnswer.Correct) {
            var n_down_buffer = this.getLastNAnswers(this.n_down);
            if (n_down_buffer.every(function (a) { return a == TrialAnswer.Correct; })) {
                console.log('down rule, increase difficulty');
                this.status.adjust_difficulty = -1; // negative -> go down = increase difficulty
                this.clearAnswerBuffer();
            }
            else {
                this.status.adjust_difficulty = 0; // not yet n correct answers, keep going
            }
        }
        else if (ans == TrialAnswer.Wrong) {
            var m_up_buffer = this.getLastNAnswers(this.m_up);
            if (m_up_buffer.every(function (a) { return a == TrialAnswer.Wrong; })) {
                console.log('up rule, decrease difficulty');
                this.status.adjust_difficulty = 1; // positive ->  go up = decrease difficulty
                this.clearAnswerBuffer();
            }
            else {
                this.status.adjust_difficulty = 0;
            }
        }
        var new_yidx = this.status.yidx;
        var new_xidx = this.status.xidx;
        this.status.reversal = false;
        if (this.status.adjust_difficulty != 0) {
            // determine next grid direction
            if (this.status.adjust_difficulty < 0) {
                if (this.status.direction == GridDirection.Up) {
                    this.status.direction = GridDirection.Left;
                }
                else if (this.status.direction == GridDirection.Right) {
                    this.status.direction = GridDirection.Down;
                } // otherwise current direction is down or left -> keep going
            }
            else if (this.status.adjust_difficulty > 0) {
                if (this.status.direction == GridDirection.Down) {
                    this.status.direction = GridDirection.Right;
                }
                else if (this.status.direction == GridDirection.Left) {
                    this.status.direction = GridDirection.Up;
                } // otherwise current direction is up or right -> keep going
            }
            // determine new position towards the chosen direction
            switch (this.status.direction) {
                case GridDirection.Up:
                    new_yidx = new_yidx + this.status.stepsize[1];
                    break;
                case GridDirection.Right:
                    new_xidx = new_xidx + this.status.stepsize[0];
                    break;
                case GridDirection.Down:
                    new_yidx = new_yidx - this.status.stepsize[1];
                    break;
                case GridDirection.Left:
                    new_xidx = new_xidx - this.status.stepsize[0];
                    break;
            }
            // check if we reached the grid boundaries
            if (new_yidx > this.grid.getMaxIndices()[1]) {
                console.log('Grid: y max reached');
                if (this.status.direction == GridDirection.Up) {
                    // max y value reached, change direction to right, i.e. keep
                    // decreasing difficulty
                    new_yidx = this.grid.getMaxIndices()[1];
                    this.status.direction = GridDirection.Right;
                    this.status.reversal = true;
                    this.reversal_counter = this.reversal_counter + 1;
                    new_xidx = new_xidx + this.status.stepsize[0];
                    if (new_xidx > this.grid.getMaxIndices()[0]) {
                        throw new Error('Grid: Upper right corner reached.');
                    }
                }
                else {
                    throw new Error('Grid: unexpected direction when reaching upper y boundary.');
                }
            }
            else if (new_yidx < 0) {
                console.log('Grid: y min reached');
                if (this.status.direction == GridDirection.Down) {
                    // min y value reached, change direction to left, i.e. keep
                    // increasing difficulty
                    new_yidx = 0;
                    this.status.direction = GridDirection.Left;
                    this.status.reversal = true;
                    this.reversal_counter = this.reversal_counter + 1;
                    new_xidx = new_xidx - this.status.stepsize[0];
                    if (new_xidx < 0) {
                        throw new Error('Grid: Lower left corner reached.');
                    }
                }
                else {
                    throw new Error('Grid: unexpected direction when reaching lower y boundary.');
                }
            }
            else if (new_xidx > this.grid.getMaxIndices()[0]) {
                console.log('Grid: x max reached');
                if (this.status.direction == GridDirection.Right) {
                    // max x value reached, change direction to up, i.e. keep
                    // decreasing difficulty
                    new_xidx = this.grid.getMaxIndices()[0];
                    this.status.direction = GridDirection.Up;
                    this.status.reversal = true;
                    this.reversal_counter = this.reversal_counter + 1;
                    new_yidx = new_yidx + this.status.stepsize[1];
                    if (new_yidx > this.grid.getMaxIndices()[1]) {
                        throw new Error('Grid: Upper right corner reached.');
                    }
                }
                else {
                    throw new Error('Grid: unexpected direction when reaching upper x boundary.');
                }
            }
            else if (new_xidx < 0) {
                console.log('Grid: x min reached');
                if (this.status.direction == GridDirection.Left) {
                    // min x value reached, change direction to down, i.e. keep
                    // increasing difficulty
                    new_xidx = 0;
                    this.status.direction = GridDirection.Down;
                    this.status.reversal = true;
                    this.reversal_counter = this.reversal_counter + 1;
                    new_yidx = new_yidx - this.status.stepsize[1];
                    if (new_yidx < 0) {
                        throw new Error('Grid: Lower left corner reached.');
                    }
                }
                else {
                    throw new Error('Grid: unexpected direction when reaching lower x boundary.');
                }
            }
        }
        // check stopping conditions
        if (this.reversal_counter >= this.n_max_reversals) {
            this.status.finished = true;
        }
        if (this.history.length >= this.n_max_steps - 1) {
            this.status.finished = true;
        }
        // save the status to grid history
        var status_clone = Object.assign({}, this.status);
        this.history.push(status_clone);
        // move to new point
        this.status.xidx = new_xidx;
        this.status.yidx = new_yidx;
        var xval, yval;
        _a = this.getCurrentGridParameters(), xval = _a[0], yval = _a[1];
        this.status.xval = xval;
        this.status.yval = yval;
        var _a;
    };
    BasicGridTracker.prototype.getGrid = function () {
        return this.grid;
    };
    BasicGridTracker.prototype.getCurrentGridParameters = function () {
        return this.grid.getGridValues(this.status.xidx, this.status.yidx);
    };
    BasicGridTracker.prototype.getXlim = function () {
        return this.grid.getXlim();
    };
    BasicGridTracker.prototype.getYlim = function () {
        return this.grid.getYlim();
    };
    BasicGridTracker.prototype.getXres = function () {
        return this.grid.xres;
    };
    BasicGridTracker.prototype.getYres = function () {
        return this.grid.yres;
    };
    return BasicGridTracker;
}());
exports.BasicGridTracker = BasicGridTracker;
var ParamGrid = /** @class */ (function () {
    function ParamGrid(params) {
        if (params.xmax < params.xmin) {
            throw new Error('xmin must be less than xmax');
        }
        this.xlim = [params.xmin, params.xmax];
        if (params.ymax < params.ymin) {
            throw new Error('ymin must be less than ymax');
        }
        this.ylim = [params.ymin, params.ymax];
        this.xresolution = params.xres;
        this.yresolution = params.yres;
        var x_size = Math.floor((params.xmax - params.xmin) / params.xres) + 1;
        console.log('X dim size ' + x_size);
        this.xvalues = new Array(x_size);
        this.x_max_idx = x_size - 1;
        for (var i = 0; i <= this.x_max_idx; i++) {
            this.xvalues[i] = params.xmin + i * params.xres;
        }
        //this.xvalues[this.x_max_idx] = params.xmax;
        console.log('x min ' + this.xvalues[0] + ', x max ' + this.xvalues[this.x_max_idx]);
        var y_size = Math.floor((params.ymax - params.ymin) / params.yres) + 1;
        console.log('Y dim size ' + y_size);
        this.yvalues = new Array(y_size);
        this.y_max_idx = y_size - 1;
        for (var i = 0; i <= this.y_max_idx; i++) {
            this.yvalues[this.y_max_idx - i] = params.ymax - i * params.yres;
        }
        //this.yvalues[this.y_max_idx] = params.ymax;
        console.log('y min ' + this.yvalues[0] + ', y max ' + this.yvalues[this.y_max_idx]);
    }
    ParamGrid.prototype.printGrid = function () {
        var gridstring = '';
        for (var yi = this.y_max_idx; yi >= 0; yi--) {
            for (var xi = 0; xi <= this.x_max_idx; xi++) {
                gridstring = gridstring + '(' + this.xvalues[xi] + ', ' + this.yvalues[yi] + ') ';
            }
            gridstring = gridstring + ' . ';
        }
        return gridstring;
    };
    ParamGrid.prototype.getXlim = function () {
        return this.xlim;
    };
    ParamGrid.prototype.getMaxIndices = function () {
        return [this.x_max_idx, this.y_max_idx];
    };
    ParamGrid.prototype.getYlim = function () {
        return this.ylim;
    };
    Object.defineProperty(ParamGrid.prototype, "xres", {
        get: function () {
            return this.xresolution;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ParamGrid.prototype, "yres", {
        get: function () {
            return this.yresolution;
        },
        enumerable: true,
        configurable: true
    });
    ParamGrid.prototype.getSubGridByValues = function (params) {
        var ll_coord = this.getGridCoordinates(params.xmin, params.ymin);
        var ur_coord = this.getGridCoordinates(params.xmax, params.ymax);
        return this.getSubGridByIndices({ xidx_min: ll_coord[0], xidx_max: ur_coord[0], yidx_min: ll_coord[1], yidx_max: ur_coord[1] });
    };
    ParamGrid.prototype.getSubGridByIndices = function (params) {
        var ll_values = this.getGridValues(params.xidx_min, params.yidx_min);
        var ur_values = this.getGridValues(params.xidx_max, params.yidx_max);
        return new ParamGrid({
            xmin: ll_values[0],
            xmax: ur_values[0],
            ymin: ll_values[1],
            ymax: ur_values[1],
            xres: this.xresolution,
            yres: this.yresolution
        });
    };
    ParamGrid.prototype.getGridValues = function (xidx, yidx) {
        if (xidx > this.x_max_idx) {
            throw new Error('xidx exceeds grid range');
        }
        if (yidx > this.y_max_idx) {
            throw new Error('yidx exceeds grid range');
        }
        return [this.xvalues[xidx], this.yvalues[yidx]];
    };
    ParamGrid.prototype.getGridCoordinates = function (xval, yval) {
        var xidx = -1, yidx = -1;
        if (xval <= this.xlim[0]) {
            xidx = 0;
        }
        else if (xval >= this.xlim[1]) {
            xidx = this.x_max_idx;
        }
        else {
            var minimum_diff = Infinity;
            var minimum_index = -1;
            for (var i = 1; i < this.x_max_idx; i++) {
                var diff = Math.abs(xval - this.xvalues[i]);
                if (diff < minimum_diff) {
                    minimum_diff = diff;
                    minimum_index = i;
                }
            }
            xidx = minimum_index;
        }
        if (yval <= this.ylim[0]) {
            yidx = 0;
        }
        else if (yval >= this.ylim[1]) {
            yidx = this.y_max_idx;
        }
        else {
            var minimum_diff = Infinity;
            var minimum_index = -1;
            for (var i = 1; i < this.y_max_idx; i++) {
                var diff = Math.abs(yval - this.yvalues[i]);
                if (diff < minimum_diff) {
                    minimum_diff = diff;
                    minimum_index = i;
                }
            }
            yidx = minimum_index;
        }
        return [xidx, yidx];
    };
    return ParamGrid;
}());
exports.ParamGrid = ParamGrid;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdyaWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFZLGFBS1g7QUFMRCxXQUFZLGFBQWE7SUFDdkIsMEJBQVMsQ0FBQTtJQUNULDhCQUFhLENBQUE7SUFDYixnQ0FBZSxDQUFBO0lBQ2YsOEJBQWEsQ0FBQTtBQUNmLENBQUMsRUFMVyxhQUFhLEdBQWIscUJBQWEsS0FBYixxQkFBYSxRQUt4QjtBQUVELElBQVksV0FHWDtBQUhELFdBQVksV0FBVztJQUNyQixrQ0FBbUIsQ0FBQTtJQUNuQiw4QkFBZSxDQUFBO0FBQ2pCLENBQUMsRUFIVyxXQUFXLEdBQVgsbUJBQVcsS0FBWCxtQkFBVyxRQUd0QjtBQW9DRDtJQU9FO1FBQ0UsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7SUFDckIsQ0FBQztJQUVNLG9DQUFRLEdBQWYsVUFBZ0IsRUFBYztRQUM1QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNqQixNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUNELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFFTSxzQ0FBVSxHQUFqQixVQUFrQixJQUFXLEVBQUUsSUFBVztRQUN4QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBQ0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDcEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQztRQUMxQixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixD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QUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEMsSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDeEIsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sSUFBSSxZQUFZLEdBQUcsUUFBUSxDQUFDO1lBQzVCLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLEVBQUUsQ0FBQyxDQUFDLElBQUksR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDO29CQUN4QixZQUFZLEdBQUcsSUFBSSxDQUFDO29CQUNwQixhQUFhLEdBQUcsQ0FBQyxDQUFDO2dCQUNwQixDQUFDO1lBQ0gsQ0FBQztZQUNELElBQUksR0FBRyxhQUFhLENBQUM7UUFDdkIsQ0FBQztRQUVELE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN0QixDQUFDO0lBRUgsZ0JBQUM7QUFBRCxDQUFDLEFBdEpELElBc0pDO0FBdEpZLDhCQUFTIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGVudW0gR3JpZERpcmVjdGlvbiB7XG4gIFVwID0gXCJ1cFwiLFxuICBEb3duID0gXCJkb3duXCIsXG4gIFJpZ2h0ID0gXCJyaWdodFwiLFxuICBMZWZ0ID0gXCJsZWZ0XCJcbn1cblxuZXhwb3J0IGVudW0gVHJpYWxBbnN3ZXIge1xuICBDb3JyZWN0ID0gXCJjb3JyZWN0XCIsXG4gIFdyb25nID0gXCJ3cm9uZ1wiXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR3JpZFRyYWNrZXJPcHRpb25zIHtcbiAgZzogUGFyYW1HcmlkLFxuICBtX3VwOiBudW1iZXIsXG4gIG5fZG93bjogbnVtYmVyLFxuICBuX3JldnM6IG51bWJlcixcbiAgbl9zdGVwOiBudW1iZXJcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHcmlkVHJhY2tpbmdTdGF0dXMge1xuICB4aWR4OiBudW1iZXI7XG4gIHlpZHg6IG51bWJlcjtcbiAgeHZhbDogbnVtYmVyO1xuICB5dmFsOiBudW1iZXI7XG4gIGRpcmVjdGlvbjogR3JpZERpcmVjdGlvbjtcbiAgYWRqdXN0X2RpZmZpY3VsdHk6IG51bWJlcjtcbiAgZmluaXNoZWQ6IGJvb2xlYW47XG4gIGFuc3dlcj86IFRyaWFsQW5zd2VyO1xuICBjb3JyZWN0PzogYm9vbGVhbjtcbiAgc3RlcHNpemU/OiBbbnVtYmVyLCBudW1iZXJdO1xuICByZXZlcnNhbD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR3JpZFRyYWNrZXIge1xuICBpbml0aWFsaXplOiAoeHZhbDpudW1iZXIsIHl2YWw6bnVtYmVyLCBkaXJlY3Rpb246R3JpZERpcmVjdGlvbikgPT4gdm9pZDtcbiAgdXBkYXRlUG9zaXRpb246IChhbnM6VHJpYWxBbnN3ZXIpID0+IHZvaWQ7XG4gIGdldEhpc3Rvcnk6ICgpID0+IEFycmF5PEdyaWRUcmFja2luZ1N0YXR1cz47XG4gIGdldEN1cnJlbnRHcmlkUGFyYW1ldGVyczogKCkgPT4gW251bWJlciwgbnVtYmVyXTtcbiAgZ2V0U3RhdHVzOiAoKSA9PiBHcmlkVHJhY2tpbmdTdGF0dXM7XG4gIGdldFhsaW06ICgpID0+IFtudW1iZXIsbnVtYmVyXTtcbiAgZ2V0WWxpbTogKCkgPT4gW251bWJlcixudW1iZXJdO1xuICBnZXRYcmVzOiAoKSA9PiBudW1iZXI7XG4gIGdldFlyZXM6ICgpID0+IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIFBoYXNlZEdyaWRUcmFja2VyIGltcGxlbWVudHMgR3JpZFRyYWNrZXIge1xuICBwcml2YXRlIHRyYWNrZXJzOiBBcnJheTxHcmlkVHJhY2tlcj47XG4gIHByaXZhdGUgX2FjdGl2ZVRyYWNrZXI6IEdyaWRUcmFja2VyO1xuICBwcml2YXRlIGFjdGl2ZVRyYWNrZXJJZHg6IG51bWJlcjtcbiAgcHJpdmF0ZSBzdGFydGVkOiBib29sZWFuO1xuICBwcml2YXRlIGZpbmlzaGVkOiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMudHJhY2tlcnMgPSBbXTtcbiAgfVxuXG4gIHB1YmxpYyBhZGRQaGFzZShndDpHcmlkVHJhY2tlcikge1xuICAgIGlmICh0aGlzLnN0YXJ0ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkFscmVhZHkgcnVubmluZywgY2Fubm90IGFkZCBtb3JlIHBoYXNlcy5cIik7XG4gICAgfVxuICAgIHRoaXMudHJhY2tlcnMucHVzaChndCk7XG4gIH1cblxuICBwdWJsaWMgaW5pdGlhbGl6ZSh4dmFsOm51bWJlciwgeXZhbDpudW1iZXIpIHtcbiAgICBpZiAodGhpcy50cmFja2Vycy5sZW5ndGggPCAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBHcmlkVHJhY2tlcnMgYXZhaWxhYmxlIVwiKTtcbiAgICB9XG4gICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcbiAgICB0aGlzLmFjdGl2ZVRyYWNrZXJJZHggPSAwO1xuICAgIHRoaXMuX2FjdGl2ZVRyYWNrZXIgPSB0aGlzLnRyYWNrZXJzW3RoaXMuYWN0aXZlVHJhY2tlcklkeF07XG4gICAgdGhpcy5fYWN0aXZlVHJhY2tlci5pbml0aWFsaXplKHh2YWwsIHl2YWwsIEdyaWREaXJlY3Rpb24uVXApO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZVBvc2l0aW9uKGFuczpUcmlhbEFuc3dlcikge1xuICAgIHRoaXMuX2FjdGl2ZVRyYWNrZXIudXBkYXRlUG9zaXRpb24oYW5zKTtcbiAgICBsZXQgc3RhdHVzID0gdGhpcy5fYWN0aXZlVHJhY2tlci5nZXRTdGF0dXMoKTtcbiAgICBsZXQgcG9zID0gdGhpcy5fYWN0aXZlVHJhY2tlci5nZXRDdXJyZW50R3JpZFBhcmFtZXRlcnMoKTtcbiAgICBpZiAoc3RhdHVzLmZpbmlzaGVkKSB7XG4gICAgICB0aGlzLmFjdGl2ZVRyYWNrZXJJZHggKz0gMTtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZVRyYWNrZXJJZHggPCB0aGlzLnRyYWNrZXJzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLl9hY3RpdmVUcmFja2VyID0gdGhpcy50cmFja2Vyc1t0aGlzLmFjdGl2ZVRyYWNrZXJJZHhdO1xuICAgICAgICB0aGlzLl9hY3RpdmVUcmFja2VyLmluaXRpYWxpemUocG9zWzBdLCBwb3NbMV0sIHN0YXR1cy5kaXJlY3Rpb24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5maW5pc2hlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGdldCBhY3RpdmVUcmFja2VyKCk6R3JpZFRyYWNrZXIge1xuICAgIHJldHVybiB0aGlzLl9hY3RpdmVUcmFja2VyO1xuICB9XG5cbiAgcHVibGljIGdldEN1cnJlbnRHcmlkUGFyYW1ldGVycygpOiBbbnVtYmVyLCBudW1iZXJdIHtcbiAgICByZXR1cm4gdGhpcy5fYWN0aXZlVHJhY2tlci5nZXRDdXJyZW50R3JpZFBhcmFtZXRlcnMoKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRTdGF0dXMoKTogR3JpZFRyYWNraW5nU3RhdHVzIHtcbiAgICByZXR1cm4gdGhpcy5fYWN0aXZlVHJhY2tlci5nZXRTdGF0dXMoKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRIaXN0b3J5KCk6QXJyYXk8R3JpZFRyYWNraW5nU3RhdHVzPiB7XG4gICAgbGV0IGhpc3Rvcnk6R3JpZFRyYWNraW5nU3RhdHVzW10gPSBbXTtcbiAgICBsZXQgbWF4X2lkeCA9IHRoaXMuYWN0aXZlVHJhY2tlcklkeDtcbiAgICBpZiAodGhpcy5maW5pc2hlZCkge1xuICAgICAgbWF4X2lkeCA9IHRoaXMudHJhY2tlcnMubGVuZ3RoIC0gMTtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gbWF4X2lkeDtpKyspIHtcbiAgICAgIGhpc3RvcnkgPSBoaXN0b3J5LmNvbmNhdCh0aGlzLnRyYWNrZXJzW2ldLmdldEhpc3RvcnkoKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhpc3Rvcnk7XG4gIH1cblxuICBwdWJsaWMgZ2V0WGxpbSgpOltudW1iZXIsbnVtYmVyXSB7XG4gICAgbGV0IHhtaW46bnVtYmVyID0gSW5maW5pdHksIHhtYXg6bnVtYmVyID0gLUluZmluaXR5O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy50cmFja2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IHhsaW0gPSB0aGlzLnRyYWNrZXJzW2ldLmdldFhsaW0oKTtcbiAgICAgIHhtaW4gPSBNYXRoLm1pbih4bWluLCB4bGltWzBdKTtcbiAgICAgIHhtYXggPSBNYXRoLm1heCh4bWF4LCB4bGltWzFdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gW3htaW4sIHhtYXhdO1xuICB9XG5cbiAgcHVibGljIGdldFlsaW0oKTpbbnVtYmVyLCBudW1iZXJdIHtcbiAgICBsZXQgeW1pbjpudW1iZXIgPSBJbmZpbml0eSwgeW1heDpudW1iZXIgPSAtSW5maW5pdHk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnRyYWNrZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgeWxpbSA9IHRoaXMudHJhY2tlcnNbaV0uZ2V0WWxpbSgpO1xuICAgICAgeW1pbiA9IE1hdGgubWluKHltaW4sIHlsaW1bMF0pO1xuICAgICAgeW1heCA9IE1hdGgubWF4KHltYXgsIHlsaW1bMV0pO1xuICAgIH1cbiAgICByZXR1cm4gW3ltaW4seW1heF07XG4gIH1cblxuICBwdWJsaWMgZ2V0WHJlcygpOm51bWJlciB7XG4gICAgbGV0IHhyZXM6bnVtYmVyID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudHJhY2tlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCB0bXByZXMgPSB0aGlzLnRyYWNrZXJzW2ldLmdldFhyZXMoKTtcbiAgICAgIHhyZXMgPSBNYXRoLm1heCh4cmVzLCB0bXByZXMpO1xuICAgIH1cbiAgICByZXR1cm4geHJlcztcbiAgfVxuXG4gIHB1YmxpYyBnZXRZcmVzKCk6bnVtYmVyIHtcbiAgICBsZXQgeXJlczpudW1iZXIgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy50cmFja2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IHRtcHJlcyA9IHRoaXMudHJhY2tlcnNbaV0uZ2V0WXJlcygpO1xuICAgICAgeXJlcyA9IE1hdGgubWF4KHlyZXMsIHRtcHJlcyk7XG4gICAgfVxuICAgIHJldHVybiB5cmVzO1xuICB9XG5cbn1cblxuXG5leHBvcnQgY2xhc3MgQmFzaWNHcmlkVHJhY2tlciBpbXBsZW1lbnRzIEdyaWRUcmFja2VyIHtcbiAgcHJpdmF0ZSBncmlkOiBQYXJhbUdyaWQ7XG4gIHByaXZhdGUgc3RhdHVzOiBHcmlkVHJhY2tpbmdTdGF0dXM7XG4gIHByaXZhdGUgaGlzdG9yeTogQXJyYXk8R3JpZFRyYWNraW5nU3RhdHVzPjtcbiAgcHJpdmF0ZSBtX3VwOiBudW1iZXI7XG4gIHByaXZhdGUgbl9kb3duOiBudW1iZXI7XG4gIHByaXZhdGUgYW5zd2VyQnVmZmVyOiBBcnJheTxUcmlhbEFuc3dlcnxudWxsPjtcbiAgcHJpdmF0ZSBuX21heF9yZXZlcnNhbHM6IG51bWJlcjtcbiAgcHJpdmF0ZSByZXZlcnNhbF9jb3VudGVyOiBudW1iZXI7XG4gIHByaXZhdGUgbl9tYXhfc3RlcHM6IG51bWJlcjtcbiAgcHJpdmF0ZSBpbml0aWFsaXplZDogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3RvcihwYXJhbXM6IEdyaWRUcmFja2VyT3B0aW9ucykge1xuICAgIHRoaXMuZ3JpZCA9IHBhcmFtcy5nO1xuICAgIHRoaXMubV91cCA9IHBhcmFtcy5tX3VwO1xuICAgIHRoaXMubl9kb3duID0gcGFyYW1zLm5fZG93bjtcbiAgICB0aGlzLmFuc3dlckJ1ZmZlciA9IG5ldyBBcnJheShNYXRoLm1heChwYXJhbXMubV91cCwgcGFyYW1zLm5fZG93bikpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5hbnN3ZXJCdWZmZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuYW5zd2VyQnVmZmVyW2ldID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLm5fbWF4X3JldmVyc2FscyA9IHBhcmFtcy5uX3JldnM7XG4gICAgdGhpcy5uX21heF9zdGVwcyA9IHBhcmFtcy5uX3N0ZXA7XG4gICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuICB9XG5cbiAgZ2V0TGFzdE5BbnN3ZXJzKG46IG51bWJlcik6IFRyaWFsQW5zd2VyW10ge1xuICAgIGxldCBpID0gTWF0aC5taW4odGhpcy5hbnN3ZXJCdWZmZXIubGVuZ3RoLCBNYXRoLmFicyhuKSk7XG4gICAgcmV0dXJuIHRoaXMuYW5zd2VyQnVmZmVyLnNsaWNlKC0xKmkpO1xuICB9XG5cbiAgY2xlYXJBbnN3ZXJCdWZmZXIoKTogdm9pZCB7XG4gICAgdGhpcy5hbnN3ZXJCdWZmZXIgPSBuZXcgQXJyYXkodGhpcy5hbnN3ZXJCdWZmZXIubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYW5zd2VyQnVmZmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLmFuc3dlckJ1ZmZlcltpXSA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgZ2V0U3RhdHVzKCk6IEdyaWRUcmFja2luZ1N0YXR1cyB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdHVzO1xuICB9XG5cbiAgZ2V0SGlzdG9yeSgpOiBHcmlkVHJhY2tpbmdTdGF0dXNbXSB7XG4gICAgcmV0dXJuIHRoaXMuaGlzdG9yeTtcbiAgfVxuXG4gIGdldFN0ZXBzaXplKCk6IFtudW1iZXIsIG51bWJlcl0ge1xuICAgIHJldHVybiB0aGlzLnN0YXR1cy5zdGVwc2l6ZTtcbiAgfVxuXG4gIHNldFN0ZXBzaXplKHhzdGVwOm51bWJlciwgeXN0ZXA6bnVtYmVyKSB7XG4gICAgdGhpcy5zdGF0dXMuc3RlcHNpemUgPSBbeHN0ZXAsIHlzdGVwXTtcbiAgfVxuXG4gIGluaXRpYWxpemUoeDpudW1iZXIsIHk6bnVtYmVyLCBkaXJlY3Rpb246IEdyaWREaXJlY3Rpb24pIHtcbiAgICAvLyBsZXQgeF9wb3NpdGlvbiA9IHg7XG4gICAgLy8gaWYgKHggPCAwKSB7XG4gICAgLy8gICB4X3Bvc2l0aW9uID0gdGhpcy5ncmlkLmdldE1heEluZGljZXMoKVswXSArIHg7XG4gICAgLy8gfVxuICAgIC8vIGxldCB5X3Bvc2l0aW9uID0geTtcbiAgICAvLyBpZiAoeSA8IDApIHtcbiAgICAvLyAgIHlfcG9zaXRpb24gPSB0aGlzLmdyaWQuZ2V0TWF4SW5kaWNlcygpWzFdICsgeTtcbiAgICAvLyB9XG4gICAgbGV0IHhfcG9zaXRpb24sIHlfcG9zaXRpb247XG4gICAgW3hfcG9zaXRpb24sIHlfcG9zaXRpb25dID0gdGhpcy5ncmlkLmdldEdyaWRDb29yZGluYXRlcyh4LHkpO1xuICAgIGxldCB4dmFsLCB5dmFsO1xuICAgIFt4dmFsLCB5dmFsXSA9IHRoaXMuZ3JpZC5nZXRHcmlkVmFsdWVzKHhfcG9zaXRpb24sIHlfcG9zaXRpb24pO1xuXG4gICAgdGhpcy5zdGF0dXMgPSB7XG4gICAgICB4aWR4OiB4X3Bvc2l0aW9uLFxuICAgICAgeWlkeDogeV9wb3NpdGlvbixcbiAgICAgIHh2YWw6IHh2YWwsXG4gICAgICB5dmFsOiB5dmFsLFxuICAgICAgc3RlcHNpemU6IFsxLCAxXSxcbiAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLFxuICAgICAgYWRqdXN0X2RpZmZpY3VsdHk6IDAsXG4gICAgICBmaW5pc2hlZDogZmFsc2VcbiAgICB9XG5cbiAgICB0aGlzLmhpc3RvcnkgPSBbXTtcbiAgICB0aGlzLnJldmVyc2FsX2NvdW50ZXIgPSAwO1xuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICB9XG5cbiAgdXBkYXRlUG9zaXRpb24oYW5zOiBUcmlhbEFuc3dlcik6IHZvaWQge1xuICAgIGlmICghdGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUcmFja2VyIG5vdCBpbml0aWFsaXplZC4nKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3RhdHVzLmZpbmlzaGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RyYWNrZXIgaGFzIGFscmVhZHkgZmluaXNoZWQuIFJlLWluaXRpYWxpemUgdG8gc3RhcnQgYSBuZXcgcnVuLicpO1xuICAgIH1cblxuICAgIHRoaXMuYW5zd2VyQnVmZmVyLnNoaWZ0KCk7XG4gICAgdGhpcy5hbnN3ZXJCdWZmZXIucHVzaChhbnMpO1xuICAgIHRoaXMuc3RhdHVzLmFuc3dlciA9IGFucztcblxuICAgIGNvbnNvbGUubG9nKHRoaXMuYW5zd2VyQnVmZmVyKTtcbiAgICAvLyBjb21wdXRlIHRoZSBtLXVwLW4tZG93biBydWxlXG4gICAgaWYgKGFucyA9PSBUcmlhbEFuc3dlci5Db3JyZWN0KSB7XG4gICAgICBsZXQgbl9kb3duX2J1ZmZlciA9IHRoaXMuZ2V0TGFzdE5BbnN3ZXJzKHRoaXMubl9kb3duKTtcbiAgICAgIGlmIChuX2Rvd25fYnVmZmVyLmV2ZXJ5KGEgPT4gYSA9PSBUcmlhbEFuc3dlci5Db3JyZWN0KSkge1xuICAgICAgICBjb25zb2xlLmxvZygnZG93biBydWxlLCBpbmNyZWFzZSBkaWZmaWN1bHR5Jyk7XG4gICAgICAgIHRoaXMuc3RhdHVzLmFkanVzdF9kaWZmaWN1bHR5ID0gLTE7IC8vIG5lZ2F0aXZlIC0+IGdvIGRvd24gPSBpbmNyZWFzZSBkaWZmaWN1bHR5XG4gICAgICAgIHRoaXMuY2xlYXJBbnN3ZXJCdWZmZXIoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc3RhdHVzLmFkanVzdF9kaWZmaWN1bHR5ID0gMDsgLy8gbm90IHlldCBuIGNvcnJlY3QgYW5zd2Vycywga2VlcCBnb2luZ1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYW5zID09IFRyaWFsQW5zd2VyLldyb25nKSB7XG4gICAgICBsZXQgbV91cF9idWZmZXIgPSB0aGlzLmdldExhc3ROQW5zd2Vycyh0aGlzLm1fdXApO1xuICAgICAgaWYgKG1fdXBfYnVmZmVyLmV2ZXJ5KGEgPT4gYSA9PSBUcmlhbEFuc3dlci5Xcm9uZykpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3VwIHJ1bGUsIGRlY3JlYXNlIGRpZmZpY3VsdHknKTtcbiAgICAgICAgdGhpcy5zdGF0dXMuYWRqdXN0X2RpZmZpY3VsdHkgPSAxOyAvLyBwb3NpdGl2ZSAtPiAgZ28gdXAgPSBkZWNyZWFzZSBkaWZmaWN1bHR5XG4gICAgICAgIHRoaXMuY2xlYXJBbnN3ZXJCdWZmZXIoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc3RhdHVzLmFkanVzdF9kaWZmaWN1bHR5ID0gMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgbmV3X3lpZHggPSB0aGlzLnN0YXR1cy55aWR4O1xuICAgIGxldCBuZXdfeGlkeCA9IHRoaXMuc3RhdHVzLnhpZHg7XG4gICAgdGhpcy5zdGF0dXMucmV2ZXJzYWwgPSBmYWxzZTtcblxuICAgIGlmICh0aGlzLnN0YXR1cy5hZGp1c3RfZGlmZmljdWx0eSAhPSAwKSB7XG4gICAgICAvLyBkZXRlcm1pbmUgbmV4dCBncmlkIGRpcmVjdGlvblxuICAgICAgaWYgKHRoaXMuc3RhdHVzLmFkanVzdF9kaWZmaWN1bHR5IDwgMCkgeyAvLyBnbyBkb3duID0gaW5jcmVhc2UgZGlmZmljdWx0eVxuICAgICAgICAgIGlmICh0aGlzLnN0YXR1cy5kaXJlY3Rpb24gPT0gR3JpZERpcmVjdGlvbi5VcCkge1xuICAgICAgICAgICAgdGhpcy5zdGF0dXMuZGlyZWN0aW9uID0gR3JpZERpcmVjdGlvbi5MZWZ0O1xuICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0dXMuZGlyZWN0aW9uID09IEdyaWREaXJlY3Rpb24uUmlnaHQpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzLmRpcmVjdGlvbiA9IEdyaWREaXJlY3Rpb24uRG93bjtcbiAgICAgICAgICB9IC8vIG90aGVyd2lzZSBjdXJyZW50IGRpcmVjdGlvbiBpcyBkb3duIG9yIGxlZnQgLT4ga2VlcCBnb2luZ1xuICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXR1cy5hZGp1c3RfZGlmZmljdWx0eSA+IDApIHsgLy8gZ28gdXAgPSBkZWNyZWFzZSBkaWZmaWN1bHR5XG4gICAgICAgIGlmICh0aGlzLnN0YXR1cy5kaXJlY3Rpb24gPT0gR3JpZERpcmVjdGlvbi5Eb3duKSB7XG4gICAgICAgICAgdGhpcy5zdGF0dXMuZGlyZWN0aW9uID0gR3JpZERpcmVjdGlvbi5SaWdodDtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXR1cy5kaXJlY3Rpb24gPT0gR3JpZERpcmVjdGlvbi5MZWZ0KSB7XG4gICAgICAgICAgdGhpcy5zdGF0dXMuZGlyZWN0aW9uID0gR3JpZERpcmVjdGlvbi5VcDtcbiAgICAgICAgfSAvLyBvdGhlcndpc2UgY3VycmVudCBkaXJlY3Rpb24gaXMgdXAgb3IgcmlnaHQgLT4ga2VlcCBnb2luZ1xuICAgICAgfVxuXG4gICAgICAvLyBkZXRlcm1pbmUgbmV3IHBvc2l0aW9uIHRvd2FyZHMgdGhlIGNob3NlbiBkaXJlY3Rpb25cbiAgICAgIHN3aXRjaCAodGhpcy5zdGF0dXMuZGlyZWN0aW9uKSB7XG4gICAgICAgIGNhc2UgR3JpZERpcmVjdGlvbi5VcDpcbiAgICAgICAgICBuZXdfeWlkeCA9IG5ld195aWR4ICsgdGhpcy5zdGF0dXMuc3RlcHNpemVbMV07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgR3JpZERpcmVjdGlvbi5SaWdodDpcbiAgICAgICAgICBuZXdfeGlkeCA9IG5ld194aWR4ICsgdGhpcy5zdGF0dXMuc3RlcHNpemVbMF07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgR3JpZERpcmVjdGlvbi5Eb3duOlxuICAgICAgICAgIG5ld195aWR4ID0gbmV3X3lpZHggLSB0aGlzLnN0YXR1cy5zdGVwc2l6ZVsxXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBHcmlkRGlyZWN0aW9uLkxlZnQ6XG4gICAgICAgICAgbmV3X3hpZHggPSBuZXdfeGlkeCAtIHRoaXMuc3RhdHVzLnN0ZXBzaXplWzBdO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBjaGVjayBpZiB3ZSByZWFjaGVkIHRoZSBncmlkIGJvdW5kYXJpZXNcbiAgICAgIGlmIChuZXdfeWlkeCA+IHRoaXMuZ3JpZC5nZXRNYXhJbmRpY2VzKClbMV0pIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0dyaWQ6IHkgbWF4IHJlYWNoZWQnKTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzLmRpcmVjdGlvbiA9PSBHcmlkRGlyZWN0aW9uLlVwKSB7XG4gICAgICAgICAgLy8gbWF4IHkgdmFsdWUgcmVhY2hlZCwgY2hhbmdlIGRpcmVjdGlvbiB0byByaWdodCwgaS5lLiBrZWVwXG4gICAgICAgICAgLy8gZGVjcmVhc2luZyBkaWZmaWN1bHR5XG4gICAgICAgICAgbmV3X3lpZHggPSB0aGlzLmdyaWQuZ2V0TWF4SW5kaWNlcygpWzFdO1xuICAgICAgICAgIHRoaXMuc3RhdHVzLmRpcmVjdGlvbiA9IEdyaWREaXJlY3Rpb24uUmlnaHQ7XG4gICAgICAgICAgdGhpcy5zdGF0dXMucmV2ZXJzYWwgPSB0cnVlO1xuICAgICAgICAgIHRoaXMucmV2ZXJzYWxfY291bnRlciA9IHRoaXMucmV2ZXJzYWxfY291bnRlciArIDE7XG4gICAgICAgICAgbmV3X3hpZHggPSBuZXdfeGlkeCArIHRoaXMuc3RhdHVzLnN0ZXBzaXplWzBdO1xuICAgICAgICAgIGlmIChuZXdfeGlkeCA+IHRoaXMuZ3JpZC5nZXRNYXhJbmRpY2VzKClbMF0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignR3JpZDogVXBwZXIgcmlnaHQgY29ybmVyIHJlYWNoZWQuJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignR3JpZDogdW5leHBlY3RlZCBkaXJlY3Rpb24gd2hlbiByZWFjaGluZyB1cHBlciB5IGJvdW5kYXJ5LicpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKG5ld195aWR4IDwgMCkge1xuICAgICAgICBjb25zb2xlLmxvZygnR3JpZDogeSBtaW4gcmVhY2hlZCcpO1xuICAgICAgICBpZiAodGhpcy5zdGF0dXMuZGlyZWN0aW9uID09IEdyaWREaXJlY3Rpb24uRG93bikge1xuICAgICAgICAgIC8vIG1pbiB5IHZhbHVlIHJlYWNoZWQsIGNoYW5nZSBkaXJlY3Rpb24gdG8gbGVmdCwgaS5lLiBrZWVwXG4gICAgICAgICAgLy8gaW5jcmVhc2luZyBkaWZmaWN1bHR5XG4gICAgICAgICAgbmV3X3lpZHggPSAwO1xuICAgICAgICAgIHRoaXMuc3RhdHVzLmRpcmVjdGlvbiA9IEdyaWREaXJlY3Rpb24uTGVmdDtcbiAgICAgICAgICB0aGlzLnN0YXR1cy5yZXZlcnNhbCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5yZXZlcnNhbF9jb3VudGVyID0gdGhpcy5yZXZlcnNhbF9jb3VudGVyICsgMTtcbiAgICAgICAgICBuZXdfeGlkeCA9IG5ld194aWR4IC0gdGhpcy5zdGF0dXMuc3RlcHNpemVbMF07XG4gICAgICAgICAgaWYgKG5ld194aWR4IDwgMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdHcmlkOiBMb3dlciBsZWZ0IGNvcm5lciByZWFjaGVkLicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dyaWQ6IHVuZXhwZWN0ZWQgZGlyZWN0aW9uIHdoZW4gcmVhY2hpbmcgbG93ZXIgeSBib3VuZGFyeS4nKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChuZXdfeGlkeCA+IHRoaXMuZ3JpZC5nZXRNYXhJbmRpY2VzKClbMF0pIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0dyaWQ6IHggbWF4IHJlYWNoZWQnKTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzLmRpcmVjdGlvbiA9PSBHcmlkRGlyZWN0aW9uLlJpZ2h0KSB7XG4gICAgICAgICAgLy8gbWF4IHggdmFsdWUgcmVhY2hlZCwgY2hhbmdlIGRpcmVjdGlvbiB0byB1cCwgaS5lLiBrZWVwXG4gICAgICAgICAgLy8gZGVjcmVhc2luZyBkaWZmaWN1bHR5XG4gICAgICAgICAgbmV3X3hpZHggPSB0aGlzLmdyaWQuZ2V0TWF4SW5kaWNlcygpWzBdO1xuICAgICAgICAgIHRoaXMuc3RhdHVzLmRpcmVjdGlvbiA9IEdyaWREaXJlY3Rpb24uVXA7XG4gICAgICAgICAgdGhpcy5zdGF0dXMucmV2ZXJzYWwgPSB0cnVlO1xuICAgICAgICAgIHRoaXMucmV2ZXJzYWxfY291bnRlciA9IHRoaXMucmV2ZXJzYWxfY291bnRlciArIDE7XG4gICAgICAgICAgbmV3X3lpZHggPSBuZXdfeWlkeCArIHRoaXMuc3RhdHVzLnN0ZXBzaXplWzFdO1xuICAgICAgICAgIGlmIChuZXdfeWlkeCA+IHRoaXMuZ3JpZC5nZXRNYXhJbmRpY2VzKClbMV0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignR3JpZDogVXBwZXIgcmlnaHQgY29ybmVyIHJlYWNoZWQuJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignR3JpZDogdW5leHBlY3RlZCBkaXJlY3Rpb24gd2hlbiByZWFjaGluZyB1cHBlciB4IGJvdW5kYXJ5LicpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKG5ld194aWR4IDwgMCkge1xuICAgICAgICBjb25zb2xlLmxvZygnR3JpZDogeCBtaW4gcmVhY2hlZCcpO1xuICAgICAgICBpZiAodGhpcy5zdGF0dXMuZGlyZWN0aW9uID09IEdyaWREaXJlY3Rpb24uTGVmdCkge1xuICAgICAgICAgIC8vIG1pbiB4IHZhbHVlIHJlYWNoZWQsIGNoYW5nZSBkaXJlY3Rpb24gdG8gZG93biwgaS5lLiBrZWVwXG4gICAgICAgICAgLy8gaW5jcmVhc2luZyBkaWZmaWN1bHR5XG4gICAgICAgICAgbmV3X3hpZHggPSAwO1xuICAgICAgICAgIHRoaXMuc3RhdHVzLmRpcmVjdGlvbiA9IEdyaWREaXJlY3Rpb24uRG93bjtcbiAgICAgICAgICB0aGlzLnN0YXR1cy5yZXZlcnNhbCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5yZXZlcnNhbF9jb3VudGVyID0gdGhpcy5yZXZlcnNhbF9jb3VudGVyICsgMTtcbiAgICAgICAgICBuZXdfeWlkeCA9IG5ld195aWR4IC0gdGhpcy5zdGF0dXMuc3RlcHNpemVbMV07XG4gICAgICAgICAgaWYgKG5ld195aWR4IDwgMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdHcmlkOiBMb3dlciBsZWZ0IGNvcm5lciByZWFjaGVkLicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dyaWQ6IHVuZXhwZWN0ZWQgZGlyZWN0aW9uIHdoZW4gcmVhY2hpbmcgbG93ZXIgeCBib3VuZGFyeS4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNoZWNrIHN0b3BwaW5nIGNvbmRpdGlvbnNcbiAgICBpZiAodGhpcy5yZXZlcnNhbF9jb3VudGVyID49IHRoaXMubl9tYXhfcmV2ZXJzYWxzKSB7XG4gICAgICB0aGlzLnN0YXR1cy5maW5pc2hlZCA9IHRydWU7XG4gICAgfVxuICAgIGlmICh0aGlzLmhpc3RvcnkubGVuZ3RoID49IHRoaXMubl9tYXhfc3RlcHMgLSAxKSB7XG4gICAgICB0aGlzLnN0YXR1cy5maW5pc2hlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gc2F2ZSB0aGUgc3RhdHVzIHRvIGdyaWQgaGlzdG9yeVxuICAgIGxldCBzdGF0dXNfY2xvbmUgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLnN0YXR1cyk7XG4gICAgdGhpcy5oaXN0b3J5LnB1c2goc3RhdHVzX2Nsb25lKTtcblxuICAgIC8vIG1vdmUgdG8gbmV3IHBvaW50XG4gICAgdGhpcy5zdGF0dXMueGlkeCA9IG5ld194aWR4O1xuICAgIHRoaXMuc3RhdHVzLnlpZHggPSBuZXdfeWlkeDtcbiAgICBsZXQgeHZhbCwgeXZhbDtcbiAgICBbeHZhbCwgeXZhbF0gPSB0aGlzLmdldEN1cnJlbnRHcmlkUGFyYW1ldGVycygpO1xuICAgIHRoaXMuc3RhdHVzLnh2YWwgPSB4dmFsO1xuICAgIHRoaXMuc3RhdHVzLnl2YWwgPSB5dmFsO1xuICB9XG5cbiAgZ2V0R3JpZCgpOiBQYXJhbUdyaWQge1xuICAgIHJldHVybiB0aGlzLmdyaWQ7XG4gIH1cblxuICBnZXRDdXJyZW50R3JpZFBhcmFtZXRlcnMoKTogW251bWJlciwgbnVtYmVyXSB7XG4gICAgcmV0dXJuIHRoaXMuZ3JpZC5nZXRHcmlkVmFsdWVzKHRoaXMuc3RhdHVzLnhpZHgsIHRoaXMuc3RhdHVzLnlpZHgpO1xuICB9XG5cbiAgZ2V0WGxpbSgpOltudW1iZXIsbnVtYmVyXSB7XG4gICAgcmV0dXJuIHRoaXMuZ3JpZC5nZXRYbGltKCk7XG4gIH1cblxuICBnZXRZbGltKCk6W251bWJlcixudW1iZXJdIHtcbiAgICByZXR1cm4gdGhpcy5ncmlkLmdldFlsaW0oKTtcbiAgfVxuXG4gIGdldFhyZXMoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5ncmlkLnhyZXM7XG4gIH1cblxuICBnZXRZcmVzKCk6bnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5ncmlkLnlyZXM7XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgUGFyYW1HcmlkIHtcbiAgcHJpdmF0ZSB4bGltOiBbbnVtYmVyLCBudW1iZXJdO1xuICBwcml2YXRlIHhfbWF4X2lkeDogbnVtYmVyO1xuICBwcml2YXRlIHlsaW06IFtudW1iZXIsIG51bWJlcl07XG4gIHByaXZhdGUgeV9tYXhfaWR4OiBudW1iZXI7XG4gIHByaXZhdGUgeHJlc29sdXRpb246IG51bWJlcjtcbiAgcHJpdmF0ZSB5cmVzb2x1dGlvbjogbnVtYmVyO1xuICBwcml2YXRlIHh2YWx1ZXM6IEFycmF5PG51bWJlcj47XG4gIHByaXZhdGUgeXZhbHVlczogQXJyYXk8bnVtYmVyPjtcblxuICBjb25zdHJ1Y3RvcihwYXJhbXM6IHt4bWluOiBudW1iZXIsIHhtYXg6IG51bWJlciwgeW1pbjogbnVtYmVyLCB5bWF4OiBudW1iZXIsXG4gICAgICAgICAgICAgIHhyZXM6IG51bWJlciwgeXJlczogbnVtYmVyfSkge1xuXG4gICAgaWYgKHBhcmFtcy54bWF4IDwgcGFyYW1zLnhtaW4pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigneG1pbiBtdXN0IGJlIGxlc3MgdGhhbiB4bWF4Jyk7XG4gICAgfVxuICAgIHRoaXMueGxpbSA9IFtwYXJhbXMueG1pbiwgcGFyYW1zLnhtYXhdO1xuICAgIGlmIChwYXJhbXMueW1heCA8IHBhcmFtcy55bWluKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3ltaW4gbXVzdCBiZSBsZXNzIHRoYW4geW1heCcpO1xuICAgIH1cbiAgICB0aGlzLnlsaW0gPSBbcGFyYW1zLnltaW4sIHBhcmFtcy55bWF4XTtcblxuICAgIHRoaXMueHJlc29sdXRpb24gPSBwYXJhbXMueHJlcztcbiAgICB0aGlzLnlyZXNvbHV0aW9uID0gcGFyYW1zLnlyZXM7XG5cbiAgICBsZXQgeF9zaXplID0gTWF0aC5mbG9vcigocGFyYW1zLnhtYXggLSBwYXJhbXMueG1pbikvcGFyYW1zLnhyZXMpICsgMTtcbiAgICBjb25zb2xlLmxvZygnWCBkaW0gc2l6ZSAnICsgeF9zaXplKTtcbiAgICB0aGlzLnh2YWx1ZXMgPSBuZXcgQXJyYXkoeF9zaXplKTtcbiAgICB0aGlzLnhfbWF4X2lkeCA9IHhfc2l6ZSAtIDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gdGhpcy54X21heF9pZHg7IGkrKykge1xuICAgICAgdGhpcy54dmFsdWVzW2ldID0gcGFyYW1zLnhtaW4gKyBpKnBhcmFtcy54cmVzO1xuICAgIH1cbiAgICAvL3RoaXMueHZhbHVlc1t0aGlzLnhfbWF4X2lkeF0gPSBwYXJhbXMueG1heDtcbiAgICBjb25zb2xlLmxvZygneCBtaW4gJyArIHRoaXMueHZhbHVlc1swXSArICcsIHggbWF4ICcgKyB0aGlzLnh2YWx1ZXNbdGhpcy54X21heF9pZHhdKTtcblxuICAgIGxldCB5X3NpemUgPSBNYXRoLmZsb29yKChwYXJhbXMueW1heCAtIHBhcmFtcy55bWluKS9wYXJhbXMueXJlcykgKyAxO1xuICAgIGNvbnNvbGUubG9nKCdZIGRpbSBzaXplICcgKyB5X3NpemUpO1xuICAgIHRoaXMueXZhbHVlcyA9IG5ldyBBcnJheSh5X3NpemUpO1xuICAgIHRoaXMueV9tYXhfaWR4ID0geV9zaXplIC0gMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8PSB0aGlzLnlfbWF4X2lkeDsgaSsrKSB7XG4gICAgICB0aGlzLnl2YWx1ZXNbdGhpcy55X21heF9pZHggLSBpXSA9IHBhcmFtcy55bWF4IC0gaSpwYXJhbXMueXJlcztcbiAgICB9XG4gICAgLy90aGlzLnl2YWx1ZXNbdGhpcy55X21heF9pZHhdID0gcGFyYW1zLnltYXg7XG4gICAgY29uc29sZS5sb2coJ3kgbWluICcgKyB0aGlzLnl2YWx1ZXNbMF0gKyAnLCB5IG1heCAnICsgdGhpcy55dmFsdWVzW3RoaXMueV9tYXhfaWR4XSk7XG5cbiAgfVxuXG4gIHByaW50R3JpZCgpOiBzdHJpbmcge1xuICAgIGxldCBncmlkc3RyaW5nOiBzdHJpbmcgPSAnJztcbiAgICBmb3IgKGxldCB5aSA9IHRoaXMueV9tYXhfaWR4OyB5aSA+PSAwOyB5aS0tKSB7XG4gICAgICBmb3IgKGxldCB4aSA9IDA7IHhpIDw9IHRoaXMueF9tYXhfaWR4OyB4aSsrKSB7XG4gICAgICAgIGdyaWRzdHJpbmcgPSBncmlkc3RyaW5nICsgJygnICsgdGhpcy54dmFsdWVzW3hpXSArICcsICcgKyB0aGlzLnl2YWx1ZXNbeWldICsgJykgJztcbiAgICAgIH1cbiAgICAgIGdyaWRzdHJpbmcgPSBncmlkc3RyaW5nICsgJyAuICc7XG4gICAgfVxuXG4gICAgcmV0dXJuIGdyaWRzdHJpbmc7XG4gIH1cblxuICBnZXRYbGltKCk6IFtudW1iZXIsIG51bWJlcl0ge1xuICAgIHJldHVybiB0aGlzLnhsaW07XG4gIH1cblxuICBnZXRNYXhJbmRpY2VzKCk6IFtudW1iZXIsIG51bWJlcl0ge1xuICAgIHJldHVybiBbdGhpcy54X21heF9pZHgsIHRoaXMueV9tYXhfaWR4XTtcbiAgfVxuXG4gIGdldFlsaW0oKTogW251bWJlciwgbnVtYmVyXSB7XG4gICAgcmV0dXJuIHRoaXMueWxpbTtcbiAgfVxuXG4gIGdldCB4cmVzKCk6bnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy54cmVzb2x1dGlvbjtcbiAgfVxuXG4gIGdldCB5cmVzKCk6bnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy55cmVzb2x1dGlvbjtcbiAgfVxuXG4gIGdldFN1YkdyaWRCeVZhbHVlcyhwYXJhbXM6IHt4bWluOm51bWJlciwgeG1heDpudW1iZXIsIHltaW46bnVtYmVyLCB5bWF4Om51bWJlcn0pOlBhcmFtR3JpZCB7XG4gICAgbGV0IGxsX2Nvb3JkID0gdGhpcy5nZXRHcmlkQ29vcmRpbmF0ZXMocGFyYW1zLnhtaW4sIHBhcmFtcy55bWluKTtcbiAgICBsZXQgdXJfY29vcmQgPSB0aGlzLmdldEdyaWRDb29yZGluYXRlcyhwYXJhbXMueG1heCwgcGFyYW1zLnltYXgpO1xuICAgIHJldHVybiB0aGlzLmdldFN1YkdyaWRCeUluZGljZXMoe3hpZHhfbWluOiBsbF9jb29yZFswXSwgeGlkeF9tYXg6IHVyX2Nvb3JkWzBdLCB5aWR4X21pbjogbGxfY29vcmRbMV0sIHlpZHhfbWF4OiB1cl9jb29yZFsxXX0pO1xuICB9XG5cbiAgZ2V0U3ViR3JpZEJ5SW5kaWNlcyhwYXJhbXM6IHt4aWR4X21pbjpudW1iZXIsIHhpZHhfbWF4Om51bWJlciwgeWlkeF9taW46bnVtYmVyLCB5aWR4X21heDpudW1iZXJ9KTpQYXJhbUdyaWQge1xuICAgIGxldCBsbF92YWx1ZXMgPSB0aGlzLmdldEdyaWRWYWx1ZXMocGFyYW1zLnhpZHhfbWluLCBwYXJhbXMueWlkeF9taW4pO1xuICAgIGxldCB1cl92YWx1ZXMgPSB0aGlzLmdldEdyaWRWYWx1ZXMocGFyYW1zLnhpZHhfbWF4LCBwYXJhbXMueWlkeF9tYXgpO1xuXG4gICAgcmV0dXJuIG5ldyBQYXJhbUdyaWQoe1xuICAgICAgeG1pbjogbGxfdmFsdWVzWzBdLFxuICAgICAgeG1heDogdXJfdmFsdWVzWzBdLFxuICAgICAgeW1pbjogbGxfdmFsdWVzWzFdLFxuICAgICAgeW1heDogdXJfdmFsdWVzWzFdLFxuICAgICAgeHJlczogdGhpcy54cmVzb2x1dGlvbixcbiAgICAgIHlyZXM6IHRoaXMueXJlc29sdXRpb25cbiAgICB9KTtcbiAgfVxuXG4gIGdldEdyaWRWYWx1ZXMoeGlkeCwgeWlkeCk6IFtudW1iZXIsIG51bWJlcl0ge1xuICAgIGlmICh4aWR4ID4gdGhpcy54X21heF9pZHgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigneGlkeCBleGNlZWRzIGdyaWQgcmFuZ2UnKTtcbiAgICB9XG4gICAgaWYgKHlpZHggPiB0aGlzLnlfbWF4X2lkeCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd5aWR4IGV4Y2VlZHMgZ3JpZCByYW5nZScpO1xuICAgIH1cblxuICAgIHJldHVybiBbdGhpcy54dmFsdWVzW3hpZHhdLCB0aGlzLnl2YWx1ZXNbeWlkeF1dO1xuICB9XG5cbiAgZ2V0R3JpZENvb3JkaW5hdGVzKHh2YWw6bnVtYmVyLCB5dmFsOm51bWJlcik6IFtudW1iZXIsIG51bWJlcl0ge1xuICAgIGxldCB4aWR4ID0gLTEsIHlpZHggPSAtMTtcblxuICAgIGlmICh4dmFsIDw9IHRoaXMueGxpbVswXSkge1xuICAgICAgeGlkeCA9IDA7XG4gICAgfSBlbHNlIGlmICh4dmFsID49IHRoaXMueGxpbVsxXSkge1xuICAgICAgeGlkeCA9IHRoaXMueF9tYXhfaWR4O1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgbWluaW11bV9kaWZmID0gSW5maW5pdHk7XG4gICAgICBsZXQgbWluaW11bV9pbmRleCA9IC0xO1xuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCB0aGlzLnhfbWF4X2lkeDsgaSsrKSB7XG4gICAgICAgIGxldCBkaWZmID0gTWF0aC5hYnMoeHZhbCAtIHRoaXMueHZhbHVlc1tpXSk7XG4gICAgICAgIGlmIChkaWZmIDwgbWluaW11bV9kaWZmKSB7XG4gICAgICAgICAgbWluaW11bV9kaWZmID0gZGlmZjtcbiAgICAgICAgICBtaW5pbXVtX2luZGV4ID0gaTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgeGlkeCA9IG1pbmltdW1faW5kZXg7XG4gICAgfVxuXG4gICAgaWYgKHl2YWwgPD0gdGhpcy55bGltWzBdKSB7XG4gICAgICB5aWR4ID0gMDtcbiAgICB9IGVsc2UgaWYgKHl2YWwgPj0gdGhpcy55bGltWzFdKSB7XG4gICAgICB5aWR4ID0gdGhpcy55X21heF9pZHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBtaW5pbXVtX2RpZmYgPSBJbmZpbml0eTtcbiAgICAgIGxldCBtaW5pbXVtX2luZGV4ID0gLTE7XG4gICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHRoaXMueV9tYXhfaWR4OyBpKyspIHtcbiAgICAgICAgbGV0IGRpZmYgPSBNYXRoLmFicyh5dmFsIC0gdGhpcy55dmFsdWVzW2ldKTtcbiAgICAgICAgaWYgKGRpZmYgPCBtaW5pbXVtX2RpZmYpIHtcbiAgICAgICAgICBtaW5pbXVtX2RpZmYgPSBkaWZmO1xuICAgICAgICAgIG1pbmltdW1faW5kZXggPSBpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB5aWR4ID0gbWluaW11bV9pbmRleDtcbiAgICB9XG5cbiAgICByZXR1cm4gW3hpZHgsIHlpZHhdO1xuICB9XG5cbn1cbiJdfQ==