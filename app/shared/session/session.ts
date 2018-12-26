import { Injectable } from '@angular/core';
import { GridTracker } from '../grid/grid';

@Injectable()
export class SessionProvider {
  private _username: string;
  private _experiments: Array<Experiment>;

  constructor() {
    this._experiments = [];
  }

  resetSession() {
    this._username = "";
    this._experiments = [];
  }

  get username():string {
    return this._username;
  }

  set username(newname:string) {
    this._username = newname;
  }

  startExperiment(freq:number) {
    let exp = new Experiment(freq);
    this._experiments.push(exp);
  }

  getExperiments(): Array<Experiment> {
    return this._experiments;
  }

  getCurrentExperiment(): Experiment {
    return this._experiments[this._experiments.length - 1];
  }

  cancelExperiment() {
    this._experiments.pop();
  }

}

export enum ExperimentStatus {
  Initialized = "initialized",
  NoiseThreshold = "noise_threshold",
  ToneThreshold = "tone_threshold",
  Started = "started",
  Running = "running",
  Aborted = "aborted",
  Finished = "finished"
}

export class Experiment {
  private _test_frequency: number;
  private _noise_threshold: number;
  private _tone_threshold: number;
  private _grid: GridTracker;
  private _status: ExperimentStatus;

  constructor(freq:number) {
    this._test_frequency = freq;
    this._status = ExperimentStatus.Initialized;
  }

  get testFrequency():number {
    return this._test_frequency;
  }

  get noiseThreshold():number {
    return this._noise_threshold;
  }

  set noiseThreshold(th:number) {
    this._noise_threshold = th;
  }

  get toneThreshold():number {
    return this._tone_threshold;
  }

  set toneThreshold(th:number) {
    this._tone_threshold = th;
  }

  get grid():GridTracker {
    return this._grid;
  }

  set grid(gt:GridTracker) {
    this._grid = gt;
  }

  get status():ExperimentStatus {
    return this._status;
  }

  set status(s:ExperimentStatus) {
    this._status = s;
  }

}
