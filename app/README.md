# DTU Hearing Systems listening experiment template

This template creates a simple NativeScript app using TypeScript and Angular.

Before trying to install this app, make sure you have the NativeScript and XCode
all set up: <https://docs.nativescript.org/start/quick-setup>. Note, that
in order to develop and run apps on iOS, you need a mac.

You can create a new app that uses this template with the `--template` option
of the NativeScript CLI. Change `my-app-name` from the command to your preferred
app name.

```
tns create my-app-name --template https://github.com/hyvapetteri/hea-experiment-app-template.git
```

After installation, move to the newly created folder `my-app-name` and run
```
tns run ios
```
which opens a simulator and runs the app.

# App structure

There are two views in the app:
* *start* view collects basic info from the participant and saves it as a line in `participants.txt`-file
* *experiment* view contains the logic for the experiment

In the template app, the task is to categorise sounds into **A** (no amplitude modulation)
or **B** (amplitude modulated). The stimuli are pre-generated `.wav`-files that are placed in
the `audio/`-folder. The stimuli used in the experiment, and their correct categories
are defined in `views/experiment/experiment-config.ts`.
