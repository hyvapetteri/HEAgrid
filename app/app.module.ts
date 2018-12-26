import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { NativeScriptUIChartModule } from "nativescript-ui-chart/angular";
import { AppRoutingModule } from "./app.routing";
import { AppComponent } from "./app.component";

import { SessionProvider } from "./shared/session/session";

import { StartPage } from "./views/start/start";
import { ExperimentPage } from "./views/experiment/experiment";
import { ThresholdPage } from "./views/threshold/threshold";
import { GridPlotPage } from "./views/gridplot/gridplot";
import { ExperimentListPage } from "./views/experimentlist/experimentlist";
import { VerifyAudioPage } from "./views/verifyaudio/verifyaudio";
import { VolumeviewPage } from "./views/volume/volumeview";
import { CalibrationPage } from "./views/calibration/calibration";

// Uncomment and add to NgModule imports if you need to use two-way binding
// import { NativeScriptFormsModule } from "nativescript-angular/forms";

// Uncomment and add to NgModule imports  if you need to use the HTTP wrapper
// import { NativeScriptHttpModule } from "nativescript-angular/http";

@NgModule({
    bootstrap: [
        AppComponent
    ],
    imports: [
        NativeScriptModule,
        NativeScriptFormsModule,
        AppRoutingModule,
        NativeScriptUIChartModule
    ],
    declarations: [
        AppComponent,
        StartPage,
        ExperimentPage,
        ThresholdPage,
        GridPlotPage,
        ExperimentListPage,
        VerifyAudioPage,
        VolumeviewPage,
        CalibrationPage
    ],
    providers: [
        SessionProvider
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
/*
Pass your application module to the bootstrapModule function located in main.ts to start your app
*/
export class AppModule { }
