export enum GridDirection {
  Up = "up",
  Down = "down",
  Right = "right",
  Left = "left"
}

export enum TrialAnswer {
  Correct = "correct",
  Wrong = "wrong"
}

export interface GridTrackerOptions {
  g: ParamGrid,
  m_up: number,
  n_down: number,
  n_revs: number,
  n_step: number
}

export interface GridTrackingStatus {
  xidx: number;
  yidx: number;
  xval: number;
  yval: number;
  direction: GridDirection;
  adjust_difficulty: number;
  finished: boolean;
  answer?: TrialAnswer;
  correct?: boolean;
  stepsize?: [number, number];
  reversal?: boolean;
}

export interface GridTracker {
  initialize: (xval:number, yval:number, direction:GridDirection) => void;
  updatePosition: (ans:TrialAnswer) => void;
  getHistory: () => Array<GridTrackingStatus>;
  getCurrentGridParameters: () => [number, number];
  getStatus: () => GridTrackingStatus;
  getXlim: () => [number,number];
  getYlim: () => [number,number];
  getXres: () => number;
  getYres: () => number;
}

export class PhasedGridTracker implements GridTracker {
  private trackers: Array<GridTracker>;
  private _activeTracker: GridTracker;
  private activeTrackerIdx: number;
  private started: boolean;
  private finished: boolean;

  constructor() {
    this.trackers = [];
  }

  public addPhase(gt:GridTracker) {
    if (this.started) {
      throw new Error("Already running, cannot add more phases.");
    }
    this.trackers.push(gt);
  }

  public initialize(xval:number, yval:number) {
    if (this.trackers.length < 1) {
      throw new Error("No GridTrackers available!");
    }
    this.started = true;
    this.activeTrackerIdx = 0;
    this._activeTracker = this.trackers[this.activeTrackerIdx];
    this._activeTracker.initialize(xval, yval, GridDirection.Up);
  }

  public updatePosition(ans:TrialAnswer) {
    this._activeTracker.updatePosition(ans);
    let status = this._activeTracker.getStatus();
    let pos = this._activeTracker.getCurrentGridParameters();
    if (status.finished) {
      this.activeTrackerIdx += 1;
      if (this.activeTrackerIdx < this.trackers.length) {
        this._activeTracker = this.trackers[this.activeTrackerIdx];
        this._activeTracker.initialize(pos[0], pos[1], status.direction);
      } else {
        this.finished = true;
      }
    }
  }

  public get activeTracker():GridTracker {
    return this._activeTracker;
  }

  public getCurrentGridParameters(): [number, number] {
    return this._activeTracker.getCurrentGridParameters();
  }

  public getStatus(): GridTrackingStatus {
    return this._activeTracker.getStatus();
  }

  public getHistory():Array<GridTrackingStatus> {
    let history:GridTrackingStatus[] = [];
    let max_idx = this.activeTrackerIdx;
    if (this.finished) {
      max_idx = this.trackers.length - 1;
    }
    for (let i = 0; i <= max_idx;i++) {
      history = history.concat(this.trackers[i].getHistory());
    }

    return history;
  }

  public getXlim():[number,number] {
    let xmin:number = Infinity, xmax:number = -Infinity;
    for (let i = 0; i < this.trackers.length; i++) {
      let xlim = this.trackers[i].getXlim();
      xmin = Math.min(xmin, xlim[0]);
      xmax = Math.max(xmax, xlim[1]);
    }

    return [xmin, xmax];
  }

  public getYlim():[number, number] {
    let ymin:number = Infinity, ymax:number = -Infinity;
    for (let i = 0; i < this.trackers.length; i++) {
      let ylim = this.trackers[i].getYlim();
      ymin = Math.min(ymin, ylim[0]);
      ymax = Math.max(ymax, ylim[1]);
    }
    return [ymin,ymax];
  }

  public getXres():number {
    let xres:number = 0;
    for (let i = 0; i < this.trackers.length; i++) {
      let tmpres = this.trackers[i].getXres();
      xres = Math.max(xres, tmpres);
    }
    return xres;
  }

  public getYres():number {
    let yres:number = 0;
    for (let i = 0; i < this.trackers.length; i++) {
      let tmpres = this.trackers[i].getYres();
      yres = Math.max(yres, tmpres);
    }
    return yres;
  }

}


export class BasicGridTracker implements GridTracker {
  private grid: ParamGrid;
  private status: GridTrackingStatus;
  private history: Array<GridTrackingStatus>;
  private m_up: number;
  private n_down: number;
  private answerBuffer: Array<TrialAnswer|null>;
  private n_max_reversals: number;
  private reversal_counter: number;
  private n_max_steps: number;
  private initialized: boolean;

  constructor(params: GridTrackerOptions) {
    this.grid = params.g;
    this.m_up = params.m_up;
    this.n_down = params.n_down;
    this.answerBuffer = new Array(Math.max(params.m_up, params.n_down));
    for (let i = 0; i < this.answerBuffer.length; i++) {
      this.answerBuffer[i] = null;
    }

    this.n_max_reversals = params.n_revs;
    this.n_max_steps = params.n_step;
    this.initialized = false;
  }

