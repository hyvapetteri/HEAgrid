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
        var targ_key = "";
        if (this.freq == 1000) {
            targ_key = "spl_tone1k";
        }
        else if (this.freq == 2000) {
            targ_key = "spl_tone2k";
        }
        else if (this.freq == 4000) {
            targ_key = "spl_tone4k";
        }
        var targ_ref_level;
        if (appSettings.hasKey(targ_key)) {
            targ_ref_level = appSettings.getNumber(targ_key);
        }
        else {
            this.showError("Calibrate levels first!").then(function () {
                _this.routerExtensions.navigate(['calibration']);
            });
        }
        var min_level = targ_ref_level - 20;
        var grid_y_min = Math.min(min_level, tone_level_range);
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
        var constrainedgrid = basegrid.getGrid().getSubGridByValues({ xmin: 0, xmax: 0, ymin: ylim[0], ymax: ylim[1] });
        if (this.currentExperiment.type === session_1.ExperimentType.SingleRunWithGap) {
            constrainedgrid = basegrid.getGrid().getSubGridByValues({ xmin: 0.2, xmax: 0.2, ymin: ylim[0], ymax: ylim[1] });
        }
        var sparseconstrainedgrid = constrainedgrid.getDownsampledGrid(1, 2);
        grid.addPhase(new grid_1.BasicGridTracker({
            g: sparseconstrainedgrid,
            m_up: env.experiment.grid_mup,
            n_down: env.experiment.grid_ndown,
            n_revs: 4,
            n_step: 100
        }));
        grid.addPhase(new grid_1.BasicGridTracker({
            g: constrainedgrid,
            m_up: env.experiment.grid_mup,
            n_down: env.experiment.grid_ndown,
            n_revs: 6,
            n_step: 100
        }));
        if (this.currentExperiment.type === session_1.ExperimentType.Grid) {
            grid.addPhase(basegrid);
        }
        grid.initialize(0, ylim[0] + 40);
        //grid.initialize(0, -6);
        console.log('Grid initialized');
        this.currentExperiment.grid = grid;
        var appPath = fs.knownFolders.currentApp();
        this.audioPath = fs.path.join(appPath.path, env.audioPath);
        //this.audioPath = fs.knownFolders.documents().path;
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
                settingsPath: fs.knownFolders.documents().path,
                completeCallback: function (args) {
                    _this._ngZone.run(function () { return _this.soundEnded(i); });
                },
                compensate: true
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
            return _this.writeLog('BG ref level: ' + bg_ref_level + ', target ref level: ' + targ_ref_level + ', target threshold: ' + util.a2db(_this.currentExperiment.toneThreshold) + ', masker threshold: ' + util.a2db(_this.currentExperiment.noiseThreshold));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwZXJpbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImV4cGVyaW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBa0Q7QUFDbEQsZ0NBQStCO0FBRS9CLHFEQUF1RDtBQUN2RCxpREFBbUQ7QUFDbkQsZ0RBQW9EO0FBQ3BELG1FQUFxRTtBQUVyRSx3REFBNkc7QUFDN0csOERBQTZEO0FBQzdELHNEQUErRDtBQUUvRCw4Q0FBZ0Q7QUFDaEQseUNBQTJDO0FBRTNDLCtDQUFzSTtBQUN0SSw0RUFBeUc7QUFVekc7SUFrQ0Usd0JBQW9CLGVBQWdDLEVBQ2hDLGdCQUFrQyxFQUNsQyxPQUFlLEVBQ2YsSUFBVTtRQUg5QixpQkE2TUM7UUE3TW1CLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtRQUNoQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1FBQ2xDLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFDZixTQUFJLEdBQUosSUFBSSxDQUFNO1FBTnRCLHNCQUFpQixHQUFrQixFQUFFLENBQUM7UUFRNUMsdUJBQXVCO1FBQ3ZCLElBQUksQ0FBQyxjQUFjLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUM7UUFDcEQsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7UUFDdEIsSUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7UUFDMUIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUM7UUFDNUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDN0MsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUM7WUFDekIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUNELElBQUksQ0FBQyxXQUFX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QUF2Z0JZLHdDQUFjIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBOZ1pvbmUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tIFwidWkvcGFnZVwiO1xuaW1wb3J0IHsgRXZlbnREYXRhIH0gZnJvbSBcImRhdGEvb2JzZXJ2YWJsZVwiO1xuaW1wb3J0ICogYXMgZGlhbG9ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9kaWFsb2dzXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9maWxlLXN5c3RlbVwiO1xuaW1wb3J0IHsgc2V0VGltZW91dCB9IGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3RpbWVyXCI7XG5pbXBvcnQgKiBhcyBhcHBTZXR0aW5ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9hcHBsaWNhdGlvbi1zZXR0aW5nc1wiO1xuXG5pbXBvcnQgeyBTZXNzaW9uUHJvdmlkZXIsIEV4cGVyaW1lbnQsIEV4cGVyaW1lbnRTdGF0dXMsIEV4cGVyaW1lbnRUeXBlIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3Nlc3Npb24vc2Vzc2lvbic7XG5pbXBvcnQgeyBWb2x1bWVPYnNlcnZlciB9IGZyb20gXCIuLi8uLi9zaGFyZWQvdm9sdW1lb2JzZXJ2ZXJcIjtcbmltcG9ydCB7IFJvdXRlckV4dGVuc2lvbnMgfSBmcm9tICduYXRpdmVzY3JpcHQtYW5ndWxhci9yb3V0ZXInO1xuXG5pbXBvcnQgKiBhcyBlbnYgZnJvbSAnLi4vLi4vY29uZmlnL2Vudmlyb25tZW50JztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAnLi4vLi4vc2hhcmVkL3V0aWxzJztcbmltcG9ydCB7IHNvdW5kX2NvbmZpZyB9IGZyb20gJy4vZXhwZXJpbWVudC1jb25maWcnO1xuaW1wb3J0IHsgUGhhc2VkR3JpZFRyYWNrZXIsIEJhc2ljR3JpZFRyYWNrZXIsIFBhcmFtR3JpZCwgR3JpZFRyYWNrZXIsIFRyaWFsQW5zd2VyLCBHcmlkVHJhY2tpbmdTdGF0dXMgfSBmcm9tICcuLi8uLi9zaGFyZWQvZ3JpZC9ncmlkJztcbmltcG9ydCB7IEdyaWRQbGF5ZXIsIEdyaWRQbGF5ZXJPcHRpb25zLCBDaGFubmVsT3B0aW9ucyB9IGZyb20gJy4uLy4uL3NoYXJlZC9ncmlkLXBsYXllci9ncmlkLXBsYXllci1pb3MnO1xuXG5kZWNsYXJlIHZhciBOU1VSTDtcblxuQENvbXBvbmVudCh7XG4gIG1vZHVsZUlkOiBtb2R1bGUuaWQsXG4gIHNlbGVjdG9yOiAncGFnZS1leHBlcmltZW50JyxcbiAgdGVtcGxhdGVVcmw6ICcuL2V4cGVyaW1lbnQuaHRtbCcsXG4gIHN0eWxlVXJsczogWycuL2V4cGVyaW1lbnQuY3NzJ11cbn0pXG5leHBvcnQgY2xhc3MgRXhwZXJpbWVudFBhZ2Uge1xuXG4gIHByaXZhdGUgbWFzdGVyVm9sdW1lT2JzZXJ2ZXI6IFZvbHVtZU9ic2VydmVyO1xuICBwcml2YXRlIHZvbHVtZTogbnVtYmVyO1xuICBwcml2YXRlIHRyaWFsTnVtYmVyOiBudW1iZXI7XG4gIHByaXZhdGUgdWlkOiBzdHJpbmc7XG4gIHByaXZhdGUgYXVkaW9QYXRoOiBzdHJpbmc7XG4gIHByaXZhdGUgdm9sdW1lSWNvbjogc3RyaW5nO1xuICBwcml2YXRlIG5fYWx0ZXJuYXRpdmVzOiBudW1iZXI7XG4gIHByaXZhdGUgYWx0ZXJuYXRpdmVfaWRzOiBBcnJheTxudW1iZXI+O1xuICBwcml2YXRlIGFsdGVybmF0aXZlX2xhYmVsczogc3RyaW5nO1xuICAvL3ByaXZhdGUgcGxheWVyczogQXJyYXk8VE5TUGxheWVyPjtcbiAgcHJpdmF0ZSBwbGF5ZXJzOiBBcnJheTxHcmlkUGxheWVyPjtcbiAgcHJpdmF0ZSB0cmlhbFRpbWVvdXQ6IGFueTtcblxuICBwcml2YXRlIElTSV9tczogbnVtYmVyO1xuICBwcml2YXRlIGZyZXE6IG51bWJlcjtcblxuICBwcml2YXRlIHNvdW5kX2lkOiBzdHJpbmc7XG4gIHByaXZhdGUgaXNDb3JyZWN0OiBib29sZWFuO1xuICBwcml2YXRlIHRhcmdldF9pZHg6IG51bWJlcjtcblxuICBwcml2YXRlIHBsYXlCdXR0b25UZXh0OiBzdHJpbmc7XG4gIHByaXZhdGUgaW5zdHJ1Y3Rpb25UZXh0OiBzdHJpbmc7XG4gIHByaXZhdGUgaGlnaGxpZ2h0ZWRCdXR0b246IG51bWJlcjtcbiAgcHJpdmF0ZSBlbmFibGVBbnN3ZXI6IGJvb2xlYW47XG4gIHByaXZhdGUgYW5zd2VyZWQ6IGJvb2xlYW47XG4gIHByaXZhdGUgZ3JpZF9jb2xkZWY6IHN0cmluZztcbiAgcHJpdmF0ZSBydW5uaW5nOiBib29sZWFuO1xuXG4gIHByaXZhdGUgbG9nRmlsZVBhdGg6IHN0cmluZztcbiAgcHJpdmF0ZSBleHBlcmltZW50TG9nVGV4dDogQXJyYXk8c3RyaW5nPiA9IFtdO1xuICBwcml2YXRlIGN1cnJlbnRFeHBlcmltZW50OiBFeHBlcmltZW50O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgc2Vzc2lvblByb3ZpZGVyOiBTZXNzaW9uUHJvdmlkZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgcm91dGVyRXh0ZW5zaW9uczogUm91dGVyRXh0ZW5zaW9ucyxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgICAgICAgICAgIHByaXZhdGUgcGFnZTogUGFnZSkge1xuXG4gICAgLy8gMkFGQyAtLT4gdHdvIHBsYXllcnNcbiAgICB0aGlzLm5fYWx0ZXJuYXRpdmVzID0gZW52LmV4cGVyaW1lbnQubl9hbHRlcm5hdGl2ZXM7XG4gICAgdGhpcy5ncmlkX2NvbGRlZiA9IFwiXCI7XG4gICAgdGhpcy5hbHRlcm5hdGl2ZV9pZHMgPSBbXTtcbiAgICB0aGlzLmFsdGVybmF0aXZlX2xhYmVscyA9IGVudi5leHBlcmltZW50LmFsdGVybmF0aXZlX2xhYmVscztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubl9hbHRlcm5hdGl2ZXM7IGkrKykge1xuICAgICAgdGhpcy5ncmlkX2NvbGRlZiArPSBcIiosXCI7XG4gICAgICB0aGlzLmFsdGVybmF0aXZlX2lkcy5wdXNoKGkpO1xuICAgIH1cbiAgICB0aGlzLmdyaWRfY29sZGVmID0gdGhpcy5ncmlkX2NvbGRlZi5zbGljZSgwLC0xKTtcbiAgICBjb25zb2xlLmxvZyhcIkdyaWQgY29sZGVmOiBcIiArIHRoaXMuZ3JpZF9jb2xkZWYpO1xuXG4gICAgdGhpcy5jdXJyZW50RXhwZXJpbWVudCA9IHNlc3Npb25Qcm92aWRlci5nZXRDdXJyZW50RXhwZXJpbWVudCgpO1xuICAgIHRoaXMuY3VycmVudEV4cGVyaW1lbnQuc3RhdHVzID0gRXhwZXJpbWVudFN0YXR1cy5TdGFydGVkO1xuICAgIHRoaXMuZnJlcSA9IHRoaXMuY3VycmVudEV4cGVyaW1lbnQudGVzdEZyZXF1ZW5jeTtcblxuICAgIHRoaXMudm9sdW1lID0gMTtcbiAgICBjb25zb2xlLmxvZygnVm9sdW1lOiAnICsgdGhpcy52b2x1bWUpO1xuICAgIGxldCB0b25lX2xldmVsX3JhbmdlID0gdXRpbC5hMmRiKHRoaXMudm9sdW1lKSAtIHV0aWwuYTJkYih0aGlzLmN1cnJlbnRFeHBlcmltZW50LnRvbmVUaHJlc2hvbGQpO1xuICAgIHRvbmVfbGV2ZWxfcmFuZ2UgPSBNYXRoLmZsb29yKHRvbmVfbGV2ZWxfcmFuZ2UpO1xuICAgIGNvbnNvbGUubG9nKCdUb25lIGxldmVsIHJhbmdlOiAnICsgdG9uZV9sZXZlbF9yYW5nZSk7XG5cbiAgICAvLyBsZXQgcGFyYW1ldGVyX2dyaWQgPSBuZXcgUGFyYW1HcmlkKHtcbiAgICAvLyAgIHhtaW46IDEsXG4gICAgLy8gICB4bWF4OiAxOCxcbiAgICAvLyAgIHhyZXM6IDEsXG4gICAgLy8gICB5bWluOiAyNiAtIG1pbmltdW1faW5kZXgsXG4gICAgLy8gICB5bWF4OiAyNixcbiAgICAvLyAgIHlyZXM6IDFcbiAgICAvLyB9KTtcblxuICAgIGxldCB0YXJnX2tleSA9IFwiXCI7XG4gICAgaWYgKHRoaXMuZnJlcSA9PSAxMDAwKSB7XG4gICAgICB0YXJnX2tleSA9IFwic3BsX3RvbmUxa1wiO1xuICAgIH0gZWxzZSBpZiAodGhpcy5mcmVxID09IDIwMDApIHtcbiAgICAgIHRhcmdfa2V5ID0gXCJzcGxfdG9uZTJrXCI7XG4gICAgfSBlbHNlIGlmICh0aGlzLmZyZXEgPT0gNDAwMCkge1xuICAgICAgdGFyZ19rZXkgPSBcInNwbF90b25lNGtcIjtcbiAgICB9XG5cbiAgICBsZXQgdGFyZ19yZWZfbGV2ZWw7XG4gICAgaWYgKGFwcFNldHRpbmdzLmhhc0tleSh0YXJnX2tleSkpIHtcbiAgICAgIHRhcmdfcmVmX2xldmVsID0gYXBwU2V0dGluZ3MuZ2V0TnVtYmVyKHRhcmdfa2V5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zaG93RXJyb3IoXCJDYWxpYnJhdGUgbGV2ZWxzIGZpcnN0IVwiKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFsnY2FsaWJyYXRpb24nXSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBsZXQgbWluX2xldmVsID0gdGFyZ19yZWZfbGV2ZWwgLSAyMDtcbiAgICBsZXQgZ3JpZF95X21pbiA9IE1hdGgubWluKG1pbl9sZXZlbCwgdG9uZV9sZXZlbF9yYW5nZSlcblxuICAgIGxldCBwYXJhbWV0ZXJfZ3JpZCA9IG5ldyBQYXJhbUdyaWQoe1xuICAgICAgeG1pbjogMCxcbiAgICAgIHhtYXg6IGVudi5tYXhHYXAsXG4gICAgICB4cmVzOiAwLjA1LFxuICAgICAgeW1pbjogZW52Lm1heFRhcmdldExldmVsX2RCIC0gdG9uZV9sZXZlbF9yYW5nZSxcbiAgICAgIHltYXg6IGVudi5tYXhUYXJnZXRMZXZlbF9kQixcbiAgICAgIHlyZXM6IDNcbiAgICB9KTtcblxuICAgIGNvbnNvbGUubG9nKCdHcmlkOicpO1xuICAgIGNvbnNvbGUubG9nKHBhcmFtZXRlcl9ncmlkLnByaW50R3JpZCgpKTtcblxuICAgIGxldCBiYXNlZ3JpZCA9IG5ldyBCYXNpY0dyaWRUcmFja2VyKHtcbiAgICAgIGc6IHBhcmFtZXRlcl9ncmlkLFxuICAgICAgbV91cDogZW52LmV4cGVyaW1lbnQuZ3JpZF9tdXAsXG4gICAgICBuX2Rvd246IGVudi5leHBlcmltZW50LmdyaWRfbmRvd24sXG4gICAgICBuX3JldnM6IGVudi5leHBlcmltZW50LmdyaWRfbnJldnMsXG4gICAgICBuX3N0ZXA6IGVudi5leHBlcmltZW50LmdyaWRfbnN0ZXBcbiAgICB9KTtcblxuICAgIGxldCBncmlkID0gbmV3IFBoYXNlZEdyaWRUcmFja2VyKCk7XG4gICAgbGV0IHlsaW0gPSBiYXNlZ3JpZC5nZXRHcmlkKCkuZ2V0WWxpbSgpO1xuXG4gICAgbGV0IGNvbnN0cmFpbmVkZ3JpZCA9IGJhc2VncmlkLmdldEdyaWQoKS5nZXRTdWJHcmlkQnlWYWx1ZXMoe3htaW46MCwgeG1heDowLCB5bWluOnlsaW1bMF0sIHltYXg6eWxpbVsxXX0pO1xuICAgIGlmICh0aGlzLmN1cnJlbnRFeHBlcmltZW50LnR5cGUgPT09IEV4cGVyaW1lbnRUeXBlLlNpbmdsZVJ1bldpdGhHYXApIHtcbiAgICAgIGNvbnN0cmFpbmVkZ3JpZCA9IGJhc2VncmlkLmdldEdyaWQoKS5nZXRTdWJHcmlkQnlWYWx1ZXMoe3htaW46IDAuMiwgeG1heDogMC4yLCB5bWluOnlsaW1bMF0sIHltYXg6eWxpbVsxXX0pO1xuICAgIH1cbiAgICBsZXQgc3BhcnNlY29uc3RyYWluZWRncmlkID0gY29uc3RyYWluZWRncmlkLmdldERvd25zYW1wbGVkR3JpZCgxLDIpO1xuXG4gICAgZ3JpZC5hZGRQaGFzZShuZXcgQmFzaWNHcmlkVHJhY2tlcih7XG4gICAgICBnOiBzcGFyc2Vjb25zdHJhaW5lZGdyaWQsXG4gICAgICBtX3VwOiBlbnYuZXhwZXJpbWVudC5ncmlkX211cCxcbiAgICAgIG5fZG93bjogZW52LmV4cGVyaW1lbnQuZ3JpZF9uZG93bixcbiAgICAgIG5fcmV2czogNCxcbiAgICAgIG5fc3RlcDogMTAwXG4gICAgfSkpO1xuXG4gICAgZ3JpZC5hZGRQaGFzZShuZXcgQmFzaWNHcmlkVHJhY2tlcih7XG4gICAgICBnOiBjb25zdHJhaW5lZGdyaWQsXG4gICAgICBtX3VwOiBlbnYuZXhwZXJpbWVudC5ncmlkX211cCxcbiAgICAgIG5fZG93bjogZW52LmV4cGVyaW1lbnQuZ3JpZF9uZG93bixcbiAgICAgIG5fcmV2czogNixcbiAgICAgIG5fc3RlcDogMTAwXG4gICAgfSkpO1xuXG4gICAgaWYgKHRoaXMuY3VycmVudEV4cGVyaW1lbnQudHlwZSA9PT0gRXhwZXJpbWVudFR5cGUuR3JpZCkge1xuICAgICAgZ3JpZC5hZGRQaGFzZShiYXNlZ3JpZCk7XG4gICAgfVxuXG4gICAgZ3JpZC5pbml0aWFsaXplKDAsIHlsaW1bMF0gKyA0MCk7XG4gICAgLy9ncmlkLmluaXRpYWxpemUoMCwgLTYpO1xuICAgIGNvbnNvbGUubG9nKCdHcmlkIGluaXRpYWxpemVkJyk7XG4gICAgdGhpcy5jdXJyZW50RXhwZXJpbWVudC5ncmlkID0gZ3JpZDtcblxuICAgIGxldCBhcHBQYXRoID0gZnMua25vd25Gb2xkZXJzLmN1cnJlbnRBcHAoKTtcbiAgICB0aGlzLmF1ZGlvUGF0aCA9IGZzLnBhdGguam9pbihhcHBQYXRoLnBhdGgsIGVudi5hdWRpb1BhdGgpO1xuICAgIC8vdGhpcy5hdWRpb1BhdGggPSBmcy5rbm93bkZvbGRlcnMuZG9jdW1lbnRzKCkucGF0aDtcbiAgICBjb25zb2xlLmxvZyh0aGlzLmF1ZGlvUGF0aCk7XG5cbiAgICB0aGlzLklTSV9tcyA9IGVudi5leHBlcmltZW50LmludGVyc3RpbXVsdXNJbnRlcnZhbF9tcztcbiAgICB0aGlzLnRyaWFsTnVtYmVyID0gMDtcblxuICAgIGxldCBiZ19yZWZfbGV2ZWw7XG4gICAgaWYgKGFwcFNldHRpbmdzLmhhc0tleShcInNwbF9iYWNrZ3JvdW5kXCIpKSB7XG4gICAgICBiZ19yZWZfbGV2ZWwgPSBhcHBTZXR0aW5ncy5nZXROdW1iZXIoXCJzcGxfYmFja2dyb3VuZFwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zaG93RXJyb3IoXCJDYWxpYnJhdGUgbGV2ZWxzIGZpcnN0IVwiKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFsnY2FsaWJyYXRpb24nXSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLnBsYXllcnMgPSBbXTtcbiAgICBsZXQgcHJvbWlzZXMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubl9hbHRlcm5hdGl2ZXM7IGkrKykge1xuICAgICAgdGhpcy5wbGF5ZXJzLnB1c2gobmV3IEdyaWRQbGF5ZXIoKSk7XG4gICAgICBsZXQgcGxheWVyT3B0aW9uczpHcmlkUGxheWVyT3B0aW9ucyA9IHtcbiAgICAgICAgdGFyZ2V0RnJlcXVlbmN5OiB0aGlzLmN1cnJlbnRFeHBlcmltZW50LnRlc3RGcmVxdWVuY3ksXG4gICAgICAgIGxvb3A6IGZhbHNlLFxuICAgICAgICBwYWRkZWRTaWxlbmNlRHVyYXRpb246IDAsXG4gICAgICAgIHRhcmdldER1cmF0aW9uOiBlbnYuZXhwZXJpbWVudC50YXJnZXREdXJhdGlvbl9zLFxuICAgICAgICBtYXNrZXJEdXJhdGlvbjogZW52LmV4cGVyaW1lbnQubWFza2VyRHVyYXRpb25fcyxcbiAgICAgICAgLy9tYXNrZXJMZXZlbDogdXRpbC5hMmRiKHRoaXMuY3VycmVudEV4cGVyaW1lbnQubm9pc2VUaHJlc2hvbGQpICsgZW52Lm1hc2tlckxldmVsX2RCLFxuICAgICAgICBtYXNrZXJMZXZlbDogZW52Lm1hc2tlckxldmVsX2RCIC0gYmdfcmVmX2xldmVsLFxuICAgICAgICBjaGFubmVsT3B0aW9uczogQ2hhbm5lbE9wdGlvbnMuRGlvdGljLFxuICAgICAgICBzZXR0aW5nc1BhdGg6IGZzLmtub3duRm9sZGVycy5kb2N1bWVudHMoKS5wYXRoLFxuICAgICAgICBjb21wbGV0ZUNhbGxiYWNrOiBhcmdzID0+IHtcbiAgICAgICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHRoaXMuc291bmRFbmRlZChpKSk7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbXBlbnNhdGU6IHRydWVcbiAgICAgIH07XG4gICAgICBwcm9taXNlcy5wdXNoKHRoaXMucGxheWVyc1tpXS5pbml0aWFsaXplKHBsYXllck9wdGlvbnMpKTtcbiAgICB9XG5cbiAgICBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5sb2FkU291bmRzKCk7XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnU291bmRzIGxvYWRlZCcpO1xuICAgICAgLy8gZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5fYWx0ZXJuYXRpdmVzOyBpKyspIHtcbiAgICAgIC8vICAgdGhpcy5wbGF5ZXJzW2ldLmdldEF1ZGlvVHJhY2tEdXJhdGlvbigpLnRoZW4oZHVyID0+IHtcbiAgICAgIC8vICAgICBjb25zb2xlLmxvZygnUGxheWVyICcgKyBpICsgJywgdHJhY2sgZHVyYXRpb24gJyArIGR1cik7XG4gICAgICAvLyAgIH0pO1xuICAgICAgLy8gfVxuXG4gICAgICB0aGlzLnBsYXlCdXR0b25UZXh0ID0gXCJQbGF5XCI7XG4gICAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9IFwiUHJlc3MgcGxheSBidXR0b24gdG8gaGVhciB0aGUgc291bmQuXCI7XG4gICAgICB0aGlzLmhpZ2hsaWdodGVkQnV0dG9uID0gLTE7XG5cbiAgICAgIHRoaXMuZW5hYmxlQW5zd2VyID0gZmFsc2U7XG4gICAgICB0aGlzLmFuc3dlcmVkID0gZmFsc2U7XG5cbiAgICAgIHRoaXMudWlkID0gc2Vzc2lvblByb3ZpZGVyLnVzZXJuYW1lO1xuXG4gICAgICBsZXQgZG9jc1BhdGggPSBmcy5rbm93bkZvbGRlcnMuZG9jdW1lbnRzKCkucGF0aDtcbiAgICAgIGxldCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgbGV0IGxvZ2ZpbGUgPSBlbnYuZW52aXJvbm1lbnQuZXhwZXJpbWVudEZpbGVQcmVmaXggKyB0aGlzLnVpZCArICctJyArIG5vdy5nZXRIb3VycygpICsgJy0nICsgbm93LmdldE1pbnV0ZXMoKSArICcuJyArIG5vdy5nZXRNaWxsaXNlY29uZHMoKSArICctJyArIG5vdy5nZXREYXRlKCkgKyAnLScgKyAobm93LmdldE1vbnRoKCkrMSkgKyAnLScgKyBub3cuZ2V0RnVsbFllYXIoKSArICcubG9nJztcbiAgICAgIHRoaXMubG9nRmlsZVBhdGggPSBmcy5wYXRoLmpvaW4oZG9jc1BhdGgsIGxvZ2ZpbGUpO1xuICAgICAgY29uc29sZS5sb2coJ0xvZ2dpbmcgdG8gJyArIGxvZ2ZpbGUpO1xuICAgICAgcmV0dXJuIHRoaXMud3JpdGVMb2coJ0V4cGVyaW1lbnQgc3RhcnRlZCwgc3ViamVjdCAnICsgdGhpcy51aWQgKyAnLCB2b2wgJyArIHRoaXMudm9sdW1lICsgJywgZnJlcSAnICsgdGhpcy5mcmVxKTtcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLndyaXRlTG9nKCdCRyByZWYgbGV2ZWw6ICcgKyBiZ19yZWZfbGV2ZWwgKyAnLCB0YXJnZXQgcmVmIGxldmVsOiAnICsgdGFyZ19yZWZfbGV2ZWwgKyAnLCB0YXJnZXQgdGhyZXNob2xkOiAnICsgdXRpbC5hMmRiKHRoaXMuY3VycmVudEV4cGVyaW1lbnQudG9uZVRocmVzaG9sZCkgKyAnLCBtYXNrZXIgdGhyZXNob2xkOiAnICsgdXRpbC5hMmRiKHRoaXMuY3VycmVudEV4cGVyaW1lbnQubm9pc2VUaHJlc2hvbGQpKTtcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLndyaXRlTG9nKCd0cmlhbDsgZ2FwOyBsZXZlbDsgYW5zd2VyOyBjb3JyZWN0Jyk7XG4gICAgfSkuY2F0Y2goZXJyID0+IHRoaXMuc2hvd0Vycm9yKGVycikpO1xuXG4gICAgdGhpcy5wYWdlLm9uKFwibmF2aWdhdGVkVG9cIiwgKGRhdGE6IEV2ZW50RGF0YSkgPT4ge1xuICAgICAgY29uc29sZS5sb2coXCJhZGRpbmcgdm9sdW1lIG9ic2VydmVyXCIpO1xuICAgICAgbGV0IGF1ZGlvU2Vzc2lvbiA9IEFWQXVkaW9TZXNzaW9uLnNoYXJlZEluc3RhbmNlKCk7XG4gICAgICB0aGlzLm1hc3RlclZvbHVtZU9ic2VydmVyID0gbmV3IFZvbHVtZU9ic2VydmVyKCk7XG4gICAgICB0aGlzLm1hc3RlclZvbHVtZU9ic2VydmVyLnNldENhbGxiYWNrKChvYmopID0+IHtcbiAgICAgICAgZGlhbG9ncy5hbGVydCh7XG4gICAgICAgICAgdGl0bGU6IFwiVm9sdW1lIGNoYW5nZWQhXCIsXG4gICAgICAgICAgbWVzc2FnZTogXCJBIHZvbHVtZSBidXR0b24gcHJlc3Mgd2FzIG9ic2VydmVkLiBUaGUgY3VycmVudCBleHBlcmltZW50IHdpbGwgYmUgY2FuY2VsbGVkIGFuZCB5b3Ugd2lsbCBub3cgcmV0dXJuIHRvIHRoZSB2b2x1bWUgc2V0dGluZyBzY3JlZW4uXCIsXG4gICAgICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCJcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgdGhpcy5jdXJyZW50RXhwZXJpbWVudC5zdGF0dXMgPSBFeHBlcmltZW50U3RhdHVzLkFib3J0ZWQ7XG4gICAgICAgICAgcmV0dXJuIHRoaXMud3JpdGVMb2coJ1ZvbHVtZSBjaGFuZ2VkLCBhYm9ydGVkIHRyaWFsLlxcbicgKyBKU09OLnN0cmluZ2lmeSh0aGlzLmN1cnJlbnRFeHBlcmltZW50LmdyaWQuZ2V0SGlzdG9yeSgpKSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFsnL3ZvbHVtZSddLCB7Y2xlYXJIaXN0b3J5OiB0cnVlfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pLmNhdGNoKGVyciA9PiBjb25zb2xlLmxvZyhlcnIpKTtcbiAgICAgIH0pO1xuICAgICAgYXVkaW9TZXNzaW9uLmFkZE9ic2VydmVyRm9yS2V5UGF0aE9wdGlvbnNDb250ZXh0KHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIsIFwib3V0cHV0Vm9sdW1lXCIsIE5TS2V5VmFsdWVPYnNlcnZpbmdPcHRpb25zLk5ldywgbnVsbCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnBhZ2Uub24oXCJuYXZpZ2F0aW5nRnJvbVwiLCAoZGF0YTogRXZlbnREYXRhKSA9PiB7XG4gICAgICBsZXQgYXVkaW9TZXNzaW9uID0gQVZBdWRpb1Nlc3Npb24uc2hhcmVkSW5zdGFuY2UoKTtcbiAgICAgIGF1ZGlvU2Vzc2lvbi5yZW1vdmVPYnNlcnZlckZvcktleVBhdGgodGhpcy5tYXN0ZXJWb2x1bWVPYnNlcnZlciwgXCJvdXRwdXRWb2x1bWVcIik7XG4gICAgfSk7XG5cbiAgfVxuXG4gIGV2YWx1YXRlQW5zd2VyKGFuc3dlcikge1xuICAgIHRoaXMuZW5hYmxlQW5zd2VyID0gZmFsc2U7XG4gICAgdGhpcy5hbnN3ZXJlZCA9IHRydWU7XG5cbiAgICB0aGlzLmlzQ29ycmVjdCA9IChhbnN3ZXIgPT0gdGhpcy50YXJnZXRfaWR4KTtcbiAgICBpZiAodGhpcy5pc0NvcnJlY3QpIHtcbiAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gJ0NvcnJlY3QnO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9ICdXcm9uZyc7XG4gICAgfVxuXG4gICAgbGV0IFt4LCB5XSA9IHRoaXMuY3VycmVudEV4cGVyaW1lbnQuZ3JpZC5nZXRDdXJyZW50R3JpZFBhcmFtZXRlcnMoKTtcbiAgICByZXR1cm4gdGhpcy53cml0ZUxvZygnJyArIHRoaXMudHJpYWxOdW1iZXIgKyAnOycgKyB4ICsgJzsnICsgeSArICc7JyArIGFuc3dlciArICc7JyArIHRoaXMuaXNDb3JyZWN0KS50aGVuKCgpID0+IHtcbiAgICAgIGxldCBhbnMgPSB0aGlzLmlzQ29ycmVjdCA/IFRyaWFsQW5zd2VyLkNvcnJlY3QgOiBUcmlhbEFuc3dlci5Xcm9uZztcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuY3VycmVudEV4cGVyaW1lbnQuZ3JpZC51cGRhdGVQb3NpdGlvbihhbnMpOyAvLyBtaWdodCB0aHJvdyBlcnJvciBpZiBzb21ldGhpbmcgZ29lcyB3cm9uZywgY2F0Y2hlZCBsYXRlclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRXJyb3IgdXBkYXRpbmcgcG9zaXRpb246IFwiICsgZXJyKTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRoaXMuY3VycmVudEV4cGVyaW1lbnQuZ3JpZC5nZXRTdGF0dXMoKSkpO1xuICAgICAgLy9jb25zb2xlLmxvZygnbmV3IHBvc2l0aW9uICcgKyB4ICsgJywgJyArIHkpO1xuXG4gICAgICBpZiAodGhpcy5jdXJyZW50RXhwZXJpbWVudC5ncmlkLmdldFN0YXR1cygpLmZpbmlzaGVkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRmluaXNoZWRcIik7XG4gICAgICAgIHJldHVybiB0aGlzLndyaXRlTG9nKEpTT04uc3RyaW5naWZ5KHRoaXMuY3VycmVudEV4cGVyaW1lbnQuZ3JpZC5nZXRIaXN0b3J5KCkpKS50aGVuKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaEV4cGVyaW1lbnQoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmxvYWRTb3VuZHMoKS50aGVuKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMucnVubmluZykge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hbnN3ZXJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSBcIlByZXBhcmUgZm9yIG5leHQgc291bmQhXCJcbiAgICAgICAgICB9LCBNYXRoLnJvdW5kKGVudi5leHBlcmltZW50LmludGVydHJpYWxJbnRlcnZhbF9tcy8yKSk7XG4gICAgICAgICAgdGhpcy50cmlhbFRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMucGxheVRyaWFsKCksIGVudi5leHBlcmltZW50LmludGVydHJpYWxJbnRlcnZhbF9tcyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKGVyciA9PiB0aGlzLnNob3dFcnJvcihlcnIpKTtcbiAgfVxuXG4gIGxvYWRTb3VuZHMoKSB7XG4gICAgLy9jb25zb2xlLmxvZygnTG9hZGluZyBzb3VuZHMnKTtcbiAgICBsZXQgcHJvbWlzZXMgPSBbXTtcbiAgICB0aGlzLnRhcmdldF9pZHggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiB0aGlzLm5fYWx0ZXJuYXRpdmVzKTtcbiAgICAvL2NvbnNvbGUubG9nKCdUYXJnZXQgaXMgYXQgJyArIHRoaXMudGFyZ2V0X2lkeCk7XG4gICAgbGV0IFttYXNrX2ksIHRhcmdfaV0gPSB0aGlzLmN1cnJlbnRFeHBlcmltZW50LmdyaWQuZ2V0Q3VycmVudEdyaWRQYXJhbWV0ZXJzKCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubl9hbHRlcm5hdGl2ZXM7IGkrKykge1xuXG4gICAgICBwcm9taXNlcy5wdXNoKHRoaXMucGxheWVyc1tpXS5wcmVsb2FkU3RpbXVsdXMobWFza19pLCB0YXJnX2ksIChpID09IHRoaXMudGFyZ2V0X2lkeCksIHRydWUpLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBpbml0aWFsaXppbmcgcGxheWVyICcgKyBpICsgJyAoaXMgdGFyZ2V0PyAnICsgKHRoaXMudGFyZ2V0X2lkeCA9PSBpKSArICcpICcrIGVyci5leHRyYSk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSxyZWplY3QpID0+IHJlamVjdChlcnIuZXh0cmEpKTtcbiAgICAgIH0pKTtcbiAgICB9XG5cblxuICAgICAgLy8gbGV0IHN0aW1faWQgPSAnJztcbiAgICAgIC8vIGlmIChpID09IHRoaXMudGFyZ2V0X2lkeCkge1xuICAgICAgLy8gICBzdGltX2lkID0gJ2YnICsgdGhpcy5mcmVxICsgJ19sZXZlbCcgKyB0YXJnX2kgKyAnX2dhcCcgKyBtYXNrX2kgKyAnLndhdic7XG4gICAgICAvLyAgIHRoaXMuc291bmRfaWQgPSBzdGltX2lkO1xuICAgICAgLy8gfSBlbHNlIHtcbiAgICAgIC8vICAgc3RpbV9pZCA9ICdmJyArIHRoaXMuZnJlcSArICdfZ2FwJyArIG1hc2tfaSArICcud2F2JztcbiAgICAgIC8vIH1cbiAgICAgIC8vIGxldCBzb3VuZHBhdGggPSBmcy5wYXRoLmpvaW4odGhpcy5hdWRpb1BhdGgsIHN0aW1faWQpO1xuICAgICAgLy8gaWYgKCFmcy5GaWxlLmV4aXN0cyhzb3VuZHBhdGgpKSB7XG4gICAgICAvLyAgIHByb21pc2VzLnB1c2gobmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4gcmVqZWN0KCdTb3VuZCBmaWxlICcgKyBzdGltX2lkICsgJyBkb2VzIG5vdCBleGlzdCEnKSkpO1xuICAgICAgLy8gfSBlbHNlIHtcbiAgICAgIC8vICAgcHJvbWlzZXMucHVzaCh0aGlzLnBsYXllcnNbaV0uaW5pdEZyb21GaWxlKHtcbiAgICAgIC8vICAgICBhdWRpb0ZpbGU6IHNvdW5kcGF0aCxcbiAgICAgIC8vICAgICBsb29wOiBmYWxzZSxcbiAgICAgIC8vICAgICBjb21wbGV0ZUNhbGxiYWNrOiBhcmdzID0+IHtcbiAgICAgIC8vICAgICAgIC8vIG5vdGU6IHBhc3NpbmcgdGhlIGN1cnJlbnQgdmFsdWUgb2YgbG9vcCB2YXJpYWJsZSBpIHRvIHRoZSBjYWxsYmFjayBpcyBvbmx5XG4gICAgICAvLyAgICAgICAvLyBwb3NzaWJsZSB3aGVuIHVzaW5nICdsZXQnIGluIHRoZSBsb29wIGluaXRpYWxpemF0aW9uLiBrZXl3b3JkczogXCJqYXZhc2NyaXB0IGNsb3N1cmVcIlxuICAgICAgLy8gICAgICAgLy9jb25zb2xlLmxvZyh0aGlzLm5hbWUgKyAnIFNvdW5kICcgKyBpICsgJyBlbmRlZCwgcGxheWluZyBuZXh0Jyk7XG4gICAgICAvLyAgICAgICB0aGlzLnNvdW5kRW5kZWQoaSk7XG4gICAgICAvLyAgICAgICBpZiAoaSA8IHRoaXMubl9hbHRlcm5hdGl2ZXMgLSAxKSB7XG4gICAgICAvLyAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fbmdab25lLnJ1bigoKSA9PiB0aGlzLnN0YXJ0U291bmQoaSsxKSksIHRoaXMuSVNJX21zKTtcbiAgICAgIC8vICAgICAgIH0gZWxzZSB7XG4gICAgICAvLyAgICAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4gdGhpcy50cmlhbEVuZGVkKCkpO1xuICAgICAgLy8gICAgICAgfVxuICAgICAgLy8gICAgIH0sXG4gICAgICAvLyAgICAgZXJyb3JDYWxsYmFjazogZXJyb3IgPT4ge1xuICAgICAgLy8gICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoZXJyb3IpKTtcbiAgICAgIC8vICAgICB9XG4gICAgICAvLyAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAvLyAgICAgY29uc29sZS5sb2coJ0Vycm9yIGluaXRpYWxpemluZyBwbGF5ZXIgJyArIGkgKyAnLCAnICsgZXJyLmV4dHJhKTtcbiAgICAgIC8vICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUscmVqZWN0KSA9PiByZWplY3QoZXJyLmV4dHJhKSk7XG4gICAgICAvLyAgIH0pKTtcbiAgICAgIC8vIH1cbiAgICAvL31cblxuICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcykuY2F0Y2goZXJyID0+IHRoaXMuc2hvd0Vycm9yKGVycikpO1xuICB9XG5cbiAgaGFuZGxlUGxheUJ1dHRvbigpIHtcbiAgICBpZiAodGhpcy5ydW5uaW5nKSB7XG4gICAgICB0aGlzLnBhdXNlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudHJpYWxUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLnBsYXlUcmlhbCgpLCBlbnYuZXhwZXJpbWVudC5pbnRlcnRyaWFsSW50ZXJ2YWxfbXMvMik7XG4gICAgICB0aGlzLnBsYXlCdXR0b25UZXh0ID0gXCJQYXVzZVwiO1xuICAgICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSBcIlByZXBhcmUgZm9yIG5leHQgc291bmQhXCJcbiAgICB9XG4gIH1cblxuICBpc1J1bm5pbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMucnVubmluZztcbiAgfVxuXG4gIHBhdXNlKCkge1xuICAgIGlmICghdGhpcy5ydW5uaW5nKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMudHJpYWxUaW1lb3V0KTtcbiAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICB0aGlzLnBsYXlCdXR0b25UZXh0ID0gXCJQbGF5XCI7XG4gIH1cblxuICBpc1BsYXlpbmcoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5fYWx0ZXJuYXRpdmVzOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLnBsYXllcnNbaV0uaXNQbGF5aW5nKCkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcGxheVRyaWFsKCkge1xuICAgIHRoaXMucnVubmluZyA9IHRydWU7XG4gICAgdGhpcy5jdXJyZW50RXhwZXJpbWVudC5zdGF0dXMgPSBFeHBlcmltZW50U3RhdHVzLlJ1bm5pbmc7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubl9hbHRlcm5hdGl2ZXM7IGkrKykge1xuICAgICAgdGhpcy5wbGF5ZXJzW2ldLnZvbHVtZSA9IHRoaXMudm9sdW1lO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnN0YXJ0U291bmQoMCkudGhlbihcbiAgICAgICgpID0+IHtcbiAgICAgICAgdGhpcy50cmlhbE51bWJlciArPSAxO1xuICAgICAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9IFwiV2hpY2ggc291bmQgaGFzIHRoZSB0YXJnZXQ/XCI7XG4gICAgICAgIHRoaXMuZW5hYmxlQW5zd2VyID0gZmFsc2U7XG4gICAgICAgIHRoaXMuYW5zd2VyZWQgPSBmYWxzZTtcbiAgICAgIH0sXG4gICAgICBlcnIgPT4gdGhpcy5zaG93RXJyb3IoJ2NvdWxkIG5vdCBzdGFydCBzb3VuZDogJyArIGVycilcbiAgICApO1xuICB9XG5cbiAgc3RhcnRTb3VuZChwbGF5ZXJfaWR4KSB7XG4gICAgaWYgKHRoaXMucGxheWVyc1twbGF5ZXJfaWR4XS5pc1BsYXlpbmcoKSkge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHJlamVjdCgnQWxyZWFkeSBwbGF5aW5nJykpO1xuICAgIH1cbiAgICB0aGlzLmhpZ2hsaWdodGVkQnV0dG9uID0gcGxheWVyX2lkeDtcbiAgICByZXR1cm4gdGhpcy5wbGF5ZXJzW3BsYXllcl9pZHhdLnBsYXkoKTtcbiAgfVxuXG4gIHNvdW5kRW5kZWQocGxheWVyX2lkeCkge1xuICAgIHRoaXMuaGlnaGxpZ2h0ZWRCdXR0b24gPSAtMTtcbiAgICBpZiAocGxheWVyX2lkeCA8IHRoaXMubl9hbHRlcm5hdGl2ZXMgLSAxKSB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+ICB7XG4gICAgICAgIHRoaXMuc3RhcnRTb3VuZChwbGF5ZXJfaWR4KzEpLmNhdGNoKGVyciA9PiBjb25zb2xlLmxvZyhlcnIpKTtcbiAgICAgIH0sIHRoaXMuSVNJX21zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy50cmlhbEVuZGVkKCk7XG4gICAgfVxuICB9XG5cbiAgdHJpYWxFbmRlZCgpIHtcbiAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9ICdDbGljayBvbiB0aGUgc291bmQgdGhhdCBoYWQgdGhlIHRhcmdldCc7XG4gICAgdGhpcy5lbmFibGVBbnN3ZXIgPSB0cnVlO1xuICB9XG5cbiAgd3JpdGVMb2cobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgY29uc29sZS5sb2coJ0xPRzonKTtcbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgICB0aGlzLmV4cGVyaW1lbnRMb2dUZXh0LnB1c2gobWVzc2FnZSk7XG5cbiAgICBsZXQgZmlsZUhhbmRsZSA9IGZzLkZpbGUuZnJvbVBhdGgodGhpcy5sb2dGaWxlUGF0aCk7XG4gICAgbGV0IGxvZ3N0cmluZyA9ICcnO1xuICAgIGZvciAobGV0IHJvdyBvZiB0aGlzLmV4cGVyaW1lbnRMb2dUZXh0KSB7XG4gICAgICBsb2dzdHJpbmcgPSBsb2dzdHJpbmcuY29uY2F0KHJvdyArICdcXG4nKTtcbiAgICB9XG4gICAgcmV0dXJuIGZpbGVIYW5kbGUud3JpdGVUZXh0KGxvZ3N0cmluZykuY2F0Y2goZXJyID0+IHtcbiAgICAgIHRoaXMuc2hvd0Vycm9yKGVycik7XG4gICAgfSk7XG4gIH1cblxuICAvLyB2b2x1bWVEb3duKCkge1xuICAvLyAgIGlmICh0aGlzLnZvbHVtZSA+IDAuMSkge1xuICAvLyAgICAgdGhpcy52b2x1bWUgLT0gMC4xO1xuICAvLyAgIH1cbiAgLy8gICB0aGlzLnVwZGF0ZVZvbHVtZUljb24oKTtcbiAgLy8gICB0aGlzLnBsYXllci52b2x1bWUgPSB0aGlzLnZvbHVtZTtcbiAgLy8gfVxuICAvL1xuICAvLyB2b2x1bWVVcCgpIHtcbiAgLy8gICBpZiAodGhpcy52b2x1bWUgPD0gMC45KSB7XG4gIC8vICAgICB0aGlzLnZvbHVtZSArPSAwLjE7XG4gIC8vICAgfVxuICAvLyAgIHRoaXMudXBkYXRlVm9sdW1lSWNvbigpO1xuICAvLyAgIHRoaXMucGxheWVyLnZvbHVtZSA9ICB0aGlzLnZvbHVtZTtcbiAgLy8gfVxuXG4gIC8vIHVwZGF0ZVZvbHVtZUljb24oKSB7XG4gIC8vICAgaWYgKHRoaXMudm9sdW1lIDw9IDAuMikge1xuICAvLyAgICAgdGhpcy52b2x1bWVJY29uID0gJ3ZvbHVtZS1tdXRlJztcbiAgLy8gICB9IGVsc2UgaWYgKHRoaXMudm9sdW1lIDw9IDAuNikge1xuICAvLyAgICAgdGhpcy52b2x1bWVJY29uID0gJ3ZvbHVtZS1kb3duJztcbiAgLy8gICB9IGVsc2Uge1xuICAvLyAgICAgdGhpcy52b2x1bWVJY29uID0gJ3ZvbHVtZS11cCc7XG4gIC8vICAgfVxuICAvLyB9XG5cbiAgc2hvd0Vycm9yKGVycikge1xuICAgIHJldHVybiBkaWFsb2dzLmFsZXJ0KHtcbiAgICAgIHRpdGxlOiAnRXJyb3InLFxuICAgICAgbWVzc2FnZTogZXJyLFxuICAgICAgb2tCdXR0b25UZXh0OiAnQ2xvc2UnXG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAvLyBwYXNzXG4gICAgfSk7XG4gIH1cblxuICBmaW5pc2hFeHBlcmltZW50KCkge1xuICAgIGRpYWxvZ3MuYWxlcnQoe1xuICAgICAgdGl0bGU6ICdFeHBlcmltZW50IGNvbXBsZXRlZCcsXG4gICAgICBtZXNzYWdlOiAnVGhlIGV4cGVyaW1lbnQgaXMgbm93IGZpbmlzaGVkLCB0aGFuayB5b3UgZm9yIHBhcnRpY2lwYXRpbmchJyxcbiAgICAgIG9rQnV0dG9uVGV4dDogJ09LJ1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5jdXJyZW50RXhwZXJpbWVudC5zdGF0dXMgPSBFeHBlcmltZW50U3RhdHVzLkZpbmlzaGVkO1xuICAgICAgcmV0dXJuIHRoaXMucm91dGVyRXh0ZW5zaW9ucy5uYXZpZ2F0ZShbJy9leHBlcmltZW50bGlzdCddLCB7Y2xlYXJIaXN0b3J5OiB0cnVlfSk7XG4gICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgIHRoaXMuc2hvd0Vycm9yKGVycik7XG4gICAgfSk7XG4gIH1cblxuICBhYm9ydEV4cGVyaW1lbnQoKSB7XG4gICAgZGlhbG9ncy5jb25maXJtKHtcbiAgICAgIHRpdGxlOiAnQWJvcnQgZXhwZXJpbWVudD8nLFxuICAgICAgbWVzc2FnZTogJ1RoZSBleHBlcmltZW50IGlzIG5vdCBmaW5pc2hlZCwgYXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGFib3J0PyBZb3UgY2Fubm90IGNvbnRpbnVlIHRoZSBleHBlcmltZW50IGFmdGVyIHF1aXR0aW5nLicsXG4gICAgICBva0J1dHRvblRleHQ6ICdRdWl0JyxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHQ6ICdTdGF5J1xuICAgIH0pLnRoZW4oYW5zID0+IHtcbiAgICAgIGlmIChhbnMpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50RXhwZXJpbWVudC5zdGF0dXMgPSBFeHBlcmltZW50U3RhdHVzLkFib3J0ZWQ7XG4gICAgICAgIHJldHVybiB0aGlzLndyaXRlTG9nKCdBYm9ydGVkIHRyaWFsLlxcbicgKyBKU09OLnN0cmluZ2lmeSh0aGlzLmN1cnJlbnRFeHBlcmltZW50LmdyaWQuZ2V0SGlzdG9yeSgpKSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucm91dGVyRXh0ZW5zaW9ucy5uYXZpZ2F0ZShbJy9leHBlcmltZW50bGlzdCddLCB7Y2xlYXJIaXN0b3J5OiB0cnVlfSk7XG4gICAgICAgIH0pLmNhdGNoKGVyciA9PiB0aGlzLnNob3dFcnJvcihlcnIpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHNob3dBY3Rpb25TaGVldCgpIHtcbiAgICBkaWFsb2dzLmFjdGlvbih7XG4gICAgICB0aXRsZTogJ0FjdGlvbnMnLFxuICAgICAgbWVzc2FnZTogJ0Nob29zZSBhbiBhY3Rpb24nLFxuICAgICAgY2FuY2VsQnV0dG9uVGV4dDogJ0NhbmNlbCcsXG4gICAgICBhY3Rpb25zOiBbJ1Nob3cgZ3JpZCcsICdWZXJpZnkgYXVkaW8nLCAnQWJvcnQgZXhwZXJpbWVudCddXG4gICAgfSkudGhlbigocmVzdWx0OiBzdHJpbmcpID0+IHtcbiAgICAgIHN3aXRjaCAocmVzdWx0KSB7XG4gICAgICAgIGNhc2UgJ1Nob3cgZ3JpZCc6IHtcbiAgICAgICAgICB0aGlzLnJvdXRlckV4dGVuc2lvbnMubmF2aWdhdGUoWycvZ3JpZHBsb3QnLCAwXSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSAnVmVyaWZ5IGF1ZGlvJzoge1xuICAgICAgICAgIHRoaXMucm91dGVyRXh0ZW5zaW9ucy5uYXZpZ2F0ZShbJy92ZXJpZnlhdWRpbyddKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlICdBYm9ydCBleHBlcmltZW50Jzoge1xuICAgICAgICAgIHRoaXMuYWJvcnRFeHBlcmltZW50KCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgZGVmYXVsdDoge1xuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG59XG4iXX0=