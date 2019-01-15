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
        // let tone_level_range = util.a2db(this.volume) - util.a2db(this.currentExperiment.toneThreshold);
        // tone_level_range = Math.floor(tone_level_range);
        // console.log('Tone level range: ' + tone_level_range);
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
        var min_level = targ_ref_level - 10;
        // let grid_y_min = Math.min(min_level, tone_level_range)
        var parameter_grid = new grid_1.ParamGrid({
            xmin: 0,
            xmax: env.maxGap,
            xres: 0.05,
            ymin: env.maxTargetLevel_dB - min_level,
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
            n_revs: 3,
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
            basegrid.initialize(0, -100, grid_1.GridDirection.Right);
            grid.addPhase(basegrid);
        }
        var start_level = targ_ref_level - 70; // 70 dB SPL
        grid.initialize(0, env.maxTargetLevel_dB - start_level);
        //grid.initialize(0, ylim[0] + 40);
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
                channelOptions: grid_player_ios_1.ChannelOptions.MonoticLeft,
                settingsPath: fs.knownFolders.documents().path,
                completeCallback: function (args) {
                    _this._ngZone.run(function () { return _this.soundEnded(i); });
                },
                compensate: true,
                calibration: false
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
            return _this.writeLog('BG ref level: ' + bg_ref_level + ', target ref level: ' + targ_ref_level + ', masker threshold: ' + util.a2db(_this.currentExperiment.noiseThreshold));
        }).then(function () {
            return _this.writeLog('trial; gap; level; answer; correct');
        }).catch(function (err) { return _this.showError(err); });
        this.page.on("navigatedTo", function (data) {
            console.log("adding volume observer");
            var audioSession = AVAudioSession.sharedInstance();
            audioSession.setPreferredSampleRateError(44100);
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
        var audioSession = AVAudioSession.sharedInstance();
        if (audioSession.sampleRate !== 44100) {
            this.showError("Wrong sample rate! fs = " + audioSession.sampleRate);
        }
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
        //this.instructionText = 'Click on the sound that had the target';
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
