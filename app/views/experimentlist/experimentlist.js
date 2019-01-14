"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var page_1 = require("ui/page");
var dialogs = require("tns-core-modules/ui/dialogs");
var router_1 = require("nativescript-angular/router");
var environment_1 = require("../../config/environment");
var volumeobserver_1 = require("../../shared/volumeobserver");
var session_1 = require("../../shared/session/session");
var appSettings = require("tns-core-modules/application-settings");
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
            item.text = "" + experimentList[i].type + " " + experimentList[i].testFrequency + " Hz (" + experimentList[i].status + ")";
            if (experimentList[i].status == session_1.ExperimentStatus.Finished) {
                var grid = experimentList[i].grid;
                var history_1 = grid.getHistory();
                var n_avg = 6;
                var counter_avg = 0;
                var sum_avg = 0;
                for (var i_1 = history_1.length - 1; i_1 >= 0; i_1--) {
                    if (history_1[i_1].reversal) {
                        sum_avg += history_1[i_1].yval;
                        counter_avg += 1;
                        if (counter_avg == n_avg) {
                            break;
                        }
                    }
                }
                var threshold = sum_avg / n_avg;
                item.text += ", th " + threshold;
            }
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
        var _this = this;
        if (this.listItems[tapEvent.index].type === "test") {
            var pickedFreq_1 = this.listItems[tapEvent.index].frequency;
            var targ_key = "";
            if (pickedFreq_1 == 1000) {
                targ_key = "spl_tone1k";
            }
            else if (pickedFreq_1 == 2000) {
                targ_key = "spl_tone2k";
            }
            else if (pickedFreq_1 == 4000) {
                targ_key = "spl_tone4k";
            }
            var targ_ref_level = void 0;
            if (appSettings.hasKey(targ_key)) {
                targ_ref_level = appSettings.getNumber(targ_key);
            }
            else {
                return this.showError("Calibrate levels first!");
            }
            return dialogs.action({
                title: "Experiment type",
                cancelButtonText: "Cancel",
                actions: ["Grid (default)", "AFC, no gap", "AFC, 0.2 gap"]
            }).then(function (result) {
                _this.sessionProvider.startExperiment(pickedFreq_1);
                if (result === "Grid (default)") {
                    _this.sessionProvider.getCurrentExperiment().type = session_1.ExperimentType.Grid;
                }
                else if (result === "AFC, no gap") {
                    _this.sessionProvider.getCurrentExperiment().type = session_1.ExperimentType.SingleRunNoGap;
                }
                else if (result === "AFC, 0.2 gap") {
                    _this.sessionProvider.getCurrentExperiment().type = session_1.ExperimentType.SingleRunWithGap;
                }
                else {
                    _this.sessionProvider.cancelExperiment();
                    return;
                }
                return _this.routerExtensions.navigate(["/threshold"], { clearHistory: true }).catch(function (err) {
                    console.log(err);
                });
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
            actions: ['Calibrate', 'Send with email', 'Quit']
        }).then(function (result) {
            console.log(result);
            if (result == "Calibrate") {
                return _this.routerExtensions.navigate(['/calibration']);
            }
            else if (result == "Quit") {
                _this.sessionProvider.resetSession();
                return _this.routerExtensions.navigate(['/start'], { clearHistory: true });
            }
        }).catch(function (err) { return console.log(err); });
    };
    ExperimentListPage.prototype.sendResults = function () {
    };
    ExperimentListPage.prototype.showError = function (err) {
        return dialogs.alert({
            title: 'Error',
            message: err,
            okButtonText: 'Close'
        }).then(function () {
            // pass
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwZXJpbWVudGxpc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJleHBlcmltZW50bGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUEwQztBQUMxQyxnQ0FBK0I7QUFFL0IscURBQXVEO0FBR3ZELHNEQUErRDtBQUMvRCx3REFBMkQ7QUFDM0QsOERBQTZEO0FBQzdELHdEQUE2RztBQUM3RyxtRUFBcUU7QUFRckU7SUFLRSw0QkFBb0IsZUFBZ0MsRUFDaEMsZ0JBQWtDLEVBQ2xDLElBQVU7UUFGOUIsaUJBK0RDO1FBL0RtQixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFDaEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUNsQyxTQUFJLEdBQUosSUFBSSxDQUFNO1FBRTVCLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsd0RBQXdELEVBQUMsQ0FBQyxDQUFDO1FBQ3RHLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsNkJBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNoRCxJQUFJLElBQUksR0FBTyxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUMsQ0FBQztZQUM5QixJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsR0FBRyw2QkFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUMxQyxJQUFJLENBQUMsU0FBUyxHQUFHLDZCQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQzFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsSUFB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RUFBRSx1QkFBdUI7U0FDckMsQ0FBQzt5Q0FNcUMseUJBQWU7WUFDZCx5QkFBZ0I7WUFDNUIsV0FBSTtPQVBuQixrQkFBa0IsQ0ErSjlCO0lBQUQseUJBQUM7Q0FBQSxBQS9KRCxJQStKQztBQS9KWSxnREFBa0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tIFwidWkvcGFnZVwiO1xuaW1wb3J0IHsgRXZlbnREYXRhIH0gZnJvbSBcImRhdGEvb2JzZXJ2YWJsZVwiO1xuaW1wb3J0ICogYXMgZGlhbG9ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9kaWFsb2dzXCI7XG5pbXBvcnQgeyBMaXN0UGlja2VyIH0gZnJvbSBcInVpL2xpc3QtcGlja2VyXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9maWxlLXN5c3RlbVwiO1xuaW1wb3J0IHsgUm91dGVyRXh0ZW5zaW9ucyB9IGZyb20gXCJuYXRpdmVzY3JpcHQtYW5ndWxhci9yb3V0ZXJcIjtcbmltcG9ydCB7IHRlc3RmcmVxdWVuY2llcyB9IGZyb20gXCIuLi8uLi9jb25maWcvZW52aXJvbm1lbnRcIjtcbmltcG9ydCB7IFZvbHVtZU9ic2VydmVyIH0gZnJvbSBcIi4uLy4uL3NoYXJlZC92b2x1bWVvYnNlcnZlclwiO1xuaW1wb3J0IHsgU2Vzc2lvblByb3ZpZGVyLCBFeHBlcmltZW50LCBFeHBlcmltZW50VHlwZSwgRXhwZXJpbWVudFN0YXR1cyB9IGZyb20gJy4uLy4uL3NoYXJlZC9zZXNzaW9uL3Nlc3Npb24nO1xuaW1wb3J0ICogYXMgYXBwU2V0dGluZ3MgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvYXBwbGljYXRpb24tc2V0dGluZ3NcIjtcblxuXG5AQ29tcG9uZW50KHtcbiAgbW9kdWxlSWQ6IG1vZHVsZS5pZCxcbiAgc2VsZWN0b3I6ICdwYWdlLWV4cGVyaW1lbnRsaXN0JyxcbiAgdGVtcGxhdGVVcmw6ICcuL2V4cGVyaW1lbnRsaXN0Lmh0bWwnXG59KVxuZXhwb3J0IGNsYXNzIEV4cGVyaW1lbnRMaXN0UGFnZSB7XG4gIHByaXZhdGUgbGlzdEl0ZW1zOiBBcnJheTxhbnk+O1xuICBwcml2YXRlIG1hc3RlclZvbHVtZU9ic2VydmVyOiBWb2x1bWVPYnNlcnZlcjtcbiAgcHJpdmF0ZSBhdWRpb1Nlc3Npb246IEFWQXVkaW9TZXNzaW9uO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgc2Vzc2lvblByb3ZpZGVyOiBTZXNzaW9uUHJvdmlkZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgcm91dGVyRXh0ZW5zaW9uczogUm91dGVyRXh0ZW5zaW9ucyxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBwYWdlOiBQYWdlKSB7XG5cbiAgICB0aGlzLmxpc3RJdGVtcyA9IFtdO1xuICAgIHRoaXMubGlzdEl0ZW1zLnB1c2goe3R5cGU6IFwiaGVhZGVyXCIsIHRleHQ6IFwiU3RhcnQgbmV3IGV4cGVyaW1lbnQgYnkgc2VsZWN0aW5nIHRlc3QgZnJlcXVlbmN5IGJlbG93XCJ9KTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRlc3RmcmVxdWVuY2llcy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IGl0ZW06YW55ID0ge3R5cGU6IFwidGVzdFwifTtcbiAgICAgIGl0ZW0udGV4dCA9IFwiXCIgKyB0ZXN0ZnJlcXVlbmNpZXNbaV0ubGFiZWw7XG4gICAgICBpdGVtLmZyZXF1ZW5jeSA9IHRlc3RmcmVxdWVuY2llc1tpXS52YWx1ZTtcbiAgICAgIHRoaXMubGlzdEl0ZW1zLnB1c2goaXRlbSk7XG4gICAgfVxuXG4gICAgdGhpcy5saXN0SXRlbXMucHVzaCh7dHlwZTogXCJoZWFkZXJcIiwgdGV4dDogXCJQcmV2aW91cyBleHBlcmltZW50cyBpbiB0aGUgY3VycmVudCBzZXNzaW9uXCJ9KTtcbiAgICBsZXQgZXhwZXJpbWVudExpc3QgPSBzZXNzaW9uUHJvdmlkZXIuZ2V0RXhwZXJpbWVudHMoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV4cGVyaW1lbnRMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgaXRlbTphbnkgPSB7dHlwZTogXCJoaXN0b3J5XCJ9O1xuICAgICAgaXRlbS50ZXh0ID0gXCJcIiArIGV4cGVyaW1lbnRMaXN0W2ldLnR5cGUgKyBcIiBcIiArIGV4cGVyaW1lbnRMaXN0W2ldLnRlc3RGcmVxdWVuY3kgKyBcIiBIeiAoXCIgKyBleHBlcmltZW50TGlzdFtpXS5zdGF0dXMgKyBcIilcIjtcbiAgICAgIGlmIChleHBlcmltZW50TGlzdFtpXS5zdGF0dXMgPT0gRXhwZXJpbWVudFN0YXR1cy5GaW5pc2hlZCkge1xuICAgICAgICBsZXQgZ3JpZCA9IGV4cGVyaW1lbnRMaXN0W2ldLmdyaWQ7XG5cbiAgICAgICAgbGV0IGhpc3RvcnkgPSBncmlkLmdldEhpc3RvcnkoKTtcbiAgICAgICAgbGV0IG5fYXZnID0gNjtcbiAgICAgICAgbGV0IGNvdW50ZXJfYXZnID0gMDtcbiAgICAgICAgbGV0IHN1bV9hdmcgPSAwO1xuICAgICAgICBmb3IgKGxldCBpID0gaGlzdG9yeS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgIGlmIChoaXN0b3J5W2ldLnJldmVyc2FsKSB7XG4gICAgICAgICAgICBzdW1fYXZnICs9IGhpc3RvcnlbaV0ueXZhbDtcbiAgICAgICAgICAgIGNvdW50ZXJfYXZnICs9IDE7XG4gICAgICAgICAgICBpZiAoY291bnRlcl9hdmcgPT0gbl9hdmcpIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCB0aHJlc2hvbGQgPSBzdW1fYXZnIC8gbl9hdmc7XG4gICAgICAgIGl0ZW0udGV4dCArPSBcIiwgdGggXCIgKyB0aHJlc2hvbGQ7XG4gICAgICB9XG4gICAgICBpdGVtLmV4cGVyaW1lbnRJZCA9IGkgKyAxO1xuICAgICAgdGhpcy5saXN0SXRlbXMucHVzaChpdGVtKTtcbiAgICB9XG5cbiAgICB0aGlzLnBhZ2Uub24oXCJuYXZpZ2F0ZWRUb1wiLCAoZGF0YTogRXZlbnREYXRhKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhcImFkZGluZyB2b2x1bWUgb2JzZXJ2ZXJcIik7XG4gICAgICBsZXQgYXVkaW9TZXNzaW9uID0gQVZBdWRpb1Nlc3Npb24uc2hhcmVkSW5zdGFuY2UoKTtcbiAgICAgIHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIgPSBuZXcgVm9sdW1lT2JzZXJ2ZXIoKTtcbiAgICAgIHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIuc2V0Q2FsbGJhY2soKG9iaikgPT4ge1xuICAgICAgICBkaWFsb2dzLmFsZXJ0KHtcbiAgICAgICAgICB0aXRsZTogXCJWb2x1bWUgY2hhbmdlZCFcIixcbiAgICAgICAgICBtZXNzYWdlOiBcIkEgdm9sdW1lIGJ1dHRvbiBwcmVzcyB3YXMgb2JzZXJ2ZWQuIFRoZSBjdXJyZW50IGV4cGVyaW1lbnQgd2lsbCBiZSBjYW5jZWxsZWQgYW5kIHlvdSB3aWxsIG5vdyByZXR1cm4gdG8gdGhlIHZvbHVtZSBzZXR0aW5nIHNjcmVlbi5cIixcbiAgICAgICAgICBva0J1dHRvblRleHQ6IFwiT0tcIlxuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFtcIi92b2x1bWVcIl0sIHtjbGVhckhpc3Rvcnk6IHRydWV9KTtcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IGNvbnNvbGUubG9nKGVycikpO1xuICAgICAgfSk7XG4gICAgICBhdWRpb1Nlc3Npb24uYWRkT2JzZXJ2ZXJGb3JLZXlQYXRoT3B0aW9uc0NvbnRleHQodGhpcy5tYXN0ZXJWb2x1bWVPYnNlcnZlciwgXCJvdXRwdXRWb2x1bWVcIiwgTlNLZXlWYWx1ZU9ic2VydmluZ09wdGlvbnMuTmV3LCBudWxsKTtcbiAgICB9KTtcblxuICAgIHRoaXMucGFnZS5vbihcIm5hdmlnYXRpbmdGcm9tXCIsIChkYXRhOiBFdmVudERhdGEpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKFwicmVtb3Zpbmcgdm9sdW1lIG9ic2VydmVyXCIpO1xuICAgICAgbGV0IGF1ZGlvU2Vzc2lvbiA9IEFWQXVkaW9TZXNzaW9uLnNoYXJlZEluc3RhbmNlKCk7XG4gICAgICBhdWRpb1Nlc3Npb24ucmVtb3ZlT2JzZXJ2ZXJGb3JLZXlQYXRoKHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIsIFwib3V0cHV0Vm9sdW1lXCIpO1xuICAgIH0pO1xuXG4gIH1cblxuICBoYW5kbGVUYXAodGFwRXZlbnQpIHtcbiAgICBpZiAodGhpcy5saXN0SXRlbXNbdGFwRXZlbnQuaW5kZXhdLnR5cGUgPT09IFwidGVzdFwiKSB7XG4gICAgICBsZXQgcGlja2VkRnJlcSA9IHRoaXMubGlzdEl0ZW1zW3RhcEV2ZW50LmluZGV4XS5mcmVxdWVuY3k7XG4gICAgICBsZXQgdGFyZ19rZXkgPSBcIlwiO1xuICAgICAgaWYgKHBpY2tlZEZyZXEgPT0gMTAwMCkge1xuICAgICAgICB0YXJnX2tleSA9IFwic3BsX3RvbmUxa1wiO1xuICAgICAgfSBlbHNlIGlmIChwaWNrZWRGcmVxID09IDIwMDApIHtcbiAgICAgICAgdGFyZ19rZXkgPSBcInNwbF90b25lMmtcIjtcbiAgICAgIH0gZWxzZSBpZiAocGlja2VkRnJlcSA9PSA0MDAwKSB7XG4gICAgICAgIHRhcmdfa2V5ID0gXCJzcGxfdG9uZTRrXCI7XG4gICAgICB9XG5cbiAgICAgIGxldCB0YXJnX3JlZl9sZXZlbDtcbiAgICAgIGlmIChhcHBTZXR0aW5ncy5oYXNLZXkodGFyZ19rZXkpKSB7XG4gICAgICAgIHRhcmdfcmVmX2xldmVsID0gYXBwU2V0dGluZ3MuZ2V0TnVtYmVyKHRhcmdfa2V5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNob3dFcnJvcihcIkNhbGlicmF0ZSBsZXZlbHMgZmlyc3QhXCIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZGlhbG9ncy5hY3Rpb24oe1xuICAgICAgICB0aXRsZTogXCJFeHBlcmltZW50IHR5cGVcIixcbiAgICAgICAgY2FuY2VsQnV0dG9uVGV4dDogXCJDYW5jZWxcIixcbiAgICAgICAgYWN0aW9uczogW1wiR3JpZCAoZGVmYXVsdClcIiwgXCJBRkMsIG5vIGdhcFwiLCBcIkFGQywgMC4yIGdhcFwiXVxuICAgICAgfSkudGhlbigocmVzdWx0OiBzdHJpbmcpID0+IHtcbiAgICAgICAgdGhpcy5zZXNzaW9uUHJvdmlkZXIuc3RhcnRFeHBlcmltZW50KHBpY2tlZEZyZXEpO1xuICAgICAgICBpZiAocmVzdWx0ID09PSBcIkdyaWQgKGRlZmF1bHQpXCIpIHtcbiAgICAgICAgICB0aGlzLnNlc3Npb25Qcm92aWRlci5nZXRDdXJyZW50RXhwZXJpbWVudCgpLnR5cGUgPSBFeHBlcmltZW50VHlwZS5HcmlkO1xuICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdCA9PT0gXCJBRkMsIG5vIGdhcFwiKSB7XG4gICAgICAgICAgdGhpcy5zZXNzaW9uUHJvdmlkZXIuZ2V0Q3VycmVudEV4cGVyaW1lbnQoKS50eXBlID0gRXhwZXJpbWVudFR5cGUuU2luZ2xlUnVuTm9HYXA7XG4gICAgICAgIH0gZWxzZSBpZiAocmVzdWx0ID09PSBcIkFGQywgMC4yIGdhcFwiKSB7XG4gICAgICAgICAgdGhpcy5zZXNzaW9uUHJvdmlkZXIuZ2V0Q3VycmVudEV4cGVyaW1lbnQoKS50eXBlID0gRXhwZXJpbWVudFR5cGUuU2luZ2xlUnVuV2l0aEdhcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnNlc3Npb25Qcm92aWRlci5jYW5jZWxFeHBlcmltZW50KCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucm91dGVyRXh0ZW5zaW9ucy5uYXZpZ2F0ZShcbiAgICAgICAgICBbXCIvdGhyZXNob2xkXCJdLCB7Y2xlYXJIaXN0b3J5OiB0cnVlfVxuICAgICAgICApLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIH0gZWxzZSBpZiAodGhpcy5saXN0SXRlbXNbdGFwRXZlbnQuaW5kZXhdLnR5cGUgPT09IFwiaGlzdG9yeVwiKSB7XG4gICAgICBsZXQgcGlja2VkRXhwZXJpbWVudCA9IHRoaXMubGlzdEl0ZW1zW3RhcEV2ZW50LmluZGV4XS5leHBlcmltZW50SWQ7XG5cbiAgICAgIHJldHVybiB0aGlzLnJvdXRlckV4dGVuc2lvbnMubmF2aWdhdGUoXG4gICAgICAgIFtcIi9ncmlkcGxvdFwiLCBwaWNrZWRFeHBlcmltZW50XVxuICAgICAgKS5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgdGVtcGxhdGVTZWxlY3RvcihpdGVtOiBhbnksIGluZGV4OiBudW1iZXIsIGl0ZW1zOiBhbnkpIHtcbiAgICByZXR1cm4gaXRlbS50eXBlO1xuICB9XG5cbiAgc2hvd0FjdGlvblNoZWV0KCkge1xuICAgIGRpYWxvZ3MuYWN0aW9uKHtcbiAgICAgIHRpdGxlOiAnU2VuZCB0aGUgcmVzdWx0cycsXG4gICAgICBtZXNzYWdlOiAndmVyc2lvbiAwLjEnLFxuICAgICAgY2FuY2VsQnV0dG9uVGV4dDogJ0NhbmNlbCcsXG4gICAgICBhY3Rpb25zOiBbJ0NhbGlicmF0ZScsICdTZW5kIHdpdGggZW1haWwnLCAnUXVpdCddXG4gICAgfSkudGhlbigocmVzdWx0OiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gICAgICBpZiAocmVzdWx0ID09IFwiQ2FsaWJyYXRlXCIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucm91dGVyRXh0ZW5zaW9ucy5uYXZpZ2F0ZShbJy9jYWxpYnJhdGlvbiddKTtcbiAgICAgIH0gZWxzZSBpZiAocmVzdWx0ID09IFwiUXVpdFwiKSB7XG4gICAgICAgIHRoaXMuc2Vzc2lvblByb3ZpZGVyLnJlc2V0U2Vzc2lvbigpO1xuICAgICAgICByZXR1cm4gdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFsnL3N0YXJ0J10sIHtjbGVhckhpc3Rvcnk6IHRydWV9KTtcbiAgICAgIH1cbiAgICB9KS5jYXRjaChlcnIgPT4gY29uc29sZS5sb2coZXJyKSk7XG4gIH1cblxuICBzZW5kUmVzdWx0cygpIHtcblxuICB9XG5cbiAgc2hvd0Vycm9yKGVycikge1xuICAgIHJldHVybiBkaWFsb2dzLmFsZXJ0KHtcbiAgICAgIHRpdGxlOiAnRXJyb3InLFxuICAgICAgbWVzc2FnZTogZXJyLFxuICAgICAgb2tCdXR0b25UZXh0OiAnQ2xvc2UnXG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAvLyBwYXNzXG4gICAgfSk7XG4gIH1cblxufVxuIl19