"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var page_1 = require("ui/page");
var env = require("../../config/environment");
var volumeobserver_1 = require("../../shared/volumeobserver");
var router_1 = require("nativescript-angular/router");
var session_1 = require("../../shared/session/session");
var VolumeviewPage = /** @class */ (function () {
    function VolumeviewPage(sessionProvider, routerExtensions, ngZone, page) {
        var _this = this;
        this.sessionProvider = sessionProvider;
        this.routerExtensions = routerExtensions;
        this.ngZone = ngZone;
        this.page = page;
        this.targetVolume = env.deviceVolume;
        this.enableContinue = false;
        this.audioSession = AVAudioSession.sharedInstance();
        this.audioSession.setActiveError(true);
        this.masterVolumeObserver = new volumeobserver_1.VolumeObserver();
        this.masterVolumeObserver.setCallback(function (obj) {
            _this.ngZone.run(function () { return _this.setMasterVolume(obj.outputVolume); });
        });
        this.audioSession.addObserverForKeyPathOptionsContext(this.masterVolumeObserver, "outputVolume", 1 /* New */, null);
        this.volume = this.audioSession.outputVolume;
        if (Math.abs(this.volume - this.targetVolume) < env.deviceVolumeResolution) {
            this.enableContinue = true;
        }
        else if (this.volume < this.targetVolume) {
            this.adjust = "up";
        }
        else if (this.volume > this.targetVolume) {
            this.adjust = "down";
        }
        this.page.on("navigatingFrom", function (data) {
            _this.audioSession.removeObserverForKeyPath(_this.masterVolumeObserver, "outputVolume");
        });
    }
    VolumeviewPage.prototype.setMasterVolume = function (vol) {
        if (Math.abs(vol - this.targetVolume) < env.deviceVolumeResolution) {
            this.enableContinue = true;
        }
        else if (vol < this.targetVolume) {
            this.enableContinue = false;
            this.adjust = "up";
        }
        else if (vol > this.targetVolume) {
            this.enableContinue = false;
            this.adjust = "down";
        }
        this.volume = vol;
    };
    VolumeviewPage = __decorate([
        core_1.Component({
            moduleId: module.id,
            selector: 'page-volumeview',
            templateUrl: './volumeview.html'
        }),
        __metadata("design:paramtypes", [session_1.SessionProvider,
            router_1.RouterExtensions,
            core_1.NgZone,
            page_1.Page])
    ], VolumeviewPage);
    return VolumeviewPage;
}());
exports.VolumeviewPage = VolumeviewPage;
