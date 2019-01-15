"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function db2a(db) {
    return Math.pow(10, db / 20);
}
exports.db2a = db2a;
function a2db(a) {
    return 20 * Math.log10(a);
}
exports.a2db = a2db;
function max(x) {
    var maxval = -Infinity;
    for (var i = 0; i < x.length; i++) {
        if (x[i] > maxval) {
            maxval = x[i];
        }
    }
    return maxval;
}
exports.max = max;
function hasNan(x) {
    for (var i = 0; i < x.length; i++) {
        if (Number.isNaN(x[i])) {
            return true;
        }
    }
    return false;
}
exports.hasNan = hasNan;
function min(x) {
    var minval = Infinity;
    for (var i = 0; i < x.length; i++) {
        if (x[i] < minval) {
            minval = x[i];
        }
    }
    return minval;
}
exports.min = min;
function head(x, n) {
    var output = new Float32Array(n);
    var str = "";
    for (var i = 0; i < n; i++) {
        str += x[i] + " ";
        output[i] = x[i];
    }
    console.log(str);
    return output;
}
exports.head = head;
function abs(x) {
    var y = new Float32Array(x.length);
    for (var i = 0; i < x.length; i++) {
        y[i] = Math.abs(x[i]);
    }
    return y;
}
exports.abs = abs;
/** Generate normally distributed samples with the Marsaglia polar method,
* which transforms uniformly distributed variables to normal distribution.
* @param mean Desired mean of the normal distribution
* @param std Desired standard deviation of the normal distribution
* @returns A function which returns a random sample from the desired distribution when called
*/
function initRandn(mean, std) {
    var hasSpareSample = false;
    var spareSample;
    return function () {
        if (hasSpareSample) {
            hasSpareSample = false;
            return spareSample * std + mean;
        }
        else {
            var u = void 0, v = void 0, s = void 0;
            do {
                u = Math.random() * 2 - 1;
                v = Math.random() * 2 - 1;
                s = (u * u) + (v * v);
            } while (s >= 1 || s == 0);
            var mul = Math.sqrt(-2.0 * Math.log(s) / s);
            spareSample = v * mul;
            hasSpareSample = true;
            return mean + (std * u * mul);
        }
    };
}
exports.initRandn = initRandn;
;
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
function boxcar_spectrum(input, flow, fhigh, fs) {
    var len = input.real.length;
    var flow_idx = Math.round(flow * len / (fs / 2));
    var fhigh_idx = Math.round(fhigh * len / (fs / 2));
    var cut_real = new Float32Array(len);
    var cut_imag = new Float32Array(len);
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
    var output = {
        real: cut_real,
        imag: cut_imag
    };
    return output;
}
exports.boxcar_spectrum = boxcar_spectrum;
function rms(input) {
    var output = new interop.Reference();
    vDSP_rmsqv(interop.handleof(input), 1, output, input.length);
    return output.value;
}
exports.rms = rms;
function rms_spect(input) {
    var output = 0;
    for (var i = 0; i < input.real.length; i++) {
        output += Math.pow(input.real[i], 2) + Math.pow(input.imag[i], 2);
    }
    output /= input.real.length;
    return Math.sqrt(output);
}
exports.rms_spect = rms_spect;
function setSignalLevel(input, targetLeveldB, normalize) {
    var output = new Float32Array(input.length);
    var rms_value = rms(input);
    var targetLevelMultiplier = Math.pow(10, targetLeveldB / 20);
    var multiplier = targetLevelMultiplier;
    if (normalize) {
        multiplier = multiplier / rms_value;
    }
    var multiplier_ref = new interop.Reference(multiplier);
    vDSP_vsmul(interop.handleof(input), 1, multiplier_ref, interop.handleof(output), 1, input.length);
    return output;
}
exports.setSignalLevel = setSignalLevel;
function fft(input, nfft) {
    //console.log("Input length: "+ input.length + " max: " + max(input) + ", min: " + min(input));
    // head(input, 20);
    var input_padded = new Float32Array(nfft);
    input_padded.set(input);
    var fft_setup = vDSP_DFT_zrop_CreateSetup(null, nfft, 1 /* FORWARD */);
    if (fft_setup === null) {
        console.log("FFT setup failed!");
    }
    else {
        //console.log("FFT setup type: " + typeof(fft_setup));
    }
    var ir = new Float32Array(nfft / 2);
    var ii = new Float32Array(nfft / 2);
    var or = new Float32Array(nfft / 2);
    var oi = new Float32Array(nfft / 2);
    for (var i = 0; i < nfft / 2; i++) {
        if (Number.isNaN(input_padded[i * 2]) || (input_padded[i * 2] === undefined)) {
            console.log("input " + i + "*2 is NaN");
        }
        if (Number.isNaN(input_padded[i * 2 + 1])) {
            console.log("input " + i + "*2 + 1 is NaN");
        }
        ir[i] = input_padded[i * 2];
        ii[i] = input_padded[i * 2 + 1];
    }
    // console.log("FFT input rms PRE: hasNaN: " + hasNan(ir) + ", real max  " + max(ir) + ", min " + min(ir) + ", imag max " + max(ii) + ", min " + min(ii));
    vDSP_DFT_Execute(fft_setup, interop.handleof(ir), interop.handleof(ii), interop.handleof(or), interop.handleof(oi));
    var output = {
        real: or,
        imag: oi
    };
    // console.log("FFT output has NaN real: " + hasNan(or) + ", imag: "+ hasNan(ir) + " rms: " + rms_spect(output) + ", real max  " + max(or) + ", min " + min(or) + ", imag max " + max(oi) + ", min " + min(oi));
    vDSP_DFT_DestroySetup(fft_setup); // free resources
    // head(output.real, 20);
    return output;
}
exports.fft = fft;
function ifft(input, nifft) {
    var ifft_setup = vDSP_DFT_zrop_CreateSetup(null, nifft, -1 /* INVERSE */);
    var or = new Float32Array(nifft / 2);
    var oi = new Float32Array(nifft / 2);
    vDSP_DFT_Execute(ifft_setup, interop.handleof(input.real), interop.handleof(input.imag), interop.handleof(or), interop.handleof(oi));
    var output = new Float32Array(nifft);
    for (var i = 0; i < nifft / 2; i++) {
        output[i * 2] = or[i] / nifft;
        output[i * 2 + 1] = oi[i] / nifft;
    }
    vDSP_DFT_DestroySetup(ifft_setup);
    // console.log("IFFT output rms: " + rms(output));
    return output;
}
exports.ifft = ifft;
/** Return the next number from n that is a power of two */
function getNextPowerOf2(n) {
    return Math.pow(2, Math.ceil(Math.log2(n)));
}
exports.getNextPowerOf2 = getNextPowerOf2;
var WindowType;
(function (WindowType) {
    WindowType[WindowType["Linear"] = 0] = "Linear";
    WindowType[WindowType["RaisedCosine"] = 1] = "RaisedCosine";
})(WindowType = exports.WindowType || (exports.WindowType = {}));
function applyWindow(input, windowType, duration, fs) {
    var rampUp = new Float32Array(Math.round(duration * fs));
    switch (windowType) {
        case WindowType.Linear: {
            for (var i = 0; i < rampUp.length; i++) {
                rampUp[i] = i / rampUp.length;
            }
            break;
        }
        case WindowType.RaisedCosine: {
            for (var i = 0; i < rampUp.length; i++) {
                rampUp[i] = (1 + Math.cos(Math.PI + (i / rampUp.length) * Math.PI)) / 2;
            }
            break;
        }
    }
    var win = new Float32Array(input.length);
    for (var i = 0; i < rampUp.length; i++) {
        win[i] = rampUp[i];
    }
    for (var i = rampUp.length; i < (win.length - rampUp.length); i++) {
        win[i] = 1;
    }
    for (var i = (win.length - rampUp.length), j = rampUp.length - 1; i < win.length; i++, j--) {
        win[i] = rampUp[j];
    }
    var output = new Float32Array(input.length);
    vDSP_vmul(interop.handleof(input), 1, interop.handleof(win), 1, interop.handleof(output), 1, input.length);
    return output;
}
exports.applyWindow = applyWindow;
function calfilter(headphoneFilter, calLevel, targetLevel, input) {
    var fixedAttenuation = 18;
    var len_input = input.length;
    var len_filt = headphoneFilter.length;
    var input_padded = new Float32Array(len_input + len_filt - 1);
    var rms1_input = setSignalLevel(input, 0, true); // normalize to RMS = 1
    input_padded.set(rms1_input);
    var output = new Float32Array(len_input);
    vDSP_desamp(interop.handleof(input_padded), 1, interop.handleof(headphoneFilter), interop.handleof(output), output.length, len_filt);
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
    var output_norm = setSignalLevel(output, targetLevel - calLevel - fixedAttenuation, false);
    //let output_norm = setSignalLevel(output, targetLevel - calLevel, false);
    return output_norm;
}
exports.calfilter = calfilter;
