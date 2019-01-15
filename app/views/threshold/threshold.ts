import { Component, NgZone } from '@angular/core';
import { Page } from "ui/page";
import { EventData } from "data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import * as application from "tns-core-modules/application";
import * as fs from "tns-core-modules/file-system";
import * as env from "../../config/environment";
import * as util from "../../shared/utils";
import { VolumeObserver } from "../../shared/volumeobserver";
import { RouterExtensions } from "nativescript-angular/router";
import { TouchGestureEventData } from "ui/gestures";
import { TNSPlayer } from 'nativescript-audio';
import { GridPlayer, GridPlayerOptions, ChannelOptions } from '../../shared/grid-player/grid-player-ios';

import { SessionProvider, Experiment, ExperimentStatus } from '../../shared/session/session';

declare var NSURL;

@Component({
  moduleId: module.id,
  selector: 'page-threshold',
  templateUrl: './threshold.html',
  styleUrls: ['./threshold.css']
})
export class ThresholdPage {
  private titleText:string;
  private instructionText: string;
  private answerButtonText: string;
  private playButtonText: string;
  private answerButtonPressed: boolean;

  private enablePlay: boolean;
  private enableAnswer: boolean;

  //private player: TNSPlayer;
  private player: GridPlayer;
  private audioPath: string;

  private volume: number;
  private turns: number[];
  private direction: number;
  private max_turns: number;

  private volumeUpdateTimerId: number;
  private masterVolumeObserver: VolumeObserver;

  private experiment: Experiment;

  constructor(private sessionProvider: SessionProvider,
              private routerExtensions: RouterExtensions,
              private _ngZone: NgZone,
              private page: Page) {

    this.titleText = "Hearing threshold";

    this.enablePlay = false;
    this.enableAnswer = false;
    this.answerButtonPressed = false;

    this.turns = [];
    this.max_turns = env.threshold.maxTurns;

    this.experiment = this.sessionProvider.getCurrentExperiment();
    this.experiment.status = ExperimentStatus.NoiseThreshold;

    this.page.on("navigatedTo", (data: EventData) => {

      console.log("adding volume observer");
      let audioSession = AVAudioSession.sharedInstance();
      audioSession.setPreferredSampleRateError(44100);
      this.masterVolumeObserver = new VolumeObserver();
      this.masterVolumeObserver.setCallback((obj) => {
        this.player.pause().then(() => {
          clearInterval(this.volumeUpdateTimerId);
          this.sessionProvider.cancelExperiment();
        }).then(() => {
          return dialogs.alert({
            title: "Volume changed!",
            message: "A volume button press was observed. The current experiment will be cancelled and you will now return to the volume setting screen.",
            okButtonText: "OK"
          });
        }).then(() => {
          return this.routerExtensions.navigate(["/volume"], {clearHistory: true});
        }).catch(err => console.log(err));
      });
      audioSession.addObserverForKeyPathOptionsContext(this.masterVolumeObserver, "outputVolume", NSKeyValueObservingOptions.New, null);
    });

    this.page.on("navigatingFrom", (data: EventData) => {
      let audioSession = AVAudioSession.sharedInstance();
      audioSession.removeObserverForKeyPath(this.masterVolumeObserver, "outputVolume");
    });

    this.setup();
  }

  onButtonTouch(args: TouchGestureEventData) {
    if (args.action == 'down') {
      this.answerButtonPressed = true;
      this.turns.push(this.volume);
      this.direction = -1;
      this.answerButtonText = 'Hold';
    } else if (args.action == 'up') {
      this.answerButtonPressed = false;
      this.turns.push(this.volume);
      this.direction = 1;
      this.answerButtonText = 'Push';
    }
    if (this.turns.length >= this.max_turns) {
      this.player.dispose().then(() => {
        clearInterval(this.volumeUpdateTimerId);
        this.instructionText = 'Done';
        this.finish();
      });
    }
  }

