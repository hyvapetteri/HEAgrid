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
        this.titleText = "Threshold 1/2";
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
            channelOptions: grid_player_ios_1.ChannelOptions.Diotic,
            settingsPath: fs.knownFolders.documents().path,
            debug: true,
            compensate: true
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
        var _this = this;
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
            this.experiment.status = session_1.ExperimentStatus.ToneThreshold;
            return this.setup().then(function () {
                _this.instructionText = 'Now we will measure another threshold using a tone. Press play to start.';
                _this.titleText = "Threshold 2/2";
            });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyZXNob2xkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGhyZXNob2xkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQWtEO0FBQ2xELGdDQUErQjtBQUUvQixxREFBdUQ7QUFFdkQsaURBQW1EO0FBQ25ELDhDQUFnRDtBQUNoRCx5Q0FBMkM7QUFDM0MsOERBQTZEO0FBQzdELHNEQUErRDtBQUcvRCw0RUFBeUc7QUFFekcsd0RBQTZGO0FBVTdGO0lBd0JFLHVCQUFvQixlQUFnQyxFQUNoQyxnQkFBa0MsRUFDbEMsT0FBZSxFQUNmLElBQVU7UUFIOUIsaUJBNkNDO1FBN0NtQixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFDaEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUNsQyxZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQ2YsU0FBSSxHQUFKLElBQUksQ0FBTTtRQUU1QixJQUFJLENBQUMsU0FBUyxHQUFHLGVBQWUsQ0FBQztRQUVqQyxJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztRQUN4QixJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztRQUMxQixJQUFJLENBQUMsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO1FBRWpDLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLElBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7UUFFeEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFDOUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsMEJBQWdCLENBQUMsY0FBYyxDQUFDO1FBRXpELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxVQUFDLElBQWU7WUFFMUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBQ3RDLElBQUksWUFBWSxHQUFHLGNBQWMs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WUFBWSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7UUFDbkYsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDO0lBRUQsaUNBQVMsR0FBVCxVQUFVLEdBQUc7UUFDWCxPQUFPLENBQUMsS0FBSyxDQUFDO1lBQ1osS0FBSyxFQUFFLE9BQU87WUFDZCxPQUFPLEVBQUUsR0FBRztZQUNaLFlBQVksRUFBRSxPQUFPO1NBQ3RCLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDTixPQUFPO1FBQ1QsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBdk9VLGFBQWE7UUFOekIsZ0JBQVMsQ0FBQztZQUNULFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRTtZQUNuQixRQUFRLEVBQUUsZ0JBQWdCO1lBQzFCLFdBQVcsRUFBRSxrQkFBa0I7WUFDL0IsU0FBUyxFQUFFLENBQUMsaUJBQWlCLENBQUM7U0FDL0IsQ0FBQzt5Q0F5QnFDLHlCQUFlO1lBQ2QseUJBQWdCO1lBQ3pCLGFBQU07WUFDVCxXQUFJO09BM0JuQixhQUFhLENBd096QjtJQUFELG9CQUFDO0NBQUEsQUF4T0QsSUF3T0M7QUF4T1ksc0NBQWEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE5nWm9uZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gXCJ1aS9wYWdlXCI7XG5pbXBvcnQgeyBFdmVudERhdGEgfSBmcm9tIFwiZGF0YS9vYnNlcnZhYmxlXCI7XG5pbXBvcnQgKiBhcyBkaWFsb2dzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL2RpYWxvZ3NcIjtcbmltcG9ydCAqIGFzIGFwcGxpY2F0aW9uIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2FwcGxpY2F0aW9uXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9maWxlLXN5c3RlbVwiO1xuaW1wb3J0ICogYXMgZW52IGZyb20gXCIuLi8uLi9jb25maWcvZW52aXJvbm1lbnRcIjtcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSBcIi4uLy4uL3NoYXJlZC91dGlsc1wiO1xuaW1wb3J0IHsgVm9sdW1lT2JzZXJ2ZXIgfSBmcm9tIFwiLi4vLi4vc2hhcmVkL3ZvbHVtZW9ic2VydmVyXCI7XG5pbXBvcnQgeyBSb3V0ZXJFeHRlbnNpb25zIH0gZnJvbSBcIm5hdGl2ZXNjcmlwdC1hbmd1bGFyL3JvdXRlclwiO1xuaW1wb3J0IHsgVG91Y2hHZXN0dXJlRXZlbnREYXRhIH0gZnJvbSBcInVpL2dlc3R1cmVzXCI7XG5pbXBvcnQgeyBUTlNQbGF5ZXIgfSBmcm9tICduYXRpdmVzY3JpcHQtYXVkaW8nO1xuaW1wb3J0IHsgR3JpZFBsYXllciwgR3JpZFBsYXllck9wdGlvbnMsIENoYW5uZWxPcHRpb25zIH0gZnJvbSAnLi4vLi4vc2hhcmVkL2dyaWQtcGxheWVyL2dyaWQtcGxheWVyLWlvcyc7XG5cbmltcG9ydCB7IFNlc3Npb25Qcm92aWRlciwgRXhwZXJpbWVudCwgRXhwZXJpbWVudFN0YXR1cyB9IGZyb20gJy4uLy4uL3NoYXJlZC9zZXNzaW9uL3Nlc3Npb24nO1xuXG5kZWNsYXJlIHZhciBOU1VSTDtcblxuQENvbXBvbmVudCh7XG4gIG1vZHVsZUlkOiBtb2R1bGUuaWQsXG4gIHNlbGVjdG9yOiAncGFnZS10aHJlc2hvbGQnLFxuICB0ZW1wbGF0ZVVybDogJy4vdGhyZXNob2xkLmh0bWwnLFxuICBzdHlsZVVybHM6IFsnLi90aHJlc2hvbGQuY3NzJ11cbn0pXG5leHBvcnQgY2xhc3MgVGhyZXNob2xkUGFnZSB7XG4gIHByaXZhdGUgdGl0bGVUZXh0OnN0cmluZztcbiAgcHJpdmF0ZSBpbnN0cnVjdGlvblRleHQ6IHN0cmluZztcbiAgcHJpdmF0ZSBhbnN3ZXJCdXR0b25UZXh0OiBzdHJpbmc7XG4gIHByaXZhdGUgcGxheUJ1dHRvblRleHQ6IHN0cmluZztcbiAgcHJpdmF0ZSBhbnN3ZXJCdXR0b25QcmVzc2VkOiBib29sZWFuO1xuXG4gIHByaXZhdGUgZW5hYmxlUGxheTogYm9vbGVhbjtcbiAgcHJpdmF0ZSBlbmFibGVBbnN3ZXI6IGJvb2xlYW47XG5cbiAgLy9wcml2YXRlIHBsYXllcjogVE5TUGxheWVyO1xuICBwcml2YXRlIHBsYXllcjogR3JpZFBsYXllcjtcbiAgcHJpdmF0ZSBhdWRpb1BhdGg6IHN0cmluZztcblxuICBwcml2YXRlIHZvbHVtZTogbnVtYmVyO1xuICBwcml2YXRlIHR1cm5zOiBudW1iZXJbXTtcbiAgcHJpdmF0ZSBkaXJlY3Rpb246IG51bWJlcjtcbiAgcHJpdmF0ZSBtYXhfdHVybnM6IG51bWJlcjtcblxuICBwcml2YXRlIHZvbHVtZVVwZGF0ZVRpbWVySWQ6IG51bWJlcjtcbiAgcHJpdmF0ZSBtYXN0ZXJWb2x1bWVPYnNlcnZlcjogVm9sdW1lT2JzZXJ2ZXI7XG5cbiAgcHJpdmF0ZSBleHBlcmltZW50OiBFeHBlcmltZW50O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgc2Vzc2lvblByb3ZpZGVyOiBTZXNzaW9uUHJvdmlkZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgcm91dGVyRXh0ZW5zaW9uczogUm91dGVyRXh0ZW5zaW9ucyxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgICAgICAgICAgIHByaXZhdGUgcGFnZTogUGFnZSkge1xuXG4gICAgdGhpcy50aXRsZVRleHQgPSBcIlRocmVzaG9sZCAxLzJcIjtcblxuICAgIHRoaXMuZW5hYmxlUGxheSA9IGZhbHNlO1xuICAgIHRoaXMuZW5hYmxlQW5zd2VyID0gZmFsc2U7XG4gICAgdGhpcy5hbnN3ZXJCdXR0b25QcmVzc2VkID0gZmFsc2U7XG5cbiAgICB0aGlzLnR1cm5zID0gW107XG4gICAgdGhpcy5tYXhfdHVybnMgPSBlbnYudGhyZXNob2xkLm1heFR1cm5zO1xuXG4gICAgdGhpcy5leHBlcmltZW50ID0gdGhpcy5zZXNzaW9uUHJvdmlkZXIuZ2V0Q3VycmVudEV4cGVyaW1lbnQoKTtcbiAgICB0aGlzLmV4cGVyaW1lbnQuc3RhdHVzID0gRXhwZXJpbWVudFN0YXR1cy5Ob2lzZVRocmVzaG9sZDtcblxuICAgIHRoaXMucGFnZS5vbihcIm5hdmlnYXRlZFRvXCIsIChkYXRhOiBFdmVudERhdGEpID0+IHtcblxuICAgICAgY29uc29sZS5sb2coXCJhZGRpbmcgdm9sdW1lIG9ic2VydmVyXCIpO1xuICAgICAgbGV0IGF1ZGlvU2Vzc2lvbiA9IEFWQXVkaW9TZXNzaW9uLnNoYXJlZEluc3RhbmNlKCk7XG4gICAgICB0aGlzLm1hc3RlclZvbHVtZU9ic2VydmVyID0gbmV3IFZvbHVtZU9ic2VydmVyKCk7XG4gICAgICB0aGlzLm1hc3RlclZvbHVtZU9ic2VydmVyLnNldENhbGxiYWNrKChvYmopID0+IHtcbiAgICAgICAgdGhpcy5wbGF5ZXIucGF1c2UoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMudm9sdW1lVXBkYXRlVGltZXJJZCk7XG4gICAgICAgICAgdGhpcy5zZXNzaW9uUHJvdmlkZXIuY2FuY2VsRXhwZXJpbWVudCgpO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZGlhbG9ncy5hbGVydCh7XG4gICAgICAgICAgICB0aXRsZTogXCJWb2x1bWUgY2hhbmdlZCFcIixcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiQSB2b2x1bWUgYnV0dG9uIHByZXNzIHdhcyBvYnNlcnZlZC4gVGhlIGN1cnJlbnQgZXhwZXJpbWVudCB3aWxsIGJlIGNhbmNlbGxlZCBhbmQgeW91IHdpbGwgbm93IHJldHVybiB0byB0aGUgdm9sdW1lIHNldHRpbmcgc2NyZWVuLlwiLFxuICAgICAgICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCJcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucm91dGVyRXh0ZW5zaW9ucy5uYXZpZ2F0ZShbXCIvdm9sdW1lXCJdLCB7Y2xlYXJIaXN0b3J5OiB0cnVlfSk7XG4gICAgICAgIH0pLmNhdGNoKGVyciA9PiBjb25zb2xlLmxvZyhlcnIpKTtcbiAgICAgIH0pO1xuICAgICAgYXVkaW9TZXNzaW9uLmFkZE9ic2VydmVyRm9yS2V5UGF0aE9wdGlvbnNDb250ZXh0KHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIsIFwib3V0cHV0Vm9sdW1lXCIsIE5TS2V5VmFsdWVPYnNlcnZpbmdPcHRpb25zLk5ldywgbnVsbCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnBhZ2Uub24oXCJuYXZpZ2F0aW5nRnJvbVwiLCAoZGF0YTogRXZlbnREYXRhKSA9PiB7XG4gICAgICBsZXQgYXVkaW9TZXNzaW9uID0gQVZBdWRpb1Nlc3Npb24uc2hhcmVkSW5zdGFuY2UoKTtcbiAgICAgIGF1ZGlvU2Vzc2lvbi5yZW1vdmVPYnNlcnZlckZvcktleVBhdGgodGhpcy5tYXN0ZXJWb2x1bWVPYnNlcnZlciwgXCJvdXRwdXRWb2x1bWVcIik7XG4gICAgfSk7XG5cbiAgICB0aGlzLnNldHVwKCk7XG4gIH1cblxuICBvbkJ1dHRvblRvdWNoKGFyZ3M6IFRvdWNoR2VzdHVyZUV2ZW50RGF0YSkge1xuICAgIGlmIChhcmdzLmFjdGlvbiA9PSAnZG93bicpIHtcbiAgICAgIHRoaXMuYW5zd2VyQnV0dG9uUHJlc3NlZCA9IHRydWU7XG4gICAgICB0aGlzLnR1cm5zLnB1c2godGhpcy52b2x1bWUpO1xuICAgICAgdGhpcy5kaXJlY3Rpb24gPSAtMTtcbiAgICAgIHRoaXMuYW5zd2VyQnV0dG9uVGV4dCA9ICdIb2xkJztcbiAgICB9IGVsc2UgaWYgKGFyZ3MuYWN0aW9uID09ICd1cCcpIHtcbiAgICAgIHRoaXMuYW5zd2VyQnV0dG9uUHJlc3NlZCA9IGZhbHNlO1xuICAgICAgdGhpcy50dXJucy5wdXNoKHRoaXMudm9sdW1lKTtcbiAgICAgIHRoaXMuZGlyZWN0aW9uID0gMTtcbiAgICAgIHRoaXMuYW5zd2VyQnV0dG9uVGV4dCA9ICdQdXNoJztcbiAgICB9XG4gICAgaWYgKHRoaXMudHVybnMubGVuZ3RoID49IHRoaXMubWF4X3R1cm5zKSB7XG4gICAgICB0aGlzLnBsYXllci5kaXNwb3NlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy52b2x1bWVVcGRhdGVUaW1lcklkKTtcbiAgICAgICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSAnRG9uZSc7XG4gICAgICAgIHRoaXMuZmluaXNoKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBzZXR1cCgpIHtcbiAgICBsZXQgYXBwUGF0aCA9IGZzLmtub3duRm9sZGVycy5jdXJyZW50QXBwKCk7XG4gICAgLy90aGlzLmF1ZGlvUGF0aCA9IGZzLnBhdGguam9pbihhcHBQYXRoLnBhdGgsIGVudi5hdWRpb1BhdGgpO1xuICAgIHRoaXMuYXVkaW9QYXRoID0gZnMua25vd25Gb2xkZXJzLmRvY3VtZW50cygpLnBhdGg7XG4gICAgY29uc29sZS5sb2codGhpcy5hdWRpb1BhdGgpO1xuXG4gICAgLy90aGlzLnBsYXllciA9IG5ldyBUTlNQbGF5ZXIoKTtcbiAgICBsZXQgcGxheWVyT3B0aW9uczpHcmlkUGxheWVyT3B0aW9ucyA9IHtcbiAgICAgIHRhcmdldEZyZXF1ZW5jeTogdGhpcy5leHBlcmltZW50LnRlc3RGcmVxdWVuY3ksXG4gICAgICBsb29wOiB0cnVlLFxuICAgICAgcGFkZGVkU2lsZW5jZUR1cmF0aW9uOiBlbnYudGhyZXNob2xkLnBhZGRlZFNpbGVuY2VEdXJhdGlvbl9zLFxuICAgICAgdGFyZ2V0RHVyYXRpb246IGVudi50aHJlc2hvbGQudGFyZ2V0RHVyYXRpb25fcyxcbiAgICAgIG1hc2tlckR1cmF0aW9uOiBlbnYudGhyZXNob2xkLm1hc2tlckR1cmF0aW9uX3MsXG4gICAgICBtYXNrZXJMZXZlbDogMCxcbiAgICAgIGNoYW5uZWxPcHRpb25zOiBDaGFubmVsT3B0aW9ucy5EaW90aWMsXG4gICAgICBzZXR0aW5nc1BhdGg6IGZzLmtub3duRm9sZGVycy5kb2N1bWVudHMoKS5wYXRoLFxuICAgICAgZGVidWc6IHRydWUsXG4gICAgICBjb21wZW5zYXRlOiB0cnVlXG4gICAgfVxuICAgIHRoaXMucGxheWVyID0gbmV3IEdyaWRQbGF5ZXIoKTtcblxuICAgIHJldHVybiB0aGlzLnBsYXllci5pbml0aWFsaXplKHBsYXllck9wdGlvbnMpLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMucGxheWVyLnByZWxvYWRTdGltdWx1cygwLCBlbnYubWF4VGFyZ2V0TGV2ZWxfZEIsICh0aGlzLmV4cGVyaW1lbnQuc3RhdHVzID09IEV4cGVyaW1lbnRTdGF0dXMuVG9uZVRocmVzaG9sZCksXG4gICAgICAgICAgICB0aGlzLmV4cGVyaW1lbnQuc3RhdHVzID09IEV4cGVyaW1lbnRTdGF0dXMuTm9pc2VUaHJlc2hvbGQpO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ3N0aW11bHVzIHByZWxvYWRlZCEnKTtcbiAgICAgIHRoaXMuZW5hYmxlUGxheSA9IHRydWU7XG4gICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9ICdQcmVzcyBwbGF5IHRvIHN0YXJ0JztcbiAgICAgIHRoaXMuYW5zd2VyQnV0dG9uVGV4dCA9ICdQdXNoJztcbiAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ2Vycm9yIHByZWxvYWRpbmcgc3RpbXVsdXMnKTtcbiAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgfSk7XG5cbiAgICAvLyBsZXQgZnJlcSA9IHRoaXMuZXhwZXJpbWVudC50ZXN0RnJlcXVlbmN5O1xuICAgIC8vXG4gICAgLy8gbGV0IGF1ZGlvZmlsZSA9ICcnO1xuICAgIC8vIGlmICh0aGlzLmV4cGVyaW1lbnQuc3RhdHVzID09IEV4cGVyaW1lbnRTdGF0dXMuTm9pc2VUaHJlc2hvbGQpIHtcbiAgICAvLyAgIGF1ZGlvZmlsZSA9ICdub2lzZV9yZWYud2F2JztcbiAgICAvLyB9IGVsc2UgaWYgKHRoaXMuZXhwZXJpbWVudC5zdGF0dXMgPT0gRXhwZXJpbWVudFN0YXR1cy5Ub25lVGhyZXNob2xkKSB7XG4gICAgLy8gICBhdWRpb2ZpbGUgPSAnZicgKyBmcmVxICsgJ19yZWYud2F2JztcbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgcmV0dXJuIHRoaXMuc2hvd0Vycm9yKCdVbmV4cGVjdGVkIGV4cGVyaW1lbnQgc3RhdHVzOiAnICsgdGhpcy5leHBlcmltZW50LnN0YXR1cyk7XG4gICAgLy8gfVxuXG4gICAgLy8gcmV0dXJuIHRoaXMucGxheWVyLmluaXRGcm9tRmlsZSh7XG4gICAgLy8gICBhdWRpb0ZpbGU6IGZzLnBhdGguam9pbih0aGlzLmF1ZGlvUGF0aCwgYXVkaW9maWxlKSxcbiAgICAvLyAgIGxvb3A6IHRydWVcbiAgICAvLyB9KS50aGVuKCgpID0+IHtcbiAgICAvLyAgIHRoaXMuZW5hYmxlUGxheSA9IHRydWU7XG4gICAgLy8gICB0aGlzLnJlc2V0KCk7XG4gICAgLy8gICB0aGlzLmluc3RydWN0aW9uVGV4dCA9ICdQcmVzcyBwbGF5IHRvIHN0YXJ0JztcbiAgICAvLyAgIHRoaXMuYW5zd2VyQnV0dG9uVGV4dCA9ICdQdXNoJztcbiAgICAvLyB9KS5jYXRjaChlcnIgPT4gdGhpcy5zaG93RXJyb3IoZXJyKSk7XG5cbiAgfVxuXG4gIHBsYXkoKSB7XG4gICAgLy9pZiAodGhpcy5wbGF5ZXIuaXNBdWRpb1BsYXlpbmcoKSkge1xuICAgIGlmICh0aGlzLnBsYXllci5pc1BsYXlpbmcoKSkge1xuICAgICAgY29uc29sZS5sb2coJ3BhdXNlJyk7XG4gICAgICByZXR1cm4gdGhpcy5wbGF5ZXIucGF1c2UoKS50aGVuKCgpID0+IHtcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLnZvbHVtZVVwZGF0ZVRpbWVySWQpO1xuICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gJ1Jlc2V0LiBQcmVzcyBwbGF5IHRvIHN0YXJ0IGFnYWluLic7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coJ3BsYXknKTtcbiAgICAgIHRoaXMuZGlyZWN0aW9uID0gMTtcbiAgICAgIHJldHVybiB0aGlzLnBsYXllci5wbGF5KCkudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdQbGF5ZXIgc3RhcnRlZCcpO1xuICAgICAgICB0aGlzLnZvbHVtZVVwZGF0ZVRpbWVySWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLnVwZGF0ZVZvbHVtZSgpLCBlbnYudGhyZXNob2xkLnZvbHVtZVVwZGF0ZUludGVydmFsX21zKTtcbiAgICAgICAgdGhpcy5lbmFibGVBbnN3ZXIgPSB0cnVlO1xuICAgICAgICB0aGlzLnBsYXlCdXR0b25UZXh0ID0gJ1Jlc2V0JztcbiAgICAgICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSBcIldoZW4geW91IGhlYXIgYSBzb3VuZCwgcHJlc3MgdGhlIGJ1dHRvbiBhbmQga2VlcCBpdCBwcmVzc2VkIHVudGlsIHlvdSBjYW4ndCBoZWFyIGl0IGFueW1vcmUuIFRoZW4gcmVsZWFzZSBhbmQgcmVwZWF0LlwiO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlVm9sdW1lKCkge1xuICAgIHRoaXMudm9sdW1lID0gdXRpbC5kYjJhKHRoaXMuZGlyZWN0aW9uICogZW52LnRocmVzaG9sZC52b2x1bWVVcGRhdGVTdGVwc2l6ZV9kQikgKiB0aGlzLnZvbHVtZTtcbiAgICB0aGlzLnBsYXllci52b2x1bWUgPSB0aGlzLnZvbHVtZTtcbiAgfVxuXG4gIHJlc2V0KCkge1xuICAgIHRoaXMucGxheUJ1dHRvblRleHQgPSAnUGxheSc7XG4gICAgdGhpcy5lbmFibGVBbnN3ZXIgPSBmYWxzZTtcbiAgICB0aGlzLnZvbHVtZSA9IHV0aWwuZGIyYSgtNDApO1xuICAgIHRoaXMucGxheWVyLnZvbHVtZSA9IHRoaXMudm9sdW1lO1xuICAgIHRoaXMudHVybnMgPSBbXTtcbiAgfVxuXG4gIGZpbmlzaCgpIHtcbiAgICBsZXQgYXZnX3RocmVzaG9sZCA9IDA7XG4gICAgbGV0IG5fbGFzdF90dXJucyA9IGVudi50aHJlc2hvbGQubl9hdmc7XG4gICAgZm9yIChsZXQgaSA9IHRoaXMudHVybnMubGVuZ3RoIC0gMTsgaSA+PSB0aGlzLnR1cm5zLmxlbmd0aCAtIG5fbGFzdF90dXJuczsgaS0tKSB7XG4gICAgICBhdmdfdGhyZXNob2xkID0gYXZnX3RocmVzaG9sZCArIHV0aWwuYTJkYih0aGlzLnR1cm5zW2ldKTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coJ3N1bTogJyArIGF2Z190aHJlc2hvbGQgKyAnLCBuOiAnICsgbl9sYXN0X3R1cm5zKTtcbiAgICBhdmdfdGhyZXNob2xkID0gYXZnX3RocmVzaG9sZCAvIG5fbGFzdF90dXJucztcbiAgICBhdmdfdGhyZXNob2xkID0gdXRpbC5kYjJhKGF2Z190aHJlc2hvbGQpO1xuICAgIGNvbnNvbGUubG9nKCdUdXJuczogJyArIEpTT04uc3RyaW5naWZ5KHRoaXMudHVybnMpKTtcbiAgICBjb25zb2xlLmxvZygnVGhyZXNob2xkOiAnICsgYXZnX3RocmVzaG9sZCk7XG5cbiAgICBpZiAodGhpcy5leHBlcmltZW50LnN0YXR1cyA9PSBFeHBlcmltZW50U3RhdHVzLk5vaXNlVGhyZXNob2xkKSB7XG4gICAgICB0aGlzLmV4cGVyaW1lbnQubm9pc2VUaHJlc2hvbGQgPSBhdmdfdGhyZXNob2xkO1xuICAgICAgdGhpcy5leHBlcmltZW50LnN0YXR1cyA9IEV4cGVyaW1lbnRTdGF0dXMuVG9uZVRocmVzaG9sZDtcbiAgICAgIHJldHVybiB0aGlzLnNldHVwKCkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gJ05vdyB3ZSB3aWxsIG1lYXN1cmUgYW5vdGhlciB0aHJlc2hvbGQgdXNpbmcgYSB0b25lLiBQcmVzcyBwbGF5IHRvIHN0YXJ0LidcbiAgICAgICAgdGhpcy50aXRsZVRleHQgPSBcIlRocmVzaG9sZCAyLzJcIjtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5leHBlcmltZW50LnN0YXR1cyA9PSBFeHBlcmltZW50U3RhdHVzLlRvbmVUaHJlc2hvbGQpIHtcbiAgICAgIHRoaXMuZXhwZXJpbWVudC50b25lVGhyZXNob2xkID0gYXZnX3RocmVzaG9sZDtcbiAgICAgIHJldHVybiB0aGlzLnJvdXRlckV4dGVuc2lvbnMubmF2aWdhdGUoW1wiL2V4cGVyaW1lbnRcIl0sIHtjbGVhckhpc3Rvcnk6IHRydWV9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuc2hvd0Vycm9yKCdVbmV4cGVjdGVkIGV4cGVyaW1lbnQgc3RhdHVzOiAnICsgdGhpcy5leHBlcmltZW50LnN0YXR1cyk7XG4gICAgfVxuXG4gIH1cblxuICBjYW5jZWwoKSB7XG4gICAgY29uc29sZS5sb2coXCJjYW5jZWxcIik7XG4gICAgcmV0dXJuIHRoaXMucGxheWVyLnBhdXNlKCkudGhlbigoKSA9PiB7XG4gICAgICBjbGVhckludGVydmFsKHRoaXMudm9sdW1lVXBkYXRlVGltZXJJZCk7XG4gICAgICB0aGlzLnNlc3Npb25Qcm92aWRlci5jYW5jZWxFeHBlcmltZW50KCk7XG4gICAgICByZXR1cm4gdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFtcIi9leHBlcmltZW50bGlzdFwiXSwge2NsZWFySGlzdG9yeTogdHJ1ZX0pO1xuICAgIH0pO1xuXG4gIH1cblxuICBzaG93RXJyb3IoZXJyKSB7XG4gICAgZGlhbG9ncy5hbGVydCh7XG4gICAgICB0aXRsZTogJ0Vycm9yJyxcbiAgICAgIG1lc3NhZ2U6IGVycixcbiAgICAgIG9rQnV0dG9uVGV4dDogJ0Nsb3NlJ1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgLy8gcGFzc1xuICAgIH0pO1xuICB9XG59XG4iXX0=