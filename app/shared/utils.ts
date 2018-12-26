
export function db2a(db:number) {
  return Math.pow(10, db/20);
}

export function a2db(a:number) {
  return 20*Math.log10(a);
}

export function max(x:Float32Array):number {
  let maxval = -Infinity;
  for (let i = 0; i < x.length; i++) {
    if (x[i] > maxval) {
      maxval = x[i];
    }
  }
  return maxval;
}

export function hasNan(x:Float32Array):boolean {
  for (let i = 0; i < x.length; i++) {
    if (Number.isNaN(x[i])) {
      return true;
    }
  }
  return false;
}

export function min(x:Float32Array):number {
  let minval = Infinity;
  for (let i = 0; i < x.length; i++) {
    if (x[i] < minval) {
      minval = x[i];
    }
  }
  return minval;
}

export function head(x:Float32Array, n:number):Float32Array {
  let output = new Float32Array(n);
  let str = "";
  for (let i = 0; i < n; i++) {
    str += x[i] + " ";
    output[i] = x[i];
  }
  console.log(str);
  return output;
}

export function abs(x:Float32Array):Float32Array {
  let y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    y[i] = Math.abs(x[i]);
  }
  return y;
}

/** Generate normally distributed samples with the Marsaglia polar method,
* which transforms uniformly distributed variables to normal distribution.
* @param mean Desired mean of the normal distribution
* @param std Desired standard deviation of the normal distribution
* @returns A function which returns a random sample from the desired distribution when called
*/
export function initRandn(mean:number, std:number) {
  var hasSpareSample:boolean = false;
  var spareSample:number;

  return function():number {
    if (hasSpareSample) {
      hasSpareSample = false;
      return spareSample * std + mean;
    } else {

      let u:number, v:number, s:number;

      do {
        u = Math.random()*2 - 1;
        v = Math.random()*2 - 1;
        s = (u*u) + (v*v);
      } while (s >= 1 || s == 0);

      let mul:number = Math.sqrt(-2.0 * Math.log(s) / s);
      spareSample = v * mul;
      hasSpareSample = true;
      return mean + (std * u * mul);
    }
  }
}

export interface ComplexContainer {
  real: Float32Array;
  imag: Float32Array;
};

/**
* Takes a fourier transform of a signal and returns a copy where
* the coefficients outside the passband are set to zero
*
* @param in Input vector containing a signal's discrete fourier transform
* @param flow Lower cutoff frequency in Hz
* @param fhigh Upper cutoff frequency in Hz
* @param fs Sampling rate in Hz
* @returns A fourier transform of a signal where only the passband is nonzero
*/
export function boxcar_spectrum(input:ComplexContainer, flow:number, fhigh:number, fs:number):ComplexContainer {
  let len = input.real.length;
  let flow_idx = Math.round(flow*len/(fs/2));
  let fhigh_idx = Math.round(fhigh*len/(fs/2));
  let cut_real = new Float32Array(len);
  let cut_imag = new Float32Array(len);

  // console.log("BOXCAR: flow " + flow + " fhigh " + fhigh + " / fs/2 " + (fs/2));
  // console.log('BOXCAR: flow_idx: ' + flow_idx + ', fhigh_idx: ' + fhigh_idx + ' / len ' + len);

  cut_real.set(input.real.slice(flow_idx, fhigh_idx + 1), flow_idx);
  cut_imag.set(input.imag.slice(flow_idx, fhigh_idx + 1), flow_idx);
  if (flow_idx == 0) {
    cut_real[0] = input.real[0];
  }
  if (fhigh_idx == len) {
    cut_imag[0] = input.imag[0];
  }

  let output:ComplexContainer = {
    real: cut_real,
    imag: cut_imag
  };

  return output;
}

export function rms(input:Float32Array):number {
  let output = new interop.Reference<number>();
  vDSP_rmsqv(interop.handleof(input), 1, output, input.length);
  return output.value;
}

export function rms_spect(input:ComplexContainer):number {
  let output = 0;
  for (let i = 0; i < input.real.length; i++) {
    output += Math.pow(input.real[i],2) + Math.pow(input.imag[i],2);
  }
  output /= input.real.length;
  return Math.sqrt(output);
}

export function setSignalLevel(input:Float32Array, targetLeveldB: number, normalize:boolean):Float32Array {
  let output = new Float32Array(input.length);
  let rms_value = rms(input);
  let targetLevelMultiplier = Math.pow(10, targetLeveldB/20);
  let multiplier = targetLevelMultiplier;
  if (normalize) {
    multiplier = multiplier / rms_value;
  }
  let multiplier_ref = new interop.Reference<number>(multiplier);
  vDSP_vsmul(interop.handleof(input), 1, multiplier_ref, interop.handleof(output), 1, input.length);

  return output;
}