  getLastNAnswers(n: number): TrialAnswer[] {
    let i = Math.min(this.answerBuffer.length, Math.abs(n));
    return this.answerBuffer.slice(-1*i);
  }

  clearAnswerBuffer(): void {
    this.answerBuffer = new Array(this.answerBuffer.length);
    for (let i = 0; i < this.answerBuffer.length; i++) {
      this.answerBuffer[i] = null;
    }
  }

  getStatus(): GridTrackingStatus {
    return this.status;
  }

  getHistory(): GridTrackingStatus[] {
    return this.history;
  }

  getStepsize(): [number, number] {
    return this.status.stepsize;
  }

  setStepsize(xstep:number, ystep:number) {
    this.status.stepsize = [xstep, ystep];
  }

  initialize(x:number, y:number, direction: GridDirection) {
    // let x_position = x;
    // if (x < 0) {
    //   x_position = this.grid.getMaxIndices()[0] + x;
    // }
    // let y_position = y;
    // if (y < 0) {
    //   y_position = this.grid.getMaxIndices()[1] + y;
    // }
    let x_position, y_position;
    [x_position, y_position] = this.grid.getGridCoordinates(x,y);
    let xval, yval;
    [xval, yval] = this.grid.getGridValues(x_position, y_position);

    this.status = {
      xidx: x_position,
      yidx: y_position,
      xval: xval,
      yval: yval,
      stepsize: [1, 1],
      direction: direction,
      adjust_difficulty: 0,
      finished: false
    }

    this.history = [];
    this.reversal_counter = 0;
    this.initialized = true;
  }

  updatePosition(ans: TrialAnswer): void {
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
      let n_down_buffer = this.getLastNAnswers(this.n_down);
      if (n_down_buffer.every(a => a == TrialAnswer.Correct)) {
        console.log('down rule, increase difficulty');
        this.status.adjust_difficulty = -1; // negative -> go down = increase difficulty
        this.clearAnswerBuffer();
      } else {
        this.status.adjust_difficulty = 0; // not yet n correct answers, keep going
      }
    } else if (ans == TrialAnswer.Wrong) {
      let m_up_buffer = this.getLastNAnswers(this.m_up);
      if (m_up_buffer.every(a => a == TrialAnswer.Wrong)) {
        console.log('up rule, decrease difficulty');
        this.status.adjust_difficulty = 1; // positive ->  go up = decrease difficulty
        this.clearAnswerBuffer();
      } else {
        this.status.adjust_difficulty = 0;
      }
    }

    let new_yidx = this.status.yidx;
    let new_xidx = this.status.xidx;
    this.status.reversal = false;

    if (this.status.adjust_difficulty != 0) {
      // determine next grid direction
      if (this.status.adjust_difficulty < 0) { // go down = increase difficulty
          if (this.status.direction == GridDirection.Up) {
            this.status.direction = GridDirection.Left;
          } else if (this.status.direction == GridDirection.Right) {
            this.status.direction = GridDirection.Down;
          } // otherwise current direction is down or left -> keep going
      } else if (this.status.adjust_difficulty > 0) { // go up = decrease difficulty
        if (this.status.direction == GridDirection.Down) {
          this.status.direction = GridDirection.Right;
        } else if (this.status.direction == GridDirection.Left) {
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
        } else {
          throw new Error('Grid: unexpected direction when reaching upper y boundary.');
        }
      } else if (new_yidx < 0) {
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
        } else {
          throw new Error('Grid: unexpected direction when reaching lower y boundary.');
        }
      } else if (new_xidx > this.grid.getMaxIndices()[0]) {
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
        } else {
          throw new Error('Grid: unexpected direction when reaching upper x boundary.');
        }
      } else if (new_xidx < 0) {
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
        } else {
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
    let status_clone = Object.assign({}, this.status);
    this.history.push(status_clone);

    // move to new point
    this.status.xidx = new_xidx;
    this.status.yidx = new_yidx;
    let xval, yval;
    [xval, yval] = this.getCurrentGridParameters();
    this.status.xval = xval;
    this.status.yval = yval;
  }

  getGrid(): ParamGrid {
    return this.grid;
  }

  getCurrentGridParameters(): [number, number] {
    return this.grid.getGridValues(this.status.xidx, this.status.yidx);
  }

  getXlim():[number,number] {
    return this.grid.getXlim();
  }

  getYlim():[number,number] {
    return this.grid.getYlim();
  }

  getXres(): number {
    return this.grid.xres;
  }

  getYres():number {
    return this.grid.yres;
  }

}

export class ParamGrid {
  private xlim: [number, number];
  private x_max_idx: number;
  private ylim: [number, number];
  private y_max_idx: number;
  private xresolution: number;
  private yresolution: number;
  private xvalues: Array<number>;
  private yvalues: Array<number>;

