import { Component, NgZone } from '@angular/core';
import { Page } from "ui/page";
import { EventData } from "data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import * as fs from "tns-core-modules/file-system";
import { setTimeout } from "tns-core-modules/timer";
import * as appSettings from "tns-core-modules/application-settings";

import { SessionProvider, Experiment, ExperimentStatus } from '../../shared/session/session';
import { VolumeObserver } from "../../shared/volumeobserver";
import { RouterExtensions } from 'nativescript-angular/router';

import * as env from '../../config/environment';
import * as util from '../../shared/utils';
import { sound_config } from './experiment-config';
import { PhasedGridTracker, BasicGridTracker, ParamGrid, GridTracker, TrialAnswer, GridTrackingStatus } from '../../shared/grid/grid';
import { GridPlayer, GridPlayerOptions, ChannelOptions } from '../../shared/grid-player/grid-player-ios';

declare var NSURL;

@Component({
  moduleId: module.id,
  selector: 'page-experiment',
  templateUrl: './experiment.html',
  styleUrls: ['./experiment.css']
})
export class ExperimentPage {

  private masterVolumeObserver: VolumeObserver;
  private volume: number;
  private trialNumber: number;
  private uid: string;
  private audioPath: string;
  private volumeIcon: string;
  private n_alternatives: number;
  private alternative_ids: Array<number>;
  private alternative_labels: string;
  //private players: Array<TNSPlayer>;
  private players: Array<GridPlayer>;
  private trialTimeout: any;

  private ISI_ms: number;
  private freq: number;

  private sound_id: string;
  private isCorrect: boolean;
  private target_idx: number;

  private playButtonText: string;
  private instructionText: string;
  private highlightedButton: number;
  private enableAnswer: boolean;
  private answered: boolean;
  private grid_coldef: string;
  private running: boolean;

  private logFilePath: string;
  private experimentLogText: Array<string> = [];
  private currentExperiment: Experiment;