export function fft(input:Float32Array, nfft:number):ComplexContainer {
  //console.log("Input length: "+ input.length + " max: " + max(input) + ", min: " + min(input));
  // head(input, 20);
  let input_padded = new Float32Array(nfft);
  input_padded.set(input);
  let fft_setup = vDSP_DFT_zrop_CreateSetup(null, nfft, vDSP_DFT_Direction.FORWARD);
  if (fft_setup === null) {
    console.log("FFT setup failed!");
  } else {
    //console.log("FFT setup type: " + typeof(fft_setup));
  }
  let ir = new Float32Array(nfft/2);
  let ii = new Float32Array(nfft/2);
  let or = new Float32Array(nfft/2);
  let oi = new Float32Array(nfft/2);
  for (let i = 0; i < nfft/2; i++) {
    if (Number.isNaN(input_padded[i*2]) || (input_padded[i*2] === undefined)) {
      console.log("input "+ i + "*2 is NaN");
    }
    if (Number.isNaN(input_padded[i*2 + 1])) {
      console.log("input "+ i + "*2 + 1 is NaN");
    }
    ir[i] = input_padded[i*2];
    ii[i] = input_padded[i*2 + 1];
  }
  // console.log("FFT input rms PRE: hasNaN: " + hasNan(ir) + ", real max  " + max(ir) + ", min " + min(ir) + ", imag max " + max(ii) + ", min " + min(ii));

  vDSP_DFT_Execute(fft_setup, interop.handleof(ir), interop.handleof(ii),
                  interop.handleof(or), interop.handleof(oi));

  let output:ComplexContainer = {
    real: or,
    imag: oi
  };
  // console.log("FFT output has NaN real: " + hasNan(or) + ", imag: "+ hasNan(ir) + " rms: " + rms_spect(output) + ", real max  " + max(or) + ", min " + min(or) + ", imag max " + max(oi) + ", min " + min(oi));

  vDSP_DFT_DestroySetup(fft_setup); // free resources

  // head(output.real, 20);

  return output;
}

export function ifft(input:ComplexContainer, nifft):Float32Array {
  let ifft_setup = vDSP_DFT_zrop_CreateSetup(null, nifft, vDSP_DFT_Direction.INVERSE);

  let or = new Float32Array(nifft/2);
  let oi = new Float32Array(nifft/2);

  vDSP_DFT_Execute(ifft_setup, interop.handleof(input.real), interop.handleof(input.imag),
                  interop.handleof(or), interop.handleof(oi));
  let output = new Float32Array(nifft);
  for (let i = 0; i < nifft/2; i++) {
    output[i*2] = or[i]/nifft;
    output[i*2 + 1] = oi[i]/nifft;
  }

  vDSP_DFT_DestroySetup(ifft_setup);

  // console.log("IFFT output rms: " + rms(output));

  return output;
}

/** Return the next number from n that is a power of two */
export function getNextPowerOf2(n:number):number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

export enum WindowType {
  Linear,
  RaisedCosine
}

export function applyWindow(input:Float32Array, windowType:WindowType, duration:number, fs:number):Float32Array {
  let rampUp = new Float32Array(Math.round(duration * fs));
  switch (windowType) {
    case WindowType.Linear: {
      for (let i = 0; i < rampUp.length; i++) {
        rampUp[i] = i / rampUp.length;
      }
      break;
    }
    case WindowType.RaisedCosine: {
      for (let i = 0; i < rampUp.length; i++) {
        rampUp[i] = (1 + Math.cos(Math.PI + (i / rampUp.length) * Math.PI)) / 2;
      }
      break;
    }
  }

  let win = new Float32Array(input.length);
  for (let i = 0; i < rampUp.length; i++) {
    win[i] = rampUp[i];
  }
  for (let i = rampUp.length; i < (win.length - rampUp.length); i++) {
    win[i] = 1;
  }
  for (let i = (win.length - rampUp.length), j = rampUp.length - 1; i < win.length; i++, j--) {
    win[i] = rampUp[j];
  }

  let output = new Float32Array(input.length);
  vDSP_vmul(interop.handleof(input), 1, interop.handleof(win), 1,
            interop.handleof(output), 1, input.length);

  return output;
}

export function calfilter(headphoneFilter:Float32Array, calLevel:number,
    targetLevel:number, input:Float32Array):Float32Array {

  let fixedAttenuation = 18;

  let len_input = input.length;
  let len_filt = headphoneFilter.length;
  let input_padded = new Float32Array(len_input + len_filt - 1);
  let rms1_input = setSignalLevel(input, 0, true); // normalize to RMS = 1
  input_padded.set(rms1_input);
  let output = new Float32Array(len_input);
  vDSP_desamp(interop.handleof(input_padded), 1, interop.handleof(headphoneFilter),
              interop.handleof(output), output.length, len_filt);

  // let nfft = getNextPowerOf2(len_input + len_filt - 1);
  // let rms1_input_padded = new Float32Array(nfft);
  // rms1_input_padded.set(rms1_input);
  // let filt_padded = new Float32Array(nfft);
  // filt_padded.set(headphoneFilter);
  //
  // let input_fft:ComplexContainer = fft(rms1_input_padded, nfft);
  // let filt_fft:ComplexContainer = fft(filt_padded, nfft);
  // console.log('input RMS: ' + rms(input));
  // console.log('input FFT RMS ' + rms_spect(input_fft));
  // console.log('Filt RMS: ' + rms(headphoneFilter));
  // console.log('Filt FFT RMS: ' + rms_spect(filt_fft));
  //
  // let output_fft:ComplexContainer = {
  //   real: new Float32Array(input_fft.real.length),
  //   imag: new Float32Array(input_fft.imag.length)
  // };
  // for (let i = 0; i < output_fft.real.length; i++) {
  //   let a = input_fft.real[i];
  //   let b = input_fft.imag[i];
  //   let c = filt_fft.real[i];
  //   let d = filt_fft.imag[i];
  //   output_fft.real[i] = a*c - b*d;
  //   output_fft.imag[i] = a*d + b*c;
  // }
  // console.log('Output FFT RMS: ' + rms_spect(output_fft));
  // let output_padded = ifft(output_fft, nfft);
  // console.log('Output IFFT RMS: ' + rms(output_padded));

  let output_norm = setSignalLevel(output, targetLevel - calLevel - fixedAttenuation, false);

  return output_norm;
}
