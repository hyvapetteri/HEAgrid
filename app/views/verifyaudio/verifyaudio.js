"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var page_1 = require("ui/page");
var session_1 = require("../../shared/session/session");
var router_1 = require("nativescript-angular/router");
var appSettings = require("tns-core-modules/application-settings");
var fs = require("tns-core-modules/file-system");
var dialogs = require("tns-core-modules/ui/dialogs");
var util = require("../../shared/utils");
var env = require("../../config/environment");
var grid_player_ios_1 = require("../../shared/grid-player/grid-player-ios");
var volumeobserver_1 = require("../../shared/volumeobserver");
var StimuliOptions;
(function (StimuliOptions) {
    StimuliOptions["Background"] = "background";
    StimuliOptions["BackgroundTH"] = "background_at_threshold";
    StimuliOptions["Tone"] = "tone";
    StimuliOptions["ToneTH"] = "tone_at_threshold";
    StimuliOptions["GridPointTarget"] = "gridpoint_target";
    StimuliOptions["GridPointNontarget"] = "gridpoint_nontarget";
})(StimuliOptions = exports.StimuliOptions || (exports.StimuliOptions = {}));
var VerifyAudioPage = /** @class */ (function () {
    function VerifyAudioPage(sessionProvider, routerExtensions, page) {
        var _this = this;
        this.sessionProvider = sessionProvider;
        this.routerExtensions = routerExtensions;
        this.page = page;
        this.stimOptions = StimuliOptions;
        var appPath = fs.knownFolders.currentApp();
        this.audioPath = fs.path.join(appPath.path, 'audio');
        this.experiment = this.sessionProvider.getCurrentExperiment();
        this.xval = this.experiment.grid.getStatus().xval;
        this.yval = this.experiment.grid.getStatus().yval;
        this.xlim = this.experiment.grid.getXlim();
        this.ylim = this.experiment.grid.getYlim();
        this.submitted = false;
        this.playing = false;
        this.enablePlay = false;
        this.playButtonText = "Play stimulus";
        this.pickedStimulus = null;
        this.audioSession = AVAudioSession.sharedInstance();
        this.masterVolumeObserver = new volumeobserver_1.VolumeObserver();
        this.masterVolumeObserver.setCallback(function (obj) {
            dialogs.alert({
                title: "Volume changed!",
                message: "A volume button press was observed. The current experiment will be cancelled and you will now return to the volume setting screen.",
                okButtonText: "OK"
            }).then(function () {
                return _this.routerExtensions.navigate(["/volume"], { clearHistory: true });
            }).catch(function (err) { return console.log(err); });
        });
        this.audioSession.addObserverForKeyPathOptionsContext(this.masterVolumeObserver, "outputVolume", 1 /* New */, null);
        this.page.on("navigatingFrom", function (data) {
            _this.audioSession.removeObserverForKeyPath(_this.masterVolumeObserver, "outputVolume");
        });
    }
    VerifyAudioPage.prototype.ngOnInit = function () {
    };
    VerifyAudioPage.prototype.chooseStimulus = function (stim, event) {
        console.log(stim);
        var button = event.object;
        if (this.pickedStimulus == stim) {
            this.pickedStimulus = null;
            this.enablePlay = false;
        }
        else {
            this.pickedStimulus = stim;
            this.enablePlay = true;
        }
    };
    VerifyAudioPage.prototype.playStimulus = function () {
        var _this = this;
        if (this.playing) {
            return this.player.pause().then(function () {
                _this.playing = false;
                _this.submitted = false;
                _this.playButtonText = "Play stimulus";
                _this.player.dispose();
            });
        }
        this.submitted = true;
        var xcoord = -1, ycoord = -1;
        var check_coordinates = false;
        if ((this.pickedStimulus == StimuliOptions.GridPointTarget) || (this.pickedStimulus == StimuliOptions.GridPointNontarget)) {
            check_coordinates = true;
            xcoord = Number(this.xval);
            ycoord = Number(this.yval);
        }
        this.xinvalid = false;
        this.yinvalid = false;
        if (isNaN(xcoord) || (xcoord < this.xlim[0]) || (xcoord > this.xlim[1])) {
            this.xinvalid = true;
        }
        if (isNaN(ycoord) || (ycoord < this.ylim[0]) || (ycoord > this.ylim[1])) {
            this.yinvalid = true;
        }
        console.log('x: ' + xcoord + ', y: ' + ycoord);
        if (check_coordinates && (this.xinvalid || this.yinvalid)) {
            console.log("Invalid coordinates");
            return;
        }
        var noise_gap = xcoord;
        var tone_level = ycoord;
        var freq = this.experiment.testFrequency;
        this.volume = 1;
        var bg_ref_level;
        if (appSettings.hasKey("spl_background")) {
            bg_ref_level = appSettings.getNumber("spl_background");
        }
        else {
            return this.showError("Calibrate levels first!");
        }
        var playerOptions = {
            targetFrequency: this.experiment.testFrequency,
            loop: true,
            paddedSilenceDuration: 0,
            targetDuration: env.verifyaudio.targetDuration_s,
            maskerDuration: env.verifyaudio.maskerDuration_s,
            //maskerLevel: util.a2db(this.experiment.noiseThreshold) + env.maskerLevel_dB,
            maskerLevel: env.maskerLevel_dB - bg_ref_level,
            channelOptions: grid_player_ios_1.ChannelOptions.Diotic,
            settingsPath: this.audioPath,
            window: false,
            errorCallback: function (err) {
                console.log("error while playing: " + err);
            },
            debug: true,
            compensate: true
        };
        this.player = new grid_player_ios_1.GridPlayer();
        var playMasker = false, playTarget = false;
        switch (this.pickedStimulus) {
            case StimuliOptions.Background: {
                noise_gap = 0;
                playMasker = true;
                break;
            }
            case StimuliOptions.BackgroundTH: {
                noise_gap = 0;
                //this.volume = this.experiment.noiseThreshold;
                playerOptions.maskerLevel = util.a2db(this.experiment.noiseThreshold);
                playMasker = true;
                break;
            }
            case StimuliOptions.Tone: {
                tone_level = this.experiment.grid.getYlim()[1];
                noise_gap = 0;
                playTarget = true;
                break;
            }
            case StimuliOptions.ToneTH: {
                tone_level = this.experiment.grid.getYlim()[0];
                noise_gap = 0;
                playTarget = true;
                break;
            }
            case StimuliOptions.GridPointTarget: {
                playTarget = true;
                playMasker = true;
                break;
            }
            case StimuliOptions.GridPointNontarget: {
                playTarget = false;
                playMasker = true;
                break;
            }
            default: {
                return this.showError("Unknown stimulus option.");
            }
        }
        return this.player.initialize(playerOptions).then(function () {
            console.log("Player initialized, playing at x: " + noise_gap + ", y: " + tone_level);
            return _this.player.preloadStimulus(noise_gap, tone_level, playTarget, playMasker);
        }).then(function () {
            _this.player.volume = _this.volume;
            return _this.player.play();
        }).then(function () {
            console.log("Playing");
            _this.playing = true;
            _this.playButtonText = "Stop";
        }).catch(function (err) { return _this.showError(err); });
    };
    VerifyAudioPage.prototype.showError = function (err) {
        dialogs.alert({
            title: 'Error',
            message: err,
            okButtonText: 'Close'
        }).then(function () {
            // pass
        });
    };
    VerifyAudioPage = __decorate([
        core_1.Component({
            moduleId: module.id,
            selector: 'view-verifyaudio',
            templateUrl: 'verifyaudio.html',
            styleUrls: ['./verifyaudio.css']
        }),
        __metadata("design:paramtypes", [session_1.SessionProvider,
            router_1.RouterExtensions,
            page_1.Page])
    ], VerifyAudioPage);
    return VerifyAudioPage;
}());
exports.VerifyAudioPage = VerifyAudioPage;
