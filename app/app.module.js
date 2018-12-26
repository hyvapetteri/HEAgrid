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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFwcC5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBMkQ7QUFDM0QsZ0ZBQThFO0FBQzlFLG9EQUFxRTtBQUNyRSx5REFBMEU7QUFDMUUsNkNBQWlEO0FBQ2pELGlEQUErQztBQUUvQyxvREFBMkQ7QUFFM0QsNkNBQWdEO0FBQ2hELDREQUErRDtBQUMvRCx5REFBNEQ7QUFDNUQsc0RBQXlEO0FBQ3pELHdFQUEyRTtBQUMzRSwrREFBa0U7QUFDbEUsd0RBQTJEO0FBQzNELCtEQUFrRTtBQUVsRSwyRUFBMkU7QUFDM0Usd0VBQXdFO0FBRXhFLDZFQUE2RTtBQUM3RSxzRUFBc0U7QUFpQ3RFO0lBSEE7O01BRUU7SUFDRjtJQUF5QixDQUFDO0lBQWIsU0FBUztRQS9CckIsZUFBUSxDQUFDO1lBQ04sU0FBUyxFQUFFO2dCQUNQLDRCQUFZO2FBQ2Y7WUFDRCxPQUFPLEVBQUU7Z0JBQ0wsd0NBQWtCO2dCQUNsQiwrQkFBdUI7Z0JBQ3ZCLDhCQUFnQjtnQkFDaEIsbUNBQXlCO2FBQzVCO1lBQ0QsWUFBWSxFQUFFO2dCQUNWLDRCQUFZO2dCQUNaLGlCQUFTO2dCQUNULDJCQUFjO2dCQUNkLHlCQUFhO2dCQUNiLHVCQUFZO2dCQUNaLG1DQUFrQjtnQkFDbEIsNkJBQWU7Z0JBQ2YsMkJBQWM7Z0JBQ2QsNkJBQWU7YUFDbEI7WUFDRCxTQUFTLEVBQUU7Z0JBQ1AseUJBQWU7YUFDbEI7WUFDRCxPQUFPLEVBQUU7Z0JBQ0wsdUJBQWdCO2FBQ25CO1NBQ0osQ0FBQztRQUNGOztVQUVFO09BQ1csU0FBUyxDQUFJO0lBQUQsZ0JBQUM7Q0FBQSxBQUExQixJQUEwQjtBQUFiLDhCQUFTIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmdNb2R1bGUsIE5PX0VSUk9SU19TQ0hFTUEgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgTmF0aXZlU2NyaXB0TW9kdWxlIH0gZnJvbSBcIm5hdGl2ZXNjcmlwdC1hbmd1bGFyL25hdGl2ZXNjcmlwdC5tb2R1bGVcIjtcbmltcG9ydCB7IE5hdGl2ZVNjcmlwdEZvcm1zTW9kdWxlIH0gZnJvbSBcIm5hdGl2ZXNjcmlwdC1hbmd1bGFyL2Zvcm1zXCI7XG5pbXBvcnQgeyBOYXRpdmVTY3JpcHRVSUNoYXJ0TW9kdWxlIH0gZnJvbSBcIm5hdGl2ZXNjcmlwdC11aS1jaGFydC9hbmd1bGFyXCI7XG5pbXBvcnQgeyBBcHBSb3V0aW5nTW9kdWxlIH0gZnJvbSBcIi4vYXBwLnJvdXRpbmdcIjtcbmltcG9ydCB7IEFwcENvbXBvbmVudCB9IGZyb20gXCIuL2FwcC5jb21wb25lbnRcIjtcblxuaW1wb3J0IHsgU2Vzc2lvblByb3ZpZGVyIH0gZnJvbSBcIi4vc2hhcmVkL3Nlc3Npb24vc2Vzc2lvblwiO1xuXG5pbXBvcnQgeyBTdGFydFBhZ2UgfSBmcm9tIFwiLi92aWV3cy9zdGFydC9zdGFydFwiO1xuaW1wb3J0IHsgRXhwZXJpbWVudFBhZ2UgfSBmcm9tIFwiLi92aWV3cy9leHBlcmltZW50L2V4cGVyaW1lbnRcIjtcbmltcG9ydCB7IFRocmVzaG9sZFBhZ2UgfSBmcm9tIFwiLi92aWV3cy90aHJlc2hvbGQvdGhyZXNob2xkXCI7XG5pbXBvcnQgeyBHcmlkUGxvdFBhZ2UgfSBmcm9tIFwiLi92aWV3cy9ncmlkcGxvdC9ncmlkcGxvdFwiO1xuaW1wb3J0IHsgRXhwZXJpbWVudExpc3RQYWdlIH0gZnJvbSBcIi4vdmlld3MvZXhwZXJpbWVudGxpc3QvZXhwZXJpbWVudGxpc3RcIjtcbmltcG9ydCB7IFZlcmlmeUF1ZGlvUGFnZSB9IGZyb20gXCIuL3ZpZXdzL3ZlcmlmeWF1ZGlvL3ZlcmlmeWF1ZGlvXCI7XG5pbXBvcnQgeyBWb2x1bWV2aWV3UGFnZSB9IGZyb20gXCIuL3ZpZXdzL3ZvbHVtZS92b2x1bWV2aWV3XCI7XG5pbXBvcnQgeyBDYWxpYnJhdGlvblBhZ2UgfSBmcm9tIFwiLi92aWV3cy9jYWxpYnJhdGlvbi9jYWxpYnJhdGlvblwiO1xuXG4vLyBVbmNvbW1lbnQgYW5kIGFkZCB0byBOZ01vZHVsZSBpbXBvcnRzIGlmIHlvdSBuZWVkIHRvIHVzZSB0d28td2F5IGJpbmRpbmdcbi8vIGltcG9ydCB7IE5hdGl2ZVNjcmlwdEZvcm1zTW9kdWxlIH0gZnJvbSBcIm5hdGl2ZXNjcmlwdC1hbmd1bGFyL2Zvcm1zXCI7XG5cbi8vIFVuY29tbWVudCBhbmQgYWRkIHRvIE5nTW9kdWxlIGltcG9ydHMgIGlmIHlvdSBuZWVkIHRvIHVzZSB0aGUgSFRUUCB3cmFwcGVyXG4vLyBpbXBvcnQgeyBOYXRpdmVTY3JpcHRIdHRwTW9kdWxlIH0gZnJvbSBcIm5hdGl2ZXNjcmlwdC1hbmd1bGFyL2h0dHBcIjtcblxuQE5nTW9kdWxlKHtcbiAgICBib290c3RyYXA6IFtcbiAgICAgICAgQXBwQ29tcG9uZW50XG4gICAgXSxcbiAgICBpbXBvcnRzOiBbXG4gICAgICAgIE5hdGl2ZVNjcmlwdE1vZHVsZSxcbiAgICAgICAgTmF0aXZlU2NyaXB0Rm9ybXNNb2R1bGUsXG4gICAgICAgIEFwcFJvdXRpbmdNb2R1bGUsXG4gICAgICAgIE5hdGl2ZVNjcmlwdFVJQ2hhcnRNb2R1bGVcbiAgICBdLFxuICAgIGRlY2xhcmF0aW9uczogW1xuICAgICAgICBBcHBDb21wb25lbnQsXG4gICAgICAgIFN0YXJ0UGFnZSxcbiAgICAgICAgRXhwZXJpbWVudFBhZ2UsXG4gICAgICAgIFRocmVzaG9sZFBhZ2UsXG4gICAgICAgIEdyaWRQbG90UGFnZSxcbiAgICAgICAgRXhwZXJpbWVudExpc3RQYWdlLFxuICAgICAgICBWZXJpZnlBdWRpb1BhZ2UsXG4gICAgICAgIFZvbHVtZXZpZXdQYWdlLFxuICAgICAgICBDYWxpYnJhdGlvblBhZ2VcbiAgICBdLFxuICAgIHByb3ZpZGVyczogW1xuICAgICAgICBTZXNzaW9uUHJvdmlkZXJcbiAgICBdLFxuICAgIHNjaGVtYXM6IFtcbiAgICAgICAgTk9fRVJST1JTX1NDSEVNQVxuICAgIF1cbn0pXG4vKlxuUGFzcyB5b3VyIGFwcGxpY2F0aW9uIG1vZHVsZSB0byB0aGUgYm9vdHN0cmFwTW9kdWxlIGZ1bmN0aW9uIGxvY2F0ZWQgaW4gbWFpbi50cyB0byBzdGFydCB5b3VyIGFwcFxuKi9cbmV4cG9ydCBjbGFzcyBBcHBNb2R1bGUgeyB9XG4iXX0=