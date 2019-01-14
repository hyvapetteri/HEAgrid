"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var router_1 = require("nativescript-angular/router");
var start_1 = require("./views/start/start");
var experiment_1 = require("./views/experiment/experiment");
var threshold_1 = require("./views/threshold/threshold");
var gridplot_1 = require("./views/gridplot/gridplot");
var experimentlist_1 = require("./views/experimentlist/experimentlist");
var verifyaudio_1 = require("./views/verifyaudio/verifyaudio");
var volumeview_1 = require("./views/volume/volumeview");
var calibration_1 = require("./views/calibration/calibration");
var routes = [
    { path: "", redirectTo: "/start", pathMatch: "full" },
    { path: "start", component: start_1.StartPage },
    { path: "experiment", component: experiment_1.ExperimentPage },
    { path: "threshold", component: threshold_1.ThresholdPage },
    { path: "gridplot/:id", component: gridplot_1.GridPlotPage },
    { path: "experimentlist", component: experimentlist_1.ExperimentListPage },
    { path: "verifyaudio", component: verifyaudio_1.VerifyAudioPage },
    { path: "volume", component: volumeview_1.VolumeviewPage },
    { path: "calibration", component: calibration_1.CalibrationPage }
];
var AppRoutingModule = /** @class */ (function () {
    function AppRoutingModule() {
    }
    AppRoutingModule = __decorate([
        core_1.NgModule({
            imports: [router_1.NativeScriptRouterModule.forRoot(routes)],
            exports: [router_1.NativeScriptRouterModule]
        })
    ], AppRoutingModule);
    return AppRoutingModule;
}());
exports.AppRoutingModule = AppRoutingModule;
