import { Component } from '@angular/core';
import { Page } from "ui/page";
import { EventData } from "data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { ListPicker } from "ui/list-picker";
import * as fs from "tns-core-modules/file-system";
import { RouterExtensions } from "nativescript-angular/router";
import { testfrequencies } from "../../config/environment";
import { VolumeObserver } from "../../shared/volumeobserver";
import { SessionProvider, Experiment, ExperimentType, ExperimentStatus } from '../../shared/session/session';
import * as appSettings from "tns-core-modules/application-settings";


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
      item.text = "" + experimentList[i].type + " " + experimentList[i].testFrequency + " Hz (" + experimentList[i].status + ")";
      if (experimentList[i].status == ExperimentStatus.Finished) {
        let grid = experimentList[i].grid;

        let history = grid.getHistory();
        let n_avg = 6;
        let counter_avg = 0;
        let sum_avg = 0;
        for (let i = history.length - 1; i >= 0; i--) {
          if (history[i].reversal && (history[i].xval == 0)) {
            sum_avg += history[i].yval;
            counter_avg += 1;
            if (counter_avg == n_avg) {
              break;
            }
          }
        }
        let threshold = sum_avg / n_avg;
        item.text += ", th " + threshold;
      }
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
      let targ_key = "";
      if (pickedFreq == 1000) {
        targ_key = "spl_tone1k";
      } else if (pickedFreq == 2000) {
        targ_key = "spl_tone2k";
      } else if (pickedFreq == 4000) {
        targ_key = "spl_tone4k";
      }

      let targ_ref_level;
      if (appSettings.hasKey(targ_key)) {
        targ_ref_level = appSettings.getNumber(targ_key);
      } else {
        return this.showError("Calibrate levels first!");
      }

      return dialogs.action({
        title: "Experiment type",
        cancelButtonText: "Cancel",
        actions: ["Grid (default)", "AFC, no gap", "AFC, 0.2 gap"]
      }).then((result: string) => {
        this.sessionProvider.startExperiment(pickedFreq);
        if (result === "Grid (default)") {
          this.sessionProvider.getCurrentExperiment().type = ExperimentType.Grid;
        } else if (result === "AFC, no gap") {
          this.sessionProvider.getCurrentExperiment().type = ExperimentType.SingleRunNoGap;
        } else if (result === "AFC, 0.2 gap") {
          this.sessionProvider.getCurrentExperiment().type = ExperimentType.SingleRunWithGap;
        } else {
          this.sessionProvider.cancelExperiment();
          return;
        }

        return this.routerExtensions.navigate(
          ["/threshold"], {clearHistory: true}
        ).catch(err => {
          console.log(err);
        });
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

  showError(err) {
    return dialogs.alert({
      title: 'Error',
      message: err,
      okButtonText: 'Close'
    }).then(() => {
      // pass
    });
  }

}
