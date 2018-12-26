import { Component, NgZone } from '@angular/core';
import { Page } from "ui/page";
import { EventData } from "data/observable";
import * as env from "../../config/environment";
import { VolumeObserver } from "../../shared/volumeobserver";
import { RouterExtensions } from "nativescript-angular/router";

import { SessionProvider, Experiment, ExperimentStatus } from '../../shared/session/session';

declare var NSURL;

@Component({
  moduleId: module.id,
  selector: 'page-volumeview',
  templateUrl: './volumeview.html'
})
export class VolumeviewPage {
  private targetVolume: number;
  private volume: number;
  private adjust: string;
  private audioSession: AVAudioSession;
  private enableContinue: boolean;
  private masterVolumeObserver: VolumeObserver;

  constructor(private sessionProvider: SessionProvider,
              private routerExtensions: RouterExtensions,
              private ngZone: NgZone,
              private page: Page) {

    this.targetVolume = env.deviceVolume;
    this.enableContinue = false;

    this.audioSession = AVAudioSession.sharedInstance();
    this.audioSession.setActiveError(true);
    this.masterVolumeObserver = new VolumeObserver();
    this.masterVolumeObserver.setCallback((obj:any) => {
      this.ngZone.run(() => this.setMasterVolume(obj.outputVolume));
    });
    this.audioSession.addObserverForKeyPathOptionsContext(this.masterVolumeObserver, "outputVolume", NSKeyValueObservingOptions.New, null);

    this.volume = this.audioSession.outputVolume;
    if (Math.abs(this.volume - this.targetVolume) < env.deviceVolumeResolution) {
      this.enableContinue = true;
    } else if (this.volume < this.targetVolume) {
      this.adjust = "up";
    } else if (this.volume > this.targetVolume) {
      this.adjust = "down";
    }

    this.page.on("navigatingFrom", (data: EventData) => {
      this.audioSession.removeObserverForKeyPath(this.masterVolumeObserver, "outputVolume");
    });
  }

  setMasterVolume(vol:number) {
    if (Math.abs(vol - this.targetVolume) < env.deviceVolumeResolution) {
      this.enableContinue = true;
    } else if (vol < this.targetVolume) {
      this.enableContinue = false;
      this.adjust = "up";
    } else if (vol > this.targetVolume) {
      this.enableContinue = false;
      this.adjust = "down";
    }
    this.volume = vol;
  }

}
