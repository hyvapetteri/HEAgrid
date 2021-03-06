// >> chart-angular-axis-styling-component
import { Component, OnInit } from '@angular/core';
import { Page } from "ui/page";
import { EventData } from "data/observable";
import { SessionProvider, Experiment } from '../../shared/session/session';
import { RouterExtensions, PageRoute } from 'nativescript-angular/router';
import { switchMap } from 'rxjs/operators';
import * as dialogs from "tns-core-modules/ui/dialogs";

import { GridTracker, GridTrackingStatus, GridDirection, TrialAnswer } from '../../shared/grid/grid';
import { VolumeObserver } from "../../shared/volumeobserver";
import { ObservableArray } from "tns-core-modules/data/observable-array";

@Component({
    moduleId: module.id,
    selector: 'view-gridplot',
    templateUrl: 'gridplot.html'
})
export class GridPlotPage implements OnInit {
    private masterVolumeObserver: VolumeObserver;
    private experimentId: number;
    private _plotItems: ObservableArray<GridTrackingStatus>;
    private _plotCurrent: ObservableArray<GridTrackingStatus>;
    private xlim: [number, number];
    private ylim: [number, number];
    private xres: number;
    private yres: number;
    private experiment: Experiment;
    private threshold: number|null;

    constructor(private sessionProvider: SessionProvider,
                private routerExtensions: RouterExtensions,
                private pageRoute: PageRoute,
                private page: Page) {

      this.pageRoute.activatedRoute.pipe(
        switchMap(activatedRoute => activatedRoute.params)
      ).forEach((params) => { this.experimentId = +params['id']});

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
        let audioSession = AVAudioSession.sharedInstance();
        audioSession.removeObserverForKeyPath(this.masterVolumeObserver, "outputVolume");
      });

    }

    get plotItems(): ObservableArray<GridTrackingStatus> {
      return this._plotItems;
    }

    get plotCurrent(): ObservableArray<GridTrackingStatus> {
      return this._plotCurrent;
    }

    ngOnInit() {
        //console.log('frequency:' + this.sessionProvider.getCurrentExperiment().testFrequency);
        if (this.experimentId == 0) {
          this.experiment = this.sessionProvider.getCurrentExperiment();
          this.threshold = null;
        } else {
          let experiments = this.sessionProvider.getExperiments();
          this.experiment = experiments[this.experimentId - 1];
        }
        let grid = this.experiment.grid;

        if (this.experimentId !== 0) {
          let history = grid.getHistory();
          let n_avg = 6;
          let counter_avg = 0;
          let sum_avg = 0;
          for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].reversal) {
              sum_avg += history[i].yval;
              counter_avg += 1;
              if (counter_avg == n_avg) {
                break;
              }
            }
          }
          this.threshold = sum_avg / n_avg;
        }

        this._plotItems = new ObservableArray(grid.getHistory());
        this._plotCurrent = new ObservableArray(grid.getStatus());

        this.xlim = grid.getXlim();
        this.ylim = grid.getYlim();
        this.xres = grid.getXres();
        this.yres = grid.getYres();
        console.log('xmax: ' + this.xlim[1] + ', ymax: ' + this.ylim[1]);
    }

    goBack() {
      this.routerExtensions.back();
    }

    redoExperiment() {
      console.log('Redo experiment')
      try {
        let pickedFreq = this.experiment.testFrequency;
        this.sessionProvider.startExperiment(pickedFreq);
        let newExperiment = this.sessionProvider.getCurrentExperiment();
        newExperiment.noiseThreshold = this.experiment.noiseThreshold;
        newExperiment.toneThreshold = this.experiment.toneThreshold;
        newExperiment.type = this.experiment.type;
      } catch (err) {
        console.log(err);
      }

      return this.routerExtensions.navigate(
        ["/experiment"], {clearHistory: true}
      ).catch(err => {
        console.log(err);
      });
    }

    showActionSheet() {
      dialogs.action({
        title: 'Actions',
        cancelButtonText: 'Cancel',
        actions: ['Redo with same settings']
      }).then((result: string) => {
        console.log(result);
        if (result == "Redo with same settings") {
          return this.redoExperiment();
        }
      }).catch(err => console.log(err));
    }
}
