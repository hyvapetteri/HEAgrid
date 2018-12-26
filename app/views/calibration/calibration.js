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
            debug: true
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsaWJyYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjYWxpYnJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUFrRDtBQUNsRCxnQ0FBK0I7QUFDL0Isd0RBQStEO0FBQy9ELG1FQUFxRTtBQUNyRSxzREFBMEU7QUFFMUUsaURBQW1EO0FBQ25ELHFEQUF1RDtBQUV2RCw4Q0FBZ0Q7QUFHaEQsNEVBQXlHO0FBQ3pHLDhEQUE2RDtBQUs3RCxJQUFZLGtCQUtYO0FBTEQsV0FBWSxrQkFBa0I7SUFDNUIsK0NBQXlCLENBQUE7SUFDekIsdUNBQWlCLENBQUE7SUFDakIsdUNBQWlCLENBQUE7SUFDakIsdUNBQWlCLENBQUE7QUFDbkIsQ0FBQyxFQUxXLGtCQUFrQixHQUFsQiwwQkFBa0IsS0FBbEIsMEJBQWtCLFFBSzdCO0FBT0Q7SUF1QkkseUJBQW9CLGVBQWdDLEVBQ2hDLGdCQUFrQyxFQUNsQyxJQUFVO1FBRjlCLGlCQTJDQztRQTNDbUIsb0JBQWUsR0FBZixlQUFlLENBQWlCO1FBQ2hDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7UUFDbEMsU0FBSSxHQUFKLElBQUksQ0FBTTtRQXhCdkIsZ0JBQVcsR0FBRyxrQkFBa0IsQ0FBQztRQTBCdEMsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsY0FBYyxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0UsQ0FBQztRQUNELEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxVQUFVLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkUs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Q0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ04sT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN2QixLQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNwQixLQUFJLENBQUMsY0FBYyxHQUFHLE1BQU0sQ0FBQztRQUMvQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQSxHQUFHLElBQUksT0FBQSxLQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFuQixDQUFtQixDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELG1DQUFTLEdBQVQsVUFBVSxHQUFHO1FBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQztZQUNaLEtBQUssRUFBRSxPQUFPO1lBQ2QsT0FBTyxFQUFFLEdBQUc7WUFDWixZQUFZLEVBQUUsT0FBTztTQUN0QixDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ04sT0FBTztRQUNULENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQTVMUSxlQUFlO1FBTDNCLGdCQUFTLENBQUM7WUFDUCxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkIsUUFBUSxFQUFFLGtCQUFrQjtZQUM1QixXQUFXLEVBQUUsa0JBQWtCO1NBQ2xDLENBQUM7eUNBd0J1Qyx5QkFBZTtZQUNkLHlCQUFnQjtZQUM1QixXQUFJO09BekJyQixlQUFlLENBOEwzQjtJQUFELHNCQUFDO0NBQUEsQUE5TEQsSUE4TEM7QUE5TFksMENBQWUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE9uSW5pdCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gXCJ1aS9wYWdlXCI7XG5pbXBvcnQgeyBTZXNzaW9uUHJvdmlkZXIgfSBmcm9tICcuLi8uLi9zaGFyZWQvc2Vzc2lvbi9zZXNzaW9uJztcbmltcG9ydCAqIGFzIGFwcFNldHRpbmdzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2FwcGxpY2F0aW9uLXNldHRpbmdzXCI7XG5pbXBvcnQgeyBSb3V0ZXJFeHRlbnNpb25zLCBQYWdlUm91dGUgfSBmcm9tICduYXRpdmVzY3JpcHQtYW5ndWxhci9yb3V0ZXInO1xuaW1wb3J0IHsgc3dpdGNoTWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvZmlsZS1zeXN0ZW1cIjtcbmltcG9ydCAqIGFzIGRpYWxvZ3MgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvdWkvZGlhbG9nc1wiO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tIFwiLi4vLi4vc2hhcmVkL3V0aWxzXCI7XG5pbXBvcnQgKiBhcyBlbnYgZnJvbSBcIi4uLy4uL2NvbmZpZy9lbnZpcm9ubWVudFwiO1xuXG5pbXBvcnQgeyBHcmlkVHJhY2tlciwgR3JpZFRyYWNraW5nU3RhdHVzLCBHcmlkRGlyZWN0aW9uLCBUcmlhbEFuc3dlciwgUGFyYW1HcmlkIH0gZnJvbSAnLi4vLi4vc2hhcmVkL2dyaWQvZ3JpZCc7XG5pbXBvcnQgeyBHcmlkUGxheWVyLCBHcmlkUGxheWVyT3B0aW9ucywgQ2hhbm5lbE9wdGlvbnMgfSBmcm9tIFwiLi4vLi4vc2hhcmVkL2dyaWQtcGxheWVyL2dyaWQtcGxheWVyLWlvc1wiO1xuaW1wb3J0IHsgVm9sdW1lT2JzZXJ2ZXIgfSBmcm9tIFwiLi4vLi4vc2hhcmVkL3ZvbHVtZW9ic2VydmVyXCI7XG5pbXBvcnQgeyBPYnNlcnZhYmxlQXJyYXkgfSBmcm9tIFwiZGF0YS9vYnNlcnZhYmxlLWFycmF5XCI7XG5pbXBvcnQgeyBFdmVudERhdGEgfSBmcm9tIFwiZGF0YS9vYnNlcnZhYmxlXCI7XG5pbXBvcnQgeyBCdXR0b24gfSBmcm9tIFwidWkvYnV0dG9uXCI7XG5cbmV4cG9ydCBlbnVtIENhbGlicmF0aW9uT3B0aW9ucyB7XG4gIEJhY2tncm91bmQgPSBcImJhY2tncm91bmRcIixcbiAgVG9uZTFrID0gXCJ0b25lMWtcIixcbiAgVG9uZTJrID0gXCJ0b25lMmtcIixcbiAgVG9uZTRrID0gXCJ0b25lNGtcIlxufVxuXG5AQ29tcG9uZW50KHtcbiAgICBtb2R1bGVJZDogbW9kdWxlLmlkLFxuICAgIHNlbGVjdG9yOiAndmlldy1jYWxpYnJhdGlvbicsXG4gICAgdGVtcGxhdGVVcmw6ICdjYWxpYnJhdGlvbi5odG1sJ1xufSlcbmV4cG9ydCBjbGFzcyBDYWxpYnJhdGlvblBhZ2UgaW1wbGVtZW50cyBPbkluaXQge1xuICAgIHB1YmxpYyBzdGltT3B0aW9ucyA9IENhbGlicmF0aW9uT3B0aW9ucztcblxuICAgIHByaXZhdGUgYXVkaW9QYXRoOnN0cmluZztcbiAgICAvL3ByaXZhdGUgcGxheWVyOlROU1BsYXllcjtcbiAgICBwcml2YXRlIHBsYXllcjogR3JpZFBsYXllcjtcbiAgICBwcml2YXRlIHZvbHVtZTpudW1iZXI7XG4gICAgcHJpdmF0ZSBwaWNrZWRTdGltdWx1czogQ2FsaWJyYXRpb25PcHRpb25zfG51bGw7XG5cbiAgICBwcml2YXRlIHBsYXlpbmc6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSBlbmFibGVQbGF5OiBib29sZWFuO1xuICAgIHByaXZhdGUgcGxheUJ1dHRvblRleHQ6IHN0cmluZztcblxuICAgIHByaXZhdGUgc3VibWl0dGVkOiBib29sZWFuO1xuXG4gICAgcHJpdmF0ZSBhdWRpb1Nlc3Npb246IEFWQXVkaW9TZXNzaW9uO1xuICAgIHByaXZhdGUgbWFzdGVyVm9sdW1lT2JzZXJ2ZXI6IFZvbHVtZU9ic2VydmVyO1xuXG4gICAgcHJpdmF0ZSBzcGxfYmFja2dyb3VuZDogc3RyaW5nO1xuICAgIHByaXZhdGUgc3BsX3RvbmUxazogc3RyaW5nO1xuICAgIHByaXZhdGUgc3BsX3RvbmUyazogc3RyaW5nO1xuICAgIHByaXZhdGUgc3BsX3RvbmU0azogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBzZXNzaW9uUHJvdmlkZXI6IFNlc3Npb25Qcm92aWRlcixcbiAgICAgICAgICAgICAgICBwcml2YXRlIHJvdXRlckV4dGVuc2lvbnM6IFJvdXRlckV4dGVuc2lvbnMsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBwYWdlOiBQYWdlKSB7XG5cbiAgICAgIGlmIChhcHBTZXR0aW5ncy5oYXNLZXkoXCJzcGxfYmFja2dyb3VuZFwiKSkge1xuICAgICAgICB0aGlzLnNwbF9iYWNrZ3JvdW5kID0gYXBwU2V0dGluZ3MuZ2V0TnVtYmVyKFwic3BsX2JhY2tncm91bmRcIikudG9GaXhlZCgxKTtcbiAgICAgIH1cbiAgICAgIGlmIChhcHBTZXR0aW5ncy5oYXNLZXkoXCJzcGxfdG9uZTFrXCIpKSB7XG4gICAgICAgIHRoaXMuc3BsX3RvbmUxayA9IGFwcFNldHRpbmdzLmdldE51bWJlcihcInNwbF90b25lMWtcIikudG9GaXhlZCgxKTtcbiAgICAgIH1cbiAgICAgIGlmIChhcHBTZXR0aW5ncy5oYXNLZXkoXCJzcGxfdG9uZTJrXCIpKSB7XG4gICAgICAgIHRoaXMuc3BsX3RvbmUyayA9IGFwcFNldHRpbmdzLmdldE51bWJlcihcInNwbF90b25lMmtcIikudG9GaXhlZCgxKTtcbiAgICAgIH1cbiAgICAgIGlmIChhcHBTZXR0aW5ncy5oYXNLZXkoXCJzcGxfdG9uZTRrXCIpKSB7XG4gICAgICAgIHRoaXMuc3BsX3RvbmU0ayA9IGFwcFNldHRpbmdzLmdldE51bWJlcihcInNwbF90b25lNGtcIikudG9GaXhlZCgxKTtcbiAgICAgIH1cblxuICAgICAgbGV0IGFwcFBhdGggPSBmcy5rbm93bkZvbGRlcnMuY3VycmVudEFwcCgpO1xuICAgICAgdGhpcy5hdWRpb1BhdGggPSBmcy5wYXRoLmpvaW4oYXBwUGF0aC5wYXRoLCAnYXVkaW8nKTtcblxuICAgICAgdGhpcy5zdWJtaXR0ZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMucGxheWluZyA9IGZhbHNlO1xuICAgICAgdGhpcy5lbmFibGVQbGF5ID0gZmFsc2U7XG4gICAgICB0aGlzLnBsYXlCdXR0b25UZXh0ID0gXCJQbGF5IHN0aW11bHVzXCI7XG4gICAgICB0aGlzLnBpY2tlZFN0aW11bHVzID0gbnVsbDtcblxuICAgICAgdGhpcy5hdWRpb1Nlc3Npb24gPSBBVkF1ZGlvU2Vzc2lvbi5zaGFyZWRJbnN0YW5jZSgpO1xuICAgICAgdGhpcy5tYXN0ZXJWb2x1bWVPYnNlcnZlciA9IG5ldyBWb2x1bWVPYnNlcnZlcigpO1xuICAgICAgdGhpcy5tYXN0ZXJWb2x1bWVPYnNlcnZlci5zZXRDYWxsYmFjaygob2JqKSA9PiB7XG4gICAgICAgIGRpYWxvZ3MuYWxlcnQoe1xuICAgICAgICAgIHRpdGxlOiBcIlZvbHVtZSBjaGFuZ2VkIVwiLFxuICAgICAgICAgIG1lc3NhZ2U6IFwiQSB2b2x1bWUgYnV0dG9uIHByZXNzIHdhcyBvYnNlcnZlZC4gVGhlIGN1cnJlbnQgZXhwZXJpbWVudCB3aWxsIGJlIGNhbmNlbGxlZCBhbmQgeW91IHdpbGwgbm93IHJldHVybiB0byB0aGUgdm9sdW1lIHNldHRpbmcgc2NyZWVuLlwiLFxuICAgICAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiXG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB0aGlzLnJvdXRlckV4dGVuc2lvbnMubmF2aWdhdGUoW1wiL3ZvbHVtZVwiXSwge2NsZWFySGlzdG9yeTogdHJ1ZX0pO1xuICAgICAgICB9KS5jYXRjaChlcnIgPT4gY29uc29sZS5sb2coZXJyKSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuYXVkaW9TZXNzaW9uLmFkZE9ic2VydmVyRm9yS2V5UGF0aE9wdGlvbnNDb250ZXh0KHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIsIFwib3V0cHV0Vm9sdW1lXCIsIE5TS2V5VmFsdWVPYnNlcnZpbmdPcHRpb25zLk5ldywgbnVsbCk7XG5cbiAgICAgIHRoaXMucGFnZS5vbihcIm5hdmlnYXRpbmdGcm9tXCIsIChkYXRhOiBFdmVudERhdGEpID0+IHtcbiAgICAgICAgdGhpcy5hdWRpb1Nlc3Npb24ucmVtb3ZlT2JzZXJ2ZXJGb3JLZXlQYXRoKHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIsIFwib3V0cHV0Vm9sdW1lXCIpO1xuICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBuZ09uSW5pdCgpIHtcblxuICAgIH1cblxuICAgIGNob29zZVN0aW11bHVzKHN0aW06Q2FsaWJyYXRpb25PcHRpb25zLCBldmVudDpFdmVudERhdGEpIHtcbiAgICAgIGNvbnNvbGUubG9nKHN0aW0pO1xuXG4gICAgICBsZXQgYnV0dG9uID0gPEJ1dHRvbj5ldmVudC5vYmplY3Q7XG5cbiAgICAgIGlmICh0aGlzLnBpY2tlZFN0aW11bHVzID09IHN0aW0pIHtcbiAgICAgICAgdGhpcy5waWNrZWRTdGltdWx1cyA9IG51bGw7XG4gICAgICAgIHRoaXMuZW5hYmxlUGxheSA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5waWNrZWRTdGltdWx1cyA9IHN0aW07XG4gICAgICAgIHRoaXMuZW5hYmxlUGxheSA9IHRydWU7XG4gICAgICB9XG5cblxuICAgIH1cblxuICAgIHNhdmVWYWx1ZXMoKSB7XG4gICAgICBsZXQgdG1wX2JnID0gTnVtYmVyKHRoaXMuc3BsX2JhY2tncm91bmQpO1xuICAgICAgaWYgKCFOdW1iZXIuaXNOYU4odG1wX2JnKSkge1xuICAgICAgICBhcHBTZXR0aW5ncy5zZXROdW1iZXIoXCJzcGxfYmFja2dyb3VuZFwiLCB0bXBfYmcpO1xuICAgICAgfVxuICAgICAgbGV0IHRtcF8xayA9IE51bWJlcih0aGlzLnNwbF90b25lMWspO1xuICAgICAgaWYgKCFOdW1iZXIuaXNOYU4odG1wXzFrKSkge1xuICAgICAgICBhcHBTZXR0aW5ncy5zZXROdW1iZXIoXCJzcGxfdG9uZTFrXCIsIHRtcF8xayk7XG4gICAgICB9XG4gICAgICBsZXQgdG1wXzJrID0gTnVtYmVyKHRoaXMuc3BsX3RvbmUyayk7XG4gICAgICBpZiAoIU51bWJlci5pc05hTih0bXBfMmspKSB7XG4gICAgICAgIGFwcFNldHRpbmdzLnNldE51bWJlcihcInNwbF90b25lMmtcIiwgdG1wXzJrKTtcbiAgICAgIH1cbiAgICAgIGxldCB0bXBfNGsgPSBOdW1iZXIodGhpcy5zcGxfdG9uZTRrKTtcbiAgICAgIGlmICghTnVtYmVyLmlzTmFOKHRtcF80aykpIHtcbiAgICAgICAgYXBwU2V0dGluZ3Muc2V0TnVtYmVyKFwic3BsX3RvbmU0a1wiLCB0bXBfNGspO1xuICAgICAgfVxuICAgIH1cblxuICAgIHBsYXlTdGltdWx1cygpIHtcbiAgICAgIGlmICh0aGlzLnBsYXlpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGxheWVyLnBhdXNlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbGF5aW5nID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5zdWJtaXR0ZWQgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnBsYXlCdXR0b25UZXh0ID0gXCJQbGF5IHN0aW11bHVzXCI7XG4gICAgICAgICAgdGhpcy5wbGF5ZXIuZGlzcG9zZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdWJtaXR0ZWQgPSB0cnVlO1xuXG4gICAgICBsZXQgbm9pc2VfZ2FwID0gMDtcbiAgICAgIGxldCB0b25lX2xldmVsID0gZW52Lm1heFRhcmdldExldmVsX2RCO1xuXG4gICAgICB0aGlzLnZvbHVtZSA9IDE7XG5cbiAgICAgIGxldCBwbGF5ZXJPcHRpb25zOkdyaWRQbGF5ZXJPcHRpb25zID0ge1xuICAgICAgICB0YXJnZXRGcmVxdWVuY3k6IDAsXG4gICAgICAgIGxvb3A6IHRydWUsXG4gICAgICAgIHBhZGRlZFNpbGVuY2VEdXJhdGlvbjogMCxcbiAgICAgICAgdGFyZ2V0RHVyYXRpb246IGVudi52ZXJpZnlhdWRpby50YXJnZXREdXJhdGlvbl9zLFxuICAgICAgICBtYXNrZXJEdXJhdGlvbjogZW52LnZlcmlmeWF1ZGlvLm1hc2tlckR1cmF0aW9uX3MsXG4gICAgICAgIG1hc2tlckxldmVsOiAwLFxuICAgICAgICBjaGFubmVsT3B0aW9uczogQ2hhbm5lbE9wdGlvbnMuRGlvdGljLFxuICAgICAgICBzZXR0aW5nc1BhdGg6IHRoaXMuYXVkaW9QYXRoLFxuICAgICAgICB3aW5kb3c6IGZhbHNlLFxuICAgICAgICBlcnJvckNhbGxiYWNrOiAoZXJyKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciB3aGlsZSBwbGF5aW5nOiBcIiArIGVycik7XG4gICAgICAgIH0sXG4gICAgICAgIGRlYnVnOiB0cnVlXG4gICAgICB9O1xuICAgICAgdGhpcy5wbGF5ZXIgPSBuZXcgR3JpZFBsYXllcigpO1xuXG4gICAgICBsZXQgcGxheU1hc2tlciA9IGZhbHNlLCBwbGF5VGFyZ2V0ID0gZmFsc2U7XG4gICAgICBzd2l0Y2ggKHRoaXMucGlja2VkU3RpbXVsdXMpIHtcbiAgICAgICAgY2FzZSBDYWxpYnJhdGlvbk9wdGlvbnMuQmFja2dyb3VuZDoge1xuICAgICAgICAgIHBsYXlNYXNrZXIgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgQ2FsaWJyYXRpb25PcHRpb25zLlRvbmUxazoge1xuICAgICAgICAgIHBsYXllck9wdGlvbnMudGFyZ2V0RnJlcXVlbmN5ID0gMTAwMDtcbiAgICAgICAgICBwbGF5VGFyZ2V0ID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIENhbGlicmF0aW9uT3B0aW9ucy5Ub25lMms6IHtcbiAgICAgICAgICBwbGF5ZXJPcHRpb25zLnRhcmdldEZyZXF1ZW5jeSA9IDIwMDA7XG4gICAgICAgICAgcGxheVRhcmdldCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBDYWxpYnJhdGlvbk9wdGlvbnMuVG9uZTRrOiB7XG4gICAgICAgICAgcGxheWVyT3B0aW9ucy50YXJnZXRGcmVxdWVuY3kgPSA0MDAwO1xuICAgICAgICAgIHBsYXlUYXJnZXQgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5zaG93RXJyb3IoXCJVbmtub3duIHN0aW11bHVzIG9wdGlvbi5cIik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMucGxheWVyLmluaXRpYWxpemUocGxheWVyT3B0aW9ucykudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiUGxheWVyIGluaXRpYWxpemVkLCBwbGF5aW5nIGF0IHg6IFwiICsgbm9pc2VfZ2FwICsgXCIsIHk6IFwiICsgdG9uZV9sZXZlbCk7XG4gICAgICAgIHJldHVybiB0aGlzLnBsYXllci5wcmVsb2FkU3RpbXVsdXMobm9pc2VfZ2FwLCB0b25lX2xldmVsLCBwbGF5VGFyZ2V0LCBwbGF5TWFza2VyKTtcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLnBsYXllci52b2x1bWUgPSB0aGlzLnZvbHVtZTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGxheWVyLnBsYXkoKTtcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcIlBsYXlpbmdcIik7XG4gICAgICAgIHRoaXMucGxheWluZyA9IHRydWU7XG4gICAgICAgIHRoaXMucGxheUJ1dHRvblRleHQgPSBcIlN0b3BcIjtcbiAgICAgIH0pLmNhdGNoKGVyciA9PiB0aGlzLnNob3dFcnJvcihlcnIpKTtcbiAgICB9XG5cbiAgICBzaG93RXJyb3IoZXJyKSB7XG4gICAgICBkaWFsb2dzLmFsZXJ0KHtcbiAgICAgICAgdGl0bGU6ICdFcnJvcicsXG4gICAgICAgIG1lc3NhZ2U6IGVycixcbiAgICAgICAgb2tCdXR0b25UZXh0OiAnQ2xvc2UnXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgLy8gcGFzc1xuICAgICAgfSk7XG4gICAgfVxuXG59XG4iXX0=