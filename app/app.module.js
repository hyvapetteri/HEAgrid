"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var nativescript_module_1 = require("nativescript-angular/nativescript.module");
var forms_1 = require("nativescript-angular/forms");
var angular_1 = require("nativescript-ui-chart/angular");
var app_routing_1 = require("./app.routing");
var app_component_1 = require("./app.component");
var session_1 = require("./shared/session/session");
var start_1 = require("./views/start/start");
var experiment_1 = require("./views/experiment/experiment");
var threshold_1 = require("./views/threshold/threshold");
var gridplot_1 = require("./views/gridplot/gridplot");
var experimentlist_1 = require("./views/experimentlist/experimentlist");
var verifyaudio_1 = require("./views/verifyaudio/verifyaudio");
var volumeview_1 = require("./views/volume/volumeview");
var calibration_1 = require("./views/calibration/calibration");
// Uncomment and add to NgModule imports if you need to use two-way binding
// import { NativeScriptFormsModule } from "nativescript-angular/forms";
// Uncomment and add to NgModule imports  if you need to use the HTTP wrapper
// import { NativeScriptHttpModule } from "nativescript-angular/http";
var AppModule = /** @class */ (function () {
    /*
    Pass your application module to the bootstrapModule function located in main.ts to start your app
    */
    function AppModule() {
    }
    AppModule = __decorate([
        core_1.NgModule({
            bootstrap: [
                app_component_1.AppComponent
            ],
            imports: [
                nativescript_module_1.NativeScriptModule,
                forms_1.NativeScriptFormsModule,
                app_routing_1.AppRoutingModule,
                angular_1.NativeScriptUIChartModule
            ],
            declarations: [
                app_component_1.AppComponent,
                start_1.StartPage,
                experiment_1.ExperimentPage,
                threshold_1.ThresholdPage,
                gridplot_1.GridPlotPage,
                experimentlist_1.ExperimentListPage,
                verifyaudio_1.VerifyAudioPage,
                volumeview_1.VolumeviewPage,
                calibration_1.CalibrationPage
            ],
            providers: [
                session_1.SessionProvider
            ],
            schemas: [
                core_1.NO_ERRORS_SCHEMA
            ]
        })
        /*
        Pass your application module to the bootstrapModule function located in main.ts to start your app
        */
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
