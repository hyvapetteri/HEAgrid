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
            debug: true
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyaWZ5YXVkaW8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ2ZXJpZnlhdWRpby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUFrRDtBQUNsRCxnQ0FBK0I7QUFDL0Isd0RBQTZGO0FBQzdGLHNEQUEwRTtBQUMxRSxtRUFBcUU7QUFFckUsaURBQW1EO0FBQ25ELHFEQUF1RDtBQUN2RCx5Q0FBMkM7QUFDM0MsOENBQWdEO0FBR2hELDRFQUF5RztBQUN6Ryw4REFBNkQ7QUFLN0QsSUFBWSxjQU9YO0FBUEQsV0FBWSxjQUFjO0lBQ3hCLDJDQUF5QixDQUFBO0lBQ3pCLDBEQUF3QyxDQUFBO0lBQ3hDLCtCQUFhLENBQUE7SUFDYiw4Q0FBNEIsQ0FBQTtJQUM1QixzREFBb0MsQ0FBQTtJQUNwQyw0REFBMEMsQ0FBQTtBQUM1QyxDQUFDLEVBUFcsY0FBYyxHQUFkLHNCQUFjLEtBQWQsc0JBQWMsUUFPekI7QUFRRDtJQXlCSSx5QkFBb0IsZUFBZ0MsRUFDaEMsZ0JBQWtDLEVBQ2xDLElBQVU7UUFGOUIsaUJBc0NDO1FBdENtQixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFDaEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUNsQyxTQUFJLEdBQUosSUFBSSxDQUFNO1FBMUJ2QixnQkFBVyxHQUFHLGNBQWMsQ0FBQztRQTRCbEMsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMzQyxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFckQsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFFOUQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFJLENB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QUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDTixPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZCLEtBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3BCLEtBQUksQ0FBQyxjQUFjLEdBQUcsTUFBTSxDQUFDO1FBQy9CLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFBLEdBQUcsSUFBSSxPQUFBLEtBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQW5CLENBQW1CLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRUQsbUNBQVMsR0FBVCxVQUFVLEdBQUc7UUFDWCxPQUFPLENBQUMsS0FBSyxDQUFDO1lBQ1osS0FBSyxFQUFFLE9BQU87WUFDZCxPQUFPLEVBQUUsR0FBRztZQUNaLFlBQVksRUFBRSxPQUFPO1NBQ3RCLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDTixPQUFPO1FBQ1QsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBeE5RLGVBQWU7UUFOM0IsZ0JBQVMsQ0FBQztZQUNQLFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRTtZQUNuQixRQUFRLEVBQUUsa0JBQWtCO1lBQzVCLFdBQVcsRUFBRSxrQkFBa0I7WUFDL0IsU0FBUyxFQUFFLENBQUMsbUJBQW1CLENBQUM7U0FDbkMsQ0FBQzt5Q0EwQnVDLHlCQUFlO1lBQ2QseUJBQWdCO1lBQzVCLFdBQUk7T0EzQnJCLGVBQWUsQ0EwTjNCO0lBQUQsc0JBQUM7Q0FBQSxBQTFORCxJQTBOQztBQTFOWSwwQ0FBZSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgT25Jbml0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBQYWdlIH0gZnJvbSBcInVpL3BhZ2VcIjtcbmltcG9ydCB7IFNlc3Npb25Qcm92aWRlciwgRXhwZXJpbWVudCwgRXhwZXJpbWVudFN0YXR1cyB9IGZyb20gJy4uLy4uL3NoYXJlZC9zZXNzaW9uL3Nlc3Npb24nO1xuaW1wb3J0IHsgUm91dGVyRXh0ZW5zaW9ucywgUGFnZVJvdXRlIH0gZnJvbSAnbmF0aXZlc2NyaXB0LWFuZ3VsYXIvcm91dGVyJztcbmltcG9ydCAqIGFzIGFwcFNldHRpbmdzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2FwcGxpY2F0aW9uLXNldHRpbmdzXCI7XG5pbXBvcnQgeyBzd2l0Y2hNYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9maWxlLXN5c3RlbVwiO1xuaW1wb3J0ICogYXMgZGlhbG9ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9kaWFsb2dzXCI7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gXCIuLi8uLi9zaGFyZWQvdXRpbHNcIjtcbmltcG9ydCAqIGFzIGVudiBmcm9tIFwiLi4vLi4vY29uZmlnL2Vudmlyb25tZW50XCI7XG5cbmltcG9ydCB7IEdyaWRUcmFja2VyLCBHcmlkVHJhY2tpbmdTdGF0dXMsIEdyaWREaXJlY3Rpb24sIFRyaWFsQW5zd2VyLCBQYXJhbUdyaWQgfSBmcm9tICcuLi8uLi9zaGFyZWQvZ3JpZC9ncmlkJztcbmltcG9ydCB7IEdyaWRQbGF5ZXIsIEdyaWRQbGF5ZXJPcHRpb25zLCBDaGFubmVsT3B0aW9ucyB9IGZyb20gXCIuLi8uLi9zaGFyZWQvZ3JpZC1wbGF5ZXIvZ3JpZC1wbGF5ZXItaW9zXCI7XG5pbXBvcnQgeyBWb2x1bWVPYnNlcnZlciB9IGZyb20gXCIuLi8uLi9zaGFyZWQvdm9sdW1lb2JzZXJ2ZXJcIjtcbmltcG9ydCB7IE9ic2VydmFibGVBcnJheSB9IGZyb20gXCJkYXRhL29ic2VydmFibGUtYXJyYXlcIjtcbmltcG9ydCB7IEV2ZW50RGF0YSB9IGZyb20gXCJkYXRhL29ic2VydmFibGVcIjtcbmltcG9ydCB7IEJ1dHRvbiB9IGZyb20gXCJ1aS9idXR0b25cIjtcblxuZXhwb3J0IGVudW0gU3RpbXVsaU9wdGlvbnMge1xuICBCYWNrZ3JvdW5kID0gXCJiYWNrZ3JvdW5kXCIsXG4gIEJhY2tncm91bmRUSCA9IFwiYmFja2dyb3VuZF9hdF90aHJlc2hvbGRcIixcbiAgVG9uZSA9IFwidG9uZVwiLFxuICBUb25lVEggPSBcInRvbmVfYXRfdGhyZXNob2xkXCIsXG4gIEdyaWRQb2ludFRhcmdldCA9IFwiZ3JpZHBvaW50X3RhcmdldFwiLFxuICBHcmlkUG9pbnROb250YXJnZXQgPSBcImdyaWRwb2ludF9ub250YXJnZXRcIlxufVxuXG5AQ29tcG9uZW50KHtcbiAgICBtb2R1bGVJZDogbW9kdWxlLmlkLFxuICAgIHNlbGVjdG9yOiAndmlldy12ZXJpZnlhdWRpbycsXG4gICAgdGVtcGxhdGVVcmw6ICd2ZXJpZnlhdWRpby5odG1sJyxcbiAgICBzdHlsZVVybHM6IFsnLi92ZXJpZnlhdWRpby5jc3MnXVxufSlcbmV4cG9ydCBjbGFzcyBWZXJpZnlBdWRpb1BhZ2UgaW1wbGVtZW50cyBPbkluaXQge1xuICAgIHB1YmxpYyBzdGltT3B0aW9ucyA9IFN0aW11bGlPcHRpb25zO1xuXG4gICAgcHJpdmF0ZSBhdWRpb1BhdGg6c3RyaW5nO1xuICAgIHByaXZhdGUgZXhwZXJpbWVudDpFeHBlcmltZW50O1xuICAgIC8vcHJpdmF0ZSBwbGF5ZXI6VE5TUGxheWVyO1xuICAgIHByaXZhdGUgcGxheWVyOiBHcmlkUGxheWVyO1xuICAgIHByaXZhdGUgdm9sdW1lOm51bWJlcjtcbiAgICBwcml2YXRlIHBpY2tlZFN0aW11bHVzOiBTdGltdWxpT3B0aW9uc3xudWxsO1xuICAgIHByaXZhdGUgeHZhbDpudW1iZXI7XG4gICAgcHJpdmF0ZSB5dmFsOm51bWJlcjtcbiAgICBwcml2YXRlIHhsaW06W251bWJlcixudW1iZXJdO1xuICAgIHByaXZhdGUgeWxpbTpbbnVtYmVyLG51bWJlcl07XG5cbiAgICBwcml2YXRlIHBsYXlpbmc6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSBlbmFibGVQbGF5OiBib29sZWFuO1xuICAgIHByaXZhdGUgcGxheUJ1dHRvblRleHQ6IHN0cmluZztcblxuICAgIHByaXZhdGUgc3VibWl0dGVkOiBib29sZWFuO1xuICAgIHByaXZhdGUgeGludmFsaWQ6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSB5aW52YWxpZDogYm9vbGVhbjtcblxuICAgIHByaXZhdGUgYXVkaW9TZXNzaW9uOiBBVkF1ZGlvU2Vzc2lvbjtcbiAgICBwcml2YXRlIG1hc3RlclZvbHVtZU9ic2VydmVyOiBWb2x1bWVPYnNlcnZlcjtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgc2Vzc2lvblByb3ZpZGVyOiBTZXNzaW9uUHJvdmlkZXIsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSByb3V0ZXJFeHRlbnNpb25zOiBSb3V0ZXJFeHRlbnNpb25zLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgcGFnZTogUGFnZSkge1xuXG4gICAgICBsZXQgYXBwUGF0aCA9IGZzLmtub3duRm9sZGVycy5jdXJyZW50QXBwKCk7XG4gICAgICB0aGlzLmF1ZGlvUGF0aCA9IGZzLnBhdGguam9pbihhcHBQYXRoLnBhdGgsICdhdWRpbycpO1xuXG4gICAgICB0aGlzLmV4cGVyaW1lbnQgPSB0aGlzLnNlc3Npb25Qcm92aWRlci5nZXRDdXJyZW50RXhwZXJpbWVudCgpO1xuXG4gICAgICB0aGlzLnh2YWwgPSB0aGlzLmV4cGVyaW1lbnQuZ3JpZC5nZXRTdGF0dXMoKS54dmFsO1xuICAgICAgdGhpcy55dmFsID0gdGhpcy5leHBlcmltZW50LmdyaWQuZ2V0U3RhdHVzKCkueXZhbDtcblxuICAgICAgdGhpcy54bGltID0gdGhpcy5leHBlcmltZW50LmdyaWQuZ2V0WGxpbSgpO1xuICAgICAgdGhpcy55bGltID0gdGhpcy5leHBlcmltZW50LmdyaWQuZ2V0WWxpbSgpO1xuXG4gICAgICB0aGlzLnN1Ym1pdHRlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5wbGF5aW5nID0gZmFsc2U7XG4gICAgICB0aGlzLmVuYWJsZVBsYXkgPSBmYWxzZTtcbiAgICAgIHRoaXMucGxheUJ1dHRvblRleHQgPSBcIlBsYXkgc3RpbXVsdXNcIjtcbiAgICAgIHRoaXMucGlja2VkU3RpbXVsdXMgPSBudWxsO1xuXG4gICAgICB0aGlzLmF1ZGlvU2Vzc2lvbiA9IEFWQXVkaW9TZXNzaW9uLnNoYXJlZEluc3RhbmNlKCk7XG4gICAgICB0aGlzLm1hc3RlclZvbHVtZU9ic2VydmVyID0gbmV3IFZvbHVtZU9ic2VydmVyKCk7XG4gICAgICB0aGlzLm1hc3RlclZvbHVtZU9ic2VydmVyLnNldENhbGxiYWNrKChvYmopID0+IHtcbiAgICAgICAgZGlhbG9ncy5hbGVydCh7XG4gICAgICAgICAgdGl0bGU6IFwiVm9sdW1lIGNoYW5nZWQhXCIsXG4gICAgICAgICAgbWVzc2FnZTogXCJBIHZvbHVtZSBidXR0b24gcHJlc3Mgd2FzIG9ic2VydmVkLiBUaGUgY3VycmVudCBleHBlcmltZW50IHdpbGwgYmUgY2FuY2VsbGVkIGFuZCB5b3Ugd2lsbCBub3cgcmV0dXJuIHRvIHRoZSB2b2x1bWUgc2V0dGluZyBzY3JlZW4uXCIsXG4gICAgICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCJcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucm91dGVyRXh0ZW5zaW9ucy5uYXZpZ2F0ZShbXCIvdm9sdW1lXCJdLCB7Y2xlYXJIaXN0b3J5OiB0cnVlfSk7XG4gICAgICAgIH0pLmNhdGNoKGVyciA9PiBjb25zb2xlLmxvZyhlcnIpKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5hdWRpb1Nlc3Npb24uYWRkT2JzZXJ2ZXJGb3JLZXlQYXRoT3B0aW9uc0NvbnRleHQodGhpcy5tYXN0ZXJWb2x1bWVPYnNlcnZlciwgXCJvdXRwdXRWb2x1bWVcIiwgTlNLZXlWYWx1ZU9ic2VydmluZ09wdGlvbnMuTmV3LCBudWxsKTtcblxuICAgICAgdGhpcy5wYWdlLm9uKFwibmF2aWdhdGluZ0Zyb21cIiwgKGRhdGE6IEV2ZW50RGF0YSkgPT4ge1xuICAgICAgICB0aGlzLmF1ZGlvU2Vzc2lvbi5yZW1vdmVPYnNlcnZlckZvcktleVBhdGgodGhpcy5tYXN0ZXJWb2x1bWVPYnNlcnZlciwgXCJvdXRwdXRWb2x1bWVcIik7XG4gICAgICB9KTtcblxuICAgIH1cblxuICAgIG5nT25Jbml0KCkge1xuXG4gICAgfVxuXG4gICAgY2hvb3NlU3RpbXVsdXMoc3RpbTpTdGltdWxpT3B0aW9ucywgZXZlbnQ6RXZlbnREYXRhKSB7XG4gICAgICBjb25zb2xlLmxvZyhzdGltKTtcblxuICAgICAgbGV0IGJ1dHRvbiA9IDxCdXR0b24+ZXZlbnQub2JqZWN0O1xuXG4gICAgICBpZiAodGhpcy5waWNrZWRTdGltdWx1cyA9PSBzdGltKSB7XG4gICAgICAgIHRoaXMucGlja2VkU3RpbXVsdXMgPSBudWxsO1xuICAgICAgICB0aGlzLmVuYWJsZVBsYXkgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucGlja2VkU3RpbXVsdXMgPSBzdGltO1xuICAgICAgICB0aGlzLmVuYWJsZVBsYXkgPSB0cnVlO1xuICAgICAgfVxuXG5cbiAgICB9XG5cbiAgICBwbGF5U3RpbXVsdXMoKSB7XG4gICAgICBpZiAodGhpcy5wbGF5aW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBsYXllci5wYXVzZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMucGxheWluZyA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMuc3VibWl0dGVkID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5wbGF5QnV0dG9uVGV4dCA9IFwiUGxheSBzdGltdWx1c1wiO1xuICAgICAgICAgIHRoaXMucGxheWVyLmRpc3Bvc2UoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3VibWl0dGVkID0gdHJ1ZTtcblxuICAgICAgbGV0IHhjb29yZCA9IC0xLCB5Y29vcmQgPSAtMTtcbiAgICAgIGxldCBjaGVja19jb29yZGluYXRlcyA9IGZhbHNlO1xuICAgICAgaWYgKCh0aGlzLnBpY2tlZFN0aW11bHVzID09IFN0aW11bGlPcHRpb25zLkdyaWRQb2ludFRhcmdldCkgfHwgKHRoaXMucGlja2VkU3RpbXVsdXMgPT0gU3RpbXVsaU9wdGlvbnMuR3JpZFBvaW50Tm9udGFyZ2V0KSkge1xuICAgICAgICBjaGVja19jb29yZGluYXRlcyA9IHRydWU7XG4gICAgICAgIHhjb29yZCA9IE51bWJlcih0aGlzLnh2YWwpO1xuICAgICAgICB5Y29vcmQgPSBOdW1iZXIodGhpcy55dmFsKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy54aW52YWxpZCA9IGZhbHNlO1xuICAgICAgdGhpcy55aW52YWxpZCA9IGZhbHNlO1xuXG4gICAgICBpZiAoaXNOYU4oeGNvb3JkKSB8fCAoeGNvb3JkIDwgdGhpcy54bGltWzBdKSB8fCAoeGNvb3JkID4gdGhpcy54bGltWzFdKSkge1xuICAgICAgICB0aGlzLnhpbnZhbGlkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChpc05hTih5Y29vcmQpIHx8ICh5Y29vcmQgPCB0aGlzLnlsaW1bMF0pIHx8ICh5Y29vcmQgPiB0aGlzLnlsaW1bMV0pKSB7XG4gICAgICAgIHRoaXMueWludmFsaWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZygneDogJyArIHhjb29yZCArICcsIHk6ICcgKyB5Y29vcmQpO1xuXG4gICAgICBpZiAoY2hlY2tfY29vcmRpbmF0ZXMgJiYgKHRoaXMueGludmFsaWQgfHwgdGhpcy55aW52YWxpZCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJJbnZhbGlkIGNvb3JkaW5hdGVzXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGxldCBub2lzZV9nYXAgPSB4Y29vcmQ7XG4gICAgICBsZXQgdG9uZV9sZXZlbCA9IHljb29yZDtcblxuICAgICAgbGV0IGZyZXEgPSB0aGlzLmV4cGVyaW1lbnQudGVzdEZyZXF1ZW5jeTtcblxuICAgICAgdGhpcy52b2x1bWUgPSAxO1xuXG4gICAgICBsZXQgYmdfcmVmX2xldmVsO1xuICAgICAgaWYgKGFwcFNldHRpbmdzLmhhc0tleShcInNwbF9iYWNrZ3JvdW5kXCIpKSB7XG4gICAgICAgIGJnX3JlZl9sZXZlbCA9IGFwcFNldHRpbmdzLmdldE51bWJlcihcInNwbF9iYWNrZ3JvdW5kXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2hvd0Vycm9yKFwiQ2FsaWJyYXRlIGxldmVscyBmaXJzdCFcIik7XG4gICAgICB9XG5cbiAgICAgIGxldCBwbGF5ZXJPcHRpb25zOkdyaWRQbGF5ZXJPcHRpb25zID0ge1xuICAgICAgICB0YXJnZXRGcmVxdWVuY3k6IHRoaXMuZXhwZXJpbWVudC50ZXN0RnJlcXVlbmN5LFxuICAgICAgICBsb29wOiB0cnVlLFxuICAgICAgICBwYWRkZWRTaWxlbmNlRHVyYXRpb246IDAsXG4gICAgICAgIHRhcmdldER1cmF0aW9uOiBlbnYudmVyaWZ5YXVkaW8udGFyZ2V0RHVyYXRpb25fcyxcbiAgICAgICAgbWFza2VyRHVyYXRpb246IGVudi52ZXJpZnlhdWRpby5tYXNrZXJEdXJhdGlvbl9zLFxuICAgICAgICAvL21hc2tlckxldmVsOiB1dGlsLmEyZGIodGhpcy5leHBlcmltZW50Lm5vaXNlVGhyZXNob2xkKSArIGVudi5tYXNrZXJMZXZlbF9kQixcbiAgICAgICAgbWFza2VyTGV2ZWw6IGVudi5tYXNrZXJMZXZlbF9kQiAtIGJnX3JlZl9sZXZlbCxcbiAgICAgICAgY2hhbm5lbE9wdGlvbnM6IENoYW5uZWxPcHRpb25zLkRpb3RpYyxcbiAgICAgICAgc2V0dGluZ3NQYXRoOiB0aGlzLmF1ZGlvUGF0aCxcbiAgICAgICAgd2luZG93OiBmYWxzZSxcbiAgICAgICAgZXJyb3JDYWxsYmFjazogKGVycikgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3Igd2hpbGUgcGxheWluZzogXCIgKyBlcnIpO1xuICAgICAgICB9LFxuICAgICAgICBkZWJ1ZzogdHJ1ZVxuICAgICAgfTtcbiAgICAgIHRoaXMucGxheWVyID0gbmV3IEdyaWRQbGF5ZXIoKTtcblxuICAgICAgbGV0IHBsYXlNYXNrZXIgPSBmYWxzZSwgcGxheVRhcmdldCA9IGZhbHNlO1xuICAgICAgc3dpdGNoICh0aGlzLnBpY2tlZFN0aW11bHVzKSB7XG4gICAgICAgIGNhc2UgU3RpbXVsaU9wdGlvbnMuQmFja2dyb3VuZDoge1xuICAgICAgICAgIG5vaXNlX2dhcCA9IDA7XG4gICAgICAgICAgcGxheU1hc2tlciA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBTdGltdWxpT3B0aW9ucy5CYWNrZ3JvdW5kVEg6IHtcbiAgICAgICAgICBub2lzZV9nYXAgPSAwO1xuICAgICAgICAgIC8vdGhpcy52b2x1bWUgPSB0aGlzLmV4cGVyaW1lbnQubm9pc2VUaHJlc2hvbGQ7XG4gICAgICAgICAgcGxheWVyT3B0aW9ucy5tYXNrZXJMZXZlbCA9IHV0aWwuYTJkYih0aGlzLmV4cGVyaW1lbnQubm9pc2VUaHJlc2hvbGQpO1xuICAgICAgICAgIHBsYXlNYXNrZXIgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgU3RpbXVsaU9wdGlvbnMuVG9uZToge1xuICAgICAgICAgIHRvbmVfbGV2ZWwgPSB0aGlzLmV4cGVyaW1lbnQuZ3JpZC5nZXRZbGltKClbMV07XG4gICAgICAgICAgbm9pc2VfZ2FwID0gMDtcbiAgICAgICAgICBwbGF5VGFyZ2V0ID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFN0aW11bGlPcHRpb25zLlRvbmVUSDoge1xuICAgICAgICAgIHRvbmVfbGV2ZWwgPSB0aGlzLmV4cGVyaW1lbnQuZ3JpZC5nZXRZbGltKClbMF07XG4gICAgICAgICAgbm9pc2VfZ2FwID0gMDtcbiAgICAgICAgICBwbGF5VGFyZ2V0ID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFN0aW11bGlPcHRpb25zLkdyaWRQb2ludFRhcmdldDoge1xuICAgICAgICAgIHBsYXlUYXJnZXQgPSB0cnVlO1xuICAgICAgICAgIHBsYXlNYXNrZXIgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgU3RpbXVsaU9wdGlvbnMuR3JpZFBvaW50Tm9udGFyZ2V0OiB7XG4gICAgICAgICAgcGxheVRhcmdldCA9IGZhbHNlO1xuICAgICAgICAgIHBsYXlNYXNrZXIgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5zaG93RXJyb3IoXCJVbmtub3duIHN0aW11bHVzIG9wdGlvbi5cIik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMucGxheWVyLmluaXRpYWxpemUocGxheWVyT3B0aW9ucykudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiUGxheWVyIGluaXRpYWxpemVkLCBwbGF5aW5nIGF0IHg6IFwiICsgbm9pc2VfZ2FwICsgXCIsIHk6IFwiICsgdG9uZV9sZXZlbCk7XG4gICAgICAgIHJldHVybiB0aGlzLnBsYXllci5wcmVsb2FkU3RpbXVsdXMobm9pc2VfZ2FwLCB0b25lX2xldmVsLCBwbGF5VGFyZ2V0LCBwbGF5TWFza2VyKTtcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLnBsYXllci52b2x1bWUgPSB0aGlzLnZvbHVtZTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGxheWVyLnBsYXkoKTtcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcIlBsYXlpbmdcIik7XG4gICAgICAgIHRoaXMucGxheWluZyA9IHRydWU7XG4gICAgICAgIHRoaXMucGxheUJ1dHRvblRleHQgPSBcIlN0b3BcIjtcbiAgICAgIH0pLmNhdGNoKGVyciA9PiB0aGlzLnNob3dFcnJvcihlcnIpKTtcbiAgICB9XG5cbiAgICBzaG93RXJyb3IoZXJyKSB7XG4gICAgICBkaWFsb2dzLmFsZXJ0KHtcbiAgICAgICAgdGl0bGU6ICdFcnJvcicsXG4gICAgICAgIG1lc3NhZ2U6IGVycixcbiAgICAgICAgb2tCdXR0b25UZXh0OiAnQ2xvc2UnXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgLy8gcGFzc1xuICAgICAgfSk7XG4gICAgfVxuXG59XG4iXX0=