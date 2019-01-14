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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLnJvdXRpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhcHAucm91dGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUF5QztBQUN6QyxzREFBdUU7QUFHdkUsNkNBQWdEO0FBQ2hELDREQUErRDtBQUMvRCx5REFBNEQ7QUFDNUQsc0RBQXlEO0FBQ3pELHdFQUEyRTtBQUMzRSwrREFBa0U7QUFDbEUsd0RBQTJEO0FBQzNELCtEQUFrRTtBQUVsRSxJQUFNLE1BQU0sR0FBVztJQUNuQixFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFO0lBQ3JELEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsaUJBQVMsRUFBRTtJQUN2QyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLDJCQUFjLEVBQUM7SUFDaEQsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSx5QkFBYSxFQUFDO0lBQzlDLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsdUJBQVksRUFBQztJQUNoRCxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxTQUFTLEVBQUUsbUNBQWtCLEVBQUM7SUFDeEQsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSw2QkFBZSxFQUFDO0lBQ2xELEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsMkJBQWMsRUFBQztJQUM1QyxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLDZCQUFlLEVBQUU7Q0FDdEQsQ0FBQztBQU1GO0lBQUE7SUFBZ0MsQ0FBQztJQUFwQixnQkFBZ0I7UUFKNUIsZUFBUSxDQUFDO1lBQ04sT0FBTyxFQUFFLENBQUMsaUNBQXdCLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ25ELE9BQU8sRUFBRSxDQUFDLGlDQUF3QixDQUFDO1NBQ3RDLENBQUM7T0FDVyxnQkFBZ0IsQ0FBSTtJQUFELHVCQUFDO0NBQUEsQUFBakMsSUFBaUM7QUFBcEIsNENBQWdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmdNb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgTmF0aXZlU2NyaXB0Um91dGVyTW9kdWxlIH0gZnJvbSBcIm5hdGl2ZXNjcmlwdC1hbmd1bGFyL3JvdXRlclwiO1xuaW1wb3J0IHsgUm91dGVzIH0gZnJvbSBcIkBhbmd1bGFyL3JvdXRlclwiO1xuXG5pbXBvcnQgeyBTdGFydFBhZ2UgfSBmcm9tIFwiLi92aWV3cy9zdGFydC9zdGFydFwiO1xuaW1wb3J0IHsgRXhwZXJpbWVudFBhZ2UgfSBmcm9tIFwiLi92aWV3cy9leHBlcmltZW50L2V4cGVyaW1lbnRcIjtcbmltcG9ydCB7IFRocmVzaG9sZFBhZ2UgfSBmcm9tIFwiLi92aWV3cy90aHJlc2hvbGQvdGhyZXNob2xkXCI7XG5pbXBvcnQgeyBHcmlkUGxvdFBhZ2UgfSBmcm9tIFwiLi92aWV3cy9ncmlkcGxvdC9ncmlkcGxvdFwiO1xuaW1wb3J0IHsgRXhwZXJpbWVudExpc3RQYWdlIH0gZnJvbSBcIi4vdmlld3MvZXhwZXJpbWVudGxpc3QvZXhwZXJpbWVudGxpc3RcIjtcbmltcG9ydCB7IFZlcmlmeUF1ZGlvUGFnZSB9IGZyb20gXCIuL3ZpZXdzL3ZlcmlmeWF1ZGlvL3ZlcmlmeWF1ZGlvXCI7XG5pbXBvcnQgeyBWb2x1bWV2aWV3UGFnZSB9IGZyb20gXCIuL3ZpZXdzL3ZvbHVtZS92b2x1bWV2aWV3XCI7XG5pbXBvcnQge8KgQ2FsaWJyYXRpb25QYWdlIH0gZnJvbSBcIi4vdmlld3MvY2FsaWJyYXRpb24vY2FsaWJyYXRpb25cIjtcblxuY29uc3Qgcm91dGVzOiBSb3V0ZXMgPSBbXG4gICAgeyBwYXRoOiBcIlwiLCByZWRpcmVjdFRvOiBcIi9zdGFydFwiLCBwYXRoTWF0Y2g6IFwiZnVsbFwiIH0sXG4gICAgeyBwYXRoOiBcInN0YXJ0XCIsIGNvbXBvbmVudDogU3RhcnRQYWdlIH0sXG4gICAgeyBwYXRoOiBcImV4cGVyaW1lbnRcIiwgY29tcG9uZW50OiBFeHBlcmltZW50UGFnZX0sXG4gICAgeyBwYXRoOiBcInRocmVzaG9sZFwiLCBjb21wb25lbnQ6IFRocmVzaG9sZFBhZ2V9LFxuICAgIHsgcGF0aDogXCJncmlkcGxvdC86aWRcIiwgY29tcG9uZW50OiBHcmlkUGxvdFBhZ2V9LFxuICAgIHsgcGF0aDogXCJleHBlcmltZW50bGlzdFwiLCBjb21wb25lbnQ6IEV4cGVyaW1lbnRMaXN0UGFnZX0sXG4gICAgeyBwYXRoOiBcInZlcmlmeWF1ZGlvXCIsIGNvbXBvbmVudDogVmVyaWZ5QXVkaW9QYWdlfSxcbiAgICB7IHBhdGg6IFwidm9sdW1lXCIsIGNvbXBvbmVudDogVm9sdW1ldmlld1BhZ2V9LFxuICAgIHsgcGF0aDogXCJjYWxpYnJhdGlvblwiLCBjb21wb25lbnQ6IENhbGlicmF0aW9uUGFnZSB9XG5dO1xuXG5ATmdNb2R1bGUoe1xuICAgIGltcG9ydHM6IFtOYXRpdmVTY3JpcHRSb3V0ZXJNb2R1bGUuZm9yUm9vdChyb3V0ZXMpXSxcbiAgICBleHBvcnRzOiBbTmF0aXZlU2NyaXB0Um91dGVyTW9kdWxlXVxufSlcbmV4cG9ydCBjbGFzcyBBcHBSb3V0aW5nTW9kdWxlIHsgfVxuIl19