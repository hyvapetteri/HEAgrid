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
            if (_this.playing) {
                _this.player.dispose();
            }
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
            settingsPath: fs.knownFolders.documents().path,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyaWZ5YXVkaW8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ2ZXJpZnlhdWRpby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUFrRDtBQUNsRCxnQ0FBK0I7QUFDL0Isd0RBQTZGO0FBQzdGLHNEQUEwRTtBQUMxRSxtRUFBcUU7QUFFckUsaURBQW1EO0FBQ25ELHFEQUF1RDtBQUN2RCx5Q0FBMkM7QUFDM0MsOENBQWdEO0FBR2hELDRFQUF5RztBQUN6Ryw4REFBNkQ7QUFLN0QsSUFBWSxjQU9YO0FBUEQsV0FBWSxjQUFjO0lBQ3hCLDJDQUF5QixDQUFBO0lBQ3pCLDBEQUF3QyxDQUFBO0lBQ3hDLCtCQUFhLENBQUE7SUFDYiw4Q0FBNEIsQ0FBQTtJQUM1QixzREFBb0MsQ0FBQTtJQUNwQyw0REFBMEMsQ0FBQTtBQUM1QyxDQUFDLEVBUFcsY0FBYyxHQUFkLHNCQUFjLEtBQWQsc0JBQWMsUUFPekI7QUFRRDtJQXlCSSx5QkFBb0IsZUFBZ0MsRUFDaEMsZ0JBQWtDLEVBQ2xDLElBQVU7UUFGOUIsaUJBeUNDO1FBekNtQixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFDaEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUNsQyxTQUFJLEdBQUosSUFBSSxDQUFNO1FBMUJ2QixnQkFBVyxHQUFHLGNBQWMsQ0FBQztRQTRCbEMsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMzQyxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFckQsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFFOUQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFJLENB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Q0FBQztRQUNwRixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDTixLQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxLQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxLQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNOLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdkIsS0FBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDcEIsS0FBSSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUM7UUFDL0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQUEsR0FBRyxJQUFJLE9BQUEsS0FBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBbkIsQ0FBbUIsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxtQ0FBUyxHQUFULFVBQVUsR0FBRztRQUNYLE9BQU8sQ0FBQyxLQUFLLENBQUM7WUFDWixLQUFLLEVBQUUsT0FBTztZQUNkLE9BQU8sRUFBRSxHQUFHO1lBQ1osWUFBWSxFQUFFLE9BQU87U0FDdEIsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNOLE9BQU87UUFDVCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUE1TlEsZUFBZTtRQU4zQixnQkFBUyxDQUFDO1lBQ1AsUUFBUSxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ25CLFFBQVEsRUFBRSxrQkFBa0I7WUFDNUIsV0FBVyxFQUFFLGtCQUFrQjtZQUMvQixTQUFTLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQztTQUNuQyxDQUFDO3lDQTBCdUMseUJBQWU7WUFDZCx5QkFBZ0I7WUFDNUIsV0FBSTtPQTNCckIsZUFBZSxDQThOM0I7SUFBRCxzQkFBQztDQUFBLEFBOU5ELElBOE5DO0FBOU5ZLDBDQUFlIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBPbkluaXQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tIFwidWkvcGFnZVwiO1xuaW1wb3J0IHsgU2Vzc2lvblByb3ZpZGVyLCBFeHBlcmltZW50LCBFeHBlcmltZW50U3RhdHVzIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3Nlc3Npb24vc2Vzc2lvbic7XG5pbXBvcnQgeyBSb3V0ZXJFeHRlbnNpb25zLCBQYWdlUm91dGUgfSBmcm9tICduYXRpdmVzY3JpcHQtYW5ndWxhci9yb3V0ZXInO1xuaW1wb3J0ICogYXMgYXBwU2V0dGluZ3MgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvYXBwbGljYXRpb24tc2V0dGluZ3NcIjtcbmltcG9ydCB7IHN3aXRjaE1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2ZpbGUtc3lzdGVtXCI7XG5pbXBvcnQgKiBhcyBkaWFsb2dzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL2RpYWxvZ3NcIjtcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSBcIi4uLy4uL3NoYXJlZC91dGlsc1wiO1xuaW1wb3J0ICogYXMgZW52IGZyb20gXCIuLi8uLi9jb25maWcvZW52aXJvbm1lbnRcIjtcblxuaW1wb3J0IHsgR3JpZFRyYWNrZXIsIEdyaWRUcmFja2luZ1N0YXR1cywgR3JpZERpcmVjdGlvbiwgVHJpYWxBbnN3ZXIsIFBhcmFtR3JpZCB9IGZyb20gJy4uLy4uL3NoYXJlZC9ncmlkL2dyaWQnO1xuaW1wb3J0IHsgR3JpZFBsYXllciwgR3JpZFBsYXllck9wdGlvbnMsIENoYW5uZWxPcHRpb25zIH0gZnJvbSBcIi4uLy4uL3NoYXJlZC9ncmlkLXBsYXllci9ncmlkLXBsYXllci1pb3NcIjtcbmltcG9ydCB7IFZvbHVtZU9ic2VydmVyIH0gZnJvbSBcIi4uLy4uL3NoYXJlZC92b2x1bWVvYnNlcnZlclwiO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZUFycmF5IH0gZnJvbSBcImRhdGEvb2JzZXJ2YWJsZS1hcnJheVwiO1xuaW1wb3J0IHsgRXZlbnREYXRhIH0gZnJvbSBcImRhdGEvb2JzZXJ2YWJsZVwiO1xuaW1wb3J0IHsgQnV0dG9uIH0gZnJvbSBcInVpL2J1dHRvblwiO1xuXG5leHBvcnQgZW51bSBTdGltdWxpT3B0aW9ucyB7XG4gIEJhY2tncm91bmQgPSBcImJhY2tncm91bmRcIixcbiAgQmFja2dyb3VuZFRIID0gXCJiYWNrZ3JvdW5kX2F0X3RocmVzaG9sZFwiLFxuICBUb25lID0gXCJ0b25lXCIsXG4gIFRvbmVUSCA9IFwidG9uZV9hdF90aHJlc2hvbGRcIixcbiAgR3JpZFBvaW50VGFyZ2V0ID0gXCJncmlkcG9pbnRfdGFyZ2V0XCIsXG4gIEdyaWRQb2ludE5vbnRhcmdldCA9IFwiZ3JpZHBvaW50X25vbnRhcmdldFwiXG59XG5cbkBDb21wb25lbnQoe1xuICAgIG1vZHVsZUlkOiBtb2R1bGUuaWQsXG4gICAgc2VsZWN0b3I6ICd2aWV3LXZlcmlmeWF1ZGlvJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3ZlcmlmeWF1ZGlvLmh0bWwnLFxuICAgIHN0eWxlVXJsczogWycuL3ZlcmlmeWF1ZGlvLmNzcyddXG59KVxuZXhwb3J0IGNsYXNzIFZlcmlmeUF1ZGlvUGFnZSBpbXBsZW1lbnRzIE9uSW5pdCB7XG4gICAgcHVibGljIHN0aW1PcHRpb25zID0gU3RpbXVsaU9wdGlvbnM7XG5cbiAgICBwcml2YXRlIGF1ZGlvUGF0aDpzdHJpbmc7XG4gICAgcHJpdmF0ZSBleHBlcmltZW50OkV4cGVyaW1lbnQ7XG4gICAgLy9wcml2YXRlIHBsYXllcjpUTlNQbGF5ZXI7XG4gICAgcHJpdmF0ZSBwbGF5ZXI6IEdyaWRQbGF5ZXI7XG4gICAgcHJpdmF0ZSB2b2x1bWU6bnVtYmVyO1xuICAgIHByaXZhdGUgcGlja2VkU3RpbXVsdXM6IFN0aW11bGlPcHRpb25zfG51bGw7XG4gICAgcHJpdmF0ZSB4dmFsOm51bWJlcjtcbiAgICBwcml2YXRlIHl2YWw6bnVtYmVyO1xuICAgIHByaXZhdGUgeGxpbTpbbnVtYmVyLG51bWJlcl07XG4gICAgcHJpdmF0ZSB5bGltOltudW1iZXIsbnVtYmVyXTtcblxuICAgIHByaXZhdGUgcGxheWluZzogYm9vbGVhbjtcbiAgICBwcml2YXRlIGVuYWJsZVBsYXk6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSBwbGF5QnV0dG9uVGV4dDogc3RyaW5nO1xuXG4gICAgcHJpdmF0ZSBzdWJtaXR0ZWQ6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSB4aW52YWxpZDogYm9vbGVhbjtcbiAgICBwcml2YXRlIHlpbnZhbGlkOiBib29sZWFuO1xuXG4gICAgcHJpdmF0ZSBhdWRpb1Nlc3Npb246IEFWQXVkaW9TZXNzaW9uO1xuICAgIHByaXZhdGUgbWFzdGVyVm9sdW1lT2JzZXJ2ZXI6IFZvbHVtZU9ic2VydmVyO1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBzZXNzaW9uUHJvdmlkZXI6IFNlc3Npb25Qcm92aWRlcixcbiAgICAgICAgICAgICAgICBwcml2YXRlIHJvdXRlckV4dGVuc2lvbnM6IFJvdXRlckV4dGVuc2lvbnMsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBwYWdlOiBQYWdlKSB7XG5cbiAgICAgIGxldCBhcHBQYXRoID0gZnMua25vd25Gb2xkZXJzLmN1cnJlbnRBcHAoKTtcbiAgICAgIHRoaXMuYXVkaW9QYXRoID0gZnMucGF0aC5qb2luKGFwcFBhdGgucGF0aCwgJ2F1ZGlvJyk7XG5cbiAgICAgIHRoaXMuZXhwZXJpbWVudCA9IHRoaXMuc2Vzc2lvblByb3ZpZGVyLmdldEN1cnJlbnRFeHBlcmltZW50KCk7XG5cbiAgICAgIHRoaXMueHZhbCA9IHRoaXMuZXhwZXJpbWVudC5ncmlkLmdldFN0YXR1cygpLnh2YWw7XG4gICAgICB0aGlzLnl2YWwgPSB0aGlzLmV4cGVyaW1lbnQuZ3JpZC5nZXRTdGF0dXMoKS55dmFsO1xuXG4gICAgICB0aGlzLnhsaW0gPSB0aGlzLmV4cGVyaW1lbnQuZ3JpZC5nZXRYbGltKCk7XG4gICAgICB0aGlzLnlsaW0gPSB0aGlzLmV4cGVyaW1lbnQuZ3JpZC5nZXRZbGltKCk7XG5cbiAgICAgIHRoaXMuc3VibWl0dGVkID0gZmFsc2U7XG4gICAgICB0aGlzLnBsYXlpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMuZW5hYmxlUGxheSA9IGZhbHNlO1xuICAgICAgdGhpcy5wbGF5QnV0dG9uVGV4dCA9IFwiUGxheSBzdGltdWx1c1wiO1xuICAgICAgdGhpcy5waWNrZWRTdGltdWx1cyA9IG51bGw7XG5cbiAgICAgIHRoaXMuYXVkaW9TZXNzaW9uID0gQVZBdWRpb1Nlc3Npb24uc2hhcmVkSW5zdGFuY2UoKTtcbiAgICAgIHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIgPSBuZXcgVm9sdW1lT2JzZXJ2ZXIoKTtcbiAgICAgIHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIuc2V0Q2FsbGJhY2soKG9iaikgPT4ge1xuICAgICAgICBkaWFsb2dzLmFsZXJ0KHtcbiAgICAgICAgICB0aXRsZTogXCJWb2x1bWUgY2hhbmdlZCFcIixcbiAgICAgICAgICBtZXNzYWdlOiBcIkEgdm9sdW1lIGJ1dHRvbiBwcmVzcyB3YXMgb2JzZXJ2ZWQuIFRoZSBjdXJyZW50IGV4cGVyaW1lbnQgd2lsbCBiZSBjYW5jZWxsZWQgYW5kIHlvdSB3aWxsIG5vdyByZXR1cm4gdG8gdGhlIHZvbHVtZSBzZXR0aW5nIHNjcmVlbi5cIixcbiAgICAgICAgICBva0J1dHRvblRleHQ6IFwiT0tcIlxuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFtcIi92b2x1bWVcIl0sIHtjbGVhckhpc3Rvcnk6IHRydWV9KTtcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IGNvbnNvbGUubG9nKGVycikpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmF1ZGlvU2Vzc2lvbi5hZGRPYnNlcnZlckZvcktleVBhdGhPcHRpb25zQ29udGV4dCh0aGlzLm1hc3RlclZvbHVtZU9ic2VydmVyLCBcIm91dHB1dFZvbHVtZVwiLCBOU0tleVZhbHVlT2JzZXJ2aW5nT3B0aW9ucy5OZXcsIG51bGwpO1xuXG4gICAgICB0aGlzLnBhZ2Uub24oXCJuYXZpZ2F0aW5nRnJvbVwiLCAoZGF0YTogRXZlbnREYXRhKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnBsYXlpbmcpIHtcbiAgICAgICAgICB0aGlzLnBsYXllci5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hdWRpb1Nlc3Npb24ucmVtb3ZlT2JzZXJ2ZXJGb3JLZXlQYXRoKHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIsIFwib3V0cHV0Vm9sdW1lXCIpO1xuICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBuZ09uSW5pdCgpIHtcblxuICAgIH1cblxuICAgIGNob29zZVN0aW11bHVzKHN0aW06U3RpbXVsaU9wdGlvbnMsIGV2ZW50OkV2ZW50RGF0YSkge1xuICAgICAgY29uc29sZS5sb2coc3RpbSk7XG5cbiAgICAgIGxldCBidXR0b24gPSA8QnV0dG9uPmV2ZW50Lm9iamVjdDtcblxuICAgICAgaWYgKHRoaXMucGlja2VkU3RpbXVsdXMgPT0gc3RpbSkge1xuICAgICAgICB0aGlzLnBpY2tlZFN0aW11bHVzID0gbnVsbDtcbiAgICAgICAgdGhpcy5lbmFibGVQbGF5ID0gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnBpY2tlZFN0aW11bHVzID0gc3RpbTtcbiAgICAgICAgdGhpcy5lbmFibGVQbGF5ID0gdHJ1ZTtcbiAgICAgIH1cblxuXG4gICAgfVxuXG4gICAgcGxheVN0aW11bHVzKCkge1xuICAgICAgaWYgKHRoaXMucGxheWluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5wbGF5ZXIucGF1c2UoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICB0aGlzLnBsYXlpbmcgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnN1Ym1pdHRlZCA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMucGxheUJ1dHRvblRleHQgPSBcIlBsYXkgc3RpbXVsdXNcIjtcbiAgICAgICAgICB0aGlzLnBsYXllci5kaXNwb3NlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN1Ym1pdHRlZCA9IHRydWU7XG5cbiAgICAgIGxldCB4Y29vcmQgPSAtMSwgeWNvb3JkID0gLTE7XG4gICAgICBsZXQgY2hlY2tfY29vcmRpbmF0ZXMgPSBmYWxzZTtcbiAgICAgIGlmICgodGhpcy5waWNrZWRTdGltdWx1cyA9PSBTdGltdWxpT3B0aW9ucy5HcmlkUG9pbnRUYXJnZXQpIHx8ICh0aGlzLnBpY2tlZFN0aW11bHVzID09IFN0aW11bGlPcHRpb25zLkdyaWRQb2ludE5vbnRhcmdldCkpIHtcbiAgICAgICAgY2hlY2tfY29vcmRpbmF0ZXMgPSB0cnVlO1xuICAgICAgICB4Y29vcmQgPSBOdW1iZXIodGhpcy54dmFsKTtcbiAgICAgICAgeWNvb3JkID0gTnVtYmVyKHRoaXMueXZhbCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMueGludmFsaWQgPSBmYWxzZTtcbiAgICAgIHRoaXMueWludmFsaWQgPSBmYWxzZTtcblxuICAgICAgaWYgKGlzTmFOKHhjb29yZCkgfHwgKHhjb29yZCA8IHRoaXMueGxpbVswXSkgfHwgKHhjb29yZCA+IHRoaXMueGxpbVsxXSkpIHtcbiAgICAgICAgdGhpcy54aW52YWxpZCA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAoaXNOYU4oeWNvb3JkKSB8fCAoeWNvb3JkIDwgdGhpcy55bGltWzBdKSB8fCAoeWNvb3JkID4gdGhpcy55bGltWzFdKSkge1xuICAgICAgICB0aGlzLnlpbnZhbGlkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ3g6ICcgKyB4Y29vcmQgKyAnLCB5OiAnICsgeWNvb3JkKTtcblxuICAgICAgaWYgKGNoZWNrX2Nvb3JkaW5hdGVzICYmICh0aGlzLnhpbnZhbGlkIHx8IHRoaXMueWludmFsaWQpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiSW52YWxpZCBjb29yZGluYXRlc1wiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBsZXQgbm9pc2VfZ2FwID0geGNvb3JkO1xuICAgICAgbGV0IHRvbmVfbGV2ZWwgPSB5Y29vcmQ7XG5cbiAgICAgIGxldCBmcmVxID0gdGhpcy5leHBlcmltZW50LnRlc3RGcmVxdWVuY3k7XG5cbiAgICAgIHRoaXMudm9sdW1lID0gMTtcblxuICAgICAgbGV0IGJnX3JlZl9sZXZlbDtcbiAgICAgIGlmIChhcHBTZXR0aW5ncy5oYXNLZXkoXCJzcGxfYmFja2dyb3VuZFwiKSkge1xuICAgICAgICBiZ19yZWZfbGV2ZWwgPSBhcHBTZXR0aW5ncy5nZXROdW1iZXIoXCJzcGxfYmFja2dyb3VuZFwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNob3dFcnJvcihcIkNhbGlicmF0ZSBsZXZlbHMgZmlyc3QhXCIpO1xuICAgICAgfVxuXG4gICAgICBsZXQgcGxheWVyT3B0aW9uczpHcmlkUGxheWVyT3B0aW9ucyA9IHtcbiAgICAgICAgdGFyZ2V0RnJlcXVlbmN5OiB0aGlzLmV4cGVyaW1lbnQudGVzdEZyZXF1ZW5jeSxcbiAgICAgICAgbG9vcDogdHJ1ZSxcbiAgICAgICAgcGFkZGVkU2lsZW5jZUR1cmF0aW9uOiAwLFxuICAgICAgICB0YXJnZXREdXJhdGlvbjogZW52LnZlcmlmeWF1ZGlvLnRhcmdldER1cmF0aW9uX3MsXG4gICAgICAgIG1hc2tlckR1cmF0aW9uOiBlbnYudmVyaWZ5YXVkaW8ubWFza2VyRHVyYXRpb25fcyxcbiAgICAgICAgLy9tYXNrZXJMZXZlbDogdXRpbC5hMmRiKHRoaXMuZXhwZXJpbWVudC5ub2lzZVRocmVzaG9sZCkgKyBlbnYubWFza2VyTGV2ZWxfZEIsXG4gICAgICAgIG1hc2tlckxldmVsOiBlbnYubWFza2VyTGV2ZWxfZEIgLSBiZ19yZWZfbGV2ZWwsXG4gICAgICAgIGNoYW5uZWxPcHRpb25zOiBDaGFubmVsT3B0aW9ucy5EaW90aWMsXG4gICAgICAgIHNldHRpbmdzUGF0aDogZnMua25vd25Gb2xkZXJzLmRvY3VtZW50cygpLnBhdGgsXG4gICAgICAgIHdpbmRvdzogZmFsc2UsXG4gICAgICAgIGVycm9yQ2FsbGJhY2s6IChlcnIpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIHdoaWxlIHBsYXlpbmc6IFwiICsgZXJyKTtcbiAgICAgICAgfSxcbiAgICAgICAgZGVidWc6IHRydWUsXG4gICAgICAgIGNvbXBlbnNhdGU6IHRydWVcbiAgICAgIH07XG4gICAgICB0aGlzLnBsYXllciA9IG5ldyBHcmlkUGxheWVyKCk7XG5cbiAgICAgIGxldCBwbGF5TWFza2VyID0gZmFsc2UsIHBsYXlUYXJnZXQgPSBmYWxzZTtcbiAgICAgIHN3aXRjaCAodGhpcy5waWNrZWRTdGltdWx1cykge1xuICAgICAgICBjYXNlIFN0aW11bGlPcHRpb25zLkJhY2tncm91bmQ6IHtcbiAgICAgICAgICBub2lzZV9nYXAgPSAwO1xuICAgICAgICAgIHBsYXlNYXNrZXIgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgU3RpbXVsaU9wdGlvbnMuQmFja2dyb3VuZFRIOiB7XG4gICAgICAgICAgbm9pc2VfZ2FwID0gMDtcbiAgICAgICAgICAvL3RoaXMudm9sdW1lID0gdGhpcy5leHBlcmltZW50Lm5vaXNlVGhyZXNob2xkO1xuICAgICAgICAgIHBsYXllck9wdGlvbnMubWFza2VyTGV2ZWwgPSB1dGlsLmEyZGIodGhpcy5leHBlcmltZW50Lm5vaXNlVGhyZXNob2xkKTtcbiAgICAgICAgICBwbGF5TWFza2VyID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFN0aW11bGlPcHRpb25zLlRvbmU6IHtcbiAgICAgICAgICB0b25lX2xldmVsID0gdGhpcy5leHBlcmltZW50LmdyaWQuZ2V0WWxpbSgpWzFdO1xuICAgICAgICAgIG5vaXNlX2dhcCA9IDA7XG4gICAgICAgICAgcGxheVRhcmdldCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBTdGltdWxpT3B0aW9ucy5Ub25lVEg6IHtcbiAgICAgICAgICB0b25lX2xldmVsID0gdGhpcy5leHBlcmltZW50LmdyaWQuZ2V0WWxpbSgpWzBdO1xuICAgICAgICAgIG5vaXNlX2dhcCA9IDA7XG4gICAgICAgICAgcGxheVRhcmdldCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBTdGltdWxpT3B0aW9ucy5HcmlkUG9pbnRUYXJnZXQ6IHtcbiAgICAgICAgICBwbGF5VGFyZ2V0ID0gdHJ1ZTtcbiAgICAgICAgICBwbGF5TWFza2VyID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFN0aW11bGlPcHRpb25zLkdyaWRQb2ludE5vbnRhcmdldDoge1xuICAgICAgICAgIHBsYXlUYXJnZXQgPSBmYWxzZTtcbiAgICAgICAgICBwbGF5TWFza2VyID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2hvd0Vycm9yKFwiVW5rbm93biBzdGltdWx1cyBvcHRpb24uXCIpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLnBsYXllci5pbml0aWFsaXplKHBsYXllck9wdGlvbnMpLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcIlBsYXllciBpbml0aWFsaXplZCwgcGxheWluZyBhdCB4OiBcIiArIG5vaXNlX2dhcCArIFwiLCB5OiBcIiArIHRvbmVfbGV2ZWwpO1xuICAgICAgICByZXR1cm4gdGhpcy5wbGF5ZXIucHJlbG9hZFN0aW11bHVzKG5vaXNlX2dhcCwgdG9uZV9sZXZlbCwgcGxheVRhcmdldCwgcGxheU1hc2tlcik7XG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5wbGF5ZXIudm9sdW1lID0gdGhpcy52b2x1bWU7XG4gICAgICAgIHJldHVybiB0aGlzLnBsYXllci5wbGF5KCk7XG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJQbGF5aW5nXCIpO1xuICAgICAgICB0aGlzLnBsYXlpbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLnBsYXlCdXR0b25UZXh0ID0gXCJTdG9wXCI7XG4gICAgICB9KS5jYXRjaChlcnIgPT4gdGhpcy5zaG93RXJyb3IoZXJyKSk7XG4gICAgfVxuXG4gICAgc2hvd0Vycm9yKGVycikge1xuICAgICAgZGlhbG9ncy5hbGVydCh7XG4gICAgICAgIHRpdGxlOiAnRXJyb3InLFxuICAgICAgICBtZXNzYWdlOiBlcnIsXG4gICAgICAgIG9rQnV0dG9uVGV4dDogJ0Nsb3NlJ1xuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIC8vIHBhc3NcbiAgICAgIH0pO1xuICAgIH1cblxufVxuIl19