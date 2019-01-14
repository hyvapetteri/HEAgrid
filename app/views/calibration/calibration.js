"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var page_1 = require("ui/page");
var session_1 = require("../../shared/session/session");
var appSettings = require("tns-core-modules/application-settings");
var router_1 = require("nativescript-angular/router");
var fs = require("tns-core-modules/file-system");
var dialogs = require("tns-core-modules/ui/dialogs");
var env = require("../../config/environment");
var grid_player_ios_1 = require("../../shared/grid-player/grid-player-ios");
var volumeobserver_1 = require("../../shared/volumeobserver");
var CalibrationOptions;
(function (CalibrationOptions) {
    CalibrationOptions["Background"] = "background";
    CalibrationOptions["Tone1k"] = "tone1k";
    CalibrationOptions["Tone2k"] = "tone2k";
    CalibrationOptions["Tone4k"] = "tone4k";
})(CalibrationOptions = exports.CalibrationOptions || (exports.CalibrationOptions = {}));
var CalibrationPage = /** @class */ (function () {
    function CalibrationPage(sessionProvider, routerExtensions, page) {
        var _this = this;
        this.sessionProvider = sessionProvider;
        this.routerExtensions = routerExtensions;
        this.page = page;
        this.stimOptions = CalibrationOptions;
        this.compensateHeadphones = true;
        if (appSettings.hasKey("spl_background")) {
            this.spl_background = appSettings.getNumber("spl_background").toFixed(1);
        }
        if (appSettings.hasKey("spl_tone1k")) {
            this.spl_tone1k = appSettings.getNumber("spl_tone1k").toFixed(1);
        }
        if (appSettings.hasKey("spl_tone2k")) {
            this.spl_tone2k = appSettings.getNumber("spl_tone2k").toFixed(1);
        }
        if (appSettings.hasKey("spl_tone4k")) {
            this.spl_tone4k = appSettings.getNumber("spl_tone4k").toFixed(1);
        }
        var appPath = fs.knownFolders.currentApp();
        this.audioPath = fs.path.join(appPath.path, 'audio');
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
    CalibrationPage.prototype.ngOnInit = function () {
    };
    CalibrationPage.prototype.chooseStimulus = function (stim, event) {
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
    CalibrationPage.prototype.saveValues = function () {
        var tmp_bg = Number(this.spl_background);
        if (!Number.isNaN(tmp_bg)) {
            appSettings.setNumber("spl_background", tmp_bg);
        }
        var tmp_1k = Number(this.spl_tone1k);
        if (!Number.isNaN(tmp_1k)) {
            appSettings.setNumber("spl_tone1k", tmp_1k);
        }
        var tmp_2k = Number(this.spl_tone2k);
        if (!Number.isNaN(tmp_2k)) {
            appSettings.setNumber("spl_tone2k", tmp_2k);
        }
        var tmp_4k = Number(this.spl_tone4k);
        if (!Number.isNaN(tmp_4k)) {
            appSettings.setNumber("spl_tone4k", tmp_4k);
        }
    };
    CalibrationPage.prototype.playStimulus = function () {
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
        var noise_gap = 0;
        var tone_level = env.maxTargetLevel_dB;
        this.volume = 1;
        var playerOptions = {
            targetFrequency: 0,
            loop: true,
            paddedSilenceDuration: 0,
            targetDuration: env.verifyaudio.targetDuration_s,
            maskerDuration: env.verifyaudio.maskerDuration_s,
            maskerLevel: 0,
            channelOptions: grid_player_ios_1.ChannelOptions.Diotic,
            settingsPath: this.audioPath,
            window: false,
            errorCallback: function (err) {
                console.log("error while playing: " + err);
            },
            debug: true,
            compensate: this.compensateHeadphones
        };
        this.player = new grid_player_ios_1.GridPlayer();
        var playMasker = false, playTarget = false;
        switch (this.pickedStimulus) {
            case CalibrationOptions.Background: {
                playMasker = true;
                break;
            }
            case CalibrationOptions.Tone1k: {
                playerOptions.targetFrequency = 1000;
                playTarget = true;
                break;
            }
            case CalibrationOptions.Tone2k: {
                playerOptions.targetFrequency = 2000;
                playTarget = true;
                break;
            }
            case CalibrationOptions.Tone4k: {
                playerOptions.targetFrequency = 4000;
                playTarget = true;
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
    CalibrationPage.prototype.showError = function (err) {
        dialogs.alert({
            title: 'Error',
            message: err,
            okButtonText: 'Close'
        }).then(function () {
            // pass
        });
    };
    CalibrationPage.prototype.onSwitch = function (args) {
        var sw = args.object;
        if (sw.checked) {
            this.compensateHeadphones = true;
        }
        else {
            this.compensateHeadphones = false;
        }
    };
    CalibrationPage = __decorate([
        core_1.Component({
            moduleId: module.id,
            selector: 'view-calibration',
            templateUrl: 'calibration.html'
        }),
        __metadata("design:paramtypes", [session_1.SessionProvider,
            router_1.RouterExtensions,
            page_1.Page])
    ], CalibrationPage);
    return CalibrationPage;
}());
exports.CalibrationPage = CalibrationPage;
