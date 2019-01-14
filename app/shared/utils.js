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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLGNBQXFCLEVBQVM7SUFDNUIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBQyxFQUFFLENBQUMsQ0FBQztBQUM3QixDQUFDO0FBRkQsb0JBRUM7QUFFRCxjQUFxQixDQUFRO0lBQzNCLE1BQU0sQ0FBQyxFQUFFLEdBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxQixDQUFDO0FBRkQsb0JBRUM7QUFFRCxhQUFvQixDQUFjO0lBQ2hDLElBQUksTUFBTSxHQUFHLENBQUMsUUFBUSxDQUFDO0lBQ3ZCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ2xDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEIsQ0FBQztJQUNILENBQUM7SUFDRCxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFSRCxrQkFRQztBQUVELGdCQUF1QixDQUFjO0lBQ25DLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ2xDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDZCxDQUFDO0lBQ0gsQ0FBQztJQUNELE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDZixDQUFD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LENBQUM7Z0JBQ3ZDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUNoQyxDQUFDO1lBQ0QsS0FBSyxDQUFDO1FBQ1IsQ0FBQztRQUNELEtBQUssVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQzdCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN2QyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUUsQ0FBQztZQUNELEtBQUssQ0FBQztRQUNSLENBQUM7SUFDSCxDQUFDO0lBRUQsSUFBSSxHQUFHLEdBQUcsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3pDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ3ZDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDckIsQ0FBQztJQUNELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNsRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsQ0FBQztJQUNELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDM0YsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyQixDQUFDO0lBRUQsSUFBSSxNQUFNLEdBQUcsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzVDLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFDcEQsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRXJELE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQWpDRCxrQ0FpQ0M7QUFFRCxtQkFBMEIsZUFBNEIsRUFBRSxRQUFlLEVBQ25FLFdBQWtCLEVBQUUsS0FBa0I7SUFFeEMsSUFBSSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7SUFFMUIsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUM3QixJQUFJLFFBQVEsR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDO0lBQ3RDLElBQUksWUFBWSxHQUFHLElBQUksWUFBWSxDQUFDLFNBQVMsR0FBRyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDOUQsSUFBSSxVQUFVLEdBQUcsY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyx1QkFBdUI7SUFDeEUsWUFBWSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUM3QixJQUFJLE1BQU0sR0FBRyxJQUFJLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN6QyxXQUFXLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFDcEUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBRS9ELHdEQUF3RDtJQUN4RCxrREFBa0Q7SUFDbEQscUNBQXFDO0lBQ3JDLDRDQUE0QztJQUM1QyxvQ0FBb0M7SUFDcEMsRUFBRTtJQUNGLGlFQUFpRTtJQUNqRSwwREFBMEQ7SUFDMUQsMkNBQTJDO0lBQzNDLHdEQUF3RDtJQUN4RCxvREFBb0Q7SUFDcEQsdURBQXVEO0lBQ3ZELEVBQUU7SUFDRixzQ0FBc0M7SUFDdEMsbURBQW1EO0lBQ25ELGtEQUFrRDtJQUNsRCxLQUFLO0lBQ0wscURBQXFEO0lBQ3JELCtCQUErQjtJQUMvQiwrQkFBK0I7SUFDL0IsOEJBQThCO0lBQzlCLDhCQUE4QjtJQUM5QixvQ0FBb0M7SUFDcEMsb0NBQW9DO0lBQ3BDLElBQUk7SUFDSiwyREFBMkQ7SUFDM0QsOENBQThDO0lBQzlDLHlEQUF5RDtJQUV6RCxJQUFJLFdBQVcsR0FBRyxjQUFjLENBQUMsTUFBTSxFQUFFLFdBQVcsR0FBRyxRQUFRLEdBQUcsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDM0YsMEVBQTBFO0lBRzFFLE1BQU0sQ0FBQyxXQUFXLENBQUM7QUFDckIsQ0FBQztBQWhERCw4QkFnREMiLCJzb3VyY2VzQ29udGVudCI6WyJcbmV4cG9ydCBmdW5jdGlvbiBkYjJhKGRiOm51bWJlcikge1xuICByZXR1cm4gTWF0aC5wb3coMTAsIGRiLzIwKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGEyZGIoYTpudW1iZXIpIHtcbiAgcmV0dXJuIDIwKk1hdGgubG9nMTAoYSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXgoeDpGbG9hdDMyQXJyYXkpOm51bWJlciB7XG4gIGxldCBtYXh2YWwgPSAtSW5maW5pdHk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgeC5sZW5ndGg7IGkrKykge1xuICAgIGlmICh4W2ldID4gbWF4dmFsKSB7XG4gICAgICBtYXh2YWwgPSB4W2ldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbWF4dmFsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzTmFuKHg6RmxvYXQzMkFycmF5KTpib29sZWFuIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB4Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKE51bWJlci5pc05hTih4W2ldKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1pbih4OkZsb2F0MzJBcnJheSk6bnVtYmVyIHtcbiAgbGV0IG1pbnZhbCA9IEluZmluaXR5O1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHgubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoeFtpXSA8IG1pbnZhbCkge1xuICAgICAgbWludmFsID0geFtpXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1pbnZhbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhlYWQoeDpGbG9hdDMyQXJyYXksIG46bnVtYmVyKTpGbG9hdDMyQXJyYXkge1xuICBsZXQgb3V0cHV0ID0gbmV3IEZsb2F0MzJBcnJheShuKTtcbiAgbGV0IHN0ciA9IFwiXCI7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgc3RyICs9IHhbaV0gKyBcIiBcIjtcbiAgICBvdXRwdXRbaV0gPSB4W2ldO1xuICB9XG4gIGNvbnNvbGUubG9nKHN0cik7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhYnMoeDpGbG9hdDMyQXJyYXkpOkZsb2F0MzJBcnJheSB7XG4gIGxldCB5ID0gbmV3IEZsb2F0MzJBcnJheSh4Lmxlbmd0aCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgeC5sZW5ndGg7IGkrKykge1xuICAgIHlbaV0gPSBNYXRoLmFicyh4W2ldKTtcbiAgfVxuICByZXR1cm4geTtcbn1cblxuLyoqIEdlbmVyYXRlIG5vcm1hbGx5IGRpc3RyaWJ1dGVkIHNhbXBsZXMgd2l0aCB0aGUgTWFyc2FnbGlhIHBvbGFyIG1ldGhvZCxcbiogd2hpY2ggdHJhbnNmb3JtcyB1bmlmb3JtbHkgZGlzdHJpYnV0ZWQgdmFyaWFibGVzIHRvIG5vcm1hbCBkaXN0cmlidXRpb24uXG4qIEBwYXJhbSBtZWFuIERlc2lyZWQgbWVhbiBvZiB0aGUgbm9ybWFsIGRpc3RyaWJ1dGlvblxuKiBAcGFyYW0gc3RkIERlc2lyZWQgc3RhbmRhcmQgZGV2aWF0aW9uIG9mIHRoZSBub3JtYWwgZGlzdHJpYnV0aW9uXG4qIEByZXR1cm5zIEEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhIHJhbmRvbSBzYW1wbGUgZnJvbSB0aGUgZGVzaXJlZCBkaXN0cmlidXRpb24gd2hlbiBjYWxsZWRcbiovXG5leHBvcnQgZnVuY3Rpb24gaW5pdFJhbmRuKG1lYW46bnVtYmVyLCBzdGQ6bnVtYmVyKSB7XG4gIHZhciBoYXNTcGFyZVNhbXBsZTpib29sZWFuID0gZmFsc2U7XG4gIHZhciBzcGFyZVNhbXBsZTpudW1iZXI7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKCk6bnVtYmVyIHtcbiAgICBpZiAoaGFzU3BhcmVTYW1wbGUpIHtcbiAgICAgIGhhc1NwYXJlU2FtcGxlID0gZmFsc2U7XG4gICAgICByZXR1cm4gc3BhcmVTYW1wbGUgKiBzdGQgKyBtZWFuO1xuICAgIH0gZWxzZSB7XG5cbiAgICAgIGxldCB1Om51bWJlciwgdjpudW1iZXIsIHM6bnVtYmVyO1xuXG4gICAgICBkbyB7XG4gICAgICAgIHUgPSBNYXRoLnJhbmRvbSgpKjIgLSAxO1xuICAgICAgICB2ID0gTWF0aC5yYW5kb20oKSoyIC0gMTtcbiAgICAgICAgcyA9ICh1KnUpICsgKHYqdik7XG4gICAgICB9IHdoaWxlIChzID49IDEgfHwgcyA9PSAwKTtcblxuICAgICAgbGV0IG11bDpudW1iZXIgPSBNYXRoLnNxcnQoLTIuMCAqIE1hdGgubG9nKHMpIC8gcyk7XG4gICAgICBzcGFyZVNhbXBsZSA9IHYgKiBtdWw7XG4gICAgICBoYXNTcGFyZVNhbXBsZSA9IHRydWU7XG4gICAgICByZXR1cm4gbWVhbiArIChzdGQgKiB1ICogbXVsKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21wbGV4Q29udGFpbmVyIHtcbiAgcmVhbDogRmxvYXQzMkFycmF5O1xuICBpbWFnOiBGbG9hdDMyQXJyYXk7XG59O1xuXG4vKipcbiogVGFrZXMgYSBmb3VyaWVyIHRyYW5zZm9ybSBvZiBhIHNpZ25hbCBhbmQgcmV0dXJucyBhIGNvcHkgd2hlcmVcbiogdGhlIGNvZWZmaWNpZW50cyBvdXRzaWRlIHRoZSBwYXNzYmFuZCBhcmUgc2V0IHRvIHplcm9cbipcbiogQHBhcmFtIGluIElucHV0IHZlY3RvciBjb250YWluaW5nIGEgc2lnbmFsJ3MgZGlzY3JldGUgZm91cmllciB0cmFuc2Zvcm1cbiogQHBhcmFtIGZsb3cgTG93ZXIgY3V0b2ZmIGZyZXF1ZW5jeSBpbiBIelxuKiBAcGFyYW0gZmhpZ2ggVXBwZXIgY3V0b2ZmIGZyZXF1ZW5jeSBpbiBIelxuKiBAcGFyYW0gZnMgU2FtcGxpbmcgcmF0ZSBpbiBIelxuKiBAcmV0dXJucyBBIGZvdXJpZXIgdHJhbnNmb3JtIG9mIGEgc2lnbmFsIHdoZXJlIG9ubHkgdGhlIHBhc3NiYW5kIGlzIG5vbnplcm9cbiovXG5leHBvcnQgZnVuY3Rpb24gYm94Y2FyX3NwZWN0cnVtKGlucHV0OkNvbXBsZXhDb250YWluZXIsIGZsb3c6bnVtYmVyLCBmaGlnaDpudW1iZXIsIGZzOm51bWJlcik6Q29tcGxleENvbnRhaW5lciB7XG4gIGxldCBsZW4gPSBpbnB1dC5yZWFsLmxlbmd0aDtcbiAgbGV0IGZsb3dfaWR4ID0gTWF0aC5yb3VuZChmbG93Kmxlbi8oZnMvMikpO1xuICBsZXQgZmhpZ2hfaWR4ID0gTWF0aC5yb3VuZChmaGlnaCpsZW4vKGZzLzIpKTtcbiAgbGV0IGN1dF9yZWFsID0gbmV3IEZsb2F0MzJBcnJheShsZW4pO1xuICBsZXQgY3V0X2ltYWcgPSBuZXcgRmxvYXQzMkFycmF5KGxlbik7XG5cbiAgLy8gY29uc29sZS5sb2coXCJCT1hDQVI6IGZsb3cgXCIgKyBmbG93ICsgXCIgZmhpZ2ggXCIgKyBmaGlnaCArIFwiIC8gZnMvMiBcIiArIChmcy8yKSk7XG4gIC8vIGNvbnNvbGUubG9nKCdCT1hDQVI6IGZsb3dfaWR4OiAnICsgZmxvd19pZHggKyAnLCBmaGlnaF9pZHg6ICcgKyBmaGlnaF9pZHggKyAnIC8gbGVuICcgKyBsZW4pO1xuXG4gIGN1dF9yZWFsLnNldChpbnB1dC5yZWFsLnNsaWNlKGZsb3dfaWR4LCBmaGlnaF9pZHggKyAxKSwgZmxvd19pZHgpO1xuICBjdXRfaW1hZy5zZXQoaW5wdXQuaW1hZy5zbGljZShmbG93X2lkeCwgZmhpZ2hfaWR4ICsgMSksIGZsb3dfaWR4KTtcbiAgaWYgKGZsb3dfaWR4ID09IDApIHtcbiAgICBjdXRfcmVhbFswXSA9IGlucHV0LnJlYWxbMF07XG4gIH1cbiAgaWYgKGZoaWdoX2lkeCA9PSBsZW4pIHtcbiAgICBjdXRfaW1hZ1swXSA9IGlucHV0LmltYWdbMF07XG4gIH1cblxuICBsZXQgb3V0cHV0OkNvbXBsZXhDb250YWluZXIgPSB7XG4gICAgcmVhbDogY3V0X3JlYWwsXG4gICAgaW1hZzogY3V0X2ltYWdcbiAgfTtcblxuICByZXR1cm4gb3V0cHV0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcm1zKGlucHV0OkZsb2F0MzJBcnJheSk6bnVtYmVyIHtcbiAgbGV0IG91dHB1dCA9IG5ldyBpbnRlcm9wLlJlZmVyZW5jZTxudW1iZXI+KCk7XG4gIHZEU1Bfcm1zcXYoaW50ZXJvcC5oYW5kbGVvZihpbnB1dCksIDEsIG91dHB1dCwgaW5wdXQubGVuZ3RoKTtcbiAgcmV0dXJuIG91dHB1dC52YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJtc19zcGVjdChpbnB1dDpDb21wbGV4Q29udGFpbmVyKTpudW1iZXIge1xuICBsZXQgb3V0cHV0ID0gMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dC5yZWFsLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0cHV0ICs9IE1hdGgucG93KGlucHV0LnJlYWxbaV0sMikgKyBNYXRoLnBvdyhpbnB1dC5pbWFnW2ldLDIpO1xuICB9XG4gIG91dHB1dCAvPSBpbnB1dC5yZWFsLmxlbmd0aDtcbiAgcmV0dXJuIE1hdGguc3FydChvdXRwdXQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0U2lnbmFsTGV2ZWwoaW5wdXQ6RmxvYXQzMkFycmF5LCB0YXJnZXRMZXZlbGRCOiBudW1iZXIsIG5vcm1hbGl6ZTpib29sZWFuKTpGbG9hdDMyQXJyYXkge1xuICBsZXQgb3V0cHV0ID0gbmV3IEZsb2F0MzJBcnJheShpbnB1dC5sZW5ndGgpO1xuICBsZXQgcm1zX3ZhbHVlID0gcm1zKGlucHV0KTtcbiAgbGV0IHRhcmdldExldmVsTXVsdGlwbGllciA9IE1hdGgucG93KDEwLCB0YXJnZXRMZXZlbGRCLzIwKTtcbiAgbGV0IG11bHRpcGxpZXIgPSB0YXJnZXRMZXZlbE11bHRpcGxpZXI7XG4gIGlmIChub3JtYWxpemUpIHtcbiAgICBtdWx0aXBsaWVyID0gbXVsdGlwbGllciAvIHJtc192YWx1ZTtcbiAgfVxuICBsZXQgbXVsdGlwbGllcl9yZWYgPSBuZXcgaW50ZXJvcC5SZWZlcmVuY2U8bnVtYmVyPihtdWx0aXBsaWVyKTtcbiAgdkRTUF92c211bChpbnRlcm9wLmhhbmRsZW9mKGlucHV0KSwgMSwgbXVsdGlwbGllcl9yZWYsIGludGVyb3AuaGFuZGxlb2Yob3V0cHV0KSwgMSwgaW5wdXQubGVuZ3RoKTtcblxuICByZXR1cm4gb3V0cHV0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmZ0KGlucHV0OkZsb2F0MzJBcnJheSwgbmZmdDpudW1iZXIpOkNvbXBsZXhDb250YWluZXIge1xuICAvL2NvbnNvbGUubG9nKFwiSW5wdXQgbGVuZ3RoOiBcIisgaW5wdXQubGVuZ3RoICsgXCIgbWF4OiBcIiArIG1heChpbnB1dCkgKyBcIiwgbWluOiBcIiArIG1pbihpbnB1dCkpO1xuICAvLyBoZWFkKGlucHV0LCAyMCk7XG4gIGxldCBpbnB1dF9wYWRkZWQgPSBuZXcgRmxvYXQzMkFycmF5KG5mZnQpO1xuICBpbnB1dF9wYWRkZWQuc2V0KGlucHV0KTtcbiAgbGV0IGZmdF9zZXR1cCA9IHZEU1BfREZUX3pyb3BfQ3JlYXRlU2V0dXAobnVsbCwgbmZmdCwgdkRTUF9ERlRfRGlyZWN0aW9uLkZPUldBUkQpO1xuICBpZiAoZmZ0X3NldHVwID09PSBudWxsKSB7XG4gICAgY29uc29sZS5sb2coXCJGRlQgc2V0dXAgZmFpbGVkIVwiKTtcbiAgfSBlbHNlIHtcbiAgICAvL2NvbnNvbGUubG9nKFwiRkZUIHNldHVwIHR5cGU6IFwiICsgdHlwZW9mKGZmdF9zZXR1cCkpO1xuICB9XG4gIGxldCBpciA9IG5ldyBGbG9hdDMyQXJyYXkobmZmdC8yKTtcbiAgbGV0IGlpID0gbmV3IEZsb2F0MzJBcnJheShuZmZ0LzIpO1xuICBsZXQgb3IgPSBuZXcgRmxvYXQzMkFycmF5KG5mZnQvMik7XG4gIGxldCBvaSA9IG5ldyBGbG9hdDMyQXJyYXkobmZmdC8yKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBuZmZ0LzI7IGkrKykge1xuICAgIGlmIChOdW1iZXIuaXNOYU4oaW5wdXRfcGFkZGVkW2kqMl0pIHx8IChpbnB1dF9wYWRkZWRbaSoyXSA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgY29uc29sZS5sb2coXCJpbnB1dCBcIisgaSArIFwiKjIgaXMgTmFOXCIpO1xuICAgIH1cbiAgICBpZiAoTnVtYmVyLmlzTmFOKGlucHV0X3BhZGRlZFtpKjIgKyAxXSkpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiaW5wdXQgXCIrIGkgKyBcIioyICsgMSBpcyBOYU5cIik7XG4gICAgfVxuICAgIGlyW2ldID0gaW5wdXRfcGFkZGVkW2kqMl07XG4gICAgaWlbaV0gPSBpbnB1dF9wYWRkZWRbaSoyICsgMV07XG4gIH1cbiAgLy8gY29uc29sZS5sb2coXCJGRlQgaW5wdXQgcm1zIFBSRTogaGFzTmFOOiBcIiArIGhhc05hbihpcikgKyBcIiwgcmVhbCBtYXggIFwiICsgbWF4KGlyKSArIFwiLCBtaW4gXCIgKyBtaW4oaXIpICsgXCIsIGltYWcgbWF4IFwiICsgbWF4KGlpKSArIFwiLCBtaW4gXCIgKyBtaW4oaWkpKTtcblxuICB2RFNQX0RGVF9FeGVjdXRlKGZmdF9zZXR1cCwgaW50ZXJvcC5oYW5kbGVvZihpciksIGludGVyb3AuaGFuZGxlb2YoaWkpLFxuICAgICAgICAgICAgICAgICAgaW50ZXJvcC5oYW5kbGVvZihvciksIGludGVyb3AuaGFuZGxlb2Yob2kpKTtcblxuICBsZXQgb3V0cHV0OkNvbXBsZXhDb250YWluZXIgPSB7XG4gICAgcmVhbDogb3IsXG4gICAgaW1hZzogb2lcbiAgfTtcbiAgLy8gY29uc29sZS5sb2coXCJGRlQgb3V0cHV0IGhhcyBOYU4gcmVhbDogXCIgKyBoYXNOYW4ob3IpICsgXCIsIGltYWc6IFwiKyBoYXNOYW4oaXIpICsgXCIgcm1zOiBcIiArIHJtc19zcGVjdChvdXRwdXQpICsgXCIsIHJlYWwgbWF4ICBcIiArIG1heChvcikgKyBcIiwgbWluIFwiICsgbWluKG9yKSArIFwiLCBpbWFnIG1heCBcIiArIG1heChvaSkgKyBcIiwgbWluIFwiICsgbWluKG9pKSk7XG5cbiAgdkRTUF9ERlRfRGVzdHJveVNldHVwKGZmdF9zZXR1cCk7IC8vIGZyZWUgcmVzb3VyY2VzXG5cbiAgLy8gaGVhZChvdXRwdXQucmVhbCwgMjApO1xuXG4gIHJldHVybiBvdXRwdXQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpZmZ0KGlucHV0OkNvbXBsZXhDb250YWluZXIsIG5pZmZ0KTpGbG9hdDMyQXJyYXkge1xuICBsZXQgaWZmdF9zZXR1cCA9IHZEU1BfREZUX3pyb3BfQ3JlYXRlU2V0dXAobnVsbCwgbmlmZnQsIHZEU1BfREZUX0RpcmVjdGlvbi5JTlZFUlNFKTtcblxuICBsZXQgb3IgPSBuZXcgRmxvYXQzMkFycmF5KG5pZmZ0LzIpO1xuICBsZXQgb2kgPSBuZXcgRmxvYXQzMkFycmF5KG5pZmZ0LzIpO1xuXG4gIHZEU1BfREZUX0V4ZWN1dGUoaWZmdF9zZXR1cCwgaW50ZXJvcC5oYW5kbGVvZihpbnB1dC5yZWFsKSwgaW50ZXJvcC5oYW5kbGVvZihpbnB1dC5pbWFnKSxcbiAgICAgICAgICAgICAgICAgIGludGVyb3AuaGFuZGxlb2Yob3IpLCBpbnRlcm9wLmhhbmRsZW9mKG9pKSk7XG4gIGxldCBvdXRwdXQgPSBuZXcgRmxvYXQzMkFycmF5KG5pZmZ0KTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBuaWZmdC8yOyBpKyspIHtcbiAgICBvdXRwdXRbaSoyXSA9IG9yW2ldL25pZmZ0O1xuICAgIG91dHB1dFtpKjIgKyAxXSA9IG9pW2ldL25pZmZ0O1xuICB9XG5cbiAgdkRTUF9ERlRfRGVzdHJveVNldHVwKGlmZnRfc2V0dXApO1xuXG4gIC8vIGNvbnNvbGUubG9nKFwiSUZGVCBvdXRwdXQgcm1zOiBcIiArIHJtcyhvdXRwdXQpKTtcblxuICByZXR1cm4gb3V0cHV0O1xufVxuXG4vKiogUmV0dXJuIHRoZSBuZXh0IG51bWJlciBmcm9tIG4gdGhhdCBpcyBhIHBvd2VyIG9mIHR3byAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE5leHRQb3dlck9mMihuOm51bWJlcik6bnVtYmVyIHtcbiAgcmV0dXJuIE1hdGgucG93KDIsIE1hdGguY2VpbChNYXRoLmxvZzIobikpKTtcbn1cblxuZXhwb3J0IGVudW0gV2luZG93VHlwZSB7XG4gIExpbmVhcixcbiAgUmFpc2VkQ29zaW5lXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVdpbmRvdyhpbnB1dDpGbG9hdDMyQXJyYXksIHdpbmRvd1R5cGU6V2luZG93VHlwZSwgZHVyYXRpb246bnVtYmVyLCBmczpudW1iZXIpOkZsb2F0MzJBcnJheSB7XG4gIGxldCByYW1wVXAgPSBuZXcgRmxvYXQzMkFycmF5KE1hdGgucm91bmQoZHVyYXRpb24gKiBmcykpO1xuICBzd2l0Y2ggKHdpbmRvd1R5cGUpIHtcbiAgICBjYXNlIFdpbmRvd1R5cGUuTGluZWFyOiB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhbXBVcC5sZW5ndGg7IGkrKykge1xuICAgICAgICByYW1wVXBbaV0gPSBpIC8gcmFtcFVwLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlIFdpbmRvd1R5cGUuUmFpc2VkQ29zaW5lOiB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhbXBVcC5sZW5ndGg7IGkrKykge1xuICAgICAgICByYW1wVXBbaV0gPSAoMSArIE1hdGguY29zKE1hdGguUEkgKyAoaSAvIHJhbXBVcC5sZW5ndGgpICogTWF0aC5QSSkpIC8gMjtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGxldCB3aW4gPSBuZXcgRmxvYXQzMkFycmF5KGlucHV0Lmxlbmd0aCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcmFtcFVwLmxlbmd0aDsgaSsrKSB7XG4gICAgd2luW2ldID0gcmFtcFVwW2ldO1xuICB9XG4gIGZvciAobGV0IGkgPSByYW1wVXAubGVuZ3RoOyBpIDwgKHdpbi5sZW5ndGggLSByYW1wVXAubGVuZ3RoKTsgaSsrKSB7XG4gICAgd2luW2ldID0gMTtcbiAgfVxuICBmb3IgKGxldCBpID0gKHdpbi5sZW5ndGggLSByYW1wVXAubGVuZ3RoKSwgaiA9IHJhbXBVcC5sZW5ndGggLSAxOyBpIDwgd2luLmxlbmd0aDsgaSsrLCBqLS0pIHtcbiAgICB3aW5baV0gPSByYW1wVXBbal07XG4gIH1cblxuICBsZXQgb3V0cHV0ID0gbmV3IEZsb2F0MzJBcnJheShpbnB1dC5sZW5ndGgpO1xuICB2RFNQX3ZtdWwoaW50ZXJvcC5oYW5kbGVvZihpbnB1dCksIDEsIGludGVyb3AuaGFuZGxlb2Yod2luKSwgMSxcbiAgICAgICAgICAgIGludGVyb3AuaGFuZGxlb2Yob3V0cHV0KSwgMSwgaW5wdXQubGVuZ3RoKTtcblxuICByZXR1cm4gb3V0cHV0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsZmlsdGVyKGhlYWRwaG9uZUZpbHRlcjpGbG9hdDMyQXJyYXksIGNhbExldmVsOm51bWJlcixcbiAgICB0YXJnZXRMZXZlbDpudW1iZXIsIGlucHV0OkZsb2F0MzJBcnJheSk6RmxvYXQzMkFycmF5IHtcblxuICBsZXQgZml4ZWRBdHRlbnVhdGlvbiA9IDE4O1xuXG4gIGxldCBsZW5faW5wdXQgPSBpbnB1dC5sZW5ndGg7XG4gIGxldCBsZW5fZmlsdCA9IGhlYWRwaG9uZUZpbHRlci5sZW5ndGg7XG4gIGxldCBpbnB1dF9wYWRkZWQgPSBuZXcgRmxvYXQzMkFycmF5KGxlbl9pbnB1dCArIGxlbl9maWx0IC0gMSk7XG4gIGxldCBybXMxX2lucHV0ID0gc2V0U2lnbmFsTGV2ZWwoaW5wdXQsIDAsIHRydWUpOyAvLyBub3JtYWxpemUgdG8gUk1TID0gMVxuICBpbnB1dF9wYWRkZWQuc2V0KHJtczFfaW5wdXQpO1xuICBsZXQgb3V0cHV0ID0gbmV3IEZsb2F0MzJBcnJheShsZW5faW5wdXQpO1xuICB2RFNQX2Rlc2FtcChpbnRlcm9wLmhhbmRsZW9mKGlucHV0X3BhZGRlZCksIDEsIGludGVyb3AuaGFuZGxlb2YoaGVhZHBob25lRmlsdGVyKSxcbiAgICAgICAgICAgICAgaW50ZXJvcC5oYW5kbGVvZihvdXRwdXQpLCBvdXRwdXQubGVuZ3RoLCBsZW5fZmlsdCk7XG5cbiAgLy8gbGV0IG5mZnQgPSBnZXROZXh0UG93ZXJPZjIobGVuX2lucHV0ICsgbGVuX2ZpbHQgLSAxKTtcbiAgLy8gbGV0IHJtczFfaW5wdXRfcGFkZGVkID0gbmV3IEZsb2F0MzJBcnJheShuZmZ0KTtcbiAgLy8gcm1zMV9pbnB1dF9wYWRkZWQuc2V0KHJtczFfaW5wdXQpO1xuICAvLyBsZXQgZmlsdF9wYWRkZWQgPSBuZXcgRmxvYXQzMkFycmF5KG5mZnQpO1xuICAvLyBmaWx0X3BhZGRlZC5zZXQoaGVhZHBob25lRmlsdGVyKTtcbiAgLy9cbiAgLy8gbGV0IGlucHV0X2ZmdDpDb21wbGV4Q29udGFpbmVyID0gZmZ0KHJtczFfaW5wdXRfcGFkZGVkLCBuZmZ0KTtcbiAgLy8gbGV0IGZpbHRfZmZ0OkNvbXBsZXhDb250YWluZXIgPSBmZnQoZmlsdF9wYWRkZWQsIG5mZnQpO1xuICAvLyBjb25zb2xlLmxvZygnaW5wdXQgUk1TOiAnICsgcm1zKGlucHV0KSk7XG4gIC8vIGNvbnNvbGUubG9nKCdpbnB1dCBGRlQgUk1TICcgKyBybXNfc3BlY3QoaW5wdXRfZmZ0KSk7XG4gIC8vIGNvbnNvbGUubG9nKCdGaWx0IFJNUzogJyArIHJtcyhoZWFkcGhvbmVGaWx0ZXIpKTtcbiAgLy8gY29uc29sZS5sb2coJ0ZpbHQgRkZUIFJNUzogJyArIHJtc19zcGVjdChmaWx0X2ZmdCkpO1xuICAvL1xuICAvLyBsZXQgb3V0cHV0X2ZmdDpDb21wbGV4Q29udGFpbmVyID0ge1xuICAvLyAgIHJlYWw6IG5ldyBGbG9hdDMyQXJyYXkoaW5wdXRfZmZ0LnJlYWwubGVuZ3RoKSxcbiAgLy8gICBpbWFnOiBuZXcgRmxvYXQzMkFycmF5KGlucHV0X2ZmdC5pbWFnLmxlbmd0aClcbiAgLy8gfTtcbiAgLy8gZm9yIChsZXQgaSA9IDA7IGkgPCBvdXRwdXRfZmZ0LnJlYWwubGVuZ3RoOyBpKyspIHtcbiAgLy8gICBsZXQgYSA9IGlucHV0X2ZmdC5yZWFsW2ldO1xuICAvLyAgIGxldCBiID0gaW5wdXRfZmZ0LmltYWdbaV07XG4gIC8vICAgbGV0IGMgPSBmaWx0X2ZmdC5yZWFsW2ldO1xuICAvLyAgIGxldCBkID0gZmlsdF9mZnQuaW1hZ1tpXTtcbiAgLy8gICBvdXRwdXRfZmZ0LnJlYWxbaV0gPSBhKmMgLSBiKmQ7XG4gIC8vICAgb3V0cHV0X2ZmdC5pbWFnW2ldID0gYSpkICsgYipjO1xuICAvLyB9XG4gIC8vIGNvbnNvbGUubG9nKCdPdXRwdXQgRkZUIFJNUzogJyArIHJtc19zcGVjdChvdXRwdXRfZmZ0KSk7XG4gIC8vIGxldCBvdXRwdXRfcGFkZGVkID0gaWZmdChvdXRwdXRfZmZ0LCBuZmZ0KTtcbiAgLy8gY29uc29sZS5sb2coJ091dHB1dCBJRkZUIFJNUzogJyArIHJtcyhvdXRwdXRfcGFkZGVkKSk7XG5cbiAgbGV0IG91dHB1dF9ub3JtID0gc2V0U2lnbmFsTGV2ZWwob3V0cHV0LCB0YXJnZXRMZXZlbCAtIGNhbExldmVsIC0gZml4ZWRBdHRlbnVhdGlvbiwgZmFsc2UpO1xuICAvL2xldCBvdXRwdXRfbm9ybSA9IHNldFNpZ25hbExldmVsKG91dHB1dCwgdGFyZ2V0TGV2ZWwgLSBjYWxMZXZlbCwgZmFsc2UpO1xuXG5cbiAgcmV0dXJuIG91dHB1dF9ub3JtO1xufVxuIl19