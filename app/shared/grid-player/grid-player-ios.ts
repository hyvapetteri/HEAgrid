import * as util from '../../shared/utils';
import * as fs from "tns-core-modules/file-system";
import * as env from "../../config/environment";

declare var zonedCallback: Function;
declare var AVAudioPlayer;

export enum ChannelOptions {
  MonoticLeft,
  MonoticRight,
  Diotic,
  Dichotic
}

export interface GridPlayerOptions {
  targetFrequency: number;

  completeCallback?: any;
  errorCallback?: any;
  infoCallback?: any;

  channelOptions: ChannelOptions;

  loop: boolean;
  paddedSilenceDuration?: number;
  targetDuration: number;
  maskerDuration: number;
  maskerLevel: number;
  window?:boolean;

  settingsPath: string;

  debug?: boolean;
  compensate: boolean;
  calibration: boolean;
}

export class GridPlayer extends NSObject {
  public static ObjCProtocols = [AVAudioPlayerDelegate];

  private _player: AVAudioPlayerNode;
  private _engine: AVAudioEngine;
  private _mixer: AVAudioMixerNode;
  private _ch_layout: AVAudioChannelLayout;
  private _audioformat: AVAudioFormat;

  private _completeCallback: (p1:any) => void;
  private _errorCallback: any;
  private _infoCallback: any;

  private _debug:boolean;

  private _targetDuration: number;
  private _maskerDuration: number;
  private _maskerLevel: number;
  private _fs: number;
  private _loop: boolean;
  private _freq: number;
  private _hasMasker: boolean;
  private _hasTarget: boolean;
  private _silenceDuration: number;
  private _window:boolean;
  private _chs: ChannelOptions;

  private _dioticMasker: Float32Array;
  private _dioticTarget: Float32Array;

  private _leftFilter: Float32Array;
  private _leftCalLevel: number;
  private _rightFilter: Float32Array;
  private _rightCalLevel: number;

  private _stimbuffer: AVAudioPCMBuffer;

  private _compensate: boolean;
  private _calibration: boolean;

  private _settingsPath: string;

  public initialize(options: GridPlayerOptions):Promise<any> {
    this._freq = options.targetFrequency;

    this._targetDuration = options.targetDuration;
    this._maskerDuration = options.maskerDuration;
    this._maskerLevel = options.maskerLevel;
    this._loop = options.loop;
    this._silenceDuration = options.paddedSilenceDuration;
    this._chs = options.channelOptions;

    this._debug = !!options.debug;
    this._window = !!options.window ? options.window : true;
    this._compensate = options.compensate;
    this._calibration = options.calibration;

    this._completeCallback = options.completeCallback;
    this._errorCallback = options.errorCallback;
    this._infoCallback = options.infoCallback;
    this._dioticMasker = undefined;
    this._dioticTarget = undefined;

    this._settingsPath = options.settingsPath;

    this.log("Settings path: " + options.settingsPath);
    const leftFilterFilePath = fs.path.join(options.settingsPath, env.leftFilterFilename);
    const leftFilterFile = fs.File.fromPath(leftFilterFilePath);
    const leftFilterData = leftFilterFile.readSync(err => {this.log(err)});
    let tmpArray = new ArrayBuffer(leftFilterData.length);
    this.log('Type of readSync output: ' + typeof(leftFilterData));
    leftFilterData.getBytes(tmpArray);
    this._leftFilter = new Float32Array(tmpArray);

    const rightFilterFilePath = fs.path.join(this._settingsPath, env.rightFilterFilename);
    const rightFilterFile = fs.File.fromPath(rightFilterFilePath);
    const rightFilterData = rightFilterFile.readSync(err => {this.log(err)});
    tmpArray = new ArrayBuffer(rightFilterData.length);
    rightFilterData.getBytes(tmpArray);
    this._rightFilter = new Float32Array(tmpArray);

    const calLevelFilePath = fs.path.join(this._settingsPath, env.calLevelsFilename);
    const calLevelFile = fs.File.fromPath(calLevelFilePath);
    return calLevelFile.readText().then((res) => {
      this.log("Cal level file contents: " + res);
      let tmpLevels = JSON.parse(res);
      this._leftCalLevel = tmpLevels.left;
      this._rightCalLevel = tmpLevels.right;
      this.log("Left filter length: " + this._leftFilter.length + ", 1st coeff: " + this._leftFilter[0] + ", cal level " + this._leftCalLevel);
      this.log("Right filter length: " + this._rightFilter.length + ", 1st coeff: " + this._rightFilter[0] + ", cal level " + this._rightCalLevel);
    }).catch((err) => {
      this.log("Error reading cal levels: " + err);
    });

  }

