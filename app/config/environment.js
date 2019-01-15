"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceVolume = 0.75;
exports.deviceVolumeResolution = 0.00001;
exports.environment = {
    subjectFile: "participants.txt",
    experimentFilePrefix: "exp-log-"
};
exports.testfrequencies = [
    { label: "1 kHz", value: 1000 },
    { label: "2 kHz", value: 2000 },
    { label: "4 kHz", value: 4000 }
];
exports.audioPath = "audio";
//export const leftFilterFilename = "InvFilterL.bin";
//export const rightFilterFilename = "InvFilterR.bin";
exports.leftFilterFilename = "InvFilter.bin";
exports.rightFilterFilename = "InvFilter.bin";
exports.calLevelsFilename = "calLevels.json";
exports.refToneFilename = "ref1k_44100_24bit.bin";
exports.sweepFilename = "sweep_44100_24bit.bin";
exports.maskerLevel_dB = 70;
exports.maxTargetLevel_dB = 0;
exports.maxGap = 0.55;
exports.threshold = {
    targetDuration_s: 0.3,
    maskerDuration_s: 0.3,
    paddedSilenceDuration_s: 0.3,
    maxTurns: 10,
    volumeUpdateInterval_ms: 100,
    volumeUpdateStepsize_dB: 0.3,
    n_avg: 6
};
exports.experiment = {
    n_alternatives: 2,
    targetDuration_s: 0.3,
    maskerDuration_s: 0.3,
    interstimulusInterval_ms: 500,
    intertrialInterval_ms: 1500,
    grid_mup: 1,
    grid_ndown: 3,
    grid_nrevs: 1,
    grid_nstep: 500,
    alternative_labels: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
};
exports.verifyaudio = {
    targetDuration_s: 2.0,
    maskerDuration_s: 2.0
};
