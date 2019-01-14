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
