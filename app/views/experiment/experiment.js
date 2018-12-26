"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var page_1 = require("ui/page");
var dialogs = require("tns-core-modules/ui/dialogs");
var fs = require("tns-core-modules/file-system");
var timer_1 = require("tns-core-modules/timer");
var appSettings = require("tns-core-modules/application-settings");
var session_1 = require("../../shared/session/session");
var volumeobserver_1 = require("../../shared/volumeobserver");
var router_1 = require("nativescript-angular/router");
var env = require("../../config/environment");
var util = require("../../shared/utils");
var grid_1 = require("../../shared/grid/grid");
var grid_player_ios_1 = require("../../shared/grid-player/grid-player-ios");
var ExperimentPage = /** @class */ (function () {
    function ExperimentPage(sessionProvider, routerExtensions, _ngZone, page) {
        var _this = this;
        this.sessionProvider = sessionProvider;
        this.routerExtensions = routerExtensions;
        this._ngZone = _ngZone;
        this.page = page;
        this.experimentLogText = [];
        // 2AFC --> two players
        this.n_alternatives = env.experiment.n_alternatives;
        this.grid_coldef = "";
        this.alternative_ids = [];
        this.alternative_labels = env.experiment.alternative_labels;
        for (var i = 0; i < this.n_alternatives; i++) {
            this.grid_coldef += "*,";
            this.alternative_ids.push(i);
        }
        this.grid_coldef = this.grid_coldef.slice(0, -1);
        console.log("Grid coldef: " + this.grid_coldef);
        this.currentExperiment = sessionProvider.getCurrentExperiment();
        this.currentExperiment.status = session_1.ExperimentStatus.Started;
        this.freq = this.currentExperiment.testFrequency;
        this.volume = 1;
        console.log('Volume: ' + this.volume);
        var tone_level_range = util.a2db(this.volume) - util.a2db(this.currentExperiment.toneThreshold);
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
        var parameter_grid = new grid_1.ParamGrid({
            xmin: 0,
            xmax: env.maxGap,
            xres: 0.05,
            ymin: env.maxTargetLevel_dB - tone_level_range,
            ymax: env.maxTargetLevel_dB,
            yres: 3
        });
        console.log('Grid:');
        console.log(parameter_grid.printGrid());
        var basegrid = new grid_1.BasicGridTracker({
            g: parameter_grid,
            m_up: env.experiment.grid_mup,
            n_down: env.experiment.grid_ndown,
            n_revs: env.experiment.grid_nrevs,
            n_step: env.experiment.grid_nstep
        });
        var grid = new grid_1.PhasedGridTracker();
        var ylim = basegrid.getGrid().getYlim();
        grid.addPhase(new grid_1.BasicGridTracker({
            g: basegrid.getGrid().getSubGridByValues({ xmin: 0, xmax: 0, ymin: ylim[0], ymax: ylim[1] }),
            m_up: env.experiment.grid_mup,
            n_down: env.experiment.grid_ndown,
            n_revs: 6,
            n_step: 100
        }));
        grid.addPhase(basegrid);
        grid.initialize(0, ylim[0] + 40);
        console.log('Grid initialized');
        this.currentExperiment.grid = grid;
        var appPath = fs.knownFolders.currentApp();
        this.audioPath = fs.path.join(appPath.path, env.audioPath);
        console.log(this.audioPath);
        this.ISI_ms = env.experiment.interstimulusInterval_ms;
        this.trialNumber = 0;
        var bg_ref_level;
        if (appSettings.hasKey("spl_background")) {
            bg_ref_level = appSettings.getNumber("spl_background");
        }
        else {
            this.showError("Calibrate levels first!").then(function () {
                _this.routerExtensions.navigate(['calibration']);
            });
        }
        this.players = [];
        var promises = [];
        var _loop_1 = function (i) {
            this_1.players.push(new grid_player_ios_1.GridPlayer());
            var playerOptions = {
                targetFrequency: this_1.currentExperiment.testFrequency,
                loop: false,
                paddedSilenceDuration: 0,
                targetDuration: env.experiment.targetDuration_s,
                maskerDuration: env.experiment.maskerDuration_s,
                //maskerLevel: util.a2db(this.currentExperiment.noiseThreshold) + env.maskerLevel_dB,
                maskerLevel: env.maskerLevel_dB - bg_ref_level,
                channelOptions: grid_player_ios_1.ChannelOptions.Diotic,
                settingsPath: this_1.audioPath,
                completeCallback: function (args) {
                    _this._ngZone.run(function () { return _this.soundEnded(i); });
                }
            };
            promises.push(this_1.players[i].initialize(playerOptions));
        };
        var this_1 = this;
        for (var i = 0; i < this.n_alternatives; i++) {
            _loop_1(i);
        }
        Promise.all(promises).then(function () {
            return _this.loadSounds();
        }).then(function () {
            console.log('Sounds loaded');
            // for (let i = 0; i < this.n_alternatives; i++) {
            //   this.players[i].getAudioTrackDuration().then(dur => {
            //     console.log('Player ' + i + ', track duration ' + dur);
            //   });
            // }
            _this.playButtonText = "Play";
            _this.instructionText = "Press play button to hear the sound.";
            _this.highlightedButton = -1;
            _this.enableAnswer = false;
            _this.answered = false;
            _this.uid = sessionProvider.username;
            var docsPath = fs.knownFolders.documents().path;
            var now = new Date();
            var logfile = env.environment.experimentFilePrefix + _this.uid + '-' + now.getHours() + '-' + now.getMinutes() + '.' + now.getMilliseconds() + '-' + now.getDate() + '-' + (now.getMonth() + 1) + '-' + now.getFullYear() + '.log';
            _this.logFilePath = fs.path.join(docsPath, logfile);
            console.log('Logging to ' + logfile);
            return _this.writeLog('Experiment started, subject ' + _this.uid + ', vol ' + _this.volume + ', freq ' + _this.freq);
        }).then(function () {
            return _this.writeLog('trial; gap; level; answer; correct');
        }).catch(function (err) { return _this.showError(err); });
        this.page.on("navigatedTo", function (data) {
            console.log("adding volume observer");
            var audioSession = AVAudioSession.sharedInstance();
            _this.masterVolumeObserver = new volumeobserver_1.VolumeObserver();
            _this.masterVolumeObserver.setCallback(function (obj) {
                dialogs.alert({
                    title: "Volume changed!",
                    message: "A volume button press was observed. The current experiment will be cancelled and you will now return to the volume setting screen.",
                    okButtonText: "OK"
                }).then(function () {
                    _this.currentExperiment.status = session_1.ExperimentStatus.Aborted;
                    return _this.writeLog('Volume changed, aborted trial.\n' + JSON.stringify(_this.currentExperiment.grid.getHistory())).then(function () {
                        return _this.routerExtensions.navigate(['/volume'], { clearHistory: true });
                    });
                }).catch(function (err) { return console.log(err); });
            });
            audioSession.addObserverForKeyPathOptionsContext(_this.masterVolumeObserver, "outputVolume", 1 /* New */, null);
        });
        this.page.on("navigatingFrom", function (data) {
            var audioSession = AVAudioSession.sharedInstance();
            audioSession.removeObserverForKeyPath(_this.masterVolumeObserver, "outputVolume");
        });
    }
    ExperimentPage.prototype.evaluateAnswer = function (answer) {
        var _this = this;
        this.enableAnswer = false;
        this.answered = true;
        this.isCorrect = (answer == this.target_idx);
        if (this.isCorrect) {
            this.instructionText = 'Correct';
        }
        else {
            this.instructionText = 'Wrong';
        }
        var _a = this.currentExperiment.grid.getCurrentGridParameters(), x = _a[0], y = _a[1];
        return this.writeLog('' + this.trialNumber + ';' + x + ';' + y + ';' + answer + ';' + this.isCorrect).then(function () {
            var ans = _this.isCorrect ? grid_1.TrialAnswer.Correct : grid_1.TrialAnswer.Wrong;
            try {
                _this.currentExperiment.grid.updatePosition(ans); // might throw error if something goes wrong, catched later
            }
            catch (err) {
                console.log("Error updating position: " + err);
            }
            console.log(JSON.stringify(_this.currentExperiment.grid.getStatus()));
            //console.log('new position ' + x + ', ' + y);
            if (_this.currentExperiment.grid.getStatus().finished) {
                console.log("Finished");
                return _this.writeLog(JSON.stringify(_this.currentExperiment.grid.getHistory())).then(function () {
                    _this.finishExperiment();
                });
            }
            return _this.loadSounds().then(function () {
                if (_this.running) {
                    timer_1.setTimeout(function () {
                        _this.answered = false;
                        _this.instructionText = "Prepare for next sound!";
                    }, Math.round(env.experiment.intertrialInterval_ms / 2));
                    _this.trialTimeout = timer_1.setTimeout(function () { return _this.playTrial(); }, env.experiment.intertrialInterval_ms);
                }
            });
        }).catch(function (err) { return _this.showError(err); });
    };
    ExperimentPage.prototype.loadSounds = function () {
        var _this = this;
        //console.log('Loading sounds');
        var promises = [];
        this.target_idx = Math.floor(Math.random() * this.n_alternatives);
        //console.log('Target is at ' + this.target_idx);
        var _a = this.currentExperiment.grid.getCurrentGridParameters(), mask_i = _a[0], targ_i = _a[1];
        var _loop_2 = function (i) {
            promises.push(this_2.players[i].preloadStimulus(mask_i, targ_i, (i == this_2.target_idx), true).catch(function (err) {
                console.log('Error initializing player ' + i + ' (is target? ' + (_this.target_idx == i) + ') ' + err.extra);
                return new Promise(function (resolve, reject) { return reject(err.extra); });
            }));
        };
        var this_2 = this;
        for (var i = 0; i < this.n_alternatives; i++) {
            _loop_2(i);
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
        return Promise.all(promises).catch(function (err) { return _this.showError(err); });
    };
    ExperimentPage.prototype.handlePlayButton = function () {
        var _this = this;
        if (this.running) {
            this.pause();
        }
        else {
            this.trialTimeout = timer_1.setTimeout(function () { return _this.playTrial(); }, env.experiment.intertrialInterval_ms / 2);
            this.playButtonText = "Pause";
            this.instructionText = "Prepare for next sound!";
        }
    };
    ExperimentPage.prototype.isRunning = function () {
        return this.running;
    };
    ExperimentPage.prototype.pause = function () {
        if (!this.running) {
            return;
        }
        clearTimeout(this.trialTimeout);
        this.running = false;
        this.playButtonText = "Play";
    };
    ExperimentPage.prototype.isPlaying = function () {
        for (var i = 0; i < this.n_alternatives; i++) {
            if (this.players[i].isPlaying()) {
                return true;
            }
        }
        return false;
    };
    ExperimentPage.prototype.playTrial = function () {
        var _this = this;
        this.running = true;
        this.currentExperiment.status = session_1.ExperimentStatus.Running;
        for (var i = 0; i < this.n_alternatives; i++) {
            this.players[i].volume = this.volume;
        }
        return this.startSound(0).then(function () {
            _this.trialNumber += 1;
            _this.instructionText = "Which sound has the target?";
            _this.enableAnswer = false;
            _this.answered = false;
        }, function (err) { return _this.showError('could not start sound: ' + err); });
    };
    ExperimentPage.prototype.startSound = function (player_idx) {
        if (this.players[player_idx].isPlaying()) {
            return new Promise(function (resolve, reject) { return reject('Already playing'); });
        }
        this.highlightedButton = player_idx;
        return this.players[player_idx].play();
    };
    ExperimentPage.prototype.soundEnded = function (player_idx) {
        var _this = this;
        this.highlightedButton = -1;
        if (player_idx < this.n_alternatives - 1) {
            timer_1.setTimeout(function () {
                _this.startSound(player_idx + 1).catch(function (err) { return console.log(err); });
            }, this.ISI_ms);
        }
        else {
            this.trialEnded();
        }
    };
    ExperimentPage.prototype.trialEnded = function () {
        this.instructionText = 'Click on the sound that had the target';
        this.enableAnswer = true;
    };
    ExperimentPage.prototype.writeLog = function (message) {
        var _this = this;
        console.log('LOG:');
        console.log(message);
        this.experimentLogText.push(message);
        var fileHandle = fs.File.fromPath(this.logFilePath);
        var logstring = '';
        for (var _i = 0, _a = this.experimentLogText; _i < _a.length; _i++) {
            var row = _a[_i];
            logstring = logstring.concat(row + '\n');
        }
        return fileHandle.writeText(logstring).catch(function (err) {
            _this.showError(err);
        });
    };
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
    ExperimentPage.prototype.showError = function (err) {
        return dialogs.alert({
            title: 'Error',
            message: err,
            okButtonText: 'Close'
        }).then(function () {
            // pass
        });
    };
    ExperimentPage.prototype.finishExperiment = function () {
        var _this = this;
        dialogs.alert({
            title: 'Experiment completed',
            message: 'The experiment is now finished, thank you for participating!',
            okButtonText: 'OK'
        }).then(function () {
            _this.currentExperiment.status = session_1.ExperimentStatus.Finished;
            return _this.routerExtensions.navigate(['/experimentlist'], { clearHistory: true });
        }).catch(function (err) {
            _this.showError(err);
        });
    };
    ExperimentPage.prototype.abortExperiment = function () {
        var _this = this;
        dialogs.confirm({
            title: 'Abort experiment?',
            message: 'The experiment is not finished, are you sure you want to abort? You cannot continue the experiment after quitting.',
            okButtonText: 'Quit',
            cancelButtonText: 'Stay'
        }).then(function (ans) {
            if (ans) {
                _this.currentExperiment.status = session_1.ExperimentStatus.Aborted;
                return _this.writeLog('Aborted trial.\n' + JSON.stringify(_this.currentExperiment.grid.getHistory())).then(function () {
                    return _this.routerExtensions.navigate(['/experimentlist'], { clearHistory: true });
                }).catch(function (err) { return _this.showError(err); });
            }
        });
    };
    ExperimentPage.prototype.showActionSheet = function () {
        var _this = this;
        dialogs.action({
            title: 'Actions',
            message: 'Choose an action',
            cancelButtonText: 'Cancel',
            actions: ['Show grid', 'Verify audio', 'Abort experiment']
        }).then(function (result) {
            switch (result) {
                case 'Show grid': {
                    _this.routerExtensions.navigate(['/gridplot', 0]);
                    break;
                }
                case 'Verify audio': {
                    _this.routerExtensions.navigate(['/verifyaudio']);
                    break;
                }
                case 'Abort experiment': {
                    _this.abortExperiment();
                    break;
                }
                default: {
                }
            }
        });
    };
    ExperimentPage = __decorate([
        core_1.Component({
            moduleId: module.id,
            selector: 'page-experiment',
            templateUrl: './experiment.html',
            styleUrls: ['./experiment.css']
        }),
        __metadata("design:paramtypes", [session_1.SessionProvider,
            router_1.RouterExtensions,
            core_1.NgZone,
            page_1.Page])
    ], ExperimentPage);
    return ExperimentPage;
}());
exports.ExperimentPage = ExperimentPage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwZXJpbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImV4cGVyaW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBa0Q7QUFDbEQsZ0NBQStCO0FBRS9CLHFEQUF1RDtBQUN2RCxpREFBbUQ7QUFDbkQsZ0RBQW9EO0FBQ3BELG1FQUFxRTtBQUVyRSx3REFBNkY7QUFDN0YsOERBQTZEO0FBQzdELHNEQUErRDtBQUUvRCw4Q0FBZ0Q7QUFDaEQseUNBQTJDO0FBRTNDLCtDQUFzSTtBQUN0SSw0RUFBeUc7QUFVekc7SUFrQ0Usd0JBQW9CLGVBQWdDLEVBQ2hDLGdCQUFrQyxFQUNsQyxPQUFlLEVBQ2YsSUFBVTtRQUg5QixpQkFnS0M7UUFoS21CLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtRQUNoQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1FBQ2xDLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFDZixTQUFJLEdBQUosSUFBSSxDQUFNO1FBTnRCLHNCQUFpQixHQUFrQixFQUFFLENBQUM7UUFRNUMsdUJBQXVCO1FBQ3ZCLElBQUksQ0FBQyxjQUFjLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUM7UUFDcEQsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7UUFDdEIsSUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7UUFDMUIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUM7UUFDNUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDN0MsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUM7WUFDekIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUNELElBQUksQ0FBQyxXQUFX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QkFBQztDQUFBLEFBMWRELElBMGRDO0FBMWRZLHdDQUFjIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBOZ1pvbmUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tIFwidWkvcGFnZVwiO1xuaW1wb3J0IHsgRXZlbnREYXRhIH0gZnJvbSBcImRhdGEvb2JzZXJ2YWJsZVwiO1xuaW1wb3J0ICogYXMgZGlhbG9ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9kaWFsb2dzXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9maWxlLXN5c3RlbVwiO1xuaW1wb3J0IHsgc2V0VGltZW91dCB9IGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3RpbWVyXCI7XG5pbXBvcnQgKiBhcyBhcHBTZXR0aW5ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9hcHBsaWNhdGlvbi1zZXR0aW5nc1wiO1xuXG5pbXBvcnQgeyBTZXNzaW9uUHJvdmlkZXIsIEV4cGVyaW1lbnQsIEV4cGVyaW1lbnRTdGF0dXMgfSBmcm9tICcuLi8uLi9zaGFyZWQvc2Vzc2lvbi9zZXNzaW9uJztcbmltcG9ydCB7IFZvbHVtZU9ic2VydmVyIH0gZnJvbSBcIi4uLy4uL3NoYXJlZC92b2x1bWVvYnNlcnZlclwiO1xuaW1wb3J0IHsgUm91dGVyRXh0ZW5zaW9ucyB9IGZyb20gJ25hdGl2ZXNjcmlwdC1hbmd1bGFyL3JvdXRlcic7XG5cbmltcG9ydCAqIGFzIGVudiBmcm9tICcuLi8uLi9jb25maWcvZW52aXJvbm1lbnQnO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tICcuLi8uLi9zaGFyZWQvdXRpbHMnO1xuaW1wb3J0IHsgc291bmRfY29uZmlnIH0gZnJvbSAnLi9leHBlcmltZW50LWNvbmZpZyc7XG5pbXBvcnQgeyBQaGFzZWRHcmlkVHJhY2tlciwgQmFzaWNHcmlkVHJhY2tlciwgUGFyYW1HcmlkLCBHcmlkVHJhY2tlciwgVHJpYWxBbnN3ZXIsIEdyaWRUcmFja2luZ1N0YXR1cyB9IGZyb20gJy4uLy4uL3NoYXJlZC9ncmlkL2dyaWQnO1xuaW1wb3J0IHsgR3JpZFBsYXllciwgR3JpZFBsYXllck9wdGlvbnMsIENoYW5uZWxPcHRpb25zIH0gZnJvbSAnLi4vLi4vc2hhcmVkL2dyaWQtcGxheWVyL2dyaWQtcGxheWVyLWlvcyc7XG5cbmRlY2xhcmUgdmFyIE5TVVJMO1xuXG5AQ29tcG9uZW50KHtcbiAgbW9kdWxlSWQ6IG1vZHVsZS5pZCxcbiAgc2VsZWN0b3I6ICdwYWdlLWV4cGVyaW1lbnQnLFxuICB0ZW1wbGF0ZVVybDogJy4vZXhwZXJpbWVudC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJy4vZXhwZXJpbWVudC5jc3MnXVxufSlcbmV4cG9ydCBjbGFzcyBFeHBlcmltZW50UGFnZSB7XG5cbiAgcHJpdmF0ZSBtYXN0ZXJWb2x1bWVPYnNlcnZlcjogVm9sdW1lT2JzZXJ2ZXI7XG4gIHByaXZhdGUgdm9sdW1lOiBudW1iZXI7XG4gIHByaXZhdGUgdHJpYWxOdW1iZXI6IG51bWJlcjtcbiAgcHJpdmF0ZSB1aWQ6IHN0cmluZztcbiAgcHJpdmF0ZSBhdWRpb1BhdGg6IHN0cmluZztcbiAgcHJpdmF0ZSB2b2x1bWVJY29uOiBzdHJpbmc7XG4gIHByaXZhdGUgbl9hbHRlcm5hdGl2ZXM6IG51bWJlcjtcbiAgcHJpdmF0ZSBhbHRlcm5hdGl2ZV9pZHM6IEFycmF5PG51bWJlcj47XG4gIHByaXZhdGUgYWx0ZXJuYXRpdmVfbGFiZWxzOiBzdHJpbmc7XG4gIC8vcHJpdmF0ZSBwbGF5ZXJzOiBBcnJheTxUTlNQbGF5ZXI+O1xuICBwcml2YXRlIHBsYXllcnM6IEFycmF5PEdyaWRQbGF5ZXI+O1xuICBwcml2YXRlIHRyaWFsVGltZW91dDogYW55O1xuXG4gIHByaXZhdGUgSVNJX21zOiBudW1iZXI7XG4gIHByaXZhdGUgZnJlcTogbnVtYmVyO1xuXG4gIHByaXZhdGUgc291bmRfaWQ6IHN0cmluZztcbiAgcHJpdmF0ZSBpc0NvcnJlY3Q6IGJvb2xlYW47XG4gIHByaXZhdGUgdGFyZ2V0X2lkeDogbnVtYmVyO1xuXG4gIHByaXZhdGUgcGxheUJ1dHRvblRleHQ6IHN0cmluZztcbiAgcHJpdmF0ZSBpbnN0cnVjdGlvblRleHQ6IHN0cmluZztcbiAgcHJpdmF0ZSBoaWdobGlnaHRlZEJ1dHRvbjogbnVtYmVyO1xuICBwcml2YXRlIGVuYWJsZUFuc3dlcjogYm9vbGVhbjtcbiAgcHJpdmF0ZSBhbnN3ZXJlZDogYm9vbGVhbjtcbiAgcHJpdmF0ZSBncmlkX2NvbGRlZjogc3RyaW5nO1xuICBwcml2YXRlIHJ1bm5pbmc6IGJvb2xlYW47XG5cbiAgcHJpdmF0ZSBsb2dGaWxlUGF0aDogc3RyaW5nO1xuICBwcml2YXRlIGV4cGVyaW1lbnRMb2dUZXh0OiBBcnJheTxzdHJpbmc+ID0gW107XG4gIHByaXZhdGUgY3VycmVudEV4cGVyaW1lbnQ6IEV4cGVyaW1lbnQ7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBzZXNzaW9uUHJvdmlkZXI6IFNlc3Npb25Qcm92aWRlcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSByb3V0ZXJFeHRlbnNpb25zOiBSb3V0ZXJFeHRlbnNpb25zLFxuICAgICAgICAgICAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBwYWdlOiBQYWdlKSB7XG5cbiAgICAvLyAyQUZDIC0tPiB0d28gcGxheWVyc1xuICAgIHRoaXMubl9hbHRlcm5hdGl2ZXMgPSBlbnYuZXhwZXJpbWVudC5uX2FsdGVybmF0aXZlcztcbiAgICB0aGlzLmdyaWRfY29sZGVmID0gXCJcIjtcbiAgICB0aGlzLmFsdGVybmF0aXZlX2lkcyA9IFtdO1xuICAgIHRoaXMuYWx0ZXJuYXRpdmVfbGFiZWxzID0gZW52LmV4cGVyaW1lbnQuYWx0ZXJuYXRpdmVfbGFiZWxzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uX2FsdGVybmF0aXZlczsgaSsrKSB7XG4gICAgICB0aGlzLmdyaWRfY29sZGVmICs9IFwiKixcIjtcbiAgICAgIHRoaXMuYWx0ZXJuYXRpdmVfaWRzLnB1c2goaSk7XG4gICAgfVxuICAgIHRoaXMuZ3JpZF9jb2xkZWYgPSB0aGlzLmdyaWRfY29sZGVmLnNsaWNlKDAsLTEpO1xuICAgIGNvbnNvbGUubG9nKFwiR3JpZCBjb2xkZWY6IFwiICsgdGhpcy5ncmlkX2NvbGRlZik7XG5cbiAgICB0aGlzLmN1cnJlbnRFeHBlcmltZW50ID0gc2Vzc2lvblByb3ZpZGVyLmdldEN1cnJlbnRFeHBlcmltZW50KCk7XG4gICAgdGhpcy5jdXJyZW50RXhwZXJpbWVudC5zdGF0dXMgPSBFeHBlcmltZW50U3RhdHVzLlN0YXJ0ZWQ7XG4gICAgdGhpcy5mcmVxID0gdGhpcy5jdXJyZW50RXhwZXJpbWVudC50ZXN0RnJlcXVlbmN5O1xuXG4gICAgdGhpcy52b2x1bWUgPSAxO1xuICAgIGNvbnNvbGUubG9nKCdWb2x1bWU6ICcgKyB0aGlzLnZvbHVtZSk7XG4gICAgbGV0IHRvbmVfbGV2ZWxfcmFuZ2UgPSB1dGlsLmEyZGIodGhpcy52b2x1bWUpIC0gdXRpbC5hMmRiKHRoaXMuY3VycmVudEV4cGVyaW1lbnQudG9uZVRocmVzaG9sZCk7XG4gICAgdG9uZV9sZXZlbF9yYW5nZSA9IE1hdGguZmxvb3IodG9uZV9sZXZlbF9yYW5nZSk7XG4gICAgY29uc29sZS5sb2coJ1RvbmUgbGV2ZWwgcmFuZ2U6ICcgKyB0b25lX2xldmVsX3JhbmdlKTtcblxuICAgIC8vIGxldCBwYXJhbWV0ZXJfZ3JpZCA9IG5ldyBQYXJhbUdyaWQoe1xuICAgIC8vICAgeG1pbjogMSxcbiAgICAvLyAgIHhtYXg6IDE4LFxuICAgIC8vICAgeHJlczogMSxcbiAgICAvLyAgIHltaW46IDI2IC0gbWluaW11bV9pbmRleCxcbiAgICAvLyAgIHltYXg6IDI2LFxuICAgIC8vICAgeXJlczogMVxuICAgIC8vIH0pO1xuXG4gICAgbGV0IHBhcmFtZXRlcl9ncmlkID0gbmV3IFBhcmFtR3JpZCh7XG4gICAgICB4bWluOiAwLFxuICAgICAgeG1heDogZW52Lm1heEdhcCxcbiAgICAgIHhyZXM6IDAuMDUsXG4gICAgICB5bWluOiBlbnYubWF4VGFyZ2V0TGV2ZWxfZEIgLSB0b25lX2xldmVsX3JhbmdlLFxuICAgICAgeW1heDogZW52Lm1heFRhcmdldExldmVsX2RCLFxuICAgICAgeXJlczogM1xuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coJ0dyaWQ6Jyk7XG4gICAgY29uc29sZS5sb2cocGFyYW1ldGVyX2dyaWQucHJpbnRHcmlkKCkpO1xuXG4gICAgbGV0IGJhc2VncmlkID0gbmV3IEJhc2ljR3JpZFRyYWNrZXIoe1xuICAgICAgZzogcGFyYW1ldGVyX2dyaWQsXG4gICAgICBtX3VwOiBlbnYuZXhwZXJpbWVudC5ncmlkX211cCxcbiAgICAgIG5fZG93bjogZW52LmV4cGVyaW1lbnQuZ3JpZF9uZG93bixcbiAgICAgIG5fcmV2czogZW52LmV4cGVyaW1lbnQuZ3JpZF9ucmV2cyxcbiAgICAgIG5fc3RlcDogZW52LmV4cGVyaW1lbnQuZ3JpZF9uc3RlcFxuICAgIH0pO1xuXG4gICAgbGV0IGdyaWQgPSBuZXcgUGhhc2VkR3JpZFRyYWNrZXIoKTtcbiAgICBsZXQgeWxpbSA9IGJhc2VncmlkLmdldEdyaWQoKS5nZXRZbGltKCk7XG4gICAgZ3JpZC5hZGRQaGFzZShuZXcgQmFzaWNHcmlkVHJhY2tlcih7XG4gICAgICBnOiBiYXNlZ3JpZC5nZXRHcmlkKCkuZ2V0U3ViR3JpZEJ5VmFsdWVzKHt4bWluOjAsIHhtYXg6MCwgeW1pbjp5bGltWzBdLCB5bWF4OnlsaW1bMV19KSxcbiAgICAgIG1fdXA6IGVudi5leHBlcmltZW50LmdyaWRfbXVwLFxuICAgICAgbl9kb3duOiBlbnYuZXhwZXJpbWVudC5ncmlkX25kb3duLFxuICAgICAgbl9yZXZzOiA2LFxuICAgICAgbl9zdGVwOiAxMDBcbiAgICB9KSk7XG4gICAgZ3JpZC5hZGRQaGFzZShiYXNlZ3JpZCk7XG4gICAgZ3JpZC5pbml0aWFsaXplKDAsIHlsaW1bMF0gKyA0MCk7XG4gICAgY29uc29sZS5sb2coJ0dyaWQgaW5pdGlhbGl6ZWQnKTtcbiAgICB0aGlzLmN1cnJlbnRFeHBlcmltZW50LmdyaWQgPSBncmlkO1xuXG4gICAgbGV0IGFwcFBhdGggPSBmcy5rbm93bkZvbGRlcnMuY3VycmVudEFwcCgpO1xuICAgIHRoaXMuYXVkaW9QYXRoID0gZnMucGF0aC5qb2luKGFwcFBhdGgucGF0aCwgZW52LmF1ZGlvUGF0aCk7XG4gICAgY29uc29sZS5sb2codGhpcy5hdWRpb1BhdGgpO1xuXG4gICAgdGhpcy5JU0lfbXMgPSBlbnYuZXhwZXJpbWVudC5pbnRlcnN0aW11bHVzSW50ZXJ2YWxfbXM7XG4gICAgdGhpcy50cmlhbE51bWJlciA9IDA7XG5cbiAgICBsZXQgYmdfcmVmX2xldmVsO1xuICAgIGlmIChhcHBTZXR0aW5ncy5oYXNLZXkoXCJzcGxfYmFja2dyb3VuZFwiKSkge1xuICAgICAgYmdfcmVmX2xldmVsID0gYXBwU2V0dGluZ3MuZ2V0TnVtYmVyKFwic3BsX2JhY2tncm91bmRcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2hvd0Vycm9yKFwiQ2FsaWJyYXRlIGxldmVscyBmaXJzdCFcIikudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMucm91dGVyRXh0ZW5zaW9ucy5uYXZpZ2F0ZShbJ2NhbGlicmF0aW9uJ10pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5wbGF5ZXJzID0gW107XG4gICAgbGV0IHByb21pc2VzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5fYWx0ZXJuYXRpdmVzOyBpKyspIHtcbiAgICAgIHRoaXMucGxheWVycy5wdXNoKG5ldyBHcmlkUGxheWVyKCkpO1xuICAgICAgbGV0IHBsYXllck9wdGlvbnM6R3JpZFBsYXllck9wdGlvbnMgPSB7XG4gICAgICAgIHRhcmdldEZyZXF1ZW5jeTogdGhpcy5jdXJyZW50RXhwZXJpbWVudC50ZXN0RnJlcXVlbmN5LFxuICAgICAgICBsb29wOiBmYWxzZSxcbiAgICAgICAgcGFkZGVkU2lsZW5jZUR1cmF0aW9uOiAwLFxuICAgICAgICB0YXJnZXREdXJhdGlvbjogZW52LmV4cGVyaW1lbnQudGFyZ2V0RHVyYXRpb25fcyxcbiAgICAgICAgbWFza2VyRHVyYXRpb246IGVudi5leHBlcmltZW50Lm1hc2tlckR1cmF0aW9uX3MsXG4gICAgICAgIC8vbWFza2VyTGV2ZWw6IHV0aWwuYTJkYih0aGlzLmN1cnJlbnRFeHBlcmltZW50Lm5vaXNlVGhyZXNob2xkKSArIGVudi5tYXNrZXJMZXZlbF9kQixcbiAgICAgICAgbWFza2VyTGV2ZWw6IGVudi5tYXNrZXJMZXZlbF9kQiAtIGJnX3JlZl9sZXZlbCxcbiAgICAgICAgY2hhbm5lbE9wdGlvbnM6IENoYW5uZWxPcHRpb25zLkRpb3RpYyxcbiAgICAgICAgc2V0dGluZ3NQYXRoOiB0aGlzLmF1ZGlvUGF0aCxcbiAgICAgICAgY29tcGxldGVDYWxsYmFjazogYXJncyA9PiB7XG4gICAgICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB0aGlzLnNvdW5kRW5kZWQoaSkpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLnBsYXllcnNbaV0uaW5pdGlhbGl6ZShwbGF5ZXJPcHRpb25zKSk7XG4gICAgfVxuXG4gICAgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMubG9hZFNvdW5kcygpO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1NvdW5kcyBsb2FkZWQnKTtcbiAgICAgIC8vIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uX2FsdGVybmF0aXZlczsgaSsrKSB7XG4gICAgICAvLyAgIHRoaXMucGxheWVyc1tpXS5nZXRBdWRpb1RyYWNrRHVyYXRpb24oKS50aGVuKGR1ciA9PiB7XG4gICAgICAvLyAgICAgY29uc29sZS5sb2coJ1BsYXllciAnICsgaSArICcsIHRyYWNrIGR1cmF0aW9uICcgKyBkdXIpO1xuICAgICAgLy8gICB9KTtcbiAgICAgIC8vIH1cblxuICAgICAgdGhpcy5wbGF5QnV0dG9uVGV4dCA9IFwiUGxheVwiO1xuICAgICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSBcIlByZXNzIHBsYXkgYnV0dG9uIHRvIGhlYXIgdGhlIHNvdW5kLlwiO1xuICAgICAgdGhpcy5oaWdobGlnaHRlZEJ1dHRvbiA9IC0xO1xuXG4gICAgICB0aGlzLmVuYWJsZUFuc3dlciA9IGZhbHNlO1xuICAgICAgdGhpcy5hbnN3ZXJlZCA9IGZhbHNlO1xuXG4gICAgICB0aGlzLnVpZCA9IHNlc3Npb25Qcm92aWRlci51c2VybmFtZTtcblxuICAgICAgbGV0IGRvY3NQYXRoID0gZnMua25vd25Gb2xkZXJzLmRvY3VtZW50cygpLnBhdGg7XG4gICAgICBsZXQgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgIGxldCBsb2dmaWxlID0gZW52LmVudmlyb25tZW50LmV4cGVyaW1lbnRGaWxlUHJlZml4ICsgdGhpcy51aWQgKyAnLScgKyBub3cuZ2V0SG91cnMoKSArICctJyArIG5vdy5nZXRNaW51dGVzKCkgKyAnLicgKyBub3cuZ2V0TWlsbGlzZWNvbmRzKCkgKyAnLScgKyBub3cuZ2V0RGF0ZSgpICsgJy0nICsgKG5vdy5nZXRNb250aCgpKzEpICsgJy0nICsgbm93LmdldEZ1bGxZZWFyKCkgKyAnLmxvZyc7XG4gICAgICB0aGlzLmxvZ0ZpbGVQYXRoID0gZnMucGF0aC5qb2luKGRvY3NQYXRoLCBsb2dmaWxlKTtcbiAgICAgIGNvbnNvbGUubG9nKCdMb2dnaW5nIHRvICcgKyBsb2dmaWxlKTtcbiAgICAgIHJldHVybiB0aGlzLndyaXRlTG9nKCdFeHBlcmltZW50IHN0YXJ0ZWQsIHN1YmplY3QgJyArIHRoaXMudWlkICsgJywgdm9sICcgKyB0aGlzLnZvbHVtZSArICcsIGZyZXEgJyArIHRoaXMuZnJlcSk7XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy53cml0ZUxvZygndHJpYWw7IGdhcDsgbGV2ZWw7IGFuc3dlcjsgY29ycmVjdCcpO1xuICAgIH0pLmNhdGNoKGVyciA9PiB0aGlzLnNob3dFcnJvcihlcnIpKTtcblxuICAgIHRoaXMucGFnZS5vbihcIm5hdmlnYXRlZFRvXCIsIChkYXRhOiBFdmVudERhdGEpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKFwiYWRkaW5nIHZvbHVtZSBvYnNlcnZlclwiKTtcbiAgICAgIGxldCBhdWRpb1Nlc3Npb24gPSBBVkF1ZGlvU2Vzc2lvbi5zaGFyZWRJbnN0YW5jZSgpO1xuICAgICAgdGhpcy5tYXN0ZXJWb2x1bWVPYnNlcnZlciA9IG5ldyBWb2x1bWVPYnNlcnZlcigpO1xuICAgICAgdGhpcy5tYXN0ZXJWb2x1bWVPYnNlcnZlci5zZXRDYWxsYmFjaygob2JqKSA9PiB7XG4gICAgICAgIGRpYWxvZ3MuYWxlcnQoe1xuICAgICAgICAgIHRpdGxlOiBcIlZvbHVtZSBjaGFuZ2VkIVwiLFxuICAgICAgICAgIG1lc3NhZ2U6IFwiQSB2b2x1bWUgYnV0dG9uIHByZXNzIHdhcyBvYnNlcnZlZC4gVGhlIGN1cnJlbnQgZXhwZXJpbWVudCB3aWxsIGJlIGNhbmNlbGxlZCBhbmQgeW91IHdpbGwgbm93IHJldHVybiB0byB0aGUgdm9sdW1lIHNldHRpbmcgc2NyZWVuLlwiLFxuICAgICAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiXG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY3VycmVudEV4cGVyaW1lbnQuc3RhdHVzID0gRXhwZXJpbWVudFN0YXR1cy5BYm9ydGVkO1xuICAgICAgICAgIHJldHVybiB0aGlzLndyaXRlTG9nKCdWb2x1bWUgY2hhbmdlZCwgYWJvcnRlZCB0cmlhbC5cXG4nICsgSlNPTi5zdHJpbmdpZnkodGhpcy5jdXJyZW50RXhwZXJpbWVudC5ncmlkLmdldEhpc3RvcnkoKSkpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucm91dGVyRXh0ZW5zaW9ucy5uYXZpZ2F0ZShbJy92b2x1bWUnXSwge2NsZWFySGlzdG9yeTogdHJ1ZX0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KS5jYXRjaChlcnIgPT4gY29uc29sZS5sb2coZXJyKSk7XG4gICAgICB9KTtcbiAgICAgIGF1ZGlvU2Vzc2lvbi5hZGRPYnNlcnZlckZvcktleVBhdGhPcHRpb25zQ29udGV4dCh0aGlzLm1hc3RlclZvbHVtZU9ic2VydmVyLCBcIm91dHB1dFZvbHVtZVwiLCBOU0tleVZhbHVlT2JzZXJ2aW5nT3B0aW9ucy5OZXcsIG51bGwpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5wYWdlLm9uKFwibmF2aWdhdGluZ0Zyb21cIiwgKGRhdGE6IEV2ZW50RGF0YSkgPT4ge1xuICAgICAgbGV0IGF1ZGlvU2Vzc2lvbiA9IEFWQXVkaW9TZXNzaW9uLnNoYXJlZEluc3RhbmNlKCk7XG4gICAgICBhdWRpb1Nlc3Npb24ucmVtb3ZlT2JzZXJ2ZXJGb3JLZXlQYXRoKHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIsIFwib3V0cHV0Vm9sdW1lXCIpO1xuICAgIH0pO1xuXG4gIH1cblxuICBldmFsdWF0ZUFuc3dlcihhbnN3ZXIpIHtcbiAgICB0aGlzLmVuYWJsZUFuc3dlciA9IGZhbHNlO1xuICAgIHRoaXMuYW5zd2VyZWQgPSB0cnVlO1xuXG4gICAgdGhpcy5pc0NvcnJlY3QgPSAoYW5zd2VyID09IHRoaXMudGFyZ2V0X2lkeCk7XG4gICAgaWYgKHRoaXMuaXNDb3JyZWN0KSB7XG4gICAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9ICdDb3JyZWN0JztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSAnV3JvbmcnO1xuICAgIH1cblxuICAgIGxldCBbeCwgeV0gPSB0aGlzLmN1cnJlbnRFeHBlcmltZW50LmdyaWQuZ2V0Q3VycmVudEdyaWRQYXJhbWV0ZXJzKCk7XG4gICAgcmV0dXJuIHRoaXMud3JpdGVMb2coJycgKyB0aGlzLnRyaWFsTnVtYmVyICsgJzsnICsgeCArICc7JyArIHkgKyAnOycgKyBhbnN3ZXIgKyAnOycgKyB0aGlzLmlzQ29ycmVjdCkudGhlbigoKSA9PiB7XG4gICAgICBsZXQgYW5zID0gdGhpcy5pc0NvcnJlY3QgPyBUcmlhbEFuc3dlci5Db3JyZWN0IDogVHJpYWxBbnN3ZXIuV3Jvbmc7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLmN1cnJlbnRFeHBlcmltZW50LmdyaWQudXBkYXRlUG9zaXRpb24oYW5zKTsgLy8gbWlnaHQgdGhyb3cgZXJyb3IgaWYgc29tZXRoaW5nIGdvZXMgd3JvbmcsIGNhdGNoZWQgbGF0ZXJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkVycm9yIHVwZGF0aW5nIHBvc2l0aW9uOiBcIiArIGVycik7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0aGlzLmN1cnJlbnRFeHBlcmltZW50LmdyaWQuZ2V0U3RhdHVzKCkpKTtcbiAgICAgIC8vY29uc29sZS5sb2coJ25ldyBwb3NpdGlvbiAnICsgeCArICcsICcgKyB5KTtcblxuICAgICAgaWYgKHRoaXMuY3VycmVudEV4cGVyaW1lbnQuZ3JpZC5nZXRTdGF0dXMoKS5maW5pc2hlZCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkZpbmlzaGVkXCIpO1xuICAgICAgICByZXR1cm4gdGhpcy53cml0ZUxvZyhKU09OLnN0cmluZ2lmeSh0aGlzLmN1cnJlbnRFeHBlcmltZW50LmdyaWQuZ2V0SGlzdG9yeSgpKSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2hFeHBlcmltZW50KCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5sb2FkU291bmRzKCkudGhlbigoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnJ1bm5pbmcpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYW5zd2VyZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gXCJQcmVwYXJlIGZvciBuZXh0IHNvdW5kIVwiXG4gICAgICAgICAgfSwgTWF0aC5yb3VuZChlbnYuZXhwZXJpbWVudC5pbnRlcnRyaWFsSW50ZXJ2YWxfbXMvMikpO1xuICAgICAgICAgIHRoaXMudHJpYWxUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLnBsYXlUcmlhbCgpLCBlbnYuZXhwZXJpbWVudC5pbnRlcnRyaWFsSW50ZXJ2YWxfbXMpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KS5jYXRjaChlcnIgPT4gdGhpcy5zaG93RXJyb3IoZXJyKSk7XG4gIH1cblxuICBsb2FkU291bmRzKCkge1xuICAgIC8vY29uc29sZS5sb2coJ0xvYWRpbmcgc291bmRzJyk7XG4gICAgbGV0IHByb21pc2VzID0gW107XG4gICAgdGhpcy50YXJnZXRfaWR4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogdGhpcy5uX2FsdGVybmF0aXZlcyk7XG4gICAgLy9jb25zb2xlLmxvZygnVGFyZ2V0IGlzIGF0ICcgKyB0aGlzLnRhcmdldF9pZHgpO1xuICAgIGxldCBbbWFza19pLCB0YXJnX2ldID0gdGhpcy5jdXJyZW50RXhwZXJpbWVudC5ncmlkLmdldEN1cnJlbnRHcmlkUGFyYW1ldGVycygpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5fYWx0ZXJuYXRpdmVzOyBpKyspIHtcblxuICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLnBsYXllcnNbaV0ucHJlbG9hZFN0aW11bHVzKG1hc2tfaSwgdGFyZ19pLCAoaSA9PSB0aGlzLnRhcmdldF9pZHgpLCB0cnVlKS5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZygnRXJyb3IgaW5pdGlhbGl6aW5nIHBsYXllciAnICsgaSArICcgKGlzIHRhcmdldD8gJyArICh0aGlzLnRhcmdldF9pZHggPT0gaSkgKyAnKSAnKyBlcnIuZXh0cmEpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUscmVqZWN0KSA9PiByZWplY3QoZXJyLmV4dHJhKSk7XG4gICAgICB9KSk7XG4gICAgfVxuXG5cbiAgICAgIC8vIGxldCBzdGltX2lkID0gJyc7XG4gICAgICAvLyBpZiAoaSA9PSB0aGlzLnRhcmdldF9pZHgpIHtcbiAgICAgIC8vICAgc3RpbV9pZCA9ICdmJyArIHRoaXMuZnJlcSArICdfbGV2ZWwnICsgdGFyZ19pICsgJ19nYXAnICsgbWFza19pICsgJy53YXYnO1xuICAgICAgLy8gICB0aGlzLnNvdW5kX2lkID0gc3RpbV9pZDtcbiAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAvLyAgIHN0aW1faWQgPSAnZicgKyB0aGlzLmZyZXEgKyAnX2dhcCcgKyBtYXNrX2kgKyAnLndhdic7XG4gICAgICAvLyB9XG4gICAgICAvLyBsZXQgc291bmRwYXRoID0gZnMucGF0aC5qb2luKHRoaXMuYXVkaW9QYXRoLCBzdGltX2lkKTtcbiAgICAgIC8vIGlmICghZnMuRmlsZS5leGlzdHMoc291bmRwYXRoKSkge1xuICAgICAgLy8gICBwcm9taXNlcy5wdXNoKG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHJlamVjdCgnU291bmQgZmlsZSAnICsgc3RpbV9pZCArICcgZG9lcyBub3QgZXhpc3QhJykpKTtcbiAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAvLyAgIHByb21pc2VzLnB1c2godGhpcy5wbGF5ZXJzW2ldLmluaXRGcm9tRmlsZSh7XG4gICAgICAvLyAgICAgYXVkaW9GaWxlOiBzb3VuZHBhdGgsXG4gICAgICAvLyAgICAgbG9vcDogZmFsc2UsXG4gICAgICAvLyAgICAgY29tcGxldGVDYWxsYmFjazogYXJncyA9PiB7XG4gICAgICAvLyAgICAgICAvLyBub3RlOiBwYXNzaW5nIHRoZSBjdXJyZW50IHZhbHVlIG9mIGxvb3AgdmFyaWFibGUgaSB0byB0aGUgY2FsbGJhY2sgaXMgb25seVxuICAgICAgLy8gICAgICAgLy8gcG9zc2libGUgd2hlbiB1c2luZyAnbGV0JyBpbiB0aGUgbG9vcCBpbml0aWFsaXphdGlvbi4ga2V5d29yZHM6IFwiamF2YXNjcmlwdCBjbG9zdXJlXCJcbiAgICAgIC8vICAgICAgIC8vY29uc29sZS5sb2codGhpcy5uYW1lICsgJyBTb3VuZCAnICsgaSArICcgZW5kZWQsIHBsYXlpbmcgbmV4dCcpO1xuICAgICAgLy8gICAgICAgdGhpcy5zb3VuZEVuZGVkKGkpO1xuICAgICAgLy8gICAgICAgaWYgKGkgPCB0aGlzLm5fYWx0ZXJuYXRpdmVzIC0gMSkge1xuICAgICAgLy8gICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX25nWm9uZS5ydW4oKCkgPT4gdGhpcy5zdGFydFNvdW5kKGkrMSkpLCB0aGlzLklTSV9tcyk7XG4gICAgICAvLyAgICAgICB9IGVsc2Uge1xuICAgICAgLy8gICAgICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHRoaXMudHJpYWxFbmRlZCgpKTtcbiAgICAgIC8vICAgICAgIH1cbiAgICAgIC8vICAgICB9LFxuICAgICAgLy8gICAgIGVycm9yQ2FsbGJhY2s6IGVycm9yID0+IHtcbiAgICAgIC8vICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGVycm9yKSk7XG4gICAgICAvLyAgICAgfVxuICAgICAgLy8gICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgLy8gICAgIGNvbnNvbGUubG9nKCdFcnJvciBpbml0aWFsaXppbmcgcGxheWVyICcgKyBpICsgJywgJyArIGVyci5leHRyYSk7XG4gICAgICAvLyAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLHJlamVjdCkgPT4gcmVqZWN0KGVyci5leHRyYSkpO1xuICAgICAgLy8gICB9KSk7XG4gICAgICAvLyB9XG4gICAgLy99XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLmNhdGNoKGVyciA9PiB0aGlzLnNob3dFcnJvcihlcnIpKTtcbiAgfVxuXG4gIGhhbmRsZVBsYXlCdXR0b24oKSB7XG4gICAgaWYgKHRoaXMucnVubmluZykge1xuICAgICAgdGhpcy5wYXVzZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnRyaWFsVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5wbGF5VHJpYWwoKSwgZW52LmV4cGVyaW1lbnQuaW50ZXJ0cmlhbEludGVydmFsX21zLzIpO1xuICAgICAgdGhpcy5wbGF5QnV0dG9uVGV4dCA9IFwiUGF1c2VcIjtcbiAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gXCJQcmVwYXJlIGZvciBuZXh0IHNvdW5kIVwiXG4gICAgfVxuICB9XG5cbiAgaXNSdW5uaW5nKCkge1xuICAgIHJldHVybiB0aGlzLnJ1bm5pbmc7XG4gIH1cblxuICBwYXVzZSgpIHtcbiAgICBpZiAoIXRoaXMucnVubmluZykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNsZWFyVGltZW91dCh0aGlzLnRyaWFsVGltZW91dCk7XG4gICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgdGhpcy5wbGF5QnV0dG9uVGV4dCA9IFwiUGxheVwiO1xuICB9XG5cbiAgaXNQbGF5aW5nKCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uX2FsdGVybmF0aXZlczsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5wbGF5ZXJzW2ldLmlzUGxheWluZygpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHBsYXlUcmlhbCgpIHtcbiAgICB0aGlzLnJ1bm5pbmcgPSB0cnVlO1xuICAgIHRoaXMuY3VycmVudEV4cGVyaW1lbnQuc3RhdHVzID0gRXhwZXJpbWVudFN0YXR1cy5SdW5uaW5nO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5fYWx0ZXJuYXRpdmVzOyBpKyspIHtcbiAgICAgIHRoaXMucGxheWVyc1tpXS52b2x1bWUgPSB0aGlzLnZvbHVtZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5zdGFydFNvdW5kKDApLnRoZW4oXG4gICAgICAoKSA9PiB7XG4gICAgICAgIHRoaXMudHJpYWxOdW1iZXIgKz0gMTtcbiAgICAgICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSBcIldoaWNoIHNvdW5kIGhhcyB0aGUgdGFyZ2V0P1wiO1xuICAgICAgICB0aGlzLmVuYWJsZUFuc3dlciA9IGZhbHNlO1xuICAgICAgICB0aGlzLmFuc3dlcmVkID0gZmFsc2U7XG4gICAgICB9LFxuICAgICAgZXJyID0+IHRoaXMuc2hvd0Vycm9yKCdjb3VsZCBub3Qgc3RhcnQgc291bmQ6ICcgKyBlcnIpXG4gICAgKTtcbiAgfVxuXG4gIHN0YXJ0U291bmQocGxheWVyX2lkeCkge1xuICAgIGlmICh0aGlzLnBsYXllcnNbcGxheWVyX2lkeF0uaXNQbGF5aW5nKCkpIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiByZWplY3QoJ0FscmVhZHkgcGxheWluZycpKTtcbiAgICB9XG4gICAgdGhpcy5oaWdobGlnaHRlZEJ1dHRvbiA9IHBsYXllcl9pZHg7XG4gICAgcmV0dXJuIHRoaXMucGxheWVyc1twbGF5ZXJfaWR4XS5wbGF5KCk7XG4gIH1cblxuICBzb3VuZEVuZGVkKHBsYXllcl9pZHgpIHtcbiAgICB0aGlzLmhpZ2hsaWdodGVkQnV0dG9uID0gLTE7XG4gICAgaWYgKHBsYXllcl9pZHggPCB0aGlzLm5fYWx0ZXJuYXRpdmVzIC0gMSkge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiAge1xuICAgICAgICB0aGlzLnN0YXJ0U291bmQocGxheWVyX2lkeCsxKS5jYXRjaChlcnIgPT4gY29uc29sZS5sb2coZXJyKSk7XG4gICAgICB9LCB0aGlzLklTSV9tcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudHJpYWxFbmRlZCgpO1xuICAgIH1cbiAgfVxuXG4gIHRyaWFsRW5kZWQoKSB7XG4gICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSAnQ2xpY2sgb24gdGhlIHNvdW5kIHRoYXQgaGFkIHRoZSB0YXJnZXQnO1xuICAgIHRoaXMuZW5hYmxlQW5zd2VyID0gdHJ1ZTtcbiAgfVxuXG4gIHdyaXRlTG9nKG1lc3NhZ2U6IHN0cmluZykge1xuICAgIGNvbnNvbGUubG9nKCdMT0c6Jyk7XG4gICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICAgdGhpcy5leHBlcmltZW50TG9nVGV4dC5wdXNoKG1lc3NhZ2UpO1xuXG4gICAgbGV0IGZpbGVIYW5kbGUgPSBmcy5GaWxlLmZyb21QYXRoKHRoaXMubG9nRmlsZVBhdGgpO1xuICAgIGxldCBsb2dzdHJpbmcgPSAnJztcbiAgICBmb3IgKGxldCByb3cgb2YgdGhpcy5leHBlcmltZW50TG9nVGV4dCkge1xuICAgICAgbG9nc3RyaW5nID0gbG9nc3RyaW5nLmNvbmNhdChyb3cgKyAnXFxuJyk7XG4gICAgfVxuICAgIHJldHVybiBmaWxlSGFuZGxlLndyaXRlVGV4dChsb2dzdHJpbmcpLmNhdGNoKGVyciA9PiB7XG4gICAgICB0aGlzLnNob3dFcnJvcihlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gdm9sdW1lRG93bigpIHtcbiAgLy8gICBpZiAodGhpcy52b2x1bWUgPiAwLjEpIHtcbiAgLy8gICAgIHRoaXMudm9sdW1lIC09IDAuMTtcbiAgLy8gICB9XG4gIC8vICAgdGhpcy51cGRhdGVWb2x1bWVJY29uKCk7XG4gIC8vICAgdGhpcy5wbGF5ZXIudm9sdW1lID0gdGhpcy52b2x1bWU7XG4gIC8vIH1cbiAgLy9cbiAgLy8gdm9sdW1lVXAoKSB7XG4gIC8vICAgaWYgKHRoaXMudm9sdW1lIDw9IDAuOSkge1xuICAvLyAgICAgdGhpcy52b2x1bWUgKz0gMC4xO1xuICAvLyAgIH1cbiAgLy8gICB0aGlzLnVwZGF0ZVZvbHVtZUljb24oKTtcbiAgLy8gICB0aGlzLnBsYXllci52b2x1bWUgPSAgdGhpcy52b2x1bWU7XG4gIC8vIH1cblxuICAvLyB1cGRhdGVWb2x1bWVJY29uKCkge1xuICAvLyAgIGlmICh0aGlzLnZvbHVtZSA8PSAwLjIpIHtcbiAgLy8gICAgIHRoaXMudm9sdW1lSWNvbiA9ICd2b2x1bWUtbXV0ZSc7XG4gIC8vICAgfSBlbHNlIGlmICh0aGlzLnZvbHVtZSA8PSAwLjYpIHtcbiAgLy8gICAgIHRoaXMudm9sdW1lSWNvbiA9ICd2b2x1bWUtZG93bic7XG4gIC8vICAgfSBlbHNlIHtcbiAgLy8gICAgIHRoaXMudm9sdW1lSWNvbiA9ICd2b2x1bWUtdXAnO1xuICAvLyAgIH1cbiAgLy8gfVxuXG4gIHNob3dFcnJvcihlcnIpIHtcbiAgICByZXR1cm4gZGlhbG9ncy5hbGVydCh7XG4gICAgICB0aXRsZTogJ0Vycm9yJyxcbiAgICAgIG1lc3NhZ2U6IGVycixcbiAgICAgIG9rQnV0dG9uVGV4dDogJ0Nsb3NlJ1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgLy8gcGFzc1xuICAgIH0pO1xuICB9XG5cbiAgZmluaXNoRXhwZXJpbWVudCgpIHtcbiAgICBkaWFsb2dzLmFsZXJ0KHtcbiAgICAgIHRpdGxlOiAnRXhwZXJpbWVudCBjb21wbGV0ZWQnLFxuICAgICAgbWVzc2FnZTogJ1RoZSBleHBlcmltZW50IGlzIG5vdyBmaW5pc2hlZCwgdGhhbmsgeW91IGZvciBwYXJ0aWNpcGF0aW5nIScsXG4gICAgICBva0J1dHRvblRleHQ6ICdPSydcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuY3VycmVudEV4cGVyaW1lbnQuc3RhdHVzID0gRXhwZXJpbWVudFN0YXR1cy5GaW5pc2hlZDtcbiAgICAgIHJldHVybiB0aGlzLnJvdXRlckV4dGVuc2lvbnMubmF2aWdhdGUoWycvZXhwZXJpbWVudGxpc3QnXSwge2NsZWFySGlzdG9yeTogdHJ1ZX0pO1xuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICB0aGlzLnNob3dFcnJvcihlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgYWJvcnRFeHBlcmltZW50KCkge1xuICAgIGRpYWxvZ3MuY29uZmlybSh7XG4gICAgICB0aXRsZTogJ0Fib3J0IGV4cGVyaW1lbnQ/JyxcbiAgICAgIG1lc3NhZ2U6ICdUaGUgZXhwZXJpbWVudCBpcyBub3QgZmluaXNoZWQsIGFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBhYm9ydD8gWW91IGNhbm5vdCBjb250aW51ZSB0aGUgZXhwZXJpbWVudCBhZnRlciBxdWl0dGluZy4nLFxuICAgICAgb2tCdXR0b25UZXh0OiAnUXVpdCcsXG4gICAgICBjYW5jZWxCdXR0b25UZXh0OiAnU3RheSdcbiAgICB9KS50aGVuKGFucyA9PiB7XG4gICAgICBpZiAoYW5zKSB7XG4gICAgICAgIHRoaXMuY3VycmVudEV4cGVyaW1lbnQuc3RhdHVzID0gRXhwZXJpbWVudFN0YXR1cy5BYm9ydGVkO1xuICAgICAgICByZXR1cm4gdGhpcy53cml0ZUxvZygnQWJvcnRlZCB0cmlhbC5cXG4nICsgSlNPTi5zdHJpbmdpZnkodGhpcy5jdXJyZW50RXhwZXJpbWVudC5ncmlkLmdldEhpc3RvcnkoKSkpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB0aGlzLnJvdXRlckV4dGVuc2lvbnMubmF2aWdhdGUoWycvZXhwZXJpbWVudGxpc3QnXSwge2NsZWFySGlzdG9yeTogdHJ1ZX0pO1xuICAgICAgICB9KS5jYXRjaChlcnIgPT4gdGhpcy5zaG93RXJyb3IoZXJyKSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzaG93QWN0aW9uU2hlZXQoKSB7XG4gICAgZGlhbG9ncy5hY3Rpb24oe1xuICAgICAgdGl0bGU6ICdBY3Rpb25zJyxcbiAgICAgIG1lc3NhZ2U6ICdDaG9vc2UgYW4gYWN0aW9uJyxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHQ6ICdDYW5jZWwnLFxuICAgICAgYWN0aW9uczogWydTaG93IGdyaWQnLCAnVmVyaWZ5IGF1ZGlvJywgJ0Fib3J0IGV4cGVyaW1lbnQnXVxuICAgIH0pLnRoZW4oKHJlc3VsdDogc3RyaW5nKSA9PiB7XG4gICAgICBzd2l0Y2ggKHJlc3VsdCkge1xuICAgICAgICBjYXNlICdTaG93IGdyaWQnOiB7XG4gICAgICAgICAgdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFsnL2dyaWRwbG90JywgMF0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgJ1ZlcmlmeSBhdWRpbyc6IHtcbiAgICAgICAgICB0aGlzLnJvdXRlckV4dGVuc2lvbnMubmF2aWdhdGUoWycvdmVyaWZ5YXVkaW8nXSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSAnQWJvcnQgZXhwZXJpbWVudCc6IHtcbiAgICAgICAgICB0aGlzLmFib3J0RXhwZXJpbWVudCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6IHtcblxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxufVxuIl19