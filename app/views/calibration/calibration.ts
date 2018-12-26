import { Component, OnInit } from '@angular/core';
import { Page } from "ui/page";
import { SessionProvider } from '../../shared/session/session';
import * as appSettings from "tns-core-modules/application-settings";
import { RouterExtensions, PageRoute } from 'nativescript-angular/router';
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

export enum CalibrationOptions {
  Background = "background",
  Tone1k = "tone1k",
  Tone2k = "tone2k",
  Tone4k = "tone4k"
}

@Component({
    moduleId: module.id,
    selector: 'view-calibration',
    templateUrl: 'calibration.html'
})
export class CalibrationPage implements OnInit {
    public stimOptions = CalibrationOptions;

    private audioPath:string;
    //private player:TNSPlayer;
    private player: GridPlayer;
    private volume:number;
    private pickedStimulus: CalibrationOptions|null;

    private playing: boolean;
    private enablePlay: boolean;
    private playButtonText: string;

    private submitted: boolean;

    private audioSession: AVAudioSession;
    private masterVolumeObserver: VolumeObserver;

    private spl_background: string;
    private spl_tone1k: string;
    private spl_tone2k: string;
    private spl_tone4k: string;

    constructor(private sessionProvider: SessionProvider,
                private routerExtensions: RouterExtensions,
                private page: Page) {

      if (appSettings.hasKey("spl_background")) {
        this.spl_background = appSettings.getNumber("spl_background").toFixed(1);
      }
      if (appSettings.hasKey("spl_tone1k")) {
        this.spl_tone1k = appSettings.getNumber("spl_tone1k").toFixed(1);
      }
      if (appSettings.hasKey("spl_tone2k")) {
        this.spl_tone2k = appSettings.getNumber("spl_tone2k").toFixed(1);
      }
      if (appSettings.hasKey("spl_tone4k")) {
        this.spl_tone4k = appSettings.getNumber("spl_tone4k").toFixed(1);
      }

      let appPath = fs.knownFolders.currentApp();
      this.audioPath = fs.path.join(appPath.path, 'audio');

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
        this.audioSession.removeObserverForKeyPath(this.masterVolumeObserver, "outputVolume");
      });

    }

    ngOnInit() {

    }

    chooseStimulus(stim:CalibrationOptions, event:EventData) {
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

    saveValues() {
      let tmp_bg = Number(this.spl_background);
      if (!Number.isNaN(tmp_bg)) {
        appSettings.setNumber("spl_background", tmp_bg);
      }
      let tmp_1k = Number(this.spl_tone1k);
      if (!Number.isNaN(tmp_1k)) {
        appSettings.setNumber("spl_tone1k", tmp_1k);
      }
      let tmp_2k = Number(this.spl_tone2k);
      if (!Number.isNaN(tmp_2k)) {
        appSettings.setNumber("spl_tone2k", tmp_2k);
      }
      let tmp_4k = Number(this.spl_tone4k);
      if (!Number.isNaN(tmp_4k)) {
        appSettings.setNumber("spl_tone4k", tmp_4k);
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

      let noise_gap = 0;
      let tone_level = env.maxTargetLevel_dB;

      this.volume = 1;

      let playerOptions:GridPlayerOptions = {
        targetFrequency: 0,
        loop: true,
        paddedSilenceDuration: 0,
        targetDuration: env.verifyaudio.targetDuration_s,
        maskerDuration: env.verifyaudio.maskerDuration_s,
        maskerLevel: 0,
        channelOptions: ChannelOptions.Diotic,
        settingsPath: this.audioPath,
        window: false,
        errorCallback: (err) => {
          console.log("error while playing: " + err);
        },
        debug: true
      };
      this.player = new GridPlayer();

      let playMasker = false, playTarget = false;
      switch (this.pickedStimulus) {
        case CalibrationOptions.Background: {
          playMasker = true;
          break;
        }
        case CalibrationOptions.Tone1k: {
          playerOptions.targetFrequency = 1000;
          playTarget = true;
          break;
        }
        case CalibrationOptions.Tone2k: {
          playerOptions.targetFrequency = 2000;
          playTarget = true;
          break;
        }
        case CalibrationOptions.Tone4k: {
          playerOptions.targetFrequency = 4000;
          playTarget = true;
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