  setup() {
    let appPath = fs.knownFolders.currentApp();
    //this.audioPath = fs.path.join(appPath.path, env.audioPath);
    this.audioPath = fs.knownFolders.documents().path;
    console.log(this.audioPath);

    //this.player = new TNSPlayer();
    let playerOptions:GridPlayerOptions = {
      targetFrequency: this.experiment.testFrequency,
      loop: true,
      paddedSilenceDuration: env.threshold.paddedSilenceDuration_s,
      targetDuration: env.threshold.targetDuration_s,
      maskerDuration: env.threshold.maskerDuration_s,
      maskerLevel: 0,
      channelOptions: ChannelOptions.MonoticLeft,
      settingsPath: fs.knownFolders.documents().path,
      debug: true,
      compensate: true,
      calibration: false
    }
    this.player = new GridPlayer();

    return this.player.initialize(playerOptions).then(() => {
      return this.player.preloadStimulus(0, env.maxTargetLevel_dB, (this.experiment.status == ExperimentStatus.ToneThreshold),
            this.experiment.status == ExperimentStatus.NoiseThreshold);
    }).then(() => {
      console.log('stimulus preloaded!');
      this.enablePlay = true;
      this.reset();
      this.instructionText = 'Press play to start';
      this.answerButtonText = 'Push';
    }).catch(err => {
      console.log('error preloading stimulus');
      console.log(err);
    });

    // let freq = this.experiment.testFrequency;
    //
    // let audiofile = '';
    // if (this.experiment.status == ExperimentStatus.NoiseThreshold) {
    //   audiofile = 'noise_ref.wav';
    // } else if (this.experiment.status == ExperimentStatus.ToneThreshold) {
    //   audiofile = 'f' + freq + '_ref.wav';
    // } else {
    //   return this.showError('Unexpected experiment status: ' + this.experiment.status);
    // }

    // return this.player.initFromFile({
    //   audioFile: fs.path.join(this.audioPath, audiofile),
    //   loop: true
    // }).then(() => {
    //   this.enablePlay = true;
    //   this.reset();
    //   this.instructionText = 'Press play to start';
    //   this.answerButtonText = 'Push';
    // }).catch(err => this.showError(err));

  }

  play() {
    //if (this.player.isAudioPlaying()) {
    if (this.player.isPlaying()) {
      console.log('pause');
      return this.player.pause().then(() => {
        clearInterval(this.volumeUpdateTimerId);
        this.reset();
        this.instructionText = 'Reset. Press play to start again.';
      });
    } else {
      console.log('play');
      this.direction = 1;
      return this.player.play().then(() => {
        console.log('Player started');
        this.volumeUpdateTimerId = setInterval(() => this.updateVolume(), env.threshold.volumeUpdateInterval_ms);
        this.enableAnswer = true;
        this.playButtonText = 'Reset';
        this.instructionText = "When you hear a sound, press the button and keep it pressed until you can't hear it anymore. Then release and repeat.";
      });
    }
  }

  updateVolume() {
    this.volume = util.db2a(this.direction * env.threshold.volumeUpdateStepsize_dB) * this.volume;
    this.player.volume = this.volume;
  }

  reset() {
    this.playButtonText = 'Play';
    this.enableAnswer = false;
    this.volume = util.db2a(-40);
    this.player.volume = this.volume;
    this.turns = [];
  }

  finish() {
    let avg_threshold = 0;
    let n_last_turns = env.threshold.n_avg;
    for (let i = this.turns.length - 1; i >= this.turns.length - n_last_turns; i--) {
      avg_threshold = avg_threshold + util.a2db(this.turns[i]);
    }
    console.log('sum: ' + avg_threshold + ', n: ' + n_last_turns);
    avg_threshold = avg_threshold / n_last_turns;
    avg_threshold = util.db2a(avg_threshold);
    console.log('Turns: ' + JSON.stringify(this.turns));
    console.log('Threshold: ' + avg_threshold);

    if (this.experiment.status == ExperimentStatus.NoiseThreshold) {
      this.experiment.noiseThreshold = avg_threshold;
      //this.experiment.status = ExperimentStatus.ToneThreshold;
      return this.routerExtensions.navigate(["/experiment"], {clearHistory: true});
      // return this.setup().then(() => {
      //   this.instructionText = 'Now we will measure another threshold using a tone. Press play to start.'
      //   this.titleText = "Threshold 2/2";
      // });
    } else if (this.experiment.status == ExperimentStatus.ToneThreshold) {
      this.experiment.toneThreshold = avg_threshold;
      return this.routerExtensions.navigate(["/experiment"], {clearHistory: true});
    } else {
      return this.showError('Unexpected experiment status: ' + this.experiment.status);
    }

  }

  cancel() {
    console.log("cancel");
    return this.player.pause().then(() => {
      clearInterval(this.volumeUpdateTimerId);
      this.sessionProvider.cancelExperiment();
      return this.routerExtensions.navigate(["/experimentlist"], {clearHistory: true});
    });

  }

  showError(err) {
    dialogs.alert({
      title: 'Error',
      message: err,
      okButtonText: 'Close'
    }).then(() => {
      // pass
    });
  }
}
