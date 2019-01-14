import { Component } from '@angular/core';
import { Page } from "ui/page";
import { EventData } from "data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { ListPicker } from "ui/list-picker";
import * as fs from "tns-core-modules/file-system";
import { RouterExtensions } from "nativescript-angular/router";
import { testfrequencies } from "../../config/environment";
import { VolumeObserver } from "../../shared/volumeobserver";
import { SessionProvider, Experiment } from '../../shared/session/session';

@Component({
  moduleId: module.id,
  selector: 'page-experimentlist',
  templateUrl: './experimentlist.html'
})
export class ExperimentListPage {
  private listItems: Array<any>;
  private masterVolumeObserver: VolumeObserver;
  private audioSession: AVAudioSession;

  constructor(private sessionProvider: SessionProvider,
              private routerExtensions: RouterExtensions,
              private page: Page) {

    this.listItems = [];
    this.listItems.push({type: "header", text: "Start new experiment by selecting test frequency below"});
    for (let i = 0; i < testfrequencies.length; i++) {
      let item:any = {type: "test"};
      item.text = "" + testfrequencies[i].label;
      item.frequency = testfrequencies[i].value;
      this.listItems.push(item);
    }

    this.listItems.push({type: "header", text: "Previous experiments in the current session"});
    let experimentList = sessionProvider.getExperiments();
    for (let i = 0; i < experimentList.length; i++) {
      let item:any = {type: "history"};
      item.text = "" + experimentList[i].testFrequency + " (" + experimentList[i].status + ")";
      item.experimentId = i + 1;
      this.listItems.push(item);
    }

    this.page.on("navigatedTo", (data: EventData) => {
      console.log("adding volume observer");
      let audioSession = AVAudioSession.sharedInstance();
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
      audioSession.addObserverForKeyPathOptionsContext(this.masterVolumeObserver, "outputVolume", NSKeyValueObservingOptions.New, null);
    });

    this.page.on("navigatingFrom", (data: EventData) => {
      console.log("removing volume observer");
      let audioSession = AVAudioSession.sharedInstance();
      audioSession.removeObserverForKeyPath(this.masterVolumeObserver, "outputVolume");
    });

  }

  handleTap(tapEvent) {
    if (this.listItems[tapEvent.index].type === "test") {
      let pickedFreq = this.listItems[tapEvent.index].frequency;
      this.sessionProvider.startExperiment(pickedFreq);

      return this.routerExtensions.navigate(
        ["/threshold"], {clearHistory: true}
      ).catch(err => {
        console.log(err);
      });
    } else if (this.listItems[tapEvent.index].type === "history") {
      let pickedExperiment = this.listItems[tapEvent.index].experimentId;

      return this.routerExtensions.navigate(
        ["/gridplot", pickedExperiment]
      ).catch(err => {
        console.log(err);
      });
    }
  }

  templateSelector(item: any, index: number, items: any) {
    return item.type;
  }

  showActionSheet() {
    dialogs.action({
      title: 'Send the results',
      message: 'version 0.1',
      cancelButtonText: 'Cancel',
      actions: ['Calibrate', 'Send with email', 'Quit']
    }).then((result: string) => {
      console.log(result);
      if (result == "Calibrate") {
        return this.routerExtensions.navigate(['/calibration']);
      } else if (result == "Quit") {
        this.sessionProvider.resetSession();
        return this.routerExtensions.navigate(['/start'], {clearHistory: true});
      }
    }).catch(err => console.log(err));
  }

  sendResults() {

  }

}
