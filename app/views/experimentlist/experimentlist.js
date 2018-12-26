"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var page_1 = require("ui/page");
var dialogs = require("tns-core-modules/ui/dialogs");
var router_1 = require("nativescript-angular/router");
var environment_1 = require("../../config/environment");
var volumeobserver_1 = require("../../shared/volumeobserver");
var session_1 = require("../../shared/session/session");
var ExperimentListPage = /** @class */ (function () {
    function ExperimentListPage(sessionProvider, routerExtensions, page) {
        var _this = this;
        this.sessionProvider = sessionProvider;
        this.routerExtensions = routerExtensions;
        this.page = page;
        this.listItems = [];
        this.listItems.push({ type: "header", text: "Start new experiment by selecting test frequency below" });
        for (var i = 0; i < environment_1.testfrequencies.length; i++) {
            var item = { type: "test" };
            item.text = "" + environment_1.testfrequencies[i].label;
            item.frequency = environment_1.testfrequencies[i].value;
            this.listItems.push(item);
        }
        this.listItems.push({ type: "header", text: "Previous experiments in the current session" });
        var experimentList = sessionProvider.getExperiments();
        for (var i = 0; i < experimentList.length; i++) {
            var item = { type: "history" };
            item.text = "" + experimentList[i].testFrequency + " (" + experimentList[i].status + ")";
            item.experimentId = i + 1;
            this.listItems.push(item);
        }
        this.page.on("navigatedTo", function (data) {
            console.log("adding volume observer");
            var audioSession = AVAudioSession.sharedInstance();
            _this.masterVolumeObserver = new volumeobserver_1.VolumeObserver();
            _this.masterVolumeObserver.setCallback(function (obj) {
                dialogs.alert({
                    title: "Volume changed!",
                    message: "A volume button press was observed. The current experiment will be cancelled and you will now return to the volume setting screen.",
                    okButtonText: "OK"
                }).then(function () {
                    return _this.routerExtensions.navigate(["/volume"], { clearHistory: true });
                }).catch(function (err) { return console.log(err); });
            });
            audioSession.addObserverForKeyPathOptionsContext(_this.masterVolumeObserver, "outputVolume", 1 /* New */, null);
        });
        this.page.on("navigatingFrom", function (data) {
            console.log("removing volume observer");
            var audioSession = AVAudioSession.sharedInstance();
            audioSession.removeObserverForKeyPath(_this.masterVolumeObserver, "outputVolume");
        });
    }
    ExperimentListPage.prototype.handleTap = function (tapEvent) {
        if (this.listItems[tapEvent.index].type === "test") {
            var pickedFreq = this.listItems[tapEvent.index].frequency;
            this.sessionProvider.startExperiment(pickedFreq);
            return this.routerExtensions.navigate(["/threshold"], { clearHistory: true }).catch(function (err) {
                console.log(err);
            });
        }
        else if (this.listItems[tapEvent.index].type === "history") {
            var pickedExperiment = this.listItems[tapEvent.index].experimentId;
            return this.routerExtensions.navigate(["/gridplot", pickedExperiment]).catch(function (err) {
                console.log(err);
            });
        }
    };
    ExperimentListPage.prototype.templateSelector = function (item, index, items) {
        return item.type;
    };
    ExperimentListPage.prototype.showActionSheet = function () {
        var _this = this;
        dialogs.action({
            title: 'Send the results',
            message: 'version 0.1',
            cancelButtonText: 'Cancel',
            actions: ['Send with email', 'Quit']
        }).then(function (result) {
            console.log(result);
            if (result == "Quit") {
                _this.sessionProvider.resetSession();
                return _this.routerExtensions.navigate(['/start'], { clearHistory: true });
            }
        }).catch(function (err) { return console.log(err); });
    };
    ExperimentListPage.prototype.sendResults = function () {
    };
    ExperimentListPage = __decorate([
        core_1.Component({
            moduleId: module.id,
            selector: 'page-experimentlist',
            templateUrl: './experimentlist.html'
        }),
        __metadata("design:paramtypes", [session_1.SessionProvider,
            router_1.RouterExtensions,
            page_1.Page])
    ], ExperimentListPage);
    return ExperimentListPage;
}());
exports.ExperimentListPage = ExperimentListPage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwZXJpbWVudGxpc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJleHBlcmltZW50bGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUEwQztBQUMxQyxnQ0FBK0I7QUFFL0IscURBQXVEO0FBR3ZELHNEQUErRDtBQUMvRCx3REFBMkQ7QUFDM0QsOERBQTZEO0FBQzdELHdEQUEyRTtBQU8zRTtJQUtFLDRCQUFvQixlQUFnQyxFQUNoQyxnQkFBa0MsRUFDbEMsSUFBVTtRQUY5QixpQkE0Q0M7UUE1Q21CLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtRQUNoQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1FBQ2xDLFNBQUksR0FBSixJQUFJLENBQU07UUFFNUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFDcEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSx3REFBd0QsRUFBQyxDQUFDLENBQUM7UUFDdEcsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyw2QkFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ2hELElBQUksSUFBSSxHQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxHQUFHLDZCQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQzFDLElBQUksQ0FBQyxTQUFTLEdBQUcsNkJBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDMUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUVELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsNkNBQTZD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RSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1lBQzFFLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQSxHQUFHLElBQUksT0FBQSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFoQixDQUFnQixDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELHdDQUFXLEdBQVg7SUFFQSxDQUFDO0lBN0ZVLGtCQUFrQjtRQUw5QixnQkFBUyxDQUFDO1lBQ1QsUUFBUSxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ25CLFFBQVEsRUFBRSxxQkFBcUI7WUFDL0IsV0FBVyxFQUFFLHVCQUF1QjtTQUNyQyxDQUFDO3lDQU1xQyx5QkFBZTtZQUNkLHlCQUFnQjtZQUM1QixXQUFJO09BUG5CLGtCQUFrQixDQStGOUI7SUFBRCx5QkFBQztDQUFBLEFBL0ZELElBK0ZDO0FBL0ZZLGdEQUFrQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gXCJ1aS9wYWdlXCI7XG5pbXBvcnQgeyBFdmVudERhdGEgfSBmcm9tIFwiZGF0YS9vYnNlcnZhYmxlXCI7XG5pbXBvcnQgKiBhcyBkaWFsb2dzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL2RpYWxvZ3NcIjtcbmltcG9ydCB7IExpc3RQaWNrZXIgfSBmcm9tIFwidWkvbGlzdC1waWNrZXJcIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2ZpbGUtc3lzdGVtXCI7XG5pbXBvcnQgeyBSb3V0ZXJFeHRlbnNpb25zIH0gZnJvbSBcIm5hdGl2ZXNjcmlwdC1hbmd1bGFyL3JvdXRlclwiO1xuaW1wb3J0IHsgdGVzdGZyZXF1ZW5jaWVzIH0gZnJvbSBcIi4uLy4uL2NvbmZpZy9lbnZpcm9ubWVudFwiO1xuaW1wb3J0IHsgVm9sdW1lT2JzZXJ2ZXIgfSBmcm9tIFwiLi4vLi4vc2hhcmVkL3ZvbHVtZW9ic2VydmVyXCI7XG5pbXBvcnQgeyBTZXNzaW9uUHJvdmlkZXIsIEV4cGVyaW1lbnQgfSBmcm9tICcuLi8uLi9zaGFyZWQvc2Vzc2lvbi9zZXNzaW9uJztcblxuQENvbXBvbmVudCh7XG4gIG1vZHVsZUlkOiBtb2R1bGUuaWQsXG4gIHNlbGVjdG9yOiAncGFnZS1leHBlcmltZW50bGlzdCcsXG4gIHRlbXBsYXRlVXJsOiAnLi9leHBlcmltZW50bGlzdC5odG1sJ1xufSlcbmV4cG9ydCBjbGFzcyBFeHBlcmltZW50TGlzdFBhZ2Uge1xuICBwcml2YXRlIGxpc3RJdGVtczogQXJyYXk8YW55PjtcbiAgcHJpdmF0ZSBtYXN0ZXJWb2x1bWVPYnNlcnZlcjogVm9sdW1lT2JzZXJ2ZXI7XG4gIHByaXZhdGUgYXVkaW9TZXNzaW9uOiBBVkF1ZGlvU2Vzc2lvbjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHNlc3Npb25Qcm92aWRlcjogU2Vzc2lvblByb3ZpZGVyLFxuICAgICAgICAgICAgICBwcml2YXRlIHJvdXRlckV4dGVuc2lvbnM6IFJvdXRlckV4dGVuc2lvbnMsXG4gICAgICAgICAgICAgIHByaXZhdGUgcGFnZTogUGFnZSkge1xuXG4gICAgdGhpcy5saXN0SXRlbXMgPSBbXTtcbiAgICB0aGlzLmxpc3RJdGVtcy5wdXNoKHt0eXBlOiBcImhlYWRlclwiLCB0ZXh0OiBcIlN0YXJ0IG5ldyBleHBlcmltZW50IGJ5IHNlbGVjdGluZyB0ZXN0IGZyZXF1ZW5jeSBiZWxvd1wifSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXN0ZnJlcXVlbmNpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBpdGVtOmFueSA9IHt0eXBlOiBcInRlc3RcIn07XG4gICAgICBpdGVtLnRleHQgPSBcIlwiICsgdGVzdGZyZXF1ZW5jaWVzW2ldLmxhYmVsO1xuICAgICAgaXRlbS5mcmVxdWVuY3kgPSB0ZXN0ZnJlcXVlbmNpZXNbaV0udmFsdWU7XG4gICAgICB0aGlzLmxpc3RJdGVtcy5wdXNoKGl0ZW0pO1xuICAgIH1cblxuICAgIHRoaXMubGlzdEl0ZW1zLnB1c2goe3R5cGU6IFwiaGVhZGVyXCIsIHRleHQ6IFwiUHJldmlvdXMgZXhwZXJpbWVudHMgaW4gdGhlIGN1cnJlbnQgc2Vzc2lvblwifSk7XG4gICAgbGV0IGV4cGVyaW1lbnRMaXN0ID0gc2Vzc2lvblByb3ZpZGVyLmdldEV4cGVyaW1lbnRzKCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBleHBlcmltZW50TGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IGl0ZW06YW55ID0ge3R5cGU6IFwiaGlzdG9yeVwifTtcbiAgICAgIGl0ZW0udGV4dCA9IFwiXCIgKyBleHBlcmltZW50TGlzdFtpXS50ZXN0RnJlcXVlbmN5ICsgXCIgKFwiICsgZXhwZXJpbWVudExpc3RbaV0uc3RhdHVzICsgXCIpXCI7XG4gICAgICBpdGVtLmV4cGVyaW1lbnRJZCA9IGkgKyAxO1xuICAgICAgdGhpcy5saXN0SXRlbXMucHVzaChpdGVtKTtcbiAgICB9XG5cbiAgICB0aGlzLnBhZ2Uub24oXCJuYXZpZ2F0ZWRUb1wiLCAoZGF0YTogRXZlbnREYXRhKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhcImFkZGluZyB2b2x1bWUgb2JzZXJ2ZXJcIik7XG4gICAgICBsZXQgYXVkaW9TZXNzaW9uID0gQVZBdWRpb1Nlc3Npb24uc2hhcmVkSW5zdGFuY2UoKTtcbiAgICAgIHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIgPSBuZXcgVm9sdW1lT2JzZXJ2ZXIoKTtcbiAgICAgIHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIuc2V0Q2FsbGJhY2soKG9iaikgPT4ge1xuICAgICAgICBkaWFsb2dzLmFsZXJ0KHtcbiAgICAgICAgICB0aXRsZTogXCJWb2x1bWUgY2hhbmdlZCFcIixcbiAgICAgICAgICBtZXNzYWdlOiBcIkEgdm9sdW1lIGJ1dHRvbiBwcmVzcyB3YXMgb2JzZXJ2ZWQuIFRoZSBjdXJyZW50IGV4cGVyaW1lbnQgd2lsbCBiZSBjYW5jZWxsZWQgYW5kIHlvdSB3aWxsIG5vdyByZXR1cm4gdG8gdGhlIHZvbHVtZSBzZXR0aW5nIHNjcmVlbi5cIixcbiAgICAgICAgICBva0J1dHRvblRleHQ6IFwiT0tcIlxuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFtcIi92b2x1bWVcIl0sIHtjbGVhckhpc3Rvcnk6IHRydWV9KTtcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IGNvbnNvbGUubG9nKGVycikpO1xuICAgICAgfSk7XG4gICAgICBhdWRpb1Nlc3Npb24uYWRkT2JzZXJ2ZXJGb3JLZXlQYXRoT3B0aW9uc0NvbnRleHQodGhpcy5tYXN0ZXJWb2x1bWVPYnNlcnZlciwgXCJvdXRwdXRWb2x1bWVcIiwgTlNLZXlWYWx1ZU9ic2VydmluZ09wdGlvbnMuTmV3LCBudWxsKTtcbiAgICB9KTtcblxuICAgIHRoaXMucGFnZS5vbihcIm5hdmlnYXRpbmdGcm9tXCIsIChkYXRhOiBFdmVudERhdGEpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKFwicmVtb3Zpbmcgdm9sdW1lIG9ic2VydmVyXCIpO1xuICAgICAgbGV0IGF1ZGlvU2Vzc2lvbiA9IEFWQXVkaW9TZXNzaW9uLnNoYXJlZEluc3RhbmNlKCk7XG4gICAgICBhdWRpb1Nlc3Npb24ucmVtb3ZlT2JzZXJ2ZXJGb3JLZXlQYXRoKHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIsIFwib3V0cHV0Vm9sdW1lXCIpO1xuICAgIH0pO1xuXG4gIH1cblxuICBoYW5kbGVUYXAodGFwRXZlbnQpIHtcbiAgICBpZiAodGhpcy5saXN0SXRlbXNbdGFwRXZlbnQuaW5kZXhdLnR5cGUgPT09IFwidGVzdFwiKSB7XG4gICAgICBsZXQgcGlja2VkRnJlcSA9IHRoaXMubGlzdEl0ZW1zW3RhcEV2ZW50LmluZGV4XS5mcmVxdWVuY3k7XG4gICAgICB0aGlzLnNlc3Npb25Qcm92aWRlci5zdGFydEV4cGVyaW1lbnQocGlja2VkRnJlcSk7XG5cbiAgICAgIHJldHVybiB0aGlzLnJvdXRlckV4dGVuc2lvbnMubmF2aWdhdGUoXG4gICAgICAgIFtcIi90aHJlc2hvbGRcIl0sIHtjbGVhckhpc3Rvcnk6IHRydWV9XG4gICAgICApLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMubGlzdEl0ZW1zW3RhcEV2ZW50LmluZGV4XS50eXBlID09PSBcImhpc3RvcnlcIikge1xuICAgICAgbGV0IHBpY2tlZEV4cGVyaW1lbnQgPSB0aGlzLmxpc3RJdGVtc1t0YXBFdmVudC5pbmRleF0uZXhwZXJpbWVudElkO1xuXG4gICAgICByZXR1cm4gdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFxuICAgICAgICBbXCIvZ3JpZHBsb3RcIiwgcGlja2VkRXhwZXJpbWVudF1cbiAgICAgICkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHRlbXBsYXRlU2VsZWN0b3IoaXRlbTogYW55LCBpbmRleDogbnVtYmVyLCBpdGVtczogYW55KSB7XG4gICAgcmV0dXJuIGl0ZW0udHlwZTtcbiAgfVxuXG4gIHNob3dBY3Rpb25TaGVldCgpIHtcbiAgICBkaWFsb2dzLmFjdGlvbih7XG4gICAgICB0aXRsZTogJ1NlbmQgdGhlIHJlc3VsdHMnLFxuICAgICAgbWVzc2FnZTogJ3ZlcnNpb24gMC4xJyxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHQ6ICdDYW5jZWwnLFxuICAgICAgYWN0aW9uczogWydTZW5kIHdpdGggZW1haWwnLCAnUXVpdCddXG4gICAgfSkudGhlbigocmVzdWx0OiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gICAgICBpZiAocmVzdWx0ID09IFwiUXVpdFwiKSB7XG4gICAgICAgIHRoaXMuc2Vzc2lvblByb3ZpZGVyLnJlc2V0U2Vzc2lvbigpO1xuICAgICAgICByZXR1cm4gdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFsnL3N0YXJ0J10sIHtjbGVhckhpc3Rvcnk6IHRydWV9KTtcbiAgICAgIH1cbiAgICB9KS5jYXRjaChlcnIgPT4gY29uc29sZS5sb2coZXJyKSk7XG4gIH1cblxuICBzZW5kUmVzdWx0cygpIHtcblxuICB9XG5cbn1cbiJdfQ==