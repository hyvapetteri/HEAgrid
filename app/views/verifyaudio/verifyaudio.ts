import { Component, OnInit } from '@angular/core';
import { Page } from "ui/page";
import { SessionProvider, Experiment, ExperimentStatus } from '../../shared/session/session';
import { RouterExtensions, PageRoute } from 'nativescript-angular/router';
import * as appSettings from "tns-core-modules/application-settings";
import { switchMap } from 'rxjs/operators';
import * as fs from "tns-core-modules/file-system";
import * as dialogs from "tns-core-modules/ui/dialogs";
import * as util from "../../shared/utils";
import * as env from "../../config/environment";

import { GridTracker, GridTrackingStatus, GridDirection, TrialAnswer, ParamGrid } from '../../shared/grid/grid';
import { GridPlayer, GridPlayerOptions, ChannelOptions } from "../../shared/grid-player/grid-player-ios";
import { VolumeObserver } from "../../shared/volumeobserver";
import { ObservableArray } from "data/observable-array";
import { EventData } from "data/observable";
import { Button } from "ui/button";

export enum StimuliOptions {
  Background = "background",
  BackgroundTH = "background_at_threshold",
  Tone = "tone",
  ToneTH = "tone_at_threshold",
  GridPointTarget = "gridpoint_target",
  GridPointNontarget = "gridpoint_nontarget"
}

@Component({
    moduleId: module.id,
    selector: 'view-verifyaudio',
    templateUrl: 'verifyaudio.html',
    styleUrls: ['./verifyaudio.css']
})
export class VerifyAudioPage implements OnInit {
    public stimOptions = StimuliOptions;

    private audioPath:string;
    private experiment:Experiment;
    //private player:TNSPlayer;
    private player: GridPlayer;
    private volume:number;
    private pickedStimulus: StimuliOptions|null;
    private xval:number;
    private yval:number;
    private xlim:[number,number];
    private ylim:[number,number];

    private playing: boolean;
    private enablePlay: boolean;
    private playButtonText: string;

    private submitted: boolean;
    private xinvalid: boolean;
    private yinvalid: boolean;

    private audioSession: AVAudioSession;
    private masterVolumeObserver: VolumeObserver;

    constructor(private sessionProvider: SessionProvider,
                private routerExtensions: RouterExtensions,
                private page: Page) {

      let appPath = fs.knownFolders.currentApp();
      this.audioPath = fs.path.join(appPath.path, 'audio');

      this.experiment = this.sessionProvider.getCurrentExperiment();

      this.xval = this.experiment.grid.getStatus().xval;
      this.yval = this.experiment.grid.getStatus().yval;

      this.xlim = this.experiment.grid.getXlim();
      this.ylim = this.experiment.grid.getYlim();

      this.submitted = false;
      this.playing = false;
      this.enablePlay = false;
      this.playButtonText = "Play stimulus";
      this.pickedStimulus = null;

      this.audioSession = AVAudioSession.sharedInstance();
      this.masterVolumeObserver = new VolumeObserver();
      this.masterVolumeObserver.setCallback((obj) => {
        dialogs.alert({
          title: "Volume changed!",
          message: "A volume button press was observed. The current experiment will be cancelled and you will now return to the volume setting screen.",
          okButtonText: "OK"
        }).then(() => {
          return this.routerExtensions.navigate(["/volume"], {clearHistory: true});
        }).catch(err => console.log(err));
      });
      this.audioSession.addObserverForKeyPathOptionsContext(this.masterVolumeObserver, "outputVolume", NSKeyValueObservingOptions.New, null);

      this.page.on("navigatingFrom", (data: EventData) => {
        if (this.playing) {
          this.player.dispose();
        }
        this.audioSession.removeObserverForKeyPath(this.masterVolumeObserver, "outputVolume");
      });

    }

    ngOnInit() {

    }