  constructor(params: {xmin: number, xmax: number, ymin: number, ymax: number,
              xres: number, yres: number}) {

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

    let x_size = Math.floor((params.xmax - params.xmin)/params.xres) + 1;
    console.log('X dim size ' + x_size);
    this.xvalues = new Array(x_size);
    this.x_max_idx = x_size - 1;
    for (let i = 0; i <= this.x_max_idx; i++) {
      this.xvalues[i] = params.xmin + i*params.xres;
    }
    //this.xvalues[this.x_max_idx] = params.xmax;
    console.log('x min ' + this.xvalues[0] + ', x max ' + this.xvalues[this.x_max_idx]);

    let y_size = Math.floor((params.ymax - params.ymin)/params.yres) + 1;
    console.log('Y dim size ' + y_size);
    this.yvalues = new Array(y_size);
    this.y_max_idx = y_size - 1;
    for (let i = 0; i <= this.y_max_idx; i++) {
      this.yvalues[this.y_max_idx - i] = params.ymax - i*params.yres;
    }
    //this.yvalues[this.y_max_idx] = params.ymax;
    console.log('y min ' + this.yvalues[0] + ', y max ' + this.yvalues[this.y_max_idx]);

  }

  printGrid(): string {
    let gridstring: string = '';
    for (let yi = this.y_max_idx; yi >= 0; yi--) {
      for (let xi = 0; xi <= this.x_max_idx; xi++) {
        gridstring = gridstring + '(' + this.xvalues[xi] + ', ' + this.yvalues[yi] + ') ';
      }
      gridstring = gridstring + ' . ';
    }

    return gridstring;
  }

  getXlim(): [number, number] {
    return this.xlim;
  }

  getMaxIndices(): [number, number] {
    return [this.x_max_idx, this.y_max_idx];
  }

  getYlim(): [number, number] {
    return this.ylim;
  }

  get xres():number {
    return this.xresolution;
  }

  get yres():number {
    return this.yresolution;
  }

  getSubGridByValues(params: {xmin:number, xmax:number, ymin:number, ymax:number}):ParamGrid {
    let ll_coord = this.getGridCoordinates(params.xmin, params.ymin);
    let ur_coord = this.getGridCoordinates(params.xmax, params.ymax);
    return this.getSubGridByIndices({xidx_min: ll_coord[0], xidx_max: ur_coord[0], yidx_min: ll_coord[1], yidx_max: ur_coord[1]});
  }

  getDownsampledGrid(decimate_x:number, decimate_y:number):ParamGrid {

    return new ParamGrid({
      xmin: this.xlim[0],
      xmax: this.xlim[1],
      ymin: this.ylim[0],
      ymax: this.ylim[1],
      xres: decimate_x * this.xresolution,
      yres: decimate_y * this.yresolution
    });
  }

  getSubGridByIndices(params: {xidx_min:number, xidx_max:number, yidx_min:number, yidx_max:number}):ParamGrid {
    let ll_values = this.getGridValues(params.xidx_min, params.yidx_min);
    let ur_values = this.getGridValues(params.xidx_max, params.yidx_max);

    return new ParamGrid({
      xmin: ll_values[0],
      xmax: ur_values[0],
      ymin: ll_values[1],
      ymax: ur_values[1],
      xres: this.xresolution,
      yres: this.yresolution
    });
  }

  getGridValues(xidx, yidx): [number, number] {
    if (xidx > this.x_max_idx) {
      throw new Error('xidx exceeds grid range');
    }
    if (yidx > this.y_max_idx) {
      throw new Error('yidx exceeds grid range');
    }

    return [this.xvalues[xidx], this.yvalues[yidx]];
  }

  getGridCoordinates(xval:number, yval:number): [number, number] {
    let xidx = -1, yidx = -1;

    if (xval <= this.xlim[0]) {
      xidx = 0;
    } else if (xval >= this.xlim[1]) {
      xidx = this.x_max_idx;
    } else {
      let minimum_diff = Infinity;
      let minimum_index = -1;
      for (let i = 1; i < this.x_max_idx; i++) {
        let diff = Math.abs(xval - this.xvalues[i]);
        if (diff < minimum_diff) {
          minimum_diff = diff;
          minimum_index = i;
        }
      }
      xidx = minimum_index;
    }

    if (yval <= this.ylim[0]) {
      yidx = 0;
    } else if (yval >= this.ylim[1]) {
      yidx = this.y_max_idx;
    } else {
      let minimum_diff = Infinity;
      let minimum_index = -1;
      for (let i = 1; i < this.y_max_idx; i++) {
        let diff = Math.abs(yval - this.yvalues[i]);
        if (diff < minimum_diff) {
          minimum_diff = diff;
          minimum_index = i;
        }
      }
      yidx = minimum_index;
    }

    return [xidx, yidx];
  }

}
