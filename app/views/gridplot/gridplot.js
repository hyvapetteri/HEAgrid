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
        }
        else {
            var experiments = this.sessionProvider.getExperiments();
            this.experiment = experiments[this.experimentId - 1];
        }
        var grid = this.experiment.grid;
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
        var pickedFreq = this.experiment.testFrequency;
        this.sessionProvider.startExperiment(pickedFreq);
        var newExperiment = this.sessionProvider.getCurrentExperiment();
        newExperiment.noiseThreshold = this.experiment.noiseThreshold;
        newExperiment.toneThreshold = this.experiment.toneThreshold;
        return this.routerExtensions.navigate(["/experiment"], { clearHistory: true }).catch(function (err) {
            console.log(err);
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHBsb3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJncmlkcGxvdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDBDQUEwQztBQUMxQyxzQ0FBa0Q7QUFDbEQsZ0NBQStCO0FBRS9CLHdEQUEyRTtBQUMzRSxzREFBMEU7QUFDMUUsNENBQTJDO0FBQzNDLHFEQUF1RDtBQUd2RCw4REFBNkQ7QUFDN0QsMkVBQXlFO0FBT3pFO0lBV0ksc0JBQW9CLGVBQWdDLEVBQ2hDLGdCQUFrQyxFQUNsQyxTQUFvQixFQUNwQixJQUFVO1FBSDlCLGlCQThCQztRQTlCbUIsb0JBQWUsR0FBZixlQUFlLENBQWlCO1FBQ2hDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7UUFDbEMsY0FBUyxHQUFULFNBQVMsQ0FBVztRQUNwQixTQUFJLEdBQUosSUFBSSxDQUFNO1FBRTVCLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLElBQUksQ0FDaEMscUJBQVMsQ0FBQyxVQUFBLGNBQWMsSUFBSSxPQUFBLGNBQWMsQ0FBQyxNQUFNLEVBQXJCLENBQXFCLENBQUMsQ0FDbkQsQ0FBQyxPQUFPLENBQUMsVUFBQyxNQUFNLElBQU8sS0FBSSxDQUFDLFlBQVksR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQSxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBRTVELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxVQUFDLElBQWU7WUFDMUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBQ3RDLElBQUksWUFBWSxHQUFHLGNBQWMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNuRCxLQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSwrQkFBYyxFQUFFLENBQUM7WUFDakQsS0FBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxVQUFDLEdBQUc7Z0JBQ3hDLE9BQU8sQ0FBQyxLQUFLLENBQUM7b0JBQ1osS0FBSyxF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QUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFDaEUsYUFBYSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQztRQUM5RCxhQUFhLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDO1FBRTVELE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUNuQyxDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUMsWUFBWSxFQUFFLElBQUksRUFBQyxDQUN0QyxDQUFDLEtBQUssQ0FBQyxVQUFBLEdBQUc7WUFDVCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQXZGUSxZQUFZO1FBTHhCLGdCQUFTLENBQUM7WUFDUCxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkIsUUFBUSxFQUFFLGVBQWU7WUFDekIsV0FBVyxFQUFFLGVBQWU7U0FDL0IsQ0FBQzt5Q0FZdUMseUJBQWU7WUFDZCx5QkFBZ0I7WUFDdkIsa0JBQVM7WUFDZCxXQUFJO09BZHJCLFlBQVksQ0F3RnhCO0lBQUQsbUJBQUM7Q0FBQSxBQXhGRCxJQXdGQztBQXhGWSxvQ0FBWSIsInNvdXJjZXNDb250ZW50IjpbIi8vID4+IGNoYXJ0LWFuZ3VsYXItYXhpcy1zdHlsaW5nLWNvbXBvbmVudFxuaW1wb3J0IHsgQ29tcG9uZW50LCBPbkluaXQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tIFwidWkvcGFnZVwiO1xuaW1wb3J0IHsgRXZlbnREYXRhIH0gZnJvbSBcImRhdGEvb2JzZXJ2YWJsZVwiO1xuaW1wb3J0IHsgU2Vzc2lvblByb3ZpZGVyLCBFeHBlcmltZW50IH0gZnJvbSAnLi4vLi4vc2hhcmVkL3Nlc3Npb24vc2Vzc2lvbic7XG5pbXBvcnQgeyBSb3V0ZXJFeHRlbnNpb25zLCBQYWdlUm91dGUgfSBmcm9tICduYXRpdmVzY3JpcHQtYW5ndWxhci9yb3V0ZXInO1xuaW1wb3J0IHsgc3dpdGNoTWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0ICogYXMgZGlhbG9ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9kaWFsb2dzXCI7XG5cbmltcG9ydCB7IEdyaWRUcmFja2VyLCBHcmlkVHJhY2tpbmdTdGF0dXMsIEdyaWREaXJlY3Rpb24sIFRyaWFsQW5zd2VyIH0gZnJvbSAnLi4vLi4vc2hhcmVkL2dyaWQvZ3JpZCc7XG5pbXBvcnQgeyBWb2x1bWVPYnNlcnZlciB9IGZyb20gXCIuLi8uLi9zaGFyZWQvdm9sdW1lb2JzZXJ2ZXJcIjtcbmltcG9ydCB7IE9ic2VydmFibGVBcnJheSB9IGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2RhdGEvb2JzZXJ2YWJsZS1hcnJheVwiO1xuXG5AQ29tcG9uZW50KHtcbiAgICBtb2R1bGVJZDogbW9kdWxlLmlkLFxuICAgIHNlbGVjdG9yOiAndmlldy1ncmlkcGxvdCcsXG4gICAgdGVtcGxhdGVVcmw6ICdncmlkcGxvdC5odG1sJ1xufSlcbmV4cG9ydCBjbGFzcyBHcmlkUGxvdFBhZ2UgaW1wbGVtZW50cyBPbkluaXQge1xuICAgIHByaXZhdGUgbWFzdGVyVm9sdW1lT2JzZXJ2ZXI6IFZvbHVtZU9ic2VydmVyO1xuICAgIHByaXZhdGUgZXhwZXJpbWVudElkOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBfcGxvdEl0ZW1zOiBPYnNlcnZhYmxlQXJyYXk8R3JpZFRyYWNraW5nU3RhdHVzPjtcbiAgICBwcml2YXRlIF9wbG90Q3VycmVudDogT2JzZXJ2YWJsZUFycmF5PEdyaWRUcmFja2luZ1N0YXR1cz47XG4gICAgcHJpdmF0ZSB4bGltOiBbbnVtYmVyLCBudW1iZXJdO1xuICAgIHByaXZhdGUgeWxpbTogW251bWJlciwgbnVtYmVyXTtcbiAgICBwcml2YXRlIHhyZXM6IG51bWJlcjtcbiAgICBwcml2YXRlIHlyZXM6IG51bWJlcjtcbiAgICBwcml2YXRlIGV4cGVyaW1lbnQ6IEV4cGVyaW1lbnQ7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHNlc3Npb25Qcm92aWRlcjogU2Vzc2lvblByb3ZpZGVyLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgcm91dGVyRXh0ZW5zaW9uczogUm91dGVyRXh0ZW5zaW9ucyxcbiAgICAgICAgICAgICAgICBwcml2YXRlIHBhZ2VSb3V0ZTogUGFnZVJvdXRlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgcGFnZTogUGFnZSkge1xuXG4gICAgICB0aGlzLnBhZ2VSb3V0ZS5hY3RpdmF0ZWRSb3V0ZS5waXBlKFxuICAgICAgICBzd2l0Y2hNYXAoYWN0aXZhdGVkUm91dGUgPT4gYWN0aXZhdGVkUm91dGUucGFyYW1zKVxuICAgICAgKS5mb3JFYWNoKChwYXJhbXMpID0+IHsgdGhpcy5leHBlcmltZW50SWQgPSArcGFyYW1zWydpZCddfSk7XG5cbiAgICAgIHRoaXMucGFnZS5vbihcIm5hdmlnYXRlZFRvXCIsIChkYXRhOiBFdmVudERhdGEpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJhZGRpbmcgdm9sdW1lIG9ic2VydmVyXCIpO1xuICAgICAgICBsZXQgYXVkaW9TZXNzaW9uID0gQVZBdWRpb1Nlc3Npb24uc2hhcmVkSW5zdGFuY2UoKTtcbiAgICAgICAgdGhpcy5tYXN0ZXJWb2x1bWVPYnNlcnZlciA9IG5ldyBWb2x1bWVPYnNlcnZlcigpO1xuICAgICAgICB0aGlzLm1hc3RlclZvbHVtZU9ic2VydmVyLnNldENhbGxiYWNrKChvYmopID0+IHtcbiAgICAgICAgICBkaWFsb2dzLmFsZXJ0KHtcbiAgICAgICAgICAgIHRpdGxlOiBcIlZvbHVtZSBjaGFuZ2VkIVwiLFxuICAgICAgICAgICAgbWVzc2FnZTogXCJBIHZvbHVtZSBidXR0b24gcHJlc3Mgd2FzIG9ic2VydmVkLiBUaGUgY3VycmVudCBleHBlcmltZW50IHdpbGwgYmUgY2FuY2VsbGVkIGFuZCB5b3Ugd2lsbCBub3cgcmV0dXJuIHRvIHRoZSB2b2x1bWUgc2V0dGluZyBzY3JlZW4uXCIsXG4gICAgICAgICAgICBva0J1dHRvblRleHQ6IFwiT0tcIlxuICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucm91dGVyRXh0ZW5zaW9ucy5uYXZpZ2F0ZShbXCIvdm9sdW1lXCJdLCB7Y2xlYXJIaXN0b3J5OiB0cnVlfSk7XG4gICAgICAgICAgfSkuY2F0Y2goZXJyID0+IGNvbnNvbGUubG9nKGVycikpO1xuICAgICAgICB9KTtcbiAgICAgICAgYXVkaW9TZXNzaW9uLmFkZE9ic2VydmVyRm9yS2V5UGF0aE9wdGlvbnNDb250ZXh0KHRoaXMubWFzdGVyVm9sdW1lT2JzZXJ2ZXIsIFwib3V0cHV0Vm9sdW1lXCIsIE5TS2V5VmFsdWVPYnNlcnZpbmdPcHRpb25zLk5ldywgbnVsbCk7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5wYWdlLm9uKFwibmF2aWdhdGluZ0Zyb21cIiwgKGRhdGE6IEV2ZW50RGF0YSkgPT4ge1xuICAgICAgICBsZXQgYXVkaW9TZXNzaW9uID0gQVZBdWRpb1Nlc3Npb24uc2hhcmVkSW5zdGFuY2UoKTtcbiAgICAgICAgYXVkaW9TZXNzaW9uLnJlbW92ZU9ic2VydmVyRm9yS2V5UGF0aCh0aGlzLm1hc3RlclZvbHVtZU9ic2VydmVyLCBcIm91dHB1dFZvbHVtZVwiKTtcbiAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgZ2V0IHBsb3RJdGVtcygpOiBPYnNlcnZhYmxlQXJyYXk8R3JpZFRyYWNraW5nU3RhdHVzPiB7XG4gICAgICByZXR1cm4gdGhpcy5fcGxvdEl0ZW1zO1xuICAgIH1cblxuICAgIGdldCBwbG90Q3VycmVudCgpOiBPYnNlcnZhYmxlQXJyYXk8R3JpZFRyYWNraW5nU3RhdHVzPiB7XG4gICAgICByZXR1cm4gdGhpcy5fcGxvdEN1cnJlbnQ7XG4gICAgfVxuXG4gICAgbmdPbkluaXQoKSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ2ZyZXF1ZW5jeTonICsgdGhpcy5zZXNzaW9uUHJvdmlkZXIuZ2V0Q3VycmVudEV4cGVyaW1lbnQoKS50ZXN0RnJlcXVlbmN5KTtcbiAgICAgICAgaWYgKHRoaXMuZXhwZXJpbWVudElkID09IDApIHtcbiAgICAgICAgICB0aGlzLmV4cGVyaW1lbnQgPSB0aGlzLnNlc3Npb25Qcm92aWRlci5nZXRDdXJyZW50RXhwZXJpbWVudCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCBleHBlcmltZW50cyA9IHRoaXMuc2Vzc2lvblByb3ZpZGVyLmdldEV4cGVyaW1lbnRzKCk7XG4gICAgICAgICAgdGhpcy5leHBlcmltZW50ID0gZXhwZXJpbWVudHNbdGhpcy5leHBlcmltZW50SWQgLSAxXTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZ3JpZCA9IHRoaXMuZXhwZXJpbWVudC5ncmlkO1xuXG4gICAgICAgIHRoaXMuX3Bsb3RJdGVtcyA9IG5ldyBPYnNlcnZhYmxlQXJyYXkoZ3JpZC5nZXRIaXN0b3J5KCkpO1xuICAgICAgICB0aGlzLl9wbG90Q3VycmVudCA9IG5ldyBPYnNlcnZhYmxlQXJyYXkoZ3JpZC5nZXRTdGF0dXMoKSk7XG5cbiAgICAgICAgdGhpcy54bGltID0gZ3JpZC5nZXRYbGltKCk7XG4gICAgICAgIHRoaXMueWxpbSA9IGdyaWQuZ2V0WWxpbSgpO1xuICAgICAgICB0aGlzLnhyZXMgPSBncmlkLmdldFhyZXMoKTtcbiAgICAgICAgdGhpcy55cmVzID0gZ3JpZC5nZXRZcmVzKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCd4bWF4OiAnICsgdGhpcy54bGltWzFdICsgJywgeW1heDogJyArIHRoaXMueWxpbVsxXSk7XG4gICAgfVxuXG4gICAgZ29CYWNrKCkge1xuICAgICAgdGhpcy5yb3V0ZXJFeHRlbnNpb25zLmJhY2soKTtcbiAgICB9XG5cbiAgICByZWRvRXhwZXJpbWVudCgpIHtcbiAgICAgIGxldCBwaWNrZWRGcmVxID0gdGhpcy5leHBlcmltZW50LnRlc3RGcmVxdWVuY3k7XG4gICAgICB0aGlzLnNlc3Npb25Qcm92aWRlci5zdGFydEV4cGVyaW1lbnQocGlja2VkRnJlcSk7XG4gICAgICBsZXQgbmV3RXhwZXJpbWVudCA9IHRoaXMuc2Vzc2lvblByb3ZpZGVyLmdldEN1cnJlbnRFeHBlcmltZW50KCk7XG4gICAgICBuZXdFeHBlcmltZW50Lm5vaXNlVGhyZXNob2xkID0gdGhpcy5leHBlcmltZW50Lm5vaXNlVGhyZXNob2xkO1xuICAgICAgbmV3RXhwZXJpbWVudC50b25lVGhyZXNob2xkID0gdGhpcy5leHBlcmltZW50LnRvbmVUaHJlc2hvbGQ7XG5cbiAgICAgIHJldHVybiB0aGlzLnJvdXRlckV4dGVuc2lvbnMubmF2aWdhdGUoXG4gICAgICAgIFtcIi9leHBlcmltZW50XCJdLCB7Y2xlYXJIaXN0b3J5OiB0cnVlfVxuICAgICAgKS5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgfSk7XG4gICAgfVxufVxuIl19