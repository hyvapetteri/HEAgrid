// this import should be first in order to load some required settings (like globals and reflect-metadata)
import { platformNativeScriptDynamic } from "nativescript-angular/platform";
import { ios as iosApp, on as applicationOn, launchEvent, exitEvent, ApplicationEventData } from "tns-core-modules/application";

import { AppModule } from "./app.module";

applicationOn(launchEvent, (args: ApplicationEventData) => {
  if (args.ios !== undefined) {
    let audioSession = AVAudioSession.sharedInstance();
    try {
      audioSession.setCategoryError(AVAudioSessionCategoryPlayback);
      console.log("Category set");
      audioSession.setModeError(AVAudioSessionModeMeasurement);
      console.log("Mode set");
    } catch (err) {
      console.log("Error setting AVAudioSession category & mode: " + err);
    }
    console.log("Launched!");
  } else {
    console.log("HEA grid does not support Android at the moment!");
  }
});

applicationOn(exitEvent, (args: ApplicationEventData) => {
  if (args.ios !== undefined) {
    let audioSession = AVAudioSession.sharedInstance();
    try {
      audioSession.setActiveError(false);
    } catch (err) {
      console.log("Could not set audioSession to inactive: " + err);
    }
  }
});

// A traditional NativeScript application starts by initializing global objects, setting up global CSS rules, creating, and navigating to the main page.
// Angular applications need to take care of their own initialization: modules, components, directives, routes, DI providers.
// A NativeScript Angular app needs to make both paradigms work together, so we provide a wrapper platform object, platformNativeScriptDynamic,
// that sets up a NativeScript application and can bootstrap the Angular framework.
platformNativeScriptDynamic().bootstrapModule(AppModule);
