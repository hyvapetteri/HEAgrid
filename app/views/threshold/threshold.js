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
        this.audioPath = fs.path.join(appPath.path, env.audioPath);
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
            settingsPath: this.audioPath,
            debug: true
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyZXNob2xkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGhyZXNob2xkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQWtEO0FBQ2xELGdDQUErQjtBQUUvQixxREFBdUQ7QUFFdkQsaURBQW1EO0FBQ25ELDhDQUFnRDtBQUNoRCx5Q0FBMkM7QUFDM0MsOERBQTZEO0FBQzdELHNEQUErRDtBQUcvRCw0RUFBeUc7QUFFekcsd0RBQTZGO0FBVTdGO0lBd0JFLHVCQUFvQixlQUFnQyxFQUNoQyxnQkFBa0MsRUFDbEMsT0FBZSxFQUNmLElBQVU7UUFIOUIsaUJBNkNDO1FBN0NtQixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFDaEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUNsQyxZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQ2YsU0FBSSxHQUFKLElBQUksQ0FBTTtRQUU1QixJQUFJLENBQUMsU0FBUyxHQUFHLGVBQWUsQ0FBQztRQUVqQyxJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztRQUN4QixJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztRQUMxQixJQUFJLENBQUMsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO1FBRWpDLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLElBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7UUFFeEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFDOUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsMEJBQWdCLENBQUMsY0FBYyxDQUFDO1FBRXpELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxVQUFDLElBQWU7WUFFMUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBQ3RDLElBQUksWUFBWSxHQUFHLGNBQWMs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O1FBQ25GLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQztJQUVELGlDQUFTLEdBQVQsVUFBVSxHQUFHO1FBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQztZQUNaLEtBQUssRUFBRSxPQUFPO1lBQ2QsT0FBTyxFQUFFLEdBQUc7WUFDWixZQUFZLEVBQUUsT0FBTztTQUN0QixDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ04sT0FBTztRQUNULENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQXJPVSxhQUFhO1FBTnpCLGdCQUFTLENBQUM7WUFDVCxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkIsUUFBUSxFQUFFLGdCQUFnQjtZQUMxQixXQUFXLEVBQUUsa0JBQWtCO1lBQy9CLFNBQVMsRUFBRSxDQUFDLGlCQUFpQixDQUFDO1NBQy9CLENBQUM7eUNBeUJxQyx5QkFBZTtZQUNkLHlCQUFnQjtZQUN6QixhQUFNO1lBQ1QsV0FBSTtPQTNCbkIsYUFBYSxDQXNPekI7SUFBRCxvQkFBQztDQUFBLEFBdE9ELElBc09DO0FBdE9ZLHNDQUFhIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBOZ1pvbmUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tIFwidWkvcGFnZVwiO1xuaW1wb3J0IHsgRXZlbnREYXRhIH0gZnJvbSBcImRhdGEvb2JzZXJ2YWJsZVwiO1xuaW1wb3J0ICogYXMgZGlhbG9ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9kaWFsb2dzXCI7XG5pbXBvcnQgKiBhcyBhcHBsaWNhdGlvbiBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9hcHBsaWNhdGlvblwiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvZmlsZS1zeXN0ZW1cIjtcbmltcG9ydCAqIGFzIGVudiBmcm9tIFwiLi4vLi4vY29uZmlnL2Vudmlyb25tZW50XCI7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gXCIuLi8uLi9zaGFyZWQvdXRpbHNcIjtcbmltcG9ydCB7IFZvbHVtZU9ic2VydmVyIH0gZnJvbSBcIi4uLy4uL3NoYXJlZC92b2x1bWVvYnNlcnZlclwiO1xuaW1wb3J0IHsgUm91dGVyRXh0ZW5zaW9ucyB9IGZyb20gXCJuYXRpdmVzY3JpcHQtYW5ndWxhci9yb3V0ZXJcIjtcbmltcG9ydCB7IFRvdWNoR2VzdHVyZUV2ZW50RGF0YSB9IGZyb20gXCJ1aS9nZXN0dXJlc1wiO1xuaW1wb3J0IHsgVE5TUGxheWVyIH0gZnJvbSAnbmF0aXZlc2NyaXB0LWF1ZGlvJztcbmltcG9ydCB7IEdyaWRQbGF5ZXIsIEdyaWRQbGF5ZXJPcHRpb25zLCBDaGFubmVsT3B0aW9ucyB9IGZyb20gJy4uLy4uL3NoYXJlZC9ncmlkLXBsYXllci9ncmlkLXBsYXllci1pb3MnO1xuXG5pbXBvcnQgeyBTZXNzaW9uUHJvdmlkZXIsIEV4cGVyaW1lbnQsIEV4cGVyaW1lbnRTdGF0dXMgfSBmcm9tICcuLi8uLi9zaGFyZWQvc2Vzc2lvbi9zZXNzaW9uJztcblxuZGVjbGFyZSB2YXIgTlNVUkw7XG5cbkBDb21wb25lbnQoe1xuICBtb2R1bGVJZDogbW9kdWxlLmlkLFxuICBzZWxlY3RvcjogJ3BhZ2UtdGhyZXNob2xkJyxcbiAgdGVtcGxhdGVVcmw6ICcuL3RocmVzaG9sZC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJy4vdGhyZXNob2xkLmNzcyddXG59KVxuZXhwb3J0IGNsYXNzIFRocmVzaG9sZFBhZ2Uge1xuICBwcml2YXRlIHRpdGxlVGV4dDpzdHJpbmc7XG4gIHByaXZhdGUgaW5zdHJ1Y3Rpb25UZXh0OiBzdHJpbmc7XG4gIHByaXZhdGUgYW5zd2VyQnV0dG9uVGV4dDogc3RyaW5nO1xuICBwcml2YXRlIHBsYXlCdXR0b25UZXh0OiBzdHJpbmc7XG4gIHByaXZhdGUgYW5zd2VyQnV0dG9uUHJlc3NlZDogYm9vbGVhbjtcblxuICBwcml2YXRlIGVuYWJsZVBsYXk6IGJvb2xlYW47XG4gIHByaXZhdGUgZW5hYmxlQW5zd2VyOiBib29sZWFuO1xuXG4gIC8vcHJpdmF0ZSBwbGF5ZXI6IFROU1BsYXllcjtcbiAgcHJpdmF0ZSBwbGF5ZXI6IEdyaWRQbGF5ZXI7XG4gIHByaXZhdGUgYXVkaW9QYXRoOiBzdHJpbmc7XG5cbiAgcHJpdmF0ZSB2b2x1bWU6IG51bWJlcjtcbiAgcHJpdmF0ZSB0dXJuczogbnVtYmVyW107XG4gIHByaXZhdGUgZGlyZWN0aW9uOiBudW1iZXI7XG4gIHByaXZhdGUgbWF4X3R1cm5zOiBudW1iZXI7XG5cbiAgcHJpdmF0ZSB2b2x1bWVVcGRhdGVUaW1lcklkOiBudW1iZXI7XG4gIHByaXZhdGUgbWFzdGVyVm9sdW1lT2JzZXJ2ZXI6IFZvbHVtZU9ic2VydmVyO1xuXG4gIHByaXZhdGUgZXhwZXJpbWVudDogRXhwZXJpbWVudDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHNlc3Npb25Qcm92aWRlcjogU2Vzc2lvblByb3ZpZGVyLFxuICAgICAgICAgICAgICBwcml2YXRlIHJvdXRlckV4dGVuc2lvbnM6IFJvdXRlckV4dGVuc2lvbnMsXG4gICAgICAgICAgICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgICAgICAgICAgICBwcml2YXRlIHBhZ2U6IFBhZ2UpIHtcblxuICAgIHRoaXMudGl0bGVUZXh0ID0gXCJUaHJlc2hvbGQgMS8yXCI7XG5cbiAgICB0aGlzLmVuYWJsZVBsYXkgPSBmYWxzZTtcbiAgICB0aGlzLmVuYWJsZUFuc3dlciA9IGZhbHNlO1xuICAgIHRoaXMuYW5zd2VyQnV0dG9uUHJlc3NlZCA9IGZhbHNlO1xuXG4gICAgdGhpcy50dXJucyA9IFtdO1xuICAgIHRoaXMubWF4X3R1cm5zID0gZW52LnRocmVzaG9sZC5tYXhUdXJucztcblxuICAgIHRoaXMuZXhwZXJpbWVudCA9IHRoaXMuc2Vzc2lvblByb3ZpZGVyLmdldEN1cnJlbnRFeHBlcmltZW50KCk7XG4gICAgdGhpcy5leHBlcmltZW50LnN0YXR1cyA9IEV4cGVyaW1lbnRTdGF0dXMuTm9pc2VUaHJlc2hvbGQ7XG5cbiAgICB0aGlzLnBhZ2Uub24oXCJuYXZpZ2F0ZWRUb1wiLCAoZGF0YTogRXZlbnREYXRhKSA9PiB7XG5cbiAgICAgIGNvbnNvbGUubG9nKFwiYWRkaW5nIHZvbHVtZSBvYnNlcnZlclwiKTtcbiAgICAgIGxldCBhdWRpb1Nlc3Npb24gPSBBVkF1ZGlvU2Vzc2lvbi5zaGFyZWRJbnN0YW5jZSgpO1xuICAgICAgdGhpcy5tYXN0ZXJWb2x1bWVPYnNlcnZlciA9IG5ldyBWb2x1bWVPYnNlcnZlcigpO1xuICAgICAgdGhpcy5tYXN0ZXJWb2x1bWVPYnNlcnZlci5zZXRDYWxsYmFjaygob2JqKSA9PiB7XG4gICAgICAgIHRoaXMucGxheWVyLnBhdXNlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLnZvbHVtZVVwZGF0ZVRpbWVySWQpO1xuICAgICAgICAgIHRoaXMuc2Vzc2lvblByb3ZpZGVyLmNhbmNlbEV4cGVyaW1lbnQoKTtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGRpYWxvZ3MuYWxlcnQoe1xuICAgICAgICAgICAgdGl0bGU6IFwiVm9sdW1lIGNoYW5nZWQhXCIsXG4gICAgICAgICAgICBtZXNzYWdlOiBcIkEgdm9sdW1lIGJ1dHRvbiBwcmVzcyB3YXMgb2JzZXJ2ZWQuIFRoZSBjdXJyZW50IGV4cGVyaW1lbnQgd2lsbCBiZSBjYW5jZWxsZWQgYW5kIHlvdSB3aWxsIG5vdyByZXR1cm4gdG8gdGhlIHZvbHVtZSBzZXR0aW5nIHNjcmVlbi5cIixcbiAgICAgICAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB0aGlzLnJvdXRlckV4dGVuc2lvbnMubmF2aWdhdGUoW1wiL3ZvbHVtZVwiXSwge2NsZWFySGlzdG9yeTogdHJ1ZX0pO1xuICAgICAgICB9KS5jYXRjaChlcnIgPT4gY29uc29sZS5sb2coZXJyKSk7XG4gICAgICB9KTtcbiAgICAgIGF1ZGlvU2Vzc2lvbi5hZGRPYnNlcnZlckZvcktleVBhdGhPcHRpb25zQ29udGV4dCh0aGlzLm1hc3RlclZvbHVtZU9ic2VydmVyLCBcIm91dHB1dFZvbHVtZVwiLCBOU0tleVZhbHVlT2JzZXJ2aW5nT3B0aW9ucy5OZXcsIG51bGwpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5wYWdlLm9uKFwibmF2aWdhdGluZ0Zyb21cIiwgKGRhdGE6IEV2ZW50RGF0YSkgPT4ge1xuICAgICAgbGV0IGF1ZGlvU2Vzc2lvbiA9IEFWQXVkaW9TZXNzaW9uLnNoYXJlZEluc3RhbmNlKCk7XG4gICAgICBhdWRpb1Nlc3Npb24ucmVtb3ZlT2JzZXJ2ZXJGb3JLZXlQYXRoKHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIsIFwib3V0cHV0Vm9sdW1lXCIpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5zZXR1cCgpO1xuICB9XG5cbiAgb25CdXR0b25Ub3VjaChhcmdzOiBUb3VjaEdlc3R1cmVFdmVudERhdGEpIHtcbiAgICBpZiAoYXJncy5hY3Rpb24gPT0gJ2Rvd24nKSB7XG4gICAgICB0aGlzLmFuc3dlckJ1dHRvblByZXNzZWQgPSB0cnVlO1xuICAgICAgdGhpcy50dXJucy5wdXNoKHRoaXMudm9sdW1lKTtcbiAgICAgIHRoaXMuZGlyZWN0aW9uID0gLTE7XG4gICAgICB0aGlzLmFuc3dlckJ1dHRvblRleHQgPSAnSG9sZCc7XG4gICAgfSBlbHNlIGlmIChhcmdzLmFjdGlvbiA9PSAndXAnKSB7XG4gICAgICB0aGlzLmFuc3dlckJ1dHRvblByZXNzZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMudHVybnMucHVzaCh0aGlzLnZvbHVtZSk7XG4gICAgICB0aGlzLmRpcmVjdGlvbiA9IDE7XG4gICAgICB0aGlzLmFuc3dlckJ1dHRvblRleHQgPSAnUHVzaCc7XG4gICAgfVxuICAgIGlmICh0aGlzLnR1cm5zLmxlbmd0aCA+PSB0aGlzLm1heF90dXJucykge1xuICAgICAgdGhpcy5wbGF5ZXIuZGlzcG9zZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICBjbGVhckludGVydmFsKHRoaXMudm9sdW1lVXBkYXRlVGltZXJJZCk7XG4gICAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gJ0RvbmUnO1xuICAgICAgICB0aGlzLmZpbmlzaCgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgc2V0dXAoKSB7XG4gICAgbGV0IGFwcFBhdGggPSBmcy5rbm93bkZvbGRlcnMuY3VycmVudEFwcCgpO1xuICAgIHRoaXMuYXVkaW9QYXRoID0gZnMucGF0aC5qb2luKGFwcFBhdGgucGF0aCwgZW52LmF1ZGlvUGF0aCk7XG4gICAgY29uc29sZS5sb2codGhpcy5hdWRpb1BhdGgpO1xuXG4gICAgLy90aGlzLnBsYXllciA9IG5ldyBUTlNQbGF5ZXIoKTtcbiAgICBsZXQgcGxheWVyT3B0aW9uczpHcmlkUGxheWVyT3B0aW9ucyA9IHtcbiAgICAgIHRhcmdldEZyZXF1ZW5jeTogdGhpcy5leHBlcmltZW50LnRlc3RGcmVxdWVuY3ksXG4gICAgICBsb29wOiB0cnVlLFxuICAgICAgcGFkZGVkU2lsZW5jZUR1cmF0aW9uOiBlbnYudGhyZXNob2xkLnBhZGRlZFNpbGVuY2VEdXJhdGlvbl9zLFxuICAgICAgdGFyZ2V0RHVyYXRpb246IGVudi50aHJlc2hvbGQudGFyZ2V0RHVyYXRpb25fcyxcbiAgICAgIG1hc2tlckR1cmF0aW9uOiBlbnYudGhyZXNob2xkLm1hc2tlckR1cmF0aW9uX3MsXG4gICAgICBtYXNrZXJMZXZlbDogMCxcbiAgICAgIGNoYW5uZWxPcHRpb25zOiBDaGFubmVsT3B0aW9ucy5EaW90aWMsXG4gICAgICBzZXR0aW5nc1BhdGg6IHRoaXMuYXVkaW9QYXRoLFxuICAgICAgZGVidWc6IHRydWVcbiAgICB9XG4gICAgdGhpcy5wbGF5ZXIgPSBuZXcgR3JpZFBsYXllcigpO1xuXG4gICAgcmV0dXJuIHRoaXMucGxheWVyLmluaXRpYWxpemUocGxheWVyT3B0aW9ucykudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5wbGF5ZXIucHJlbG9hZFN0aW11bHVzKDAsIGVudi5tYXhUYXJnZXRMZXZlbF9kQiwgKHRoaXMuZXhwZXJpbWVudC5zdGF0dXMgPT0gRXhwZXJpbWVudFN0YXR1cy5Ub25lVGhyZXNob2xkKSxcbiAgICAgICAgICAgIHRoaXMuZXhwZXJpbWVudC5zdGF0dXMgPT0gRXhwZXJpbWVudFN0YXR1cy5Ob2lzZVRocmVzaG9sZCk7XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnc3RpbXVsdXMgcHJlbG9hZGVkIScpO1xuICAgICAgdGhpcy5lbmFibGVQbGF5ID0gdHJ1ZTtcbiAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gJ1ByZXNzIHBsYXkgdG8gc3RhcnQnO1xuICAgICAgdGhpcy5hbnN3ZXJCdXR0b25UZXh0ID0gJ1B1c2gnO1xuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnZXJyb3IgcHJlbG9hZGluZyBzdGltdWx1cycpO1xuICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICB9KTtcblxuICAgIC8vIGxldCBmcmVxID0gdGhpcy5leHBlcmltZW50LnRlc3RGcmVxdWVuY3k7XG4gICAgLy9cbiAgICAvLyBsZXQgYXVkaW9maWxlID0gJyc7XG4gICAgLy8gaWYgKHRoaXMuZXhwZXJpbWVudC5zdGF0dXMgPT0gRXhwZXJpbWVudFN0YXR1cy5Ob2lzZVRocmVzaG9sZCkge1xuICAgIC8vICAgYXVkaW9maWxlID0gJ25vaXNlX3JlZi53YXYnO1xuICAgIC8vIH0gZWxzZSBpZiAodGhpcy5leHBlcmltZW50LnN0YXR1cyA9PSBFeHBlcmltZW50U3RhdHVzLlRvbmVUaHJlc2hvbGQpIHtcbiAgICAvLyAgIGF1ZGlvZmlsZSA9ICdmJyArIGZyZXEgKyAnX3JlZi53YXYnO1xuICAgIC8vIH0gZWxzZSB7XG4gICAgLy8gICByZXR1cm4gdGhpcy5zaG93RXJyb3IoJ1VuZXhwZWN0ZWQgZXhwZXJpbWVudCBzdGF0dXM6ICcgKyB0aGlzLmV4cGVyaW1lbnQuc3RhdHVzKTtcbiAgICAvLyB9XG5cbiAgICAvLyByZXR1cm4gdGhpcy5wbGF5ZXIuaW5pdEZyb21GaWxlKHtcbiAgICAvLyAgIGF1ZGlvRmlsZTogZnMucGF0aC5qb2luKHRoaXMuYXVkaW9QYXRoLCBhdWRpb2ZpbGUpLFxuICAgIC8vICAgbG9vcDogdHJ1ZVxuICAgIC8vIH0pLnRoZW4oKCkgPT4ge1xuICAgIC8vICAgdGhpcy5lbmFibGVQbGF5ID0gdHJ1ZTtcbiAgICAvLyAgIHRoaXMucmVzZXQoKTtcbiAgICAvLyAgIHRoaXMuaW5zdHJ1Y3Rpb25UZXh0ID0gJ1ByZXNzIHBsYXkgdG8gc3RhcnQnO1xuICAgIC8vICAgdGhpcy5hbnN3ZXJCdXR0b25UZXh0ID0gJ1B1c2gnO1xuICAgIC8vIH0pLmNhdGNoKGVyciA9PiB0aGlzLnNob3dFcnJvcihlcnIpKTtcblxuICB9XG5cbiAgcGxheSgpIHtcbiAgICAvL2lmICh0aGlzLnBsYXllci5pc0F1ZGlvUGxheWluZygpKSB7XG4gICAgaWYgKHRoaXMucGxheWVyLmlzUGxheWluZygpKSB7XG4gICAgICBjb25zb2xlLmxvZygncGF1c2UnKTtcbiAgICAgIHJldHVybiB0aGlzLnBsYXllci5wYXVzZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICBjbGVhckludGVydmFsKHRoaXMudm9sdW1lVXBkYXRlVGltZXJJZCk7XG4gICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSAnUmVzZXQuIFByZXNzIHBsYXkgdG8gc3RhcnQgYWdhaW4uJztcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZygncGxheScpO1xuICAgICAgdGhpcy5kaXJlY3Rpb24gPSAxO1xuICAgICAgcmV0dXJuIHRoaXMucGxheWVyLnBsYXkoKS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ1BsYXllciBzdGFydGVkJyk7XG4gICAgICAgIHRoaXMudm9sdW1lVXBkYXRlVGltZXJJZCA9IHNldEludGVydmFsKCgpID0+IHRoaXMudXBkYXRlVm9sdW1lKCksIGVudi50aHJlc2hvbGQudm9sdW1lVXBkYXRlSW50ZXJ2YWxfbXMpO1xuICAgICAgICB0aGlzLmVuYWJsZUFuc3dlciA9IHRydWU7XG4gICAgICAgIHRoaXMucGxheUJ1dHRvblRleHQgPSAnUmVzZXQnO1xuICAgICAgICB0aGlzLmluc3RydWN0aW9uVGV4dCA9IFwiV2hlbiB5b3UgaGVhciBhIHNvdW5kLCBwcmVzcyB0aGUgYnV0dG9uIGFuZCBrZWVwIGl0IHByZXNzZWQgdW50aWwgeW91IGNhbid0IGhlYXIgaXQgYW55bW9yZS4gVGhlbiByZWxlYXNlIGFuZCByZXBlYXQuXCI7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGVWb2x1bWUoKSB7XG4gICAgdGhpcy52b2x1bWUgPSB1dGlsLmRiMmEodGhpcy5kaXJlY3Rpb24gKiBlbnYudGhyZXNob2xkLnZvbHVtZVVwZGF0ZVN0ZXBzaXplX2RCKSAqIHRoaXMudm9sdW1lO1xuICAgIHRoaXMucGxheWVyLnZvbHVtZSA9IHRoaXMudm9sdW1lO1xuICB9XG5cbiAgcmVzZXQoKSB7XG4gICAgdGhpcy5wbGF5QnV0dG9uVGV4dCA9ICdQbGF5JztcbiAgICB0aGlzLmVuYWJsZUFuc3dlciA9IGZhbHNlO1xuICAgIHRoaXMudm9sdW1lID0gdXRpbC5kYjJhKC00MCk7XG4gICAgdGhpcy5wbGF5ZXIudm9sdW1lID0gdGhpcy52b2x1bWU7XG4gICAgdGhpcy50dXJucyA9IFtdO1xuICB9XG5cbiAgZmluaXNoKCkge1xuICAgIGxldCBhdmdfdGhyZXNob2xkID0gMDtcbiAgICBsZXQgbl9sYXN0X3R1cm5zID0gZW52LnRocmVzaG9sZC5uX2F2ZztcbiAgICBmb3IgKGxldCBpID0gdGhpcy50dXJucy5sZW5ndGggLSAxOyBpID49IHRoaXMudHVybnMubGVuZ3RoIC0gbl9sYXN0X3R1cm5zOyBpLS0pIHtcbiAgICAgIGF2Z190aHJlc2hvbGQgPSBhdmdfdGhyZXNob2xkICsgdXRpbC5hMmRiKHRoaXMudHVybnNbaV0pO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZygnc3VtOiAnICsgYXZnX3RocmVzaG9sZCArICcsIG46ICcgKyBuX2xhc3RfdHVybnMpO1xuICAgIGF2Z190aHJlc2hvbGQgPSBhdmdfdGhyZXNob2xkIC8gbl9sYXN0X3R1cm5zO1xuICAgIGF2Z190aHJlc2hvbGQgPSB1dGlsLmRiMmEoYXZnX3RocmVzaG9sZCk7XG4gICAgY29uc29sZS5sb2coJ1R1cm5zOiAnICsgSlNPTi5zdHJpbmdpZnkodGhpcy50dXJucykpO1xuICAgIGNvbnNvbGUubG9nKCdUaHJlc2hvbGQ6ICcgKyBhdmdfdGhyZXNob2xkKTtcblxuICAgIGlmICh0aGlzLmV4cGVyaW1lbnQuc3RhdHVzID09IEV4cGVyaW1lbnRTdGF0dXMuTm9pc2VUaHJlc2hvbGQpIHtcbiAgICAgIHRoaXMuZXhwZXJpbWVudC5ub2lzZVRocmVzaG9sZCA9IGF2Z190aHJlc2hvbGQ7XG4gICAgICB0aGlzLmV4cGVyaW1lbnQuc3RhdHVzID0gRXhwZXJpbWVudFN0YXR1cy5Ub25lVGhyZXNob2xkO1xuICAgICAgcmV0dXJuIHRoaXMuc2V0dXAoKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5pbnN0cnVjdGlvblRleHQgPSAnTm93IHdlIHdpbGwgbWVhc3VyZSBhbm90aGVyIHRocmVzaG9sZCB1c2luZyBhIHRvbmUuIFByZXNzIHBsYXkgdG8gc3RhcnQuJ1xuICAgICAgICB0aGlzLnRpdGxlVGV4dCA9IFwiVGhyZXNob2xkIDIvMlwiO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmV4cGVyaW1lbnQuc3RhdHVzID09IEV4cGVyaW1lbnRTdGF0dXMuVG9uZVRocmVzaG9sZCkge1xuICAgICAgdGhpcy5leHBlcmltZW50LnRvbmVUaHJlc2hvbGQgPSBhdmdfdGhyZXNob2xkO1xuICAgICAgcmV0dXJuIHRoaXMucm91dGVyRXh0ZW5zaW9ucy5uYXZpZ2F0ZShbXCIvZXhwZXJpbWVudFwiXSwge2NsZWFySGlzdG9yeTogdHJ1ZX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5zaG93RXJyb3IoJ1VuZXhwZWN0ZWQgZXhwZXJpbWVudCBzdGF0dXM6ICcgKyB0aGlzLmV4cGVyaW1lbnQuc3RhdHVzKTtcbiAgICB9XG5cbiAgfVxuXG4gIGNhbmNlbCgpIHtcbiAgICBjb25zb2xlLmxvZyhcImNhbmNlbFwiKTtcbiAgICByZXR1cm4gdGhpcy5wbGF5ZXIucGF1c2UoKS50aGVuKCgpID0+IHtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy52b2x1bWVVcGRhdGVUaW1lcklkKTtcbiAgICAgIHRoaXMuc2Vzc2lvblByb3ZpZGVyLmNhbmNlbEV4cGVyaW1lbnQoKTtcbiAgICAgIHJldHVybiB0aGlzLnJvdXRlckV4dGVuc2lvbnMubmF2aWdhdGUoW1wiL2V4cGVyaW1lbnRsaXN0XCJdLCB7Y2xlYXJIaXN0b3J5OiB0cnVlfSk7XG4gICAgfSk7XG5cbiAgfVxuXG4gIHNob3dFcnJvcihlcnIpIHtcbiAgICBkaWFsb2dzLmFsZXJ0KHtcbiAgICAgIHRpdGxlOiAnRXJyb3InLFxuICAgICAgbWVzc2FnZTogZXJyLFxuICAgICAgb2tCdXR0b25UZXh0OiAnQ2xvc2UnXG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAvLyBwYXNzXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==