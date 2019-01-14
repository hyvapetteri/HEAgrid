"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// >> chart-angular-axis-styling-component
var core_1 = require("@angular/core");
var page_1 = require("ui/page");
var session_1 = require("../../shared/session/session");
var router_1 = require("nativescript-angular/router");
var operators_1 = require("rxjs/operators");
var dialogs = require("tns-core-modules/ui/dialogs");
var volumeobserver_1 = require("../../shared/volumeobserver");
var observable_array_1 = require("tns-core-modules/data/observable-array");
var GridPlotPage = /** @class */ (function () {
    function GridPlotPage(sessionProvider, routerExtensions, pageRoute, page) {
        var _this = this;
        this.sessionProvider = sessionProvider;
        this.routerExtensions = routerExtensions;
        this.pageRoute = pageRoute;
        this.page = page;
        this.pageRoute.activatedRoute.pipe(operators_1.switchMap(function (activatedRoute) { return activatedRoute.params; })).forEach(function (params) { _this.experimentId = +params['id']; });
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
            var audioSession = AVAudioSession.sharedInstance();
            audioSession.removeObserverForKeyPath(_this.masterVolumeObserver, "outputVolume");
        });
    }
    Object.defineProperty(GridPlotPage.prototype, "plotItems", {
        get: function () {
            return this._plotItems;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridPlotPage.prototype, "plotCurrent", {
        get: function () {
            return this._plotCurrent;
        },
        enumerable: true,
        configurable: true
    });
    GridPlotPage.prototype.ngOnInit = function () {
        //console.log('frequency:' + this.sessionProvider.getCurrentExperiment().testFrequency);
        if (this.experimentId == 0) {
            this.experiment = this.sessionProvider.getCurrentExperiment();
            this.threshold = null;
        }
        else {
            var experiments = this.sessionProvider.getExperiments();
            this.experiment = experiments[this.experimentId - 1];
        }
        var grid = this.experiment.grid;
        if (this.experimentId !== 0) {
            var history_1 = grid.getHistory();
            var n_avg = 6;
            var counter_avg = 0;
            var sum_avg = 0;
            for (var i = history_1.length - 1; i >= 0; i--) {
                if (history_1[i].reversal) {
                    sum_avg += history_1[i].yval;
                    counter_avg += 1;
                    if (counter_avg == n_avg) {
                        break;
                    }
                }
            }
            this.threshold = sum_avg / n_avg;
        }
        this._plotItems = new observable_array_1.ObservableArray(grid.getHistory());
        this._plotCurrent = new observable_array_1.ObservableArray(grid.getStatus());
        this.xlim = grid.getXlim();
        this.ylim = grid.getYlim();
        this.xres = grid.getXres();
        this.yres = grid.getYres();
        console.log('xmax: ' + this.xlim[1] + ', ymax: ' + this.ylim[1]);
    };
    GridPlotPage.prototype.goBack = function () {
        this.routerExtensions.back();
    };
    GridPlotPage.prototype.redoExperiment = function () {
        console.log('Redo experiment');
        try {
            var pickedFreq = this.experiment.testFrequency;
            this.sessionProvider.startExperiment(pickedFreq);
            var newExperiment = this.sessionProvider.getCurrentExperiment();
            newExperiment.noiseThreshold = this.experiment.noiseThreshold;
            newExperiment.toneThreshold = this.experiment.toneThreshold;
            newExperiment.type = this.experiment.type;
        }
        catch (err) {
            console.log(err);
        }
        return this.routerExtensions.navigate(["/experiment"], { clearHistory: true }).catch(function (err) {
            console.log(err);
        });
    };
    GridPlotPage.prototype.showActionSheet = function () {
        var _this = this;
        dialogs.action({
            title: 'Actions',
            cancelButtonText: 'Cancel',
            actions: ['Redo with same settings']
        }).then(function (result) {
            console.log(result);
            if (result == "Redo with same settings") {
                return _this.redoExperiment();
            }
        }).catch(function (err) { return console.log(err); });
    };
    GridPlotPage = __decorate([
        core_1.Component({
            moduleId: module.id,
            selector: 'view-gridplot',
            templateUrl: 'gridplot.html'
        }),
        __metadata("design:paramtypes", [session_1.SessionProvider,
            router_1.RouterExtensions,
            router_1.PageRoute,
            page_1.Page])
    ], GridPlotPage);
    return GridPlotPage;
}());
exports.GridPlotPage = GridPlotPage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHBsb3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJncmlkcGxvdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDBDQUEwQztBQUMxQyxzQ0FBa0Q7QUFDbEQsZ0NBQStCO0FBRS9CLHdEQUEyRTtBQUMzRSxzREFBMEU7QUFDMUUsNENBQTJDO0FBQzNDLHFEQUF1RDtBQUd2RCw4REFBNkQ7QUFDN0QsMkVBQXlFO0FBT3pFO0lBWUksc0JBQW9CLGVBQWdDLEVBQ2hDLGdCQUFrQyxFQUNsQyxTQUFvQixFQUNwQixJQUFVO1FBSDlCLGlCQThCQztRQTlCbUIsb0JBQWUsR0FBZixlQUFlLENBQWlCO1FBQ2hDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7UUFDbEMsY0FBUyxHQUFULFNBQVMsQ0FBVztRQUNwQixTQUFJLEdBQUosSUFBSSxDQUFNO1FBRTVCLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLElBQUksQ0FDaEMscUJBQVMsQ0FBQyxVQUFBLGNBQWMsSUFBSSxPQUFBLGNBQWMsQ0FBQyxNQUFNLEVBQXJCLENBQXFCLENBQUMsQ0FDbkQsQ0FBQyxPQUFPLENBQUMsVUFBQyxNQUFNLElBQU8sS0FBSSxDQUFDLFlBQVksR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQSxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBRTVELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxVQUFDLElBQWU7WUFDMUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBQ3RDLElBQUksWUFBWSxHQUFHLGNBQWMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNuRCxLQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSwrQkFBYyxFQUFFLENBQUM7WUFDakQsS0FBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxVQUFDLEdBQUc7Z0JBQ3hDLE9BQU8sQ0FBQyxLQUFLLENBQUM7b0JBQ1osS0FBSyxF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QWZyQixZQUFZLENBOEh4QjtJQUFELG1CQUFDO0NBQUEsQUE5SEQsSUE4SEM7QUE5SFksb0NBQVkiLCJzb3VyY2VzQ29udGVudCI6WyIvLyA+PiBjaGFydC1hbmd1bGFyLWF4aXMtc3R5bGluZy1jb21wb25lbnRcbmltcG9ydCB7IENvbXBvbmVudCwgT25Jbml0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBQYWdlIH0gZnJvbSBcInVpL3BhZ2VcIjtcbmltcG9ydCB7IEV2ZW50RGF0YSB9IGZyb20gXCJkYXRhL29ic2VydmFibGVcIjtcbmltcG9ydCB7IFNlc3Npb25Qcm92aWRlciwgRXhwZXJpbWVudCB9IGZyb20gJy4uLy4uL3NoYXJlZC9zZXNzaW9uL3Nlc3Npb24nO1xuaW1wb3J0IHsgUm91dGVyRXh0ZW5zaW9ucywgUGFnZVJvdXRlIH0gZnJvbSAnbmF0aXZlc2NyaXB0LWFuZ3VsYXIvcm91dGVyJztcbmltcG9ydCB7IHN3aXRjaE1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCAqIGFzIGRpYWxvZ3MgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvdWkvZGlhbG9nc1wiO1xuXG5pbXBvcnQgeyBHcmlkVHJhY2tlciwgR3JpZFRyYWNraW5nU3RhdHVzLCBHcmlkRGlyZWN0aW9uLCBUcmlhbEFuc3dlciB9IGZyb20gJy4uLy4uL3NoYXJlZC9ncmlkL2dyaWQnO1xuaW1wb3J0IHsgVm9sdW1lT2JzZXJ2ZXIgfSBmcm9tIFwiLi4vLi4vc2hhcmVkL3ZvbHVtZW9ic2VydmVyXCI7XG5pbXBvcnQgeyBPYnNlcnZhYmxlQXJyYXkgfSBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9kYXRhL29ic2VydmFibGUtYXJyYXlcIjtcblxuQENvbXBvbmVudCh7XG4gICAgbW9kdWxlSWQ6IG1vZHVsZS5pZCxcbiAgICBzZWxlY3RvcjogJ3ZpZXctZ3JpZHBsb3QnLFxuICAgIHRlbXBsYXRlVXJsOiAnZ3JpZHBsb3QuaHRtbCdcbn0pXG5leHBvcnQgY2xhc3MgR3JpZFBsb3RQYWdlIGltcGxlbWVudHMgT25Jbml0IHtcbiAgICBwcml2YXRlIG1hc3RlclZvbHVtZU9ic2VydmVyOiBWb2x1bWVPYnNlcnZlcjtcbiAgICBwcml2YXRlIGV4cGVyaW1lbnRJZDogbnVtYmVyO1xuICAgIHByaXZhdGUgX3Bsb3RJdGVtczogT2JzZXJ2YWJsZUFycmF5PEdyaWRUcmFja2luZ1N0YXR1cz47XG4gICAgcHJpdmF0ZSBfcGxvdEN1cnJlbnQ6IE9ic2VydmFibGVBcnJheTxHcmlkVHJhY2tpbmdTdGF0dXM+O1xuICAgIHByaXZhdGUgeGxpbTogW251bWJlciwgbnVtYmVyXTtcbiAgICBwcml2YXRlIHlsaW06IFtudW1iZXIsIG51bWJlcl07XG4gICAgcHJpdmF0ZSB4cmVzOiBudW1iZXI7XG4gICAgcHJpdmF0ZSB5cmVzOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBleHBlcmltZW50OiBFeHBlcmltZW50O1xuICAgIHByaXZhdGUgdGhyZXNob2xkOiBudW1iZXJ8bnVsbDtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgc2Vzc2lvblByb3ZpZGVyOiBTZXNzaW9uUHJvdmlkZXIsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSByb3V0ZXJFeHRlbnNpb25zOiBSb3V0ZXJFeHRlbnNpb25zLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgcGFnZVJvdXRlOiBQYWdlUm91dGUsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBwYWdlOiBQYWdlKSB7XG5cbiAgICAgIHRoaXMucGFnZVJvdXRlLmFjdGl2YXRlZFJvdXRlLnBpcGUoXG4gICAgICAgIHN3aXRjaE1hcChhY3RpdmF0ZWRSb3V0ZSA9PiBhY3RpdmF0ZWRSb3V0ZS5wYXJhbXMpXG4gICAgICApLmZvckVhY2goKHBhcmFtcykgPT4geyB0aGlzLmV4cGVyaW1lbnRJZCA9ICtwYXJhbXNbJ2lkJ119KTtcblxuICAgICAgdGhpcy5wYWdlLm9uKFwibmF2aWdhdGVkVG9cIiwgKGRhdGE6IEV2ZW50RGF0YSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcImFkZGluZyB2b2x1bWUgb2JzZXJ2ZXJcIik7XG4gICAgICAgIGxldCBhdWRpb1Nlc3Npb24gPSBBVkF1ZGlvU2Vzc2lvbi5zaGFyZWRJbnN0YW5jZSgpO1xuICAgICAgICB0aGlzLm1hc3RlclZvbHVtZU9ic2VydmVyID0gbmV3IFZvbHVtZU9ic2VydmVyKCk7XG4gICAgICAgIHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIuc2V0Q2FsbGJhY2soKG9iaikgPT4ge1xuICAgICAgICAgIGRpYWxvZ3MuYWxlcnQoe1xuICAgICAgICAgICAgdGl0bGU6IFwiVm9sdW1lIGNoYW5nZWQhXCIsXG4gICAgICAgICAgICBtZXNzYWdlOiBcIkEgdm9sdW1lIGJ1dHRvbiBwcmVzcyB3YXMgb2JzZXJ2ZWQuIFRoZSBjdXJyZW50IGV4cGVyaW1lbnQgd2lsbCBiZSBjYW5jZWxsZWQgYW5kIHlvdSB3aWxsIG5vdyByZXR1cm4gdG8gdGhlIHZvbHVtZSBzZXR0aW5nIHNjcmVlbi5cIixcbiAgICAgICAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiXG4gICAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFtcIi92b2x1bWVcIl0sIHtjbGVhckhpc3Rvcnk6IHRydWV9KTtcbiAgICAgICAgICB9KS5jYXRjaChlcnIgPT4gY29uc29sZS5sb2coZXJyKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBhdWRpb1Nlc3Npb24uYWRkT2JzZXJ2ZXJGb3JLZXlQYXRoT3B0aW9uc0NvbnRleHQodGhpcy5tYXN0ZXJWb2x1bWVPYnNlcnZlciwgXCJvdXRwdXRWb2x1bWVcIiwgTlNLZXlWYWx1ZU9ic2VydmluZ09wdGlvbnMuTmV3LCBudWxsKTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnBhZ2Uub24oXCJuYXZpZ2F0aW5nRnJvbVwiLCAoZGF0YTogRXZlbnREYXRhKSA9PiB7XG4gICAgICAgIGxldCBhdWRpb1Nlc3Npb24gPSBBVkF1ZGlvU2Vzc2lvbi5zaGFyZWRJbnN0YW5jZSgpO1xuICAgICAgICBhdWRpb1Nlc3Npb24ucmVtb3ZlT2JzZXJ2ZXJGb3JLZXlQYXRoKHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIsIFwib3V0cHV0Vm9sdW1lXCIpO1xuICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBnZXQgcGxvdEl0ZW1zKCk6IE9ic2VydmFibGVBcnJheTxHcmlkVHJhY2tpbmdTdGF0dXM+IHtcbiAgICAgIHJldHVybiB0aGlzLl9wbG90SXRlbXM7XG4gICAgfVxuXG4gICAgZ2V0IHBsb3RDdXJyZW50KCk6IE9ic2VydmFibGVBcnJheTxHcmlkVHJhY2tpbmdTdGF0dXM+IHtcbiAgICAgIHJldHVybiB0aGlzLl9wbG90Q3VycmVudDtcbiAgICB9XG5cbiAgICBuZ09uSW5pdCgpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnZnJlcXVlbmN5OicgKyB0aGlzLnNlc3Npb25Qcm92aWRlci5nZXRDdXJyZW50RXhwZXJpbWVudCgpLnRlc3RGcmVxdWVuY3kpO1xuICAgICAgICBpZiAodGhpcy5leHBlcmltZW50SWQgPT0gMCkge1xuICAgICAgICAgIHRoaXMuZXhwZXJpbWVudCA9IHRoaXMuc2Vzc2lvblByb3ZpZGVyLmdldEN1cnJlbnRFeHBlcmltZW50KCk7XG4gICAgICAgICAgdGhpcy50aHJlc2hvbGQgPSBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCBleHBlcmltZW50cyA9IHRoaXMuc2Vzc2lvblByb3ZpZGVyLmdldEV4cGVyaW1lbnRzKCk7XG4gICAgICAgICAgdGhpcy5leHBlcmltZW50ID0gZXhwZXJpbWVudHNbdGhpcy5leHBlcmltZW50SWQgLSAxXTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZ3JpZCA9IHRoaXMuZXhwZXJpbWVudC5ncmlkO1xuXG4gICAgICAgIGlmICh0aGlzLmV4cGVyaW1lbnRJZCAhPT0gMCkge1xuICAgICAgICAgIGxldCBoaXN0b3J5ID0gZ3JpZC5nZXRIaXN0b3J5KCk7XG4gICAgICAgICAgbGV0IG5fYXZnID0gNjtcbiAgICAgICAgICBsZXQgY291bnRlcl9hdmcgPSAwO1xuICAgICAgICAgIGxldCBzdW1fYXZnID0gMDtcbiAgICAgICAgICBmb3IgKGxldCBpID0gaGlzdG9yeS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgaWYgKGhpc3RvcnlbaV0ucmV2ZXJzYWwpIHtcbiAgICAgICAgICAgICAgc3VtX2F2ZyArPSBoaXN0b3J5W2ldLnl2YWw7XG4gICAgICAgICAgICAgIGNvdW50ZXJfYXZnICs9IDE7XG4gICAgICAgICAgICAgIGlmIChjb3VudGVyX2F2ZyA9PSBuX2F2Zykge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMudGhyZXNob2xkID0gc3VtX2F2ZyAvIG5fYXZnO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcGxvdEl0ZW1zID0gbmV3IE9ic2VydmFibGVBcnJheShncmlkLmdldEhpc3RvcnkoKSk7XG4gICAgICAgIHRoaXMuX3Bsb3RDdXJyZW50ID0gbmV3IE9ic2VydmFibGVBcnJheShncmlkLmdldFN0YXR1cygpKTtcblxuICAgICAgICB0aGlzLnhsaW0gPSBncmlkLmdldFhsaW0oKTtcbiAgICAgICAgdGhpcy55bGltID0gZ3JpZC5nZXRZbGltKCk7XG4gICAgICAgIHRoaXMueHJlcyA9IGdyaWQuZ2V0WHJlcygpO1xuICAgICAgICB0aGlzLnlyZXMgPSBncmlkLmdldFlyZXMoKTtcbiAgICAgICAgY29uc29sZS5sb2coJ3htYXg6ICcgKyB0aGlzLnhsaW1bMV0gKyAnLCB5bWF4OiAnICsgdGhpcy55bGltWzFdKTtcbiAgICB9XG5cbiAgICBnb0JhY2soKSB7XG4gICAgICB0aGlzLnJvdXRlckV4dGVuc2lvbnMuYmFjaygpO1xuICAgIH1cblxuICAgIHJlZG9FeHBlcmltZW50KCkge1xuICAgICAgY29uc29sZS5sb2coJ1JlZG8gZXhwZXJpbWVudCcpXG4gICAgICB0cnkge1xuICAgICAgICBsZXQgcGlja2VkRnJlcSA9IHRoaXMuZXhwZXJpbWVudC50ZXN0RnJlcXVlbmN5O1xuICAgICAgICB0aGlzLnNlc3Npb25Qcm92aWRlci5zdGFydEV4cGVyaW1lbnQocGlja2VkRnJlcSk7XG4gICAgICAgIGxldCBuZXdFeHBlcmltZW50ID0gdGhpcy5zZXNzaW9uUHJvdmlkZXIuZ2V0Q3VycmVudEV4cGVyaW1lbnQoKTtcbiAgICAgICAgbmV3RXhwZXJpbWVudC5ub2lzZVRocmVzaG9sZCA9IHRoaXMuZXhwZXJpbWVudC5ub2lzZVRocmVzaG9sZDtcbiAgICAgICAgbmV3RXhwZXJpbWVudC50b25lVGhyZXNob2xkID0gdGhpcy5leHBlcmltZW50LnRvbmVUaHJlc2hvbGQ7XG4gICAgICAgIG5ld0V4cGVyaW1lbnQudHlwZSA9IHRoaXMuZXhwZXJpbWVudC50eXBlO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLnJvdXRlckV4dGVuc2lvbnMubmF2aWdhdGUoXG4gICAgICAgIFtcIi9leHBlcmltZW50XCJdLCB7Y2xlYXJIaXN0b3J5OiB0cnVlfVxuICAgICAgKS5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2hvd0FjdGlvblNoZWV0KCkge1xuICAgICAgZGlhbG9ncy5hY3Rpb24oe1xuICAgICAgICB0aXRsZTogJ0FjdGlvbnMnLFxuICAgICAgICBjYW5jZWxCdXR0b25UZXh0OiAnQ2FuY2VsJyxcbiAgICAgICAgYWN0aW9uczogWydSZWRvIHdpdGggc2FtZSBzZXR0aW5ncyddXG4gICAgICB9KS50aGVuKChyZXN1bHQ6IHN0cmluZykgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQpO1xuICAgICAgICBpZiAocmVzdWx0ID09IFwiUmVkbyB3aXRoIHNhbWUgc2V0dGluZ3NcIikge1xuICAgICAgICAgIHJldHVybiB0aGlzLnJlZG9FeHBlcmltZW50KCk7XG4gICAgICAgIH1cbiAgICAgIH0pLmNhdGNoKGVyciA9PiBjb25zb2xlLmxvZyhlcnIpKTtcbiAgICB9XG59XG4iXX0=