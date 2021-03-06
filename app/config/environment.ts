export const deviceVolume = 0.75;
export const deviceVolumeResolution = 0.00001;

export const environment = {
  subjectFile: "participants.txt",
  experimentFilePrefix: "exp-log-"
};

export const testfrequencies = [
  {label: "1 kHz", value: 1000},
  {label: "2 kHz", value: 2000},
  {label: "4 kHz", value: 4000}
];

export const audioPath = "audio";
//export const leftFilterFilename = "InvFilterL.bin";
//export const rightFilterFilename = "InvFilterR.bin";
export const leftFilterFilename = "InvFilter.bin";
export const rightFilterFilename = "InvFilter.bin";
export const calLevelsFilename = "calLevels.json";
export const refToneFilename = "ref1k_44100_24bit.bin";
export const sweepFilename = "sweep_44100_24bit.bin";

export const maskerLevel_dB = 70;
export const maxTargetLevel_dB = 0;
export const maxGap = 0.55;

export const threshold = {
  targetDuration_s: 0.3,
  maskerDuration_s: 0.3,
  paddedSilenceDuration_s: 0.3,
  maxTurns: 10,
  volumeUpdateInterval_ms: 100,
  volumeUpdateStepsize_dB: 0.3,
  n_avg: 6
}

export const experiment = {
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
}

export const verifyaudio = {
  targetDuration_s: 2.0,
  maskerDuration_s: 2.0
}