  constructor(private sessionProvider: SessionProvider,
              private routerExtensions: RouterExtensions,
              private _ngZone: NgZone,
              private page: Page) {

    // 2AFC --> two players
    this.n_alternatives = env.experiment.n_alternatives;
    this.grid_coldef = "";
    this.alternative_ids = [];
    this.alternative_labels = env.experiment.alternative_labels;
    for (let i = 0; i < this.n_alternatives; i++) {
      this.grid_coldef += "*,";
      this.alternative_ids.push(i);
    }
    this.grid_coldef = this.grid_coldef.slice(0,-1);
    console.log("Grid coldef: " + this.grid_coldef);

    this.currentExperiment = sessionProvider.getCurrentExperiment();
    this.currentExperiment.status = ExperimentStatus.Started;
    this.freq = this.currentExperiment.testFrequency;

    this.volume = 1;
    console.log('Volume: ' + this.volume);
    let tone_level_range = util.a2db(this.volume) - util.a2db(this.currentExperiment.toneThreshold);
    tone_level_range = Math.floor(tone_level_range);
    console.log('Tone level range: ' + tone_level_range);

    // let parameter_grid = new ParamGrid({
    //   xmin: 1,
    //   xmax: 18,
    //   xres: 1,
    //   ymin: 26 - minimum_index,
    //   ymax: 26,
    //   yres: 1
    // });

    let parameter_grid = new ParamGrid({
      xmin: 0,
      xmax: env.maxGap,
      xres: 0.05,
      ymin: env.maxTargetLevel_dB - tone_level_range,
      ymax: env.maxTargetLevel_dB,
      yres: 3
    });

    console.log('Grid:');
    console.log(parameter_grid.printGrid());

    let basegrid = new BasicGridTracker({
      g: parameter_grid,
      m_up: env.experiment.grid_mup,
      n_down: env.experiment.grid_ndown,
      n_revs: env.experiment.grid_nrevs,
      n_step: env.experiment.grid_nstep
    });

    let grid = new PhasedGridTracker();
    let ylim = basegrid.getGrid().getYlim();
    grid.addPhase(new BasicGridTracker({
      g: basegrid.getGrid().getSubGridByValues({xmin:0, xmax:0, ymin:ylim[0], ymax:ylim[1]}),
      m_up: env.experiment.grid_mup,
      n_down: env.experiment.grid_ndown,
      n_revs: 6,
      n_step: 100
    }));
    grid.addPhase(basegrid);
    grid.initialize(0, ylim[0] + 40);
    console.log('Grid initialized');
    this.currentExperiment.grid = grid;

    let appPath = fs.knownFolders.currentApp();
    this.audioPath = fs.path.join(appPath.path, env.audioPath);
    console.log(this.audioPath);

    this.ISI_ms = env.experiment.interstimulusInterval_ms;
    this.trialNumber = 0;

    let bg_ref_level;
    if (appSettings.hasKey("spl_background")) {
      bg_ref_level = appSettings.getNumber("spl_background");
    } else {
      this.showError("Calibrate levels first!").then(() => {
        this.routerExtensions.navigate(['calibration']);
      });
    }

    this.players = [];
    let promises = [];
    for (let i = 0; i < this.n_alternatives; i++) {
      this.players.push(new GridPlayer());
      let playerOptions:GridPlayerOptions = {
        targetFrequency: this.currentExperiment.testFrequency,
        loop: false,
        paddedSilenceDuration: 0,
        targetDuration: env.experiment.targetDuration_s,
        maskerDuration: env.experiment.maskerDuration_s,
        //maskerLevel: util.a2db(this.currentExperiment.noiseThreshold) + env.maskerLevel_dB,
        maskerLevel: env.maskerLevel_dB - bg_ref_level,
        channelOptions: ChannelOptions.Diotic,
        settingsPath: this.audioPath,
        completeCallback: args => {
          this._ngZone.run(() => this.soundEnded(i));
        }
      };
      promises.push(this.players[i].initialize(playerOptions));
    }

    Promise.all(promises).then(() => {
      return this.loadSounds();
    }).then(() => {
      console.log('Sounds loaded');
      // for (let i = 0; i < this.n_alternatives; i++) {
      //   this.players[i].getAudioTrackDuration().then(dur => {
      //     console.log('Player ' + i + ', track duration ' + dur);
      //   });
      // }

      this.playButtonText = "Play";
      this.instructionText = "Press play button to hear the sound.";
      this.highlightedButton = -1;

      this.enableAnswer = false;
      this.answered = false;

      this.uid = sessionProvider.username;

      let docsPath = fs.knownFolders.documents().path;
      let now = new Date();
      let logfile = env.environment.experimentFilePrefix + this.uid + '-' + now.getHours() + '-' + now.getMinutes() + '.' + now.getMilliseconds() + '-' + now.getDate() + '-' + (now.getMonth()+1) + '-' + now.getFullYear() + '.log';
      this.logFilePath = fs.path.join(docsPath, logfile);
      console.log('Logging to ' + logfile);
      return this.writeLog('Experiment started, subject ' + this.uid + ', vol ' + this.volume + ', freq ' + this.freq);
    }).then(() => {
      return this.writeLog('trial; gap; level; answer; correct');
    }).catch(err => this.showError(err));

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
          this.currentExperiment.status = ExperimentStatus.Aborted;
          return this.writeLog('Volume changed, aborted trial.\n' + JSON.stringify(this.currentExperiment.grid.getHistory())).then(() => {
            return this.routerExtensions.navigate(['/volume'], {clearHistory: true});
          });
        }).catch(err => console.log(err));
      });
      audioSession.addObserverForKeyPathOptionsContext(this.masterVolumeObserver, "outputVolume", NSKeyValueObservingOptions.New, null);
    });

    this.page.on("navigatingFrom", (data: EventData) => {
      let audioSession = AVAudioSession.sharedInstance();
      audioSession.removeObserverForKeyPath(this.masterVolumeObserver, "outputVolume");
    });

  }

  evaluateAnswer(answer) {
    this.enableAnswer = false;
    this.answered = true;

    this.isCorrect = (answer == this.target_idx);
    if (this.isCorrect) {
      this.instructionText = 'Correct';
    } else {
      this.instructionText = 'Wrong';
    }

    let [x, y] = this.currentExperiment.grid.getCurrentGridParameters();
    return this.writeLog('' + this.trialNumber + ';' + x + ';' + y + ';' + answer + ';' + this.isCorrect).then(() => {
      let ans = this.isCorrect ? TrialAnswer.Correct : TrialAnswer.Wrong;
      try {
        this.currentExperiment.grid.updatePosition(ans); // might throw error if something goes wrong, catched later
      } catch (err) {
        console.log("Error updating position: " + err);
      }
      console.log(JSON.stringify(this.currentExperiment.grid.getStatus()));
      //console.log('new position ' + x + ', ' + y);

      if (this.currentExperiment.grid.getStatus().finished) {
        console.log("Finished");
        return this.writeLog(JSON.stringify(this.currentExperiment.grid.getHistory())).then(() => {
          this.finishExperiment();
        });
      }

      return this.loadSounds().then(() => {
        if (this.running) {
          setTimeout(() => {
            this.answered = false;
            this.instructionText = "Prepare for next sound!"
          }, Math.round(env.experiment.intertrialInterval_ms/2));
          this.trialTimeout = setTimeout(() => this.playTrial(), env.experiment.intertrialInterval_ms);
        }
      });
    }).catch(err => this.showError(err));
  }

  loadSounds() {
    //console.log('Loading sounds');
    let promises = [];
    this.target_idx = Math.floor(Math.random() * this.n_alternatives);
    //console.log('Target is at ' + this.target_idx);
    let [mask_i, targ_i] = this.currentExperiment.grid.getCurrentGridParameters();

    for (let i = 0; i < this.n_alternatives; i++) {

      promises.push(this.players[i].preloadStimulus(mask_i, targ_i, (i == this.target_idx), true).catch(err => {
        console.log('Error initializing player ' + i + ' (is target? ' + (this.target_idx == i) + ') '+ err.extra);
        return new Promise((resolve,reject) => reject(err.extra));
      }));
    }


      // let stim_id = '';
      // if (i == this.target_idx) {
      //   stim_id = 'f' + this.freq + '_level' + targ_i + '_gap' + mask_i + '.wav';
      //   this.sound_id = stim_id;
      // } else {
      //   stim_id = 'f' + this.freq + '_gap' + mask_i + '.wav';
      // }
      // let soundpath = fs.path.join(this.audioPath, stim_id);
      // if (!fs.File.exists(soundpath)) {
      //   promises.push(new Promise((resolve, reject) => reject('Sound file ' + stim_id + ' does not exist!')));
      // } else {
      //   promises.push(this.players[i].initFromFile({
      //     audioFile: soundpath,
      //     loop: false,
      //     completeCallback: args => {
      //       // note: passing the current value of loop variable i to the callback is only
      //       // possible when using 'let' in the loop initialization. keywords: "javascript closure"
      //       //console.log(this.name + ' Sound ' + i + ' ended, playing next');
      //       this.soundEnded(i);
      //       if (i < this.n_alternatives - 1) {
      //         setTimeout(() => this._ngZone.run(() => this.startSound(i+1)), this.ISI_ms);
      //       } else {
      //         this._ngZone.run(() => this.trialEnded());
      //       }
      //     },
      //     errorCallback: error => {
      //       console.log(JSON.stringify(error));
      //     }
      //   }).catch(err => {
      //     console.log('Error initializing player ' + i + ', ' + err.extra);
      //     return new Promise((resolve,reject) => reject(err.extra));
      //   }));
      // }
    //}

    return Promise.all(promises).catch(err => this.showError(err));
  }

  handlePlayButton() {
    if (this.running) {
      this.pause();
    } else {
      this.trialTimeout = setTimeout(() => this.playTrial(), env.experiment.intertrialInterval_ms/2);
      this.playButtonText = "Pause";
      this.instructionText = "Prepare for next sound!"
    }
  }

  isRunning() {
    return this.running;
  }

  pause() {
    if (!this.running) {
      return
    }
    clearTimeout(this.trialTimeout);
    this.running = false;
    this.playButtonText = "Play";
  }

  isPlaying() {
    for (let i = 0; i < this.n_alternatives; i++) {
      if (this.players[i].isPlaying()) {
        return true;
      }
    }

    return false;
  }

  playTrial() {
    this.running = true;
    this.currentExperiment.status = ExperimentStatus.Running;

    for (let i = 0; i < this.n_alternatives; i++) {
      this.players[i].volume = this.volume;
    }

    return this.startSound(0).then(
      () => {
        this.trialNumber += 1;
        this.instructionText = "Which sound has the target?";
        this.enableAnswer = false;
        this.answered = false;
      },
      err => this.showError('could not start sound: ' + err)
    );
  }

  startSound(player_idx) {
    if (this.players[player_idx].isPlaying()) {
      return new Promise((resolve, reject) => reject('Already playing'));
    }
    this.highlightedButton = player_idx;
    return this.players[player_idx].play();
  }

  soundEnded(player_idx) {
    this.highlightedButton = -1;
    if (player_idx < this.n_alternatives - 1) {
      setTimeout(() =>  {
        this.startSound(player_idx+1).catch(err => console.log(err));
      }, this.ISI_ms);
    } else {
      this.trialEnded();
    }
  }

  trialEnded() {
    this.instructionText = 'Click on the sound that had the target';
    this.enableAnswer = true;
  }

  writeLog(message: string) {
    console.log('LOG:');
    console.log(message);
    this.experimentLogText.push(message);

    let fileHandle = fs.File.fromPath(this.logFilePath);
    let logstring = '';
    for (let row of this.experimentLogText) {
      logstring = logstring.concat(row + '\n');
    }
    return fileHandle.writeText(logstring).catch(err => {
      this.showError(err);
    });
  }

  // volumeDown() {
  //   if (this.volume > 0.1) {
  //     this.volume -= 0.1;
  //   }
  //   this.updateVolumeIcon();
  //   this.player.volume = this.volume;
  // }
  //
  // volumeUp() {
  //   if (this.volume <= 0.9) {
  //     this.volume += 0.1;
  //   }
  //   this.updateVolumeIcon();
  //   this.player.volume =  this.volume;
  // }

  // updateVolumeIcon() {
  //   if (this.volume <= 0.2) {
  //     this.volumeIcon = 'volume-mute';
  //   } else if (this.volume <= 0.6) {
  //     this.volumeIcon = 'volume-down';
  //   } else {
  //     this.volumeIcon = 'volume-up';
  //   }
  // }

  showError(err) {
    return dialogs.alert({
      title: 'Error',
      message: err,
      okButtonText: 'Close'
    }).then(() => {
      // pass
    });
  }

  finishExperiment() {
    dialogs.alert({
      title: 'Experiment completed',
      message: 'The experiment is now finished, thank you for participating!',
      okButtonText: 'OK'
    }).then(() => {
      this.currentExperiment.status = ExperimentStatus.Finished;
      return this.routerExtensions.navigate(['/experimentlist'], {clearHistory: true});
    }).catch(err => {
      this.showError(err);
    });
  }

  abortExperiment() {
    dialogs.confirm({
      title: 'Abort experiment?',
      message: 'The experiment is not finished, are you sure you want to abort? You cannot continue the experiment after quitting.',
      okButtonText: 'Quit',
      cancelButtonText: 'Stay'
    }).then(ans => {
      if (ans) {
        this.currentExperiment.status = ExperimentStatus.Aborted;
        return this.writeLog('Aborted trial.\n' + JSON.stringify(this.currentExperiment.grid.getHistory())).then(() => {
          return this.routerExtensions.navigate(['/experimentlist'], {clearHistory: true});
        }).catch(err => this.showError(err));
      }
    });
  }

  showActionSheet() {
    dialogs.action({
      title: 'Actions',
      message: 'Choose an action',
      cancelButtonText: 'Cancel',
      actions: ['Show grid', 'Verify audio', 'Abort experiment']
    }).then((result: string) => {
      switch (result) {
        case 'Show grid': {
          this.routerExtensions.navigate(['/gridplot', 0]);
          break;
        }
        case 'Verify audio': {
          this.routerExtensions.navigate(['/verifyaudio']);
          break;
        }
        case 'Abort experiment': {
          this.abortExperiment();
          break;
        }
        default: {

        }
      }
    });
  }

}
