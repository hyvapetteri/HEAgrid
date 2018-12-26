import { NgModule } from "@angular/core";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { Routes } from "@angular/router";

import { StartPage } from "./views/start/start";
import { ExperimentPage } from "./views/experiment/experiment";
import { ThresholdPage } from "./views/threshold/threshold";
import { GridPlotPage } from "./views/gridplot/gridplot";
import { ExperimentListPage } from "./views/experimentlist/experimentlist";
import { VerifyAudioPage } from "./views/verifyaudio/verifyaudio";
import { VolumeviewPage } from "./views/volume/volumeview";
import { CalibrationPage } from "./views/calibration/calibration";

const routes: Routes = [
    { path: "", redirectTo: "/start", pathMatch: "full" },
    { path: "start", component: StartPage },
    { path: "experiment", component: ExperimentPage},
    { path: "threshold", component: ThresholdPage},
    { path: "gridplot/:id", component: GridPlotPage},
    { path: "experimentlist", component: ExperimentListPage},
    { path: "verifyaudio", component: VerifyAudioPage},
    { path: "volume", component: VolumeviewPage},
    { path: "calibration", component: CalibrationPage }
];

@NgModule({
    imports: [NativeScriptRouterModule.forRoot(routes)],
    exports: [NativeScriptRouterModule]
})
export class AppRoutingModule { }
