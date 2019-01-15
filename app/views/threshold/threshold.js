"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var page_1 = require("ui/page");
var dialogs = require("tns-core-modules/ui/dialogs");
var fs = require("tns-core-modules/file-system");
var env = require("../../config/environment");
var util = require("../../shared/utils");
var volumeobserver_1 = require("../../shared/volumeobserver");
var router_1 = require("nativescript-angular/router");
var grid_player_ios_1 = require("../../shared/grid-player/grid-player-ios");
var session_1 = require("../../shared/session/session");
var ThresholdPage = /** @class */ (function () {
    function ThresholdPage(sessionProvider, routerExtensions, _ngZone, page) {
        var _this = this;
        this.sessionProvider = sessionProvider;
        this.routerExtensions = routerExtensions;
        this._ngZone = _ngZone;
        this.page = page;
        this.titleText = "Hearing threshold";
        this.enablePlay = false;
        this.enableAnswer = false;
        this.answerButtonPressed = false;
        this.turns = [];
        this.max_turns = env.threshold.maxTurns;
        this.experiment = this.sessionProvider.getCurrentExperiment();
        this.experiment.status = session_1.ExperimentStatus.NoiseThreshold;
        this.page.on("navigatedTo", function (data) {
            console.log("adding volume observer");
            var audioSession = AVAudioSession.sharedInstance();
            audioSession.setPreferredSampleRateError(44100);
            _this.masterVolumeObserver = new volumeobserver_1.VolumeObserver();
            _this.masterVolumeObserver.setCallback(function (obj) {
                _this.player.pause().then(function () {
                    clearInterval(_this.volumeUpdateTimerId);
                    _this.sessionProvider.cancelExperiment();
                }).then(function () {
                    return dialogs.alert({
                        title: "Volume changed!",
                        message: "A volume button press was observed. The current experiment will be cancelled and you will now return to the volume setting screen.",
                        okButtonText: "OK"
                    });
                }).then(function () {
                    return _this.routerExtensions.navigate(["/volume"], { clearHistory: true });
                }).catch(function (err) { return console.log(err); });
            });
            audioSession.addObserverForKeyPathOptionsContext(_this.masterVolumeObserver, "outputVolume", 1 /* New */, null);
        });
        this.page.on("navigatingFrom", function (data) {
            var audioSession = AVAudioSession.sharedInstance();
            audioSession.removeObserverForKeyPath(_this.masterVolumeObserver, "outputVolume");
        });
        this.setup();
    }
    ThresholdPage.prototype.onButtonTouch = function (args) {
        var _this = this;
        if (args.action == 'down') {
            this.answerButtonPressed = true;
            this.turns.push(this.volume);
            this.direction = -1;
            this.answerButtonText = 'Hold';
        }
        else if (args.action == 'up') {
            this.answerButtonPressed = false;
            this.turns.push(this.volume);
            this.direction = 1;
            this.answerButtonText = 'Push';
        }
        if (this.turns.length >= this.max_turns) {
            this.player.dispose().then(function () {
                clearInterval(_this.volumeUpdateTimerId);
                _this.instructionText = 'Done';
                _this.finish();
            });
        }
    };
    ThresholdPage.prototype.setup = function () {
        var _this = this;
        var appPath = fs.knownFolders.currentApp();
        //this.audioPath = fs.path.join(appPath.path, env.audioPath);
        this.audioPath = fs.knownFolders.documents().path;
        console.log(this.audioPath);
        //this.player = new TNSPlayer();
        var playerOptions = {
            targetFrequency: this.experiment.testFrequency,
            loop: true,
            paddedSilenceDuration: env.threshold.paddedSilenceDuration_s,
            targetDuration: env.threshold.targetDuration_s,
            maskerDuration: env.threshold.maskerDuration_s,
            maskerLevel: 0,
            channelOptions: grid_player_ios_1.ChannelOptions.MonoticLeft,
            settingsPath: fs.knownFolders.documents().path,
            debug: true,
            compensate: true,
            calibration: false
        };
        this.player = new grid_player_ios_1.GridPlayer();
        return this.player.initialize(playerOptions).then(function () {
            return _this.player.preloadStimulus(0, env.maxTargetLevel_dB, (_this.experiment.status == session_1.ExperimentStatus.ToneThreshold), _this.experiment.status == session_1.ExperimentStatus.NoiseThreshold);
        }).then(function () {
            console.log('stimulus preloaded!');
            _this.enablePlay = true;
            _this.reset();
            _this.instructionText = 'Press play to start';
            _this.answerButtonText = 'Push';
        }).catch(function (err) {
            console.log('error preloading stimulus');
            console.log(err);
        });
        // let freq = this.experiment.testFrequency;
        //
        // let audiofile = '';
        // if (this.experiment.status == ExperimentStatus.NoiseThreshold) {
        //   audiofile = 'noise_ref.wav';
        // } else if (this.experiment.status == ExperimentStatus.ToneThreshold) {
        //   audiofile = 'f' + freq + '_ref.wav';
        // } else {
        //   return this.showError('Unexpected experiment status: ' + this.experiment.status);
        // }
        // return this.player.initFromFile({
        //   audioFile: fs.path.join(this.audioPath, audiofile),
        //   loop: true
        // }).then(() => {
        //   this.enablePlay = true;
        //   this.reset();
        //   this.instructionText = 'Press play to start';
        //   this.answerButtonText = 'Push';
        // }).catch(err => this.showError(err));
    };
    ThresholdPage.prototype.play = function () {
        var _this = this;
        //if (this.player.isAudioPlaying()) {
        if (this.player.isPlaying()) {
            console.log('pause');
            return this.player.pause().then(function () {
                clearInterval(_this.volumeUpdateTimerId);
                _this.reset();
                _this.instructionText = 'Reset. Press play to start again.';
            });
        }
        else {
            console.log('play');
            this.direction = 1;
            return this.player.play().then(function () {
                console.log('Player started');
                _this.volumeUpdateTimerId = setInterval(function () { return _this.updateVolume(); }, env.threshold.volumeUpdateInterval_ms);
                _this.enableAnswer = true;
                _this.playButtonText = 'Reset';
                _this.instructionText = "When you hear a sound, press the button and keep it pressed until you can't hear it anymore. Then release and repeat.";
            });
        }
    };
    ThresholdPage.prototype.updateVolume = function () {
        this.volume = util.db2a(this.direction * env.threshold.volumeUpdateStepsize_dB) * this.volume;
        this.player.volume = this.volume;
    };
    ThresholdPage.prototype.reset = function () {
        this.playButtonText = 'Play';
        this.enableAnswer = false;
        this.volume = util.db2a(-40);
        this.player.volume = this.volume;
        this.turns = [];
    };
    ThresholdPage.prototype.finish = function () {
        var avg_threshold = 0;
        var n_last_turns = env.threshold.n_avg;
        for (var i = this.turns.length - 1; i >= this.turns.length - n_last_turns; i--) {
            avg_threshold = avg_threshold + util.a2db(this.turns[i]);
        }
        console.log('sum: ' + avg_threshold + ', n: ' + n_last_turns);
        avg_threshold = avg_threshold / n_last_turns;
        avg_threshold = util.db2a(avg_threshold);
        console.log('Turns: ' + JSON.stringify(this.turns));
        console.log('Threshold: ' + avg_threshold);
        if (this.experiment.status == session_1.ExperimentStatus.NoiseThreshold) {
            this.experiment.noiseThreshold = avg_threshold;
            //this.experiment.status = ExperimentStatus.ToneThreshold;
            return this.routerExtensions.navigate(["/experiment"], { clearHistory: true });
            // return this.setup().then(() => {
            //   this.instructionText = 'Now we will measure another threshold using a tone. Press play to start.'
            //   this.titleText = "Threshold 2/2";
            // });
        }
        else if (this.experiment.status == session_1.ExperimentStatus.ToneThreshold) {
            this.experiment.toneThreshold = avg_threshold;
            return this.routerExtensions.navigate(["/experiment"], { clearHistory: true });
        }
        else {
            return this.showError('Unexpected experiment status: ' + this.experiment.status);
        }
    };
    ThresholdPage.prototype.cancel = function () {
        var _this = this;
        console.log("cancel");
        return this.player.pause().then(function () {
            clearInterval(_this.volumeUpdateTimerId);
            _this.sessionProvider.cancelExperiment();
            return _this.routerExtensions.navigate(["/experimentlist"], { clearHistory: true });
        });
    };
    ThresholdPage.prototype.showError = function (err) {
        dialogs.alert({
            title: 'Error',
            message: err,
            okButtonText: 'Close'
        }).then(function () {
            // pass
        });
    };
    ThresholdPage = __decorate([
        core_1.Component({
            moduleId: module.id,
            selector: 'page-threshold',
            templateUrl: './threshold.html',
            styleUrls: ['./threshold.css']
        }),
        __metadata("design:paramtypes", [session_1.SessionProvider,
            router_1.RouterExtensions,
            core_1.NgZone,
            page_1.Page])
    ], ThresholdPage);
    return ThresholdPage;
}());
exports.ThresholdPage = ThresholdPage;
