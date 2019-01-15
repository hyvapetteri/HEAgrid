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
        this._activeTracker.initialize(xval, yval, GridDirection.Down);
    };
    PhasedGridTracker.prototype.updatePosition = function (ans) {
        this._activeTracker.updatePosition(ans);
        var status = this._activeTracker.getStatus();
        var pos = this._activeTracker.getCurrentGridParameters();
        if (status.finished) {
            this.activeTrackerIdx += 1;
            if (this.activeTrackerIdx < this.trackers.length) {
                this._activeTracker = this.trackers[this.activeTrackerIdx];
                var direction = status.direction;
                if (!!this._activeTracker.getStatus()) {
                    direction = this._activeTracker.getStatus().direction;
                }
                this._activeTracker.initialize(pos[0], pos[1], direction);
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
    ParamGrid.prototype.getDownsampledGrid = function (decimate_x, decimate_y) {
        return new ParamGrid({
            xmin: this.xlim[0],
            xmax: this.xlim[1],
            ymin: this.ylim[0],
            ymax: this.ylim[1],
            xres: decimate_x * this.xresolution,
            yres: decimate_y * this.yresolution
        });
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
