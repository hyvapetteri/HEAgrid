"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// this import should be first in order to load some required settings (like globals and reflect-metadata)
var platform_1 = require("nativescript-angular/platform");
var application_1 = require("tns-core-modules/application");
var app_module_1 = require("./app.module");
application_1.on(application_1.launchEvent, function (args) {
    if (args.ios !== undefined) {
        var audioSession = AVAudioSession.sharedInstance();
        try {
            audioSession.setCategoryError(AVAudioSessionCategoryPlayback);
            console.log("Category set");
            audioSession.setModeError(AVAudioSessionModeMeasurement);
            console.log("Mode set");
            audioSession.setPreferredSampleRateError(44100);
            console.log("Sampling frequency set, now at " + audioSession.sampleRate);
        }
        catch (err) {
            console.log("Error setting AVAudioSession category & mode: " + err);
        }
        console.log("Launched!");
    }
    else {
        console.log("HEA grid does not support Android at the moment!");
    }
});
application_1.on(application_1.exitEvent, function (args) {
    if (args.ios !== undefined) {
        var audioSession = AVAudioSession.sharedInstance();
        try {
            audioSession.setActiveError(false);
        }
        catch (err) {
            console.log("Could not set audioSession to inactive: " + err);
        }
    }
});
// A traditional NativeScript application starts by initializing global objects, setting up global CSS rules, creating, and navigating to the main page.
// Angular applications need to take care of their own initialization: modules, components, directives, routes, DI providers.
// A NativeScript Angular app needs to make both paradigms work together, so we provide a wrapper platform object, platformNativeScriptDynamic,
// that sets up a NativeScript application and can bootstrap the Angular framework.
platform_1.platformNativeScriptDynamic().bootstrapModule(app_module_1.AppModule);
