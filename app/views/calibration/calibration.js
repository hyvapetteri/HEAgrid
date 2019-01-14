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
            if (_this.playing) {
                _this.player.dispose();
            }
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
            settingsPath: fs.knownFolders.documents().path,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsaWJyYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjYWxpYnJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUFrRDtBQUNsRCxnQ0FBK0I7QUFDL0Isd0RBQStEO0FBQy9ELG1FQUFxRTtBQUNyRSxzREFBMEU7QUFFMUUsaURBQW1EO0FBQ25ELHFEQUF1RDtBQUV2RCw4Q0FBZ0Q7QUFJaEQsNEVBQXlHO0FBQ3pHLDhEQUE2RDtBQUs3RCxJQUFZLGtCQUtYO0FBTEQsV0FBWSxrQkFBa0I7SUFDNUIsK0NBQXlCLENBQUE7SUFDekIsdUNBQWlCLENBQUE7SUFDakIsdUNBQWlCLENBQUE7SUFDakIsdUNBQWlCLENBQUE7QUFDbkIsQ0FBQyxFQUxXLGtCQUFrQixHQUFsQiwwQkFBa0IsS0FBbEIsMEJBQWtCLFFBSzdCO0FBT0Q7SUF5QkkseUJBQW9CLGVBQWdDLEVBQ2hDLGdCQUFrQyxFQUNsQyxJQUFVO1FBRjlCLGlCQWdEQztRQWhEbUIsb0JBQWUsR0FBZixlQUFlLENBQWlCO1FBQ2hDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7UUFDbEMsU0FBSSxHQUFKLElBQUksQ0FBTTtRQTFCdkIsZ0JBQVcsR0FBRyxrQkFBa0IsQ0FBQztRQTRCdEMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQztRQUVqQyxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxjQUFjLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzRSxDQUFDO1FBQ0QsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRSxDQUFDO1FBQ0QsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRSxDQUFDO1FBQ0QsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRSxDQUFDO1FBRUQsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMzQyxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFckQsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDckIsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7UUFDeEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxlQUFlLENBQUM7UUFDdEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7UUFFM0IsSUFBSSxDQUFDLFlBQVksR0FBRyxjQUFjLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDcEQsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksK0JBQWMsRUFBRSxDQUFDO1FBQ2pELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsVUFBQyxHQUFHO1lBQ3hDLE9BQU8sQ0FBQyxLQUFLLENBQUM7Z0JBQ1osS0FBSyxFQUFFLGlCQUFpQjtnQkFDeEIsT0FBTyxFQUFFLG9JQUFvSTtnQkFDN0ksWUFBWSxFQUFFLElBQUk7YUFDbkIsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDTixNQUFNLENBQUMsS0FBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUMsWUFBWSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7WUFDM0UsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQUEsR0FBRyxJQUFJLE9BQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBaEIsQ0FBZ0IsQ0FBQyxDQUFDO1FBQ3BDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLFlBQVksQ0FBQyxtQ0FBbUMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsY0FBYyxlQUFrQyxJQUFJLENBQUMsQ0FBQztRQUV2SSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFDLElBQWU7WUFDN0MsRUFBRSxDQUFDLENBQUMsS0FBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ2pCLEtBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDeEIsQ0FBQztZQUNELEtBQUksQ0FBQyxZQUFZLENBQUMsd0JBQXdCLENBQUMsS0FBSSxDQUFDLG9CQUFvQixFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3hGLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQztJQUVELGtDQUFRLEdBQVI7SUFFQSxDQUFDO0lBRUQsd0NBQWMsR0FBZCxVQUFlLElBQXVCLEVBQUUsS0FBZTtRQUNyRCxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWxCLElBQUksTUFBTSxHQUFXLEtBQUssQ0FBQyxNQUFNLENBQUM7UUFFbEMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO1lBQzNCLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1FBQzFCLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO1lBQzNCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLENBQUM7SUFHSCxDQUFDO0lBRUQsb0NBQVUsR0FBVjtRQUNFLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDekMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQixXQUFXLENBQUMsU0FBUyxDQUFDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFDRCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3JDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUIsV0FBVyxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUNELElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDckMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQixXQUFXLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBQ0QsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNyQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFCLFdBQVcsQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzlDLENBQUM7SUFDSCxDQUFDO0lBRUQsc0NBQVksR0FBWjtRQUFBLGlCQXlFQztRQXhFQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUM7Z0JBQzlCLEtBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO2dCQUNyQixLQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztnQkFDdkIsS0FBSSxDQUFDLGNBQWMsR0FBRyxlQUFlLENBQUM7Z0JBQ3RDLEtBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDeEIsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFFdEIsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLElBQUksVUFBVSxHQUFHLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQztRQUV2QyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUVoQixJQUFJLGFBQWEsR0FBcUI7WUFDcEMsZUFBZSxFQUFFLENBQUM7WUFDbEIsSUFBSSxFQUFFLElBQUk7WUFDVixxQkFBcUIsRUFBRSxDQUFDO1lBQ3hCLGNBQWMsRUFBRSxHQUFHLENBQUMsV0FBVyxDQUFDLGdCQUFnQjtZQUNoRCxjQUFjLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0I7WUFDaEQsV0FBVyxFQUFFLENBQUM7WUFDZCxjQUFjLEVBQUUsZ0NBQWMsQ0FBQyxNQUFNO1lBQ3JDLFlBQVksRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxDQUFDLElBQUk7WUFDOUMsTUFBTSxFQUFFLEtBQUs7WUFDYixhQUFhLEVBQUUsVUFBQyxHQUFHO2dCQUNqQixPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQzdDLENBQUM7WUFDRCxLQUFLLEVBQUUsSUFBSTtZQUNYLFVBQVUsRUFBRSxJQUFJLENBQUMsb0JBQW9CO1NBQ3RDLENBQUM7UUFFRixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksNEJBQVUsRUFBRSxDQUFDO1FBRS9CLElBQUksVUFBVSxHQUFHLEtBQUssRUFBRSxVQUFVLEdBQUcsS0FBSyxDQUFDO1FBQzNDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBQzVCLEtBQUssa0JBQWtCLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ25DLFVBQVUsR0FBRyxJQUFJLENBQUM7Z0JBQ2xCLEtBQUssQ0FBQztZQUNSLENBQUM7WUFDRCxLQUFLLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMvQixhQUFhLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztnQkFDckMsVUFBVSxHQUFHLElBQUksQ0FBQztnQkFDbEIsS0FBSyxDQUFDO1lBQ1IsQ0FBQztZQUNELEtBQUssa0JBQWtCLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQy9CLGFBQWEsQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO2dCQUNyQyxVQUFVLEdBQUcsSUFBSSxDQUFDO2dCQUNsQixLQUFLLENBQUM7WUFDUixDQUFDO1lBQ0QsS0FBSyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDL0IsYUFBYSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7Z0JBQ3JDLFVBQVUsR0FBRyxJQUFJLENBQUM7Z0JBQ2xCLEtBQUssQ0FBQztZQUNSLENBQUM7WUFDRCxTQUFTLENBQUM7Z0JBQ1IsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsMEJBQTBCLENBQUMsQ0FBQztZQUNwRCxDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDaEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsR0FBRyxTQUFTLEdBQUcsT0FBTyxHQUFHLFVBQVUsQ0FBQyxDQUFDO1lBQ3JGLE1BQU0sQ0FBQyxLQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNwRixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDTixLQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxLQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxLQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNOLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdkIsS0FBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDcEIsS0FBSSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUM7UUFDL0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQUEsR0FBRyxJQUFJLE9BQUEsS0FBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBbkIsQ0FBbUIsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxtQ0FBUyxHQUFULFVBQVUsR0FBRztRQUNYLE9BQU8sQ0FBQyxLQUFLLENBQUM7WUFDWixLQUFLLEVBQUUsT0FBTztZQUNkLE9BQU8sRUFBRSxHQUFHO1lBQ1osWUFBWSxFQUFFLE9BQU87U0FDdEIsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNOLE9BQU87UUFDVCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxrQ0FBUSxHQUFSLFVBQVMsSUFBSTtRQUNYLElBQUksRUFBRSxHQUFXLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDN0IsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDZixJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO1FBQ25DLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLENBQUM7UUFDcEMsQ0FBQztJQUNILENBQUM7SUE5TVEsZUFBZTtRQUwzQixnQkFBUyxDQUFDO1lBQ1AsUUFBUSxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ25CLFFBQVEsRUFBRSxrQkFBa0I7WUFDNUIsV0FBVyxFQUFFLGtCQUFrQjtTQUNsQyxDQUFDO3lDQTBCdUMseUJBQWU7WUFDZCx5QkFBZ0I7WUFDNUIsV0FBSTtPQTNCckIsZUFBZSxDQWdOM0I7SUFBRCxzQkFBQztDQUFBLEFBaE5ELElBZ05DO0FBaE5ZLDBDQUFlIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBPbkluaXQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tIFwidWkvcGFnZVwiO1xuaW1wb3J0IHsgU2Vzc2lvblByb3ZpZGVyIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3Nlc3Npb24vc2Vzc2lvbic7XG5pbXBvcnQgKiBhcyBhcHBTZXR0aW5ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9hcHBsaWNhdGlvbi1zZXR0aW5nc1wiO1xuaW1wb3J0IHsgUm91dGVyRXh0ZW5zaW9ucywgUGFnZVJvdXRlIH0gZnJvbSAnbmF0aXZlc2NyaXB0LWFuZ3VsYXIvcm91dGVyJztcbmltcG9ydCB7IHN3aXRjaE1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2ZpbGUtc3lzdGVtXCI7XG5pbXBvcnQgKiBhcyBkaWFsb2dzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL2RpYWxvZ3NcIjtcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSBcIi4uLy4uL3NoYXJlZC91dGlsc1wiO1xuaW1wb3J0ICogYXMgZW52IGZyb20gXCIuLi8uLi9jb25maWcvZW52aXJvbm1lbnRcIjtcbmltcG9ydCB7IFN3aXRjaCB9IGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL3N3aXRjaFwiO1xuXG5pbXBvcnQgeyBHcmlkVHJhY2tlciwgR3JpZFRyYWNraW5nU3RhdHVzLCBHcmlkRGlyZWN0aW9uLCBUcmlhbEFuc3dlciwgUGFyYW1HcmlkIH0gZnJvbSAnLi4vLi4vc2hhcmVkL2dyaWQvZ3JpZCc7XG5pbXBvcnQgeyBHcmlkUGxheWVyLCBHcmlkUGxheWVyT3B0aW9ucywgQ2hhbm5lbE9wdGlvbnMgfSBmcm9tIFwiLi4vLi4vc2hhcmVkL2dyaWQtcGxheWVyL2dyaWQtcGxheWVyLWlvc1wiO1xuaW1wb3J0IHsgVm9sdW1lT2JzZXJ2ZXIgfSBmcm9tIFwiLi4vLi4vc2hhcmVkL3ZvbHVtZW9ic2VydmVyXCI7XG5pbXBvcnQgeyBPYnNlcnZhYmxlQXJyYXkgfSBmcm9tIFwiZGF0YS9vYnNlcnZhYmxlLWFycmF5XCI7XG5pbXBvcnQgeyBFdmVudERhdGEgfSBmcm9tIFwiZGF0YS9vYnNlcnZhYmxlXCI7XG5pbXBvcnQgeyBCdXR0b24gfSBmcm9tIFwidWkvYnV0dG9uXCI7XG5cbmV4cG9ydCBlbnVtIENhbGlicmF0aW9uT3B0aW9ucyB7XG4gIEJhY2tncm91bmQgPSBcImJhY2tncm91bmRcIixcbiAgVG9uZTFrID0gXCJ0b25lMWtcIixcbiAgVG9uZTJrID0gXCJ0b25lMmtcIixcbiAgVG9uZTRrID0gXCJ0b25lNGtcIlxufVxuXG5AQ29tcG9uZW50KHtcbiAgICBtb2R1bGVJZDogbW9kdWxlLmlkLFxuICAgIHNlbGVjdG9yOiAndmlldy1jYWxpYnJhdGlvbicsXG4gICAgdGVtcGxhdGVVcmw6ICdjYWxpYnJhdGlvbi5odG1sJ1xufSlcbmV4cG9ydCBjbGFzcyBDYWxpYnJhdGlvblBhZ2UgaW1wbGVtZW50cyBPbkluaXQge1xuICAgIHB1YmxpYyBzdGltT3B0aW9ucyA9IENhbGlicmF0aW9uT3B0aW9ucztcblxuICAgIHByaXZhdGUgYXVkaW9QYXRoOnN0cmluZztcbiAgICAvL3ByaXZhdGUgcGxheWVyOlROU1BsYXllcjtcbiAgICBwcml2YXRlIHBsYXllcjogR3JpZFBsYXllcjtcbiAgICBwcml2YXRlIHZvbHVtZTpudW1iZXI7XG4gICAgcHJpdmF0ZSBwaWNrZWRTdGltdWx1czogQ2FsaWJyYXRpb25PcHRpb25zfG51bGw7XG5cbiAgICBwcml2YXRlIHBsYXlpbmc6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSBlbmFibGVQbGF5OiBib29sZWFuO1xuICAgIHByaXZhdGUgcGxheUJ1dHRvblRleHQ6IHN0cmluZztcblxuICAgIHByaXZhdGUgc3VibWl0dGVkOiBib29sZWFuO1xuXG4gICAgcHJpdmF0ZSBhdWRpb1Nlc3Npb246IEFWQXVkaW9TZXNzaW9uO1xuICAgIHByaXZhdGUgbWFzdGVyVm9sdW1lT2JzZXJ2ZXI6IFZvbHVtZU9ic2VydmVyO1xuXG4gICAgcHJpdmF0ZSBzcGxfYmFja2dyb3VuZDogc3RyaW5nO1xuICAgIHByaXZhdGUgc3BsX3RvbmUxazogc3RyaW5nO1xuICAgIHByaXZhdGUgc3BsX3RvbmUyazogc3RyaW5nO1xuICAgIHByaXZhdGUgc3BsX3RvbmU0azogc3RyaW5nO1xuXG4gICAgcHJpdmF0ZSBjb21wZW5zYXRlSGVhZHBob25lczogYm9vbGVhbjtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgc2Vzc2lvblByb3ZpZGVyOiBTZXNzaW9uUHJvdmlkZXIsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSByb3V0ZXJFeHRlbnNpb25zOiBSb3V0ZXJFeHRlbnNpb25zLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgcGFnZTogUGFnZSkge1xuXG4gICAgICB0aGlzLmNvbXBlbnNhdGVIZWFkcGhvbmVzID0gdHJ1ZTtcblxuICAgICAgaWYgKGFwcFNldHRpbmdzLmhhc0tleShcInNwbF9iYWNrZ3JvdW5kXCIpKSB7XG4gICAgICAgIHRoaXMuc3BsX2JhY2tncm91bmQgPSBhcHBTZXR0aW5ncy5nZXROdW1iZXIoXCJzcGxfYmFja2dyb3VuZFwiKS50b0ZpeGVkKDEpO1xuICAgICAgfVxuICAgICAgaWYgKGFwcFNldHRpbmdzLmhhc0tleShcInNwbF90b25lMWtcIikpIHtcbiAgICAgICAgdGhpcy5zcGxfdG9uZTFrID0gYXBwU2V0dGluZ3MuZ2V0TnVtYmVyKFwic3BsX3RvbmUxa1wiKS50b0ZpeGVkKDEpO1xuICAgICAgfVxuICAgICAgaWYgKGFwcFNldHRpbmdzLmhhc0tleShcInNwbF90b25lMmtcIikpIHtcbiAgICAgICAgdGhpcy5zcGxfdG9uZTJrID0gYXBwU2V0dGluZ3MuZ2V0TnVtYmVyKFwic3BsX3RvbmUya1wiKS50b0ZpeGVkKDEpO1xuICAgICAgfVxuICAgICAgaWYgKGFwcFNldHRpbmdzLmhhc0tleShcInNwbF90b25lNGtcIikpIHtcbiAgICAgICAgdGhpcy5zcGxfdG9uZTRrID0gYXBwU2V0dGluZ3MuZ2V0TnVtYmVyKFwic3BsX3RvbmU0a1wiKS50b0ZpeGVkKDEpO1xuICAgICAgfVxuXG4gICAgICBsZXQgYXBwUGF0aCA9IGZzLmtub3duRm9sZGVycy5jdXJyZW50QXBwKCk7XG4gICAgICB0aGlzLmF1ZGlvUGF0aCA9IGZzLnBhdGguam9pbihhcHBQYXRoLnBhdGgsICdhdWRpbycpO1xuXG4gICAgICB0aGlzLnN1Ym1pdHRlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5wbGF5aW5nID0gZmFsc2U7XG4gICAgICB0aGlzLmVuYWJsZVBsYXkgPSBmYWxzZTtcbiAgICAgIHRoaXMucGxheUJ1dHRvblRleHQgPSBcIlBsYXkgc3RpbXVsdXNcIjtcbiAgICAgIHRoaXMucGlja2VkU3RpbXVsdXMgPSBudWxsO1xuXG4gICAgICB0aGlzLmF1ZGlvU2Vzc2lvbiA9IEFWQXVkaW9TZXNzaW9uLnNoYXJlZEluc3RhbmNlKCk7XG4gICAgICB0aGlzLm1hc3RlclZvbHVtZU9ic2VydmVyID0gbmV3IFZvbHVtZU9ic2VydmVyKCk7XG4gICAgICB0aGlzLm1hc3RlclZvbHVtZU9ic2VydmVyLnNldENhbGxiYWNrKChvYmopID0+IHtcbiAgICAgICAgZGlhbG9ncy5hbGVydCh7XG4gICAgICAgICAgdGl0bGU6IFwiVm9sdW1lIGNoYW5nZWQhXCIsXG4gICAgICAgICAgbWVzc2FnZTogXCJBIHZvbHVtZSBidXR0b24gcHJlc3Mgd2FzIG9ic2VydmVkLiBUaGUgY3VycmVudCBleHBlcmltZW50IHdpbGwgYmUgY2FuY2VsbGVkIGFuZCB5b3Ugd2lsbCBub3cgcmV0dXJuIHRvIHRoZSB2b2x1bWUgc2V0dGluZyBzY3JlZW4uXCIsXG4gICAgICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCJcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucm91dGVyRXh0ZW5zaW9ucy5uYXZpZ2F0ZShbXCIvdm9sdW1lXCJdLCB7Y2xlYXJIaXN0b3J5OiB0cnVlfSk7XG4gICAgICAgIH0pLmNhdGNoKGVyciA9PiBjb25zb2xlLmxvZyhlcnIpKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5hdWRpb1Nlc3Npb24uYWRkT2JzZXJ2ZXJGb3JLZXlQYXRoT3B0aW9uc0NvbnRleHQodGhpcy5tYXN0ZXJWb2x1bWVPYnNlcnZlciwgXCJvdXRwdXRWb2x1bWVcIiwgTlNLZXlWYWx1ZU9ic2VydmluZ09wdGlvbnMuTmV3LCBudWxsKTtcblxuICAgICAgdGhpcy5wYWdlLm9uKFwibmF2aWdhdGluZ0Zyb21cIiwgKGRhdGE6IEV2ZW50RGF0YSkgPT4ge1xuICAgICAgICBpZiAodGhpcy5wbGF5aW5nKSB7XG4gICAgICAgICAgdGhpcy5wbGF5ZXIuZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYXVkaW9TZXNzaW9uLnJlbW92ZU9ic2VydmVyRm9yS2V5UGF0aCh0aGlzLm1hc3RlclZvbHVtZU9ic2VydmVyLCBcIm91dHB1dFZvbHVtZVwiKTtcbiAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgbmdPbkluaXQoKSB7XG5cbiAgICB9XG5cbiAgICBjaG9vc2VTdGltdWx1cyhzdGltOkNhbGlicmF0aW9uT3B0aW9ucywgZXZlbnQ6RXZlbnREYXRhKSB7XG4gICAgICBjb25zb2xlLmxvZyhzdGltKTtcblxuICAgICAgbGV0IGJ1dHRvbiA9IDxCdXR0b24+ZXZlbnQub2JqZWN0O1xuXG4gICAgICBpZiAodGhpcy5waWNrZWRTdGltdWx1cyA9PSBzdGltKSB7XG4gICAgICAgIHRoaXMucGlja2VkU3RpbXVsdXMgPSBudWxsO1xuICAgICAgICB0aGlzLmVuYWJsZVBsYXkgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucGlja2VkU3RpbXVsdXMgPSBzdGltO1xuICAgICAgICB0aGlzLmVuYWJsZVBsYXkgPSB0cnVlO1xuICAgICAgfVxuXG5cbiAgICB9XG5cbiAgICBzYXZlVmFsdWVzKCkge1xuICAgICAgbGV0IHRtcF9iZyA9IE51bWJlcih0aGlzLnNwbF9iYWNrZ3JvdW5kKTtcbiAgICAgIGlmICghTnVtYmVyLmlzTmFOKHRtcF9iZykpIHtcbiAgICAgICAgYXBwU2V0dGluZ3Muc2V0TnVtYmVyKFwic3BsX2JhY2tncm91bmRcIiwgdG1wX2JnKTtcbiAgICAgIH1cbiAgICAgIGxldCB0bXBfMWsgPSBOdW1iZXIodGhpcy5zcGxfdG9uZTFrKTtcbiAgICAgIGlmICghTnVtYmVyLmlzTmFOKHRtcF8xaykpIHtcbiAgICAgICAgYXBwU2V0dGluZ3Muc2V0TnVtYmVyKFwic3BsX3RvbmUxa1wiLCB0bXBfMWspO1xuICAgICAgfVxuICAgICAgbGV0IHRtcF8yayA9IE51bWJlcih0aGlzLnNwbF90b25lMmspO1xuICAgICAgaWYgKCFOdW1iZXIuaXNOYU4odG1wXzJrKSkge1xuICAgICAgICBhcHBTZXR0aW5ncy5zZXROdW1iZXIoXCJzcGxfdG9uZTJrXCIsIHRtcF8yayk7XG4gICAgICB9XG4gICAgICBsZXQgdG1wXzRrID0gTnVtYmVyKHRoaXMuc3BsX3RvbmU0ayk7XG4gICAgICBpZiAoIU51bWJlci5pc05hTih0bXBfNGspKSB7XG4gICAgICAgIGFwcFNldHRpbmdzLnNldE51bWJlcihcInNwbF90b25lNGtcIiwgdG1wXzRrKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwbGF5U3RpbXVsdXMoKSB7XG4gICAgICBpZiAodGhpcy5wbGF5aW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBsYXllci5wYXVzZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMucGxheWluZyA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMuc3VibWl0dGVkID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5wbGF5QnV0dG9uVGV4dCA9IFwiUGxheSBzdGltdWx1c1wiO1xuICAgICAgICAgIHRoaXMucGxheWVyLmRpc3Bvc2UoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3VibWl0dGVkID0gdHJ1ZTtcblxuICAgICAgbGV0IG5vaXNlX2dhcCA9IDA7XG4gICAgICBsZXQgdG9uZV9sZXZlbCA9IGVudi5tYXhUYXJnZXRMZXZlbF9kQjtcblxuICAgICAgdGhpcy52b2x1bWUgPSAxO1xuXG4gICAgICBsZXQgcGxheWVyT3B0aW9uczpHcmlkUGxheWVyT3B0aW9ucyA9IHtcbiAgICAgICAgdGFyZ2V0RnJlcXVlbmN5OiAwLFxuICAgICAgICBsb29wOiB0cnVlLFxuICAgICAgICBwYWRkZWRTaWxlbmNlRHVyYXRpb246IDAsXG4gICAgICAgIHRhcmdldER1cmF0aW9uOiBlbnYudmVyaWZ5YXVkaW8udGFyZ2V0RHVyYXRpb25fcyxcbiAgICAgICAgbWFza2VyRHVyYXRpb246IGVudi52ZXJpZnlhdWRpby5tYXNrZXJEdXJhdGlvbl9zLFxuICAgICAgICBtYXNrZXJMZXZlbDogMCxcbiAgICAgICAgY2hhbm5lbE9wdGlvbnM6IENoYW5uZWxPcHRpb25zLkRpb3RpYyxcbiAgICAgICAgc2V0dGluZ3NQYXRoOiBmcy5rbm93bkZvbGRlcnMuZG9jdW1lbnRzKCkucGF0aCxcbiAgICAgICAgd2luZG93OiBmYWxzZSxcbiAgICAgICAgZXJyb3JDYWxsYmFjazogKGVycikgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3Igd2hpbGUgcGxheWluZzogXCIgKyBlcnIpO1xuICAgICAgICB9LFxuICAgICAgICBkZWJ1ZzogdHJ1ZSxcbiAgICAgICAgY29tcGVuc2F0ZTogdGhpcy5jb21wZW5zYXRlSGVhZHBob25lc1xuICAgICAgfTtcblxuICAgICAgdGhpcy5wbGF5ZXIgPSBuZXcgR3JpZFBsYXllcigpO1xuXG4gICAgICBsZXQgcGxheU1hc2tlciA9IGZhbHNlLCBwbGF5VGFyZ2V0ID0gZmFsc2U7XG4gICAgICBzd2l0Y2ggKHRoaXMucGlja2VkU3RpbXVsdXMpIHtcbiAgICAgICAgY2FzZSBDYWxpYnJhdGlvbk9wdGlvbnMuQmFja2dyb3VuZDoge1xuICAgICAgICAgIHBsYXlNYXNrZXIgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgQ2FsaWJyYXRpb25PcHRpb25zLlRvbmUxazoge1xuICAgICAgICAgIHBsYXllck9wdGlvbnMudGFyZ2V0RnJlcXVlbmN5ID0gMTAwMDtcbiAgICAgICAgICBwbGF5VGFyZ2V0ID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIENhbGlicmF0aW9uT3B0aW9ucy5Ub25lMms6IHtcbiAgICAgICAgICBwbGF5ZXJPcHRpb25zLnRhcmdldEZyZXF1ZW5jeSA9IDIwMDA7XG4gICAgICAgICAgcGxheVRhcmdldCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBDYWxpYnJhdGlvbk9wdGlvbnMuVG9uZTRrOiB7XG4gICAgICAgICAgcGxheWVyT3B0aW9ucy50YXJnZXRGcmVxdWVuY3kgPSA0MDAwO1xuICAgICAgICAgIHBsYXlUYXJnZXQgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5zaG93RXJyb3IoXCJVbmtub3duIHN0aW11bHVzIG9wdGlvbi5cIik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMucGxheWVyLmluaXRpYWxpemUocGxheWVyT3B0aW9ucykudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiUGxheWVyIGluaXRpYWxpemVkLCBwbGF5aW5nIGF0IHg6IFwiICsgbm9pc2VfZ2FwICsgXCIsIHk6IFwiICsgdG9uZV9sZXZlbCk7XG4gICAgICAgIHJldHVybiB0aGlzLnBsYXllci5wcmVsb2FkU3RpbXVsdXMobm9pc2VfZ2FwLCB0b25lX2xldmVsLCBwbGF5VGFyZ2V0LCBwbGF5TWFza2VyKTtcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLnBsYXllci52b2x1bWUgPSB0aGlzLnZvbHVtZTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGxheWVyLnBsYXkoKTtcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcIlBsYXlpbmdcIik7XG4gICAgICAgIHRoaXMucGxheWluZyA9IHRydWU7XG4gICAgICAgIHRoaXMucGxheUJ1dHRvblRleHQgPSBcIlN0b3BcIjtcbiAgICAgIH0pLmNhdGNoKGVyciA9PiB0aGlzLnNob3dFcnJvcihlcnIpKTtcbiAgICB9XG5cbiAgICBzaG93RXJyb3IoZXJyKSB7XG4gICAgICBkaWFsb2dzLmFsZXJ0KHtcbiAgICAgICAgdGl0bGU6ICdFcnJvcicsXG4gICAgICAgIG1lc3NhZ2U6IGVycixcbiAgICAgICAgb2tCdXR0b25UZXh0OiAnQ2xvc2UnXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgLy8gcGFzc1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgb25Td2l0Y2goYXJncykge1xuICAgICAgbGV0IHN3ID0gPFN3aXRjaD5hcmdzLm9iamVjdDtcbiAgICAgIGlmIChzdy5jaGVja2VkKSB7XG4gICAgICAgIHRoaXMuY29tcGVuc2F0ZUhlYWRwaG9uZXMgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jb21wZW5zYXRlSGVhZHBob25lcyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxufVxuIl19