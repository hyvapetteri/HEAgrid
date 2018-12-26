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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidm9sdW1ldmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInZvbHVtZXZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBa0Q7QUFDbEQsZ0NBQStCO0FBRS9CLDhDQUFnRDtBQUNoRCw4REFBNkQ7QUFDN0Qsc0RBQStEO0FBRS9ELHdEQUE2RjtBQVM3RjtJQVFFLHdCQUFvQixlQUFnQyxFQUNoQyxnQkFBa0MsRUFDbEMsTUFBYyxFQUNkLElBQVU7UUFIOUIsaUJBNEJDO1FBNUJtQixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFDaEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUNsQyxXQUFNLEdBQU4sTUFBTSxDQUFRO1FBQ2QsU0FBSSxHQUFKLElBQUksQ0FBTTtRQUU1QixJQUFJLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUM7UUFDckMsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7UUFFNUIsSUFBSSxDQUFDLFlBQVksR0FBRyxjQUFjLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDcEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksK0JBQWMsRUFBRSxDQUFDO1FBQ2pELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsVUFBQyxHQUFPO1lBQzVDLEtBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGNBQU0sT0FBQSxLQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBdEMsQ0FBc0MsQ0FBQyxDQUFDO1FBQ2hFLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLFlBQVksQ0FBQyxtQ0FBbUMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsY0FBYyxlQUFrQyxJQUFJLENBQUMsQ0FBQztRQUV2SSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDO1FBQzdDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztZQUMzRSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztRQUM3QixDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7UUFDckIsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQzNDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFDLElBQWU7WUFDN0MsS0FBSSxDQUFDLFlBQVksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFJLENBQUMsb0JBQW9CLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDeEYsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsd0NBQWUsR0FBZixVQUFnQixHQUFVO1FBQ3hCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDO1lBQ25FLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO1FBQzdCLENBQUM7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO1lBQzVCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLENBQUM7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO1lBQzVCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3ZCLENBQUM7UUFDRCxJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztJQUNwQixDQUFDO0lBakRVLGNBQWM7UUFMMUIsZ0JBQVMsQ0FBQztZQUNULFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRTtZQUNuQixRQUFRLEVBQUUsaUJBQWlCO1lBQzNCLFdBQVcsRUFBRSxtQkFBbUI7U0FDakMsQ0FBQzt5Q0FTcUMseUJBQWU7WUFDZCx5QkFBZ0I7WUFDMUIsYUFBTTtZQUNSLFdBQUk7T0FYbkIsY0FBYyxDQW1EMUI7SUFBRCxxQkFBQztDQUFBLEFBbkRELElBbURDO0FBbkRZLHdDQUFjIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBOZ1pvbmUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tIFwidWkvcGFnZVwiO1xuaW1wb3J0IHsgRXZlbnREYXRhIH0gZnJvbSBcImRhdGEvb2JzZXJ2YWJsZVwiO1xuaW1wb3J0ICogYXMgZW52IGZyb20gXCIuLi8uLi9jb25maWcvZW52aXJvbm1lbnRcIjtcbmltcG9ydCB7IFZvbHVtZU9ic2VydmVyIH0gZnJvbSBcIi4uLy4uL3NoYXJlZC92b2x1bWVvYnNlcnZlclwiO1xuaW1wb3J0IHsgUm91dGVyRXh0ZW5zaW9ucyB9IGZyb20gXCJuYXRpdmVzY3JpcHQtYW5ndWxhci9yb3V0ZXJcIjtcblxuaW1wb3J0IHsgU2Vzc2lvblByb3ZpZGVyLCBFeHBlcmltZW50LCBFeHBlcmltZW50U3RhdHVzIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3Nlc3Npb24vc2Vzc2lvbic7XG5cbmRlY2xhcmUgdmFyIE5TVVJMO1xuXG5AQ29tcG9uZW50KHtcbiAgbW9kdWxlSWQ6IG1vZHVsZS5pZCxcbiAgc2VsZWN0b3I6ICdwYWdlLXZvbHVtZXZpZXcnLFxuICB0ZW1wbGF0ZVVybDogJy4vdm9sdW1ldmlldy5odG1sJ1xufSlcbmV4cG9ydCBjbGFzcyBWb2x1bWV2aWV3UGFnZSB7XG4gIHByaXZhdGUgdGFyZ2V0Vm9sdW1lOiBudW1iZXI7XG4gIHByaXZhdGUgdm9sdW1lOiBudW1iZXI7XG4gIHByaXZhdGUgYWRqdXN0OiBzdHJpbmc7XG4gIHByaXZhdGUgYXVkaW9TZXNzaW9uOiBBVkF1ZGlvU2Vzc2lvbjtcbiAgcHJpdmF0ZSBlbmFibGVDb250aW51ZTogYm9vbGVhbjtcbiAgcHJpdmF0ZSBtYXN0ZXJWb2x1bWVPYnNlcnZlcjogVm9sdW1lT2JzZXJ2ZXI7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBzZXNzaW9uUHJvdmlkZXI6IFNlc3Npb25Qcm92aWRlcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSByb3V0ZXJFeHRlbnNpb25zOiBSb3V0ZXJFeHRlbnNpb25zLFxuICAgICAgICAgICAgICBwcml2YXRlIG5nWm9uZTogTmdab25lLFxuICAgICAgICAgICAgICBwcml2YXRlIHBhZ2U6IFBhZ2UpIHtcblxuICAgIHRoaXMudGFyZ2V0Vm9sdW1lID0gZW52LmRldmljZVZvbHVtZTtcbiAgICB0aGlzLmVuYWJsZUNvbnRpbnVlID0gZmFsc2U7XG5cbiAgICB0aGlzLmF1ZGlvU2Vzc2lvbiA9IEFWQXVkaW9TZXNzaW9uLnNoYXJlZEluc3RhbmNlKCk7XG4gICAgdGhpcy5hdWRpb1Nlc3Npb24uc2V0QWN0aXZlRXJyb3IodHJ1ZSk7XG4gICAgdGhpcy5tYXN0ZXJWb2x1bWVPYnNlcnZlciA9IG5ldyBWb2x1bWVPYnNlcnZlcigpO1xuICAgIHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIuc2V0Q2FsbGJhY2soKG9iajphbnkpID0+IHtcbiAgICAgIHRoaXMubmdab25lLnJ1bigoKSA9PiB0aGlzLnNldE1hc3RlclZvbHVtZShvYmoub3V0cHV0Vm9sdW1lKSk7XG4gICAgfSk7XG4gICAgdGhpcy5hdWRpb1Nlc3Npb24uYWRkT2JzZXJ2ZXJGb3JLZXlQYXRoT3B0aW9uc0NvbnRleHQodGhpcy5tYXN0ZXJWb2x1bWVPYnNlcnZlciwgXCJvdXRwdXRWb2x1bWVcIiwgTlNLZXlWYWx1ZU9ic2VydmluZ09wdGlvbnMuTmV3LCBudWxsKTtcblxuICAgIHRoaXMudm9sdW1lID0gdGhpcy5hdWRpb1Nlc3Npb24ub3V0cHV0Vm9sdW1lO1xuICAgIGlmIChNYXRoLmFicyh0aGlzLnZvbHVtZSAtIHRoaXMudGFyZ2V0Vm9sdW1lKSA8IGVudi5kZXZpY2VWb2x1bWVSZXNvbHV0aW9uKSB7XG4gICAgICB0aGlzLmVuYWJsZUNvbnRpbnVlID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHRoaXMudm9sdW1lIDwgdGhpcy50YXJnZXRWb2x1bWUpIHtcbiAgICAgIHRoaXMuYWRqdXN0ID0gXCJ1cFwiO1xuICAgIH0gZWxzZSBpZiAodGhpcy52b2x1bWUgPiB0aGlzLnRhcmdldFZvbHVtZSkge1xuICAgICAgdGhpcy5hZGp1c3QgPSBcImRvd25cIjtcbiAgICB9XG5cbiAgICB0aGlzLnBhZ2Uub24oXCJuYXZpZ2F0aW5nRnJvbVwiLCAoZGF0YTogRXZlbnREYXRhKSA9PiB7XG4gICAgICB0aGlzLmF1ZGlvU2Vzc2lvbi5yZW1vdmVPYnNlcnZlckZvcktleVBhdGgodGhpcy5tYXN0ZXJWb2x1bWVPYnNlcnZlciwgXCJvdXRwdXRWb2x1bWVcIik7XG4gICAgfSk7XG4gIH1cblxuICBzZXRNYXN0ZXJWb2x1bWUodm9sOm51bWJlcikge1xuICAgIGlmIChNYXRoLmFicyh2b2wgLSB0aGlzLnRhcmdldFZvbHVtZSkgPCBlbnYuZGV2aWNlVm9sdW1lUmVzb2x1dGlvbikge1xuICAgICAgdGhpcy5lbmFibGVDb250aW51ZSA9IHRydWU7XG4gICAgfSBlbHNlIGlmICh2b2wgPCB0aGlzLnRhcmdldFZvbHVtZSkge1xuICAgICAgdGhpcy5lbmFibGVDb250aW51ZSA9IGZhbHNlO1xuICAgICAgdGhpcy5hZGp1c3QgPSBcInVwXCI7XG4gICAgfSBlbHNlIGlmICh2b2wgPiB0aGlzLnRhcmdldFZvbHVtZSkge1xuICAgICAgdGhpcy5lbmFibGVDb250aW51ZSA9IGZhbHNlO1xuICAgICAgdGhpcy5hZGp1c3QgPSBcImRvd25cIjtcbiAgICB9XG4gICAgdGhpcy52b2x1bWUgPSB2b2w7XG4gIH1cblxufVxuIl19