  private log(msg:string) {
    if (this._debug) {
      console.log('GridPlayer: ' + msg);
    }
  }

  public get volume(): number {
    return this._player ? this._player.volume : -1;
  }

  public set volume(vol:number) {
    if (this._player && vol >= 0) {
      this._player.volume = vol;
    }
  }

  public isPlaying(): boolean {
    return this._player ? this._player.playing : false;
  }

  public play(): Promise<any> {
    this.log('Play grid');
    return new Promise((resolve, reject) => {
      try {
        if (!this.isPlaying()) {
          this.log('now play');
          this._player.play();
          resolve(true);
        }
      } catch (err) {
        this.log('Error scheduling buffer!');
        this.log(err);
        if (this._errorCallback) {
          this._errorCallback({ err });
        }
        reject(err);
      }
    });
  }

  public pause(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        if (this.isPlaying()) {
          this._player.pause();
        }
        resolve(true);
      } catch (err) {
        if (this._errorCallback) {
          this._errorCallback({ err });
        }
        reject(err);
      }
    });
  }

  public dispose(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this._player.stop();
        this._engine.stop();
        this._engine.disconnectNodeInput(this._mixer);
        this._engine.detachNode(this._player)

        this._player = undefined;
        this._engine = undefined;
        resolve(true);
      } catch (err) {
        if (this._errorCallback) {
          this._errorCallback({ err });
        }
        reject(err);
      }
    });
  }

  public preloadStimulus(xval:number, yval:number, hasTarget:boolean, hasMasker:boolean):Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this._hasTarget = hasTarget;
        this._hasMasker = hasMasker;
        this._dioticMasker = undefined;

        let audioSession = AVAudioSession.sharedInstance();
        audioSession.setActiveError(true);
        this._fs = audioSession.sampleRate;
        this.log('Audiosession done');

        this._ch_layout = new AVAudioChannelLayout({layoutTag: kAudioChannelLayoutTag_StereoHeadphones});
        this._audioformat = new AVAudioFormat({
          commonFormat: AVAudioCommonFormat.PCMFormatFloat32,
          sampleRate: this._fs,
          interleaved: false,
          channelLayout: this._ch_layout});

        this.fillPCMBuffer(xval, yval);
        this.log('buffer created');

        if (!this._engine || !this._engine.running) {

          this._engine = new AVAudioEngine();
          this.log('Engine created');
          this._player = new AVAudioPlayerNode();
          this._player.volume = 0;
          this._player.pan = 0;
          this.log('player created');
          this._engine.attachNode(this._player);
          this.log('player attached');
          this._mixer = this._engine.mainMixerNode;
          this._engine.connectToFormat(this._player, this._mixer, this._audioformat);
          this.log('player attached to mixer');

          let success = this._engine.startAndReturnError();
          this.log('running, engine success: ' + (success ? 'yes' : 'no'));
        }
        this._player.pause();

        this._player.scheduleBufferAtTimeOptionsCompletionCallbackTypeCompletionHandler(
          this._stimbuffer,
          null,
          this._loop ? AVAudioPlayerNodeBufferOptions.Loops : null,
          AVAudioPlayerNodeCompletionCallbackType.DataPlayedBack,
          (p1: AVAudioPlayerNodeCompletionCallbackType) => {
            this.log("Finished playing!.");
            if (this._completeCallback) {
              // wrap in a promise to get back to the main thread
              // ref: https://github.com/NativeScript/NativeScript/issues/1673
              Promise.resolve().then(() => this._completeCallback({ p1 }));
            } else {
              this.log("No callback!");
            }
          }
        );

        resolve();
      } catch (err) {
        this.log(err);
        if (this._errorCallback) {
          this._errorCallback({err});
        }
        reject(err);
      }
    });
  }

  private fillPCMBuffer(xval:number, yval:number) {
    let stim;
    if (this._calibration) {
      stim = this.generateCalibrationStimulus("left");
    } else {
      stim = this.generateStimulus(xval, yval, "left");
    }
    this.log('fillPCMBuffer: Stim created');
    // prepare AVAudioPCMBuffer

    this._stimbuffer = AVAudioPCMBuffer.alloc().initWithPCMFormatFrameCapacity(this._audioformat, stim.length);
    this.log('fillPCMBuffer: buffer initialized, length ' + this._stimbuffer.frameCapacity);
    let ch_handle = this._stimbuffer.floatChannelData;

    if (this._chs !== ChannelOptions.MonoticRight) {
      this.log('fillPCMBuffer: starting to fill buffer');
      let ch_data = ch_handle[0];
      for (let i = 0; i < stim.length; i++) {
        ch_data[i] = stim[i];
      }
      this.log('fillPCMBuffer: buffer full');
    }
    if (this._chs !== ChannelOptions.MonoticLeft) {
      this.log('fillPCMBuffer: Filling also right buffer');
      let stim_r;
      if (this._calibration) {
        stim_r = this.generateCalibrationStimulus("right");
      } else {
        stim_r = this.generateStimulus(xval, yval, "right");
      }
      let ch_data = ch_handle[1];
      for (let i = 0; i < stim.length; i++) {
        ch_data[i] = stim_r[i];
      }
    }
    this._stimbuffer.frameLength = this._stimbuffer.frameCapacity;

    this.log('fillPCMBuffer: return buffer');
  }

  private generateStimulus(xval:number, yval:number, ear:string):Float32Array {

    this.log("generateStimulus: xval " + xval + ", yval " + yval);
    let nsamples_target = Math.floor(this._targetDuration * this._fs);
    let nsamples_masker = Math.floor(this._maskerDuration * this._fs);
    let nsamples = Math.max(nsamples_target, nsamples_masker);
    if (this._silenceDuration) {
      nsamples = nsamples + Math.floor(this._silenceDuration * this._fs);
    }

    let masker_output = new Float32Array(nsamples);
    if (this._hasMasker) {
      let edge1 = 20;
      let edge2 = (1 - xval)*this._freq;
      let edge3 = (1 + xval)*this._freq;
      //let edge4 = this._fs/2 - 1;
      let edge4 = 10000;
      let currbw = (edge4 - edge3) + (edge2 - edge1);
      let full_bw_dB = 10*Math.log10(edge4 - edge1);
      let bw_corr_dB = 10*Math.log10(currbw) - full_bw_dB;

      let bs_masker_win = new Float32Array(nsamples);
      if ((this._chs == ChannelOptions.Diotic) && (this._dioticMasker !== undefined)) {
        this.log("Found old diotic masker here");
        bs_masker_win = this._dioticMasker;
      } else {
        let masker = new Float32Array(nsamples_masker);
        let rnd = util.initRandn(0, util.db2a(-24));
        for (let i = 0; i < nsamples_masker; i++) {
          masker[i] = rnd();
        }

        let bs_masker = new Float32Array(nsamples_masker);
        
        // bandstop-filtering the masker
        let n_fft = util.getNextPowerOf2(nsamples_masker);
        console.log('NFFT: ' + n_fft);
        let masker_fft = util.fft(masker, n_fft);
        let bs_masker_low_fft = util.boxcar_spectrum(masker_fft, edge1, edge2, this._fs);
        let bs_masker_high_fft = util.boxcar_spectrum(masker_fft, edge3, edge4, this._fs);
        let bs_masker_low_padded = util.ifft(bs_masker_low_fft, n_fft);
        let bs_masker_high_padded = util.ifft(bs_masker_high_fft, n_fft);
        vDSP_vadd(interop.handleof(bs_masker_low_padded), 1, interop.handleof(bs_masker_high_padded), 1,
                  interop.handleof(bs_masker), 1, nsamples_masker);


        // windowing the output
        if (this._window) {
          bs_masker_win = util.applyWindow(bs_masker, util.WindowType.RaisedCosine, 0.008, this._fs);
        } else {
          bs_masker_win = bs_masker.slice();
        }
        this._dioticMasker = bs_masker_win.slice(); // slice returns a copy, not a reference
        this.log('bs_masker_win abs max: ' + util.max(util.abs(bs_masker_win)));
        this.log('bw_corr_dB level dB: ' + bw_corr_dB);
        this.log('masker level db: ' + this._maskerLevel);
      }

      // filtering & setting level
      if (this._compensate) {
        let bs_masker_win_norm;
        if (ear === "left") {
          bs_masker_win_norm = util.calfilter(this._leftFilter, (this._leftCalLevel - this._rightCalLevel),
            this._maskerLevel + bw_corr_dB, bs_masker_win);
        } else if (ear === "right") {
          bs_masker_win_norm = util.calfilter(this._rightFilter, 0,
            this._maskerLevel + bw_corr_dB, bs_masker_win);
        }

        masker_output.set(bs_masker_win_norm);
      } else {
        masker_output.set(bs_masker_win);
      }
      this.log('masker abs max: ' + util.max(util.abs(masker_output)));
    }

    let target_output = new Float32Array(nsamples);
    if (this._hasTarget) {
      let target_win;
      if ((this._chs == ChannelOptions.Diotic) && (this._dioticTarget !== undefined)) {
        this.log("Found diotic target");
        target_win = this._dioticTarget;
      } else {
        let target = new Float32Array(nsamples_target);
        for (let i = 0; i < nsamples_target; i++) {
          target[i] = Math.sin((2*Math.PI*this._freq*i)/this._fs);
        }
        if (this._window) {
          target_win = util.applyWindow(target, util.WindowType.RaisedCosine, 0.008, this._fs);
        } else {
          target_win = target.slice();
        }

        this._dioticTarget = target_win.slice();
      }

      if (this._compensate) {
        let target_norm;
        if (ear == "left") {
          target_norm = util.calfilter(this._leftFilter, 6 + (this._leftCalLevel - this._rightCalLevel),
            yval, target_win);
        } else if (ear == "right") {
          target_norm = util.calfilter(this._rightFilter, 6,
            yval, target_win);
        }
        target_output.set(target_norm);
      } else {
        masker_output.set(target_win);
      }
    }

    let output = new Float32Array(nsamples);
    vDSP_vadd(interop.handleof(masker_output), 1, interop.handleof(target_output), 1,
              interop.handleof(output), 1, nsamples);

    let maxval = new interop.Reference<number>();
    vDSP_maxmgv(interop.handleof(output), 1, maxval, nsamples);
    this.log('Max value for output: ' + maxval.value);

    return output;
  }

  public generateCalibrationStimulus(ear:string):Float32Array {
    const refToneFilePath = fs.path.join(this._settingsPath, env.refToneFilename);
    const refToneFile = fs.File.fromPath(refToneFilePath);
    const refToneData = refToneFile.readSync(err => {this.log(err)});
    let tmpArray = new ArrayBuffer(refToneData.length);
    refToneData.getBytes(tmpArray);
    const refSignal = new Float32Array(tmpArray);
    console.log("Calibration reference signal abs max value: " + util.max(util.abs(refSignal)));

    const sweepFilePath = fs.path.join(this._settingsPath, env.sweepFilename);
    const sweepFile = fs.File.fromPath(sweepFilePath);
    const sweepData = sweepFile.readSync(err => {this.log(err)});
    tmpArray = new ArrayBuffer(sweepData.length);
    sweepData.getBytes(tmpArray);
    const sweepSignal = new Float32Array(tmpArray);

    let combined_signal = new Float32Array(refSignal.length + Math.round(2*this._fs) + sweepSignal.length);
    combined_signal.set(refSignal);
    combined_signal.set(sweepSignal, refSignal.length + Math.round(1.8*this._fs));

    let cal_output = new Float32Array(combined_signal.length);

    if (this._compensate) {
      let cal_norm;
      if (ear == "left") {
        cal_norm = util.calfilter(this._leftFilter, 6 + (this._leftCalLevel - this._rightCalLevel),
          0, combined_signal);
      } else if (ear == "right") {
        cal_norm = util.calfilter(this._rightFilter, 6,
          0, combined_signal);
      }
      cal_output.set(cal_norm);
    } else {
      cal_output.set(combined_signal);
    }

    return cal_output;
  }

  public audioPlayerDidFinishPlayingSuccessfully(player?: any, flag?: boolean) {
    if (flag && this._completeCallback) {
      this._completeCallback({player, flag});
    } else if (!flag && this._errorCallback) {
      this._errorCallback({player, flag});
    }
  }

  public audioPlayerDecodeErrorDidOccurError(player: any, error: NSError) {
    if (this._errorCallback) {
      this._errorCallback({player, error});
    }
  }

}