    chooseStimulus(stim:StimuliOptions, event:EventData) {
      console.log(stim);

      let button = <Button>event.object;

      if (this.pickedStimulus == stim) {
        this.pickedStimulus = null;
        this.enablePlay = false;
      } else {
        this.pickedStimulus = stim;
        this.enablePlay = true;
      }


    }

    playStimulus() {
      if (this.playing) {
        return this.player.pause().then(() => {
          this.playing = false;
          this.submitted = false;
          this.playButtonText = "Play stimulus";
          this.player.dispose();
        });
      }

      this.submitted = true;

      let xcoord = -1, ycoord = -1;
      let check_coordinates = false;
      if ((this.pickedStimulus == StimuliOptions.GridPointTarget) || (this.pickedStimulus == StimuliOptions.GridPointNontarget)) {
        check_coordinates = true;
        xcoord = Number(this.xval);
        ycoord = Number(this.yval);
      }

      this.xinvalid = false;
      this.yinvalid = false;

      if (isNaN(xcoord) || (xcoord < this.xlim[0]) || (xcoord > this.xlim[1])) {
        this.xinvalid = true;
      }
      if (isNaN(ycoord) || (ycoord < this.ylim[0]) || (ycoord > this.ylim[1])) {
        this.yinvalid = true;
      }

      console.log('x: ' + xcoord + ', y: ' + ycoord);

      if (check_coordinates && (this.xinvalid || this.yinvalid)) {
        console.log("Invalid coordinates");
        return;
      }

      let noise_gap = xcoord;
      let tone_level = ycoord;

      let freq = this.experiment.testFrequency;

      this.volume = 1;

      let bg_ref_level;
      if (appSettings.hasKey("spl_background")) {
        bg_ref_level = appSettings.getNumber("spl_background");
      } else {
        return this.showError("Calibrate levels first!");
      }

      let playerOptions:GridPlayerOptions = {
        targetFrequency: this.experiment.testFrequency,
        loop: true,
        paddedSilenceDuration: 0,
        targetDuration: env.verifyaudio.targetDuration_s,
        maskerDuration: env.verifyaudio.maskerDuration_s,
        //maskerLevel: util.a2db(this.experiment.noiseThreshold) + env.maskerLevel_dB,
        maskerLevel: env.maskerLevel_dB - bg_ref_level,
        channelOptions: ChannelOptions.Diotic,
        settingsPath: fs.knownFolders.documents().path,
        window: false,
        errorCallback: (err) => {
          console.log("error while playing: " + err);
        },
        debug: true,
        compensate: true
      };
      this.player = new GridPlayer();

      let playMasker = false, playTarget = false;
      switch (this.pickedStimulus) {
        case StimuliOptions.Background: {
          noise_gap = 0;
          playMasker = true;
          break;
        }
        case StimuliOptions.BackgroundTH: {
          noise_gap = 0;
          //this.volume = this.experiment.noiseThreshold;
          playerOptions.maskerLevel = util.a2db(this.experiment.noiseThreshold);
          playMasker = true;
          break;
        }
        case StimuliOptions.Tone: {
          tone_level = this.experiment.grid.getYlim()[1];
          noise_gap = 0;
          playTarget = true;
          break;
        }
        case StimuliOptions.ToneTH: {
          tone_level = this.experiment.grid.getYlim()[0];
          noise_gap = 0;
          playTarget = true;
          break;
        }
        case StimuliOptions.GridPointTarget: {
          playTarget = true;
          playMasker = true;
          break;
        }
        case StimuliOptions.GridPointNontarget: {
          playTarget = false;
          playMasker = true;
          break;
        }
        default: {
          return this.showError("Unknown stimulus option.");
        }
      }

      return this.player.initialize(playerOptions).then(() => {
        console.log("Player initialized, playing at x: " + noise_gap + ", y: " + tone_level);
        return this.player.preloadStimulus(noise_gap, tone_level, playTarget, playMasker);
      }).then(() => {
        this.player.volume = this.volume;
        return this.player.play();
      }).then(() => {
        console.log("Playing");
        this.playing = true;
        this.playButtonText = "Stop";
      }).catch(err => this.showError(err));
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
