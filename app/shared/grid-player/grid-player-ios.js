"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util = require("../../shared/utils");
var fs = require("tns-core-modules/file-system");
var env = require("../../config/environment");
var ChannelOptions;
(function (ChannelOptions) {
    ChannelOptions[ChannelOptions["MonoticLeft"] = 0] = "MonoticLeft";
    ChannelOptions[ChannelOptions["MonoticRight"] = 1] = "MonoticRight";
    ChannelOptions[ChannelOptions["Diotic"] = 2] = "Diotic";
    ChannelOptions[ChannelOptions["Dichotic"] = 3] = "Dichotic";
})(ChannelOptions = exports.ChannelOptions || (exports.ChannelOptions = {}));
var GridPlayer = /** @class */ (function (_super) {
    __extends(GridPlayer, _super);
    function GridPlayer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GridPlayer.prototype.initialize = function (options) {
        var _this = this;
        this._freq = options.targetFrequency;
        this._targetDuration = options.targetDuration;
        this._maskerDuration = options.maskerDuration;
        this._maskerLevel = options.maskerLevel;
        this._loop = options.loop;
        this._silenceDuration = options.paddedSilenceDuration;
        this._chs = options.channelOptions;
        this._debug = !!options.debug;
        this._window = !!options.window ? options.window : true;
        this._completeCallback = options.completeCallback;
        this._errorCallback = options.errorCallback;
        this._infoCallback = options.infoCallback;
        this._dioticMasker = undefined;
        this._dioticTarget = undefined;
        this.log("Settings path: " + options.settingsPath);
        var leftFilterFilePath = fs.path.join(options.settingsPath, env.leftFilterFilename);
        var leftFilterFile = fs.File.fromPath(leftFilterFilePath);
        var leftFilterData = leftFilterFile.readSync(function (err) { _this.log(err); });
        var tmpArray = new ArrayBuffer(leftFilterData.length);
        this.log('Type of readSync output: ' + typeof (leftFilterData));
        leftFilterData.getBytes(tmpArray);
        this._leftFilter = new Float32Array(tmpArray);
        var rightFilterFilePath = fs.path.join(options.settingsPath, env.rightFilterFilename);
        var rightFilterFile = fs.File.fromPath(rightFilterFilePath);
        var rightFilterData = rightFilterFile.readSync(function (err) { _this.log(err); });
        tmpArray = new ArrayBuffer(rightFilterData.length);
        rightFilterData.getBytes(tmpArray);
        this._rightFilter = new Float32Array(tmpArray);
        var calLevelFilePath = fs.path.join(options.settingsPath, env.calLevelsFilename);
        var calLevelFile = fs.File.fromPath(calLevelFilePath);
        return calLevelFile.readText().then(function (res) {
            _this.log("Cal level file contents: " + res);
            var tmpLevels = JSON.parse(res);
            _this._leftCalLevel = tmpLevels.left;
            _this._rightCalLevel = tmpLevels.right;
            _this.log("Left filter length: " + _this._leftFilter.length + ", 1st coeff: " + _this._leftFilter[0] + ", cal level " + _this._leftCalLevel);
            _this.log("Right filter length: " + _this._rightFilter.length + ", 1st coeff: " + _this._rightFilter[0] + ", cal level " + _this._rightCalLevel);
        }).catch(function (err) {
            _this.log("Error reading cal levels: " + err);
        });
    };
    GridPlayer.prototype.log = function (msg) {
        if (this._debug) {
            console.log('GridPlayer: ' + msg);
        }
    };
    Object.defineProperty(GridPlayer.prototype, "volume", {
        get: function () {
            return this._player ? this._player.volume : -1;
        },
        set: function (vol) {
            if (this._player && vol >= 0) {
                this._player.volume = vol;
            }
        },
        enumerable: true,
        configurable: true
    });
    GridPlayer.prototype.isPlaying = function () {
        return this._player ? this._player.playing : false;
    };
    GridPlayer.prototype.play = function () {
        var _this = this;
        this.log('Play grid');
        return new Promise(function (resolve, reject) {
            try {
                if (!_this.isPlaying()) {
                    _this.log('now play');
                    _this._player.play();
                    resolve(true);
                }
            }
            catch (err) {
                _this.log('Error scheduling buffer!');
                _this.log(err);
                if (_this._errorCallback) {
                    _this._errorCallback({ err: err });
                }
                reject(err);
            }
        });
    };
    GridPlayer.prototype.pause = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (_this.isPlaying()) {
                    _this._player.pause();
                }
                resolve(true);
            }
            catch (err) {
                if (_this._errorCallback) {
                    _this._errorCallback({ err: err });
                }
                reject(err);
            }
        });
    };
    GridPlayer.prototype.dispose = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                _this._player.stop();
                _this._engine.stop();
                _this._engine.disconnectNodeInput(_this._mixer);
                _this._engine.detachNode(_this._player);
                _this._player = undefined;
                _this._engine = undefined;
                resolve(true);
            }
            catch (err) {
                if (_this._errorCallback) {
                    _this._errorCallback({ err: err });
                }
                reject(err);
            }
        });
    };
    GridPlayer.prototype.preloadStimulus = function (xval, yval, hasTarget, hasMasker) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                _this._hasTarget = hasTarget;
                _this._hasMasker = hasMasker;
                _this._dioticMasker = undefined;
                var audioSession = AVAudioSession.sharedInstance();
                audioSession.setActiveError(true);
                _this._fs = audioSession.sampleRate;
                _this.log('Audiosession done');
                _this._ch_layout = new AVAudioChannelLayout({ layoutTag: kAudioChannelLayoutTag_StereoHeadphones });
                _this._audioformat = new AVAudioFormat({
                    commonFormat: 1 /* PCMFormatFloat32 */,
                    sampleRate: _this._fs,
                    interleaved: false,
                    channelLayout: _this._ch_layout
                });
                _this.fillPCMBuffer(xval, yval);
                _this.log('buffer created');
                if (!_this._engine || !_this._engine.running) {
                    _this._engine = new AVAudioEngine();
                    _this.log('Engine created');
                    _this._player = new AVAudioPlayerNode();
                    _this._player.volume = 0;
                    _this._player.pan = 0;
                    _this.log('player created');
                    _this._engine.attachNode(_this._player);
                    _this.log('player attached');
                    _this._mixer = _this._engine.mainMixerNode;
                    _this._engine.connectToFormat(_this._player, _this._mixer, _this._audioformat);
                    _this.log('player attached to mixer');
                    var success = _this._engine.startAndReturnError();
                    _this.log('running, engine success: ' + (success ? 'yes' : 'no'));
                }
                _this._player.pause();
                _this._player.scheduleBufferAtTimeOptionsCompletionCallbackTypeCompletionHandler(_this._stimbuffer, null, _this._loop ? 1 /* Loops */ : null, 2 /* DataPlayedBack */, function (p1) {
                    _this.log("Finished playing!.");
                    if (_this._completeCallback) {
                        // wrap in a promise to get back to the main thread
                        // ref: https://github.com/NativeScript/NativeScript/issues/1673
                        Promise.resolve().then(function () { return _this._completeCallback({ p1: p1 }); });
                    }
                    else {
                        _this.log("No callback!");
                    }
                });
                resolve();
            }
            catch (err) {
                _this.log(err);
                if (_this._errorCallback) {
                    _this._errorCallback({ err: err });
                }
                reject(err);
            }
        });
    };
    GridPlayer.prototype.fillPCMBuffer = function (xval, yval) {
        var stim = this.generateStimulus(xval, yval, "left");
        this.log('fillPCMBuffer: Stim created');
        // prepare AVAudioPCMBuffer
        this._stimbuffer = AVAudioPCMBuffer.alloc().initWithPCMFormatFrameCapacity(this._audioformat, stim.length);
        this.log('fillPCMBuffer: buffer initialized, length ' + this._stimbuffer.frameCapacity);
        var ch_handle = this._stimbuffer.floatChannelData;
        if (this._chs !== ChannelOptions.MonoticRight) {
            this.log('fillPCMBuffer: starting to fill buffer');
            var ch_data = ch_handle[0];
            for (var i = 0; i < stim.length; i++) {
                ch_data[i] = stim[i];
            }
            this.log('fillPCMBuffer: buffer full');
        }
        if (this._chs !== ChannelOptions.MonoticLeft) {
            this.log('fillPCMBuffer: Filling also right buffer');
            var stim_r = this.generateStimulus(xval, yval, "right");
            var ch_data = ch_handle[1];
            for (var i = 0; i < stim.length; i++) {
                ch_data[i] = stim_r[i];
            }
        }
        this._stimbuffer.frameLength = this._stimbuffer.frameCapacity;
        this.log('fillPCMBuffer: return buffer');
    };
    GridPlayer.prototype.generateStimulus = function (xval, yval, ear) {
        this.log("generateStimulus: xval " + xval + ", yval " + yval);
        var nsamples_target = Math.floor(this._targetDuration * this._fs);
        var nsamples_masker = Math.floor(this._maskerDuration * this._fs);
        var nsamples = Math.max(nsamples_target, nsamples_masker);
        if (this._silenceDuration) {
            nsamples = nsamples + Math.floor(this._silenceDuration * this._fs);
        }
        var masker_output = new Float32Array(nsamples);
        if (this._hasMasker) {
            var edge1 = 1;
            var edge2 = (1 - xval) * this._freq;
            var edge3 = (1 + xval) * this._freq;
            var edge4 = this._fs / 2 - 1;
            var currbw = (edge4 - edge3) + (edge2 - edge1);
            var full_bw_dB = 10 * Math.log10(this._fs / 2);
            var bw_corr_dB = 10 * Math.log10(currbw) - full_bw_dB;
            var bs_masker_win = new Float32Array(nsamples);
            if ((this._chs == ChannelOptions.Diotic) && (this._dioticMasker !== undefined)) {
                this.log("Found old diotic masker here");
                bs_masker_win = this._dioticMasker;
            }
            else {
                var masker = new Float32Array(nsamples_masker);
                var rnd = util.initRandn(0, 1); // rms = 1
                for (var i = 0; i < nsamples_masker; i++) {
                    masker[i] = rnd();
                }
                var bs_masker = new Float32Array(nsamples_masker);
                if (xval > 0) {
                    // bandstop-filtering the masker
                    var n_fft = util.getNextPowerOf2(nsamples_masker);
                    console.log('NFFT: ' + n_fft);
                    var masker_fft = util.fft(masker, n_fft);
                    var bs_masker_low_fft = util.boxcar_spectrum(masker_fft, edge1, edge2, this._fs);
                    var bs_masker_high_fft = util.boxcar_spectrum(masker_fft, edge3, edge4, this._fs);
                    var bs_masker_low_padded = util.ifft(bs_masker_low_fft, n_fft);
                    var bs_masker_high_padded = util.ifft(bs_masker_high_fft, n_fft);
                    vDSP_vadd(interop.handleof(bs_masker_low_padded), 1, interop.handleof(bs_masker_high_padded), 1, interop.handleof(bs_masker), 1, nsamples_masker);
                }
                else {
                    bs_masker = masker.slice();
                }
                // windowing the output
                if (this._window) {
                    bs_masker_win = util.applyWindow(bs_masker, util.WindowType.RaisedCosine, 0.008, this._fs);
                }
                else {
                    bs_masker_win = bs_masker.slice();
                }
                this._dioticMasker = bs_masker_win.slice(); // slice returns a copy, not a reference
                this.log('bs_masker_win abs max: ' + util.max(util.abs(bs_masker_win)));
                this.log('bw_corr_dB level dB: ' + bw_corr_dB);
                this.log('masker level db: ' + this._maskerLevel);
            }
            // filtering & setting level
            var bs_masker_win_norm = void 0;
            if (ear === "left") {
                bs_masker_win_norm = util.calfilter(this._leftFilter, 6 + (this._leftCalLevel - this._rightCalLevel), this._maskerLevel + bw_corr_dB, bs_masker_win);
            }
            else if (ear === "right") {
                bs_masker_win_norm = util.calfilter(this._rightFilter, 6, this._maskerLevel + bw_corr_dB, bs_masker_win);
            }
            masker_output.set(bs_masker_win_norm);
            this.log('masker abs max: ' + util.max(util.abs(masker_output)));
        }
        var target_output = new Float32Array(nsamples);
        if (this._hasTarget) {
            var target_win = void 0;
            if ((this._chs == ChannelOptions.Diotic) && (this._dioticTarget !== undefined)) {
                this.log("Found diotic target");
                target_win = this._dioticTarget;
            }
            else {
                var target = new Float32Array(nsamples_target);
                for (var i = 0; i < nsamples_target; i++) {
                    target[i] = Math.sin((2 * Math.PI * this._freq * i) / this._fs);
                }
                if (this._window) {
                    target_win = util.applyWindow(target, util.WindowType.RaisedCosine, 0.008, this._fs);
                }
                else {
                    target_win = target.slice();
                }
                this._dioticTarget = target_win.slice();
            }
            var target_norm = void 0;
            if (ear == "left") {
                target_norm = util.calfilter(this._leftFilter, 6 + (this._leftCalLevel - this._rightCalLevel), yval, target_win);
            }
            else if (ear == "right") {
                target_norm = util.calfilter(this._rightFilter, 6, yval, target_win);
            }
            target_output.set(target_norm);
        }
        var output = new Float32Array(nsamples);
        vDSP_vadd(interop.handleof(masker_output), 1, interop.handleof(target_output), 1, interop.handleof(output), 1, nsamples);
        var maxval = new interop.Reference();
        vDSP_maxmgv(interop.handleof(output), 1, maxval, nsamples);
        this.log('Max value for output: ' + maxval.value);
        return output;
    };
    GridPlayer.prototype.audioPlayerDidFinishPlayingSuccessfully = function (player, flag) {
        if (flag && this._completeCallback) {
            this._completeCallback({ player: player, flag: flag });
        }
        else if (!flag && this._errorCallback) {
            this._errorCallback({ player: player, flag: flag });
        }
    };
    GridPlayer.prototype.audioPlayerDecodeErrorDidOccurError = function (player, error) {
        if (this._errorCallback) {
            this._errorCallback({ player: player, error: error });
        }
    };
    GridPlayer.ObjCProtocols = [AVAudioPlayerDelegate];
    return GridPlayer;
}(NSObject));
exports.GridPlayer = GridPlayer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZC1wbGF5ZXItaW9zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ3JpZC1wbGF5ZXItaW9zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseUNBQTJDO0FBQzNDLGlEQUFtRDtBQUNuRCw4Q0FBZ0Q7QUFLaEQsSUFBWSxjQUtYO0FBTEQsV0FBWSxjQUFjO0lBQ3hCLGlFQUFXLENBQUE7SUFDWCxtRUFBWSxDQUFBO0lBQ1osdURBQU0sQ0FBQTtJQUNOLDJEQUFRLENBQUE7QUFDVixDQUFDLEVBTFcsY0FBYyxHQUFkLHNCQUFjLEtBQWQsc0JBQWMsUUFLekI7QUF1QkQ7SUFBZ0MsOEJBQVE7SUFBeEM7O0lBd1lBLENBQUM7SUFsV1EsK0JBQVUsR0FBakIsVUFBa0IsT0FBMEI7UUFBNUMsaUJBZ0RDO1FBL0NDLElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQztRQUVyQyxJQUFJLENBQUMsZUFBZSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7UUFDOUMsSUFBSSxDQUFDLGVBQWUsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDO1FBQzlDLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQztRQUN4QyxJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDMUIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQztRQUN0RCxJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7UUFFbkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztRQUM5QixJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFFeEQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLE9BQU8sQ0FB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c2hhcmVkL3V0aWxzJztcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2ZpbGUtc3lzdGVtXCI7XG5pbXBvcnQgKiBhcyBlbnYgZnJvbSBcIi4uLy4uL2NvbmZpZy9lbnZpcm9ubWVudFwiO1xuXG5kZWNsYXJlIHZhciB6b25lZENhbGxiYWNrOiBGdW5jdGlvbjtcbmRlY2xhcmUgdmFyIEFWQXVkaW9QbGF5ZXI7XG5cbmV4cG9ydCBlbnVtIENoYW5uZWxPcHRpb25zIHtcbiAgTW9ub3RpY0xlZnQsXG4gIE1vbm90aWNSaWdodCxcbiAgRGlvdGljLFxuICBEaWNob3RpY1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRQbGF5ZXJPcHRpb25zIHtcbiAgdGFyZ2V0RnJlcXVlbmN5OiBudW1iZXI7XG5cbiAgY29tcGxldGVDYWxsYmFjaz86IGFueTtcbiAgZXJyb3JDYWxsYmFjaz86IGFueTtcbiAgaW5mb0NhbGxiYWNrPzogYW55O1xuXG4gIGNoYW5uZWxPcHRpb25zOiBDaGFubmVsT3B0aW9ucztcblxuICBsb29wOiBib29sZWFuO1xuICBwYWRkZWRTaWxlbmNlRHVyYXRpb24/OiBudW1iZXI7XG4gIHRhcmdldER1cmF0aW9uOiBudW1iZXI7XG4gIG1hc2tlckR1cmF0aW9uOiBudW1iZXI7XG4gIG1hc2tlckxldmVsOiBudW1iZXI7XG4gIHdpbmRvdz86Ym9vbGVhbjtcblxuICBzZXR0aW5nc1BhdGg6IHN0cmluZztcblxuICBkZWJ1Zz86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBHcmlkUGxheWVyIGV4dGVuZHMgTlNPYmplY3Qge1xuICBwdWJsaWMgc3RhdGljIE9iakNQcm90b2NvbHMgPSBbQVZBdWRpb1BsYXllckRlbGVnYXRlXTtcblxuICBwcml2YXRlIF9wbGF5ZXI6IEFWQXVkaW9QbGF5ZXJOb2RlO1xuICBwcml2YXRlIF9lbmdpbmU6IEFWQXVkaW9FbmdpbmU7XG4gIHByaXZhdGUgX21peGVyOiBBVkF1ZGlvTWl4ZXJOb2RlO1xuICBwcml2YXRlIF9jaF9sYXlvdXQ6IEFWQXVkaW9DaGFubmVsTGF5b3V0O1xuICBwcml2YXRlIF9hdWRpb2Zvcm1hdDogQVZBdWRpb0Zvcm1hdDtcblxuICBwcml2YXRlIF9jb21wbGV0ZUNhbGxiYWNrOiAocDE6YW55KSA9PiB2b2lkO1xuICBwcml2YXRlIF9lcnJvckNhbGxiYWNrOiBhbnk7XG4gIHByaXZhdGUgX2luZm9DYWxsYmFjazogYW55O1xuXG4gIHByaXZhdGUgX2RlYnVnOmJvb2xlYW47XG5cbiAgcHJpdmF0ZSBfdGFyZ2V0RHVyYXRpb246IG51bWJlcjtcbiAgcHJpdmF0ZSBfbWFza2VyRHVyYXRpb246IG51bWJlcjtcbiAgcHJpdmF0ZSBfbWFza2VyTGV2ZWw6IG51bWJlcjtcbiAgcHJpdmF0ZSBfZnM6IG51bWJlcjtcbiAgcHJpdmF0ZSBfbG9vcDogYm9vbGVhbjtcbiAgcHJpdmF0ZSBfZnJlcTogbnVtYmVyO1xuICBwcml2YXRlIF9oYXNNYXNrZXI6IGJvb2xlYW47XG4gIHByaXZhdGUgX2hhc1RhcmdldDogYm9vbGVhbjtcbiAgcHJpdmF0ZSBfc2lsZW5jZUR1cmF0aW9uOiBudW1iZXI7XG4gIHByaXZhdGUgX3dpbmRvdzpib29sZWFuO1xuICBwcml2YXRlIF9jaHM6IENoYW5uZWxPcHRpb25zO1xuXG4gIHByaXZhdGUgX2Rpb3RpY01hc2tlcjogRmxvYXQzMkFycmF5O1xuICBwcml2YXRlIF9kaW90aWNUYXJnZXQ6IEZsb2F0MzJBcnJheTtcblxuICBwcml2YXRlIF9sZWZ0RmlsdGVyOiBGbG9hdDMyQXJyYXk7XG4gIHByaXZhdGUgX2xlZnRDYWxMZXZlbDogbnVtYmVyO1xuICBwcml2YXRlIF9yaWdodEZpbHRlcjogRmxvYXQzMkFycmF5O1xuICBwcml2YXRlIF9yaWdodENhbExldmVsOiBudW1iZXI7XG5cbiAgcHJpdmF0ZSBfc3RpbWJ1ZmZlcjogQVZBdWRpb1BDTUJ1ZmZlcjtcblxuXG4gIHB1YmxpYyBpbml0aWFsaXplKG9wdGlvbnM6IEdyaWRQbGF5ZXJPcHRpb25zKTpQcm9taXNlPGFueT4ge1xuICAgIHRoaXMuX2ZyZXEgPSBvcHRpb25zLnRhcmdldEZyZXF1ZW5jeTtcblxuICAgIHRoaXMuX3RhcmdldER1cmF0aW9uID0gb3B0aW9ucy50YXJnZXREdXJhdGlvbjtcbiAgICB0aGlzLl9tYXNrZXJEdXJhdGlvbiA9IG9wdGlvbnMubWFza2VyRHVyYXRpb247XG4gICAgdGhpcy5fbWFza2VyTGV2ZWwgPSBvcHRpb25zLm1hc2tlckxldmVsO1xuICAgIHRoaXMuX2xvb3AgPSBvcHRpb25zLmxvb3A7XG4gICAgdGhpcy5fc2lsZW5jZUR1cmF0aW9uID0gb3B0aW9ucy5wYWRkZWRTaWxlbmNlRHVyYXRpb247XG4gICAgdGhpcy5fY2hzID0gb3B0aW9ucy5jaGFubmVsT3B0aW9ucztcblxuICAgIHRoaXMuX2RlYnVnID0gISFvcHRpb25zLmRlYnVnO1xuICAgIHRoaXMuX3dpbmRvdyA9ICEhb3B0aW9ucy53aW5kb3cgPyBvcHRpb25zLndpbmRvdyA6IHRydWU7XG5cbiAgICB0aGlzLl9jb21wbGV0ZUNhbGxiYWNrID0gb3B0aW9ucy5jb21wbGV0ZUNhbGxiYWNrO1xuICAgIHRoaXMuX2Vycm9yQ2FsbGJhY2sgPSBvcHRpb25zLmVycm9yQ2FsbGJhY2s7XG4gICAgdGhpcy5faW5mb0NhbGxiYWNrID0gb3B0aW9ucy5pbmZvQ2FsbGJhY2s7XG4gICAgdGhpcy5fZGlvdGljTWFza2VyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX2Rpb3RpY1RhcmdldCA9IHVuZGVmaW5lZDtcblxuICAgIHRoaXMubG9nKFwiU2V0dGluZ3MgcGF0aDogXCIgKyBvcHRpb25zLnNldHRpbmdzUGF0aCk7XG4gICAgY29uc3QgbGVmdEZpbHRlckZpbGVQYXRoID0gZnMucGF0aC5qb2luKG9wdGlvbnMuc2V0dGluZ3NQYXRoLCBlbnYubGVmdEZpbHRlckZpbGVuYW1lKTtcbiAgICBjb25zdCBsZWZ0RmlsdGVyRmlsZSA9IGZzLkZpbGUuZnJvbVBhdGgobGVmdEZpbHRlckZpbGVQYXRoKTtcbiAgICBjb25zdCBsZWZ0RmlsdGVyRGF0YSA9IGxlZnRGaWx0ZXJGaWxlLnJlYWRTeW5jKGVyciA9PiB7dGhpcy5sb2coZXJyKX0pO1xuICAgIGxldCB0bXBBcnJheSA9IG5ldyBBcnJheUJ1ZmZlcihsZWZ0RmlsdGVyRGF0YS5sZW5ndGgpO1xuICAgIHRoaXMubG9nKCdUeXBlIG9mIHJlYWRTeW5jIG91dHB1dDogJyArIHR5cGVvZihsZWZ0RmlsdGVyRGF0YSkpO1xuICAgIGxlZnRGaWx0ZXJEYXRhLmdldEJ5dGVzKHRtcEFycmF5KTtcbiAgICB0aGlzLl9sZWZ0RmlsdGVyID0gbmV3IEZsb2F0MzJBcnJheSh0bXBBcnJheSk7XG5cbiAgICBjb25zdCByaWdodEZpbHRlckZpbGVQYXRoID0gZnMucGF0aC5qb2luKG9wdGlvbnMuc2V0dGluZ3NQYXRoLCBlbnYucmlnaHRGaWx0ZXJGaWxlbmFtZSk7XG4gICAgY29uc3QgcmlnaHRGaWx0ZXJGaWxlID0gZnMuRmlsZS5mcm9tUGF0aChyaWdodEZpbHRlckZpbGVQYXRoKTtcbiAgICBjb25zdCByaWdodEZpbHRlckRhdGEgPSByaWdodEZpbHRlckZpbGUucmVhZFN5bmMoZXJyID0+IHt0aGlzLmxvZyhlcnIpfSk7XG4gICAgdG1wQXJyYXkgPSBuZXcgQXJyYXlCdWZmZXIocmlnaHRGaWx0ZXJEYXRhLmxlbmd0aCk7XG4gICAgcmlnaHRGaWx0ZXJEYXRhLmdldEJ5dGVzKHRtcEFycmF5KTtcbiAgICB0aGlzLl9yaWdodEZpbHRlciA9IG5ldyBGbG9hdDMyQXJyYXkodG1wQXJyYXkpO1xuXG4gICAgY29uc3QgY2FsTGV2ZWxGaWxlUGF0aCA9IGZzLnBhdGguam9pbihvcHRpb25zLnNldHRpbmdzUGF0aCwgZW52LmNhbExldmVsc0ZpbGVuYW1lKTtcbiAgICBjb25zdCBjYWxMZXZlbEZpbGUgPSBmcy5GaWxlLmZyb21QYXRoKGNhbExldmVsRmlsZVBhdGgpO1xuICAgIHJldHVybiBjYWxMZXZlbEZpbGUucmVhZFRleHQoKS50aGVuKChyZXMpID0+IHtcbiAgICAgIHRoaXMubG9nKFwiQ2FsIGxldmVsIGZpbGUgY29udGVudHM6IFwiICsgcmVzKTtcbiAgICAgIGxldCB0bXBMZXZlbHMgPSBKU09OLnBhcnNlKHJlcyk7XG4gICAgICB0aGlzLl9sZWZ0Q2FsTGV2ZWwgPSB0bXBMZXZlbHMubGVmdDtcbiAgICAgIHRoaXMuX3JpZ2h0Q2FsTGV2ZWwgPSB0bXBMZXZlbHMucmlnaHQ7XG4gICAgICB0aGlzLmxvZyhcIkxlZnQgZmlsdGVyIGxlbmd0aDogXCIgKyB0aGlzLl9sZWZ0RmlsdGVyLmxlbmd0aCArIFwiLCAxc3QgY29lZmY6IFwiICsgdGhpcy5fbGVmdEZpbHRlclswXSArIFwiLCBjYWwgbGV2ZWwgXCIgKyB0aGlzLl9sZWZ0Q2FsTGV2ZWwpO1xuICAgICAgdGhpcy5sb2coXCJSaWdodCBmaWx0ZXIgbGVuZ3RoOiBcIiArIHRoaXMuX3JpZ2h0RmlsdGVyLmxlbmd0aCArIFwiLCAxc3QgY29lZmY6IFwiICsgdGhpcy5fcmlnaHRGaWx0ZXJbMF0gKyBcIiwgY2FsIGxldmVsIFwiICsgdGhpcy5fcmlnaHRDYWxMZXZlbCk7XG4gICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgdGhpcy5sb2coXCJFcnJvciByZWFkaW5nIGNhbCBsZXZlbHM6IFwiICsgZXJyKTtcbiAgICB9KTtcblxuICB9XG5cbiAgcHJpdmF0ZSBsb2cobXNnOnN0cmluZykge1xuICAgIGlmICh0aGlzLl9kZWJ1Zykge1xuICAgICAgY29uc29sZS5sb2coJ0dyaWRQbGF5ZXI6ICcgKyBtc2cpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBnZXQgdm9sdW1lKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3BsYXllciA/IHRoaXMuX3BsYXllci52b2x1bWUgOiAtMTtcbiAgfVxuXG4gIHB1YmxpYyBzZXQgdm9sdW1lKHZvbDpudW1iZXIpIHtcbiAgICBpZiAodGhpcy5fcGxheWVyICYmIHZvbCA+PSAwKSB7XG4gICAgICB0aGlzLl9wbGF5ZXIudm9sdW1lID0gdm9sO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBpc1BsYXlpbmcoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3BsYXllciA/IHRoaXMuX3BsYXllci5wbGF5aW5nIDogZmFsc2U7XG4gIH1cblxuICBwdWJsaWMgcGxheSgpOiBQcm9taXNlPGFueT4ge1xuICAgIHRoaXMubG9nKCdQbGF5IGdyaWQnKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKCF0aGlzLmlzUGxheWluZygpKSB7XG4gICAgICAgICAgdGhpcy5sb2coJ25vdyBwbGF5Jyk7XG4gICAgICAgICAgdGhpcy5fcGxheWVyLnBsYXkoKTtcbiAgICAgICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgdGhpcy5sb2coJ0Vycm9yIHNjaGVkdWxpbmcgYnVmZmVyIScpO1xuICAgICAgICB0aGlzLmxvZyhlcnIpO1xuICAgICAgICBpZiAodGhpcy5fZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgIHRoaXMuX2Vycm9yQ2FsbGJhY2soeyBlcnIgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgcGF1c2UoKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHRoaXMuaXNQbGF5aW5nKCkpIHtcbiAgICAgICAgICB0aGlzLl9wbGF5ZXIucGF1c2UoKTtcbiAgICAgICAgfVxuICAgICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGlmICh0aGlzLl9lcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgdGhpcy5fZXJyb3JDYWxsYmFjayh7IGVyciB9KTtcbiAgICAgICAgfVxuICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBkaXNwb3NlKCk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuX3BsYXllci5zdG9wKCk7XG4gICAgICAgIHRoaXMuX2VuZ2luZS5zdG9wKCk7XG4gICAgICAgIHRoaXMuX2VuZ2luZS5kaXNjb25uZWN0Tm9kZUlucHV0KHRoaXMuX21peGVyKTtcbiAgICAgICAgdGhpcy5fZW5naW5lLmRldGFjaE5vZGUodGhpcy5fcGxheWVyKVxuXG4gICAgICAgIHRoaXMuX3BsYXllciA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5fZW5naW5lID0gdW5kZWZpbmVkO1xuICAgICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGlmICh0aGlzLl9lcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgdGhpcy5fZXJyb3JDYWxsYmFjayh7IGVyciB9KTtcbiAgICAgICAgfVxuICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBwcmVsb2FkU3RpbXVsdXMoeHZhbDpudW1iZXIsIHl2YWw6bnVtYmVyLCBoYXNUYXJnZXQ6Ym9vbGVhbiwgaGFzTWFza2VyOmJvb2xlYW4pOlByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuX2hhc1RhcmdldCA9IGhhc1RhcmdldDtcbiAgICAgICAgdGhpcy5faGFzTWFza2VyID0gaGFzTWFza2VyO1xuICAgICAgICB0aGlzLl9kaW90aWNNYXNrZXIgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgbGV0IGF1ZGlvU2Vzc2lvbiA9IEFWQXVkaW9TZXNzaW9uLnNoYXJlZEluc3RhbmNlKCk7XG4gICAgICAgIGF1ZGlvU2Vzc2lvbi5zZXRBY3RpdmVFcnJvcih0cnVlKTtcbiAgICAgICAgdGhpcy5fZnMgPSBhdWRpb1Nlc3Npb24uc2FtcGxlUmF0ZTtcbiAgICAgICAgdGhpcy5sb2coJ0F1ZGlvc2Vzc2lvbiBkb25lJyk7XG5cbiAgICAgICAgdGhpcy5fY2hfbGF5b3V0ID0gbmV3IEFWQXVkaW9DaGFubmVsTGF5b3V0KHtsYXlvdXRUYWc6IGtBdWRpb0NoYW5uZWxMYXlvdXRUYWdfU3RlcmVvSGVhZHBob25lc30pO1xuICAgICAgICB0aGlzLl9hdWRpb2Zvcm1hdCA9IG5ldyBBVkF1ZGlvRm9ybWF0KHtcbiAgICAgICAgICBjb21tb25Gb3JtYXQ6IEFWQXVkaW9Db21tb25Gb3JtYXQuUENNRm9ybWF0RmxvYXQzMixcbiAgICAgICAgICBzYW1wbGVSYXRlOiB0aGlzLl9mcyxcbiAgICAgICAgICBpbnRlcmxlYXZlZDogZmFsc2UsXG4gICAgICAgICAgY2hhbm5lbExheW91dDogdGhpcy5fY2hfbGF5b3V0fSk7XG5cbiAgICAgICAgdGhpcy5maWxsUENNQnVmZmVyKHh2YWwsIHl2YWwpO1xuICAgICAgICB0aGlzLmxvZygnYnVmZmVyIGNyZWF0ZWQnKTtcblxuICAgICAgICBpZiAoIXRoaXMuX2VuZ2luZSB8fCAhdGhpcy5fZW5naW5lLnJ1bm5pbmcpIHtcblxuICAgICAgICAgIHRoaXMuX2VuZ2luZSA9IG5ldyBBVkF1ZGlvRW5naW5lKCk7XG4gICAgICAgICAgdGhpcy5sb2coJ0VuZ2luZSBjcmVhdGVkJyk7XG4gICAgICAgICAgdGhpcy5fcGxheWVyID0gbmV3IEFWQXVkaW9QbGF5ZXJOb2RlKCk7XG4gICAgICAgICAgdGhpcy5fcGxheWVyLnZvbHVtZSA9IDA7XG4gICAgICAgICAgdGhpcy5fcGxheWVyLnBhbiA9IDA7XG4gICAgICAgICAgdGhpcy5sb2coJ3BsYXllciBjcmVhdGVkJyk7XG4gICAgICAgICAgdGhpcy5fZW5naW5lLmF0dGFjaE5vZGUodGhpcy5fcGxheWVyKTtcbiAgICAgICAgICB0aGlzLmxvZygncGxheWVyIGF0dGFjaGVkJyk7XG4gICAgICAgICAgdGhpcy5fbWl4ZXIgPSB0aGlzLl9lbmdpbmUubWFpbk1peGVyTm9kZTtcbiAgICAgICAgICB0aGlzLl9lbmdpbmUuY29ubmVjdFRvRm9ybWF0KHRoaXMuX3BsYXllciwgdGhpcy5fbWl4ZXIsIHRoaXMuX2F1ZGlvZm9ybWF0KTtcbiAgICAgICAgICB0aGlzLmxvZygncGxheWVyIGF0dGFjaGVkIHRvIG1peGVyJyk7XG5cbiAgICAgICAgICBsZXQgc3VjY2VzcyA9IHRoaXMuX2VuZ2luZS5zdGFydEFuZFJldHVybkVycm9yKCk7XG4gICAgICAgICAgdGhpcy5sb2coJ3J1bm5pbmcsIGVuZ2luZSBzdWNjZXNzOiAnICsgKHN1Y2Nlc3MgPyAneWVzJyA6ICdubycpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9wbGF5ZXIucGF1c2UoKTtcblxuICAgICAgICB0aGlzLl9wbGF5ZXIuc2NoZWR1bGVCdWZmZXJBdFRpbWVPcHRpb25zQ29tcGxldGlvbkNhbGxiYWNrVHlwZUNvbXBsZXRpb25IYW5kbGVyKFxuICAgICAgICAgIHRoaXMuX3N0aW1idWZmZXIsXG4gICAgICAgICAgbnVsbCxcbiAgICAgICAgICB0aGlzLl9sb29wID8gQVZBdWRpb1BsYXllck5vZGVCdWZmZXJPcHRpb25zLkxvb3BzIDogbnVsbCxcbiAgICAgICAgICBBVkF1ZGlvUGxheWVyTm9kZUNvbXBsZXRpb25DYWxsYmFja1R5cGUuRGF0YVBsYXllZEJhY2ssXG4gICAgICAgICAgKHAxOiBBVkF1ZGlvUGxheWVyTm9kZUNvbXBsZXRpb25DYWxsYmFja1R5cGUpID0+IHtcbiAgICAgICAgICAgIHRoaXMubG9nKFwiRmluaXNoZWQgcGxheWluZyEuXCIpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2NvbXBsZXRlQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgLy8gd3JhcCBpbiBhIHByb21pc2UgdG8gZ2V0IGJhY2sgdG8gdGhlIG1haW4gdGhyZWFkXG4gICAgICAgICAgICAgIC8vIHJlZjogaHR0cHM6Ly9naXRodWIuY29tL05hdGl2ZVNjcmlwdC9OYXRpdmVTY3JpcHQvaXNzdWVzLzE2NzNcbiAgICAgICAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB0aGlzLl9jb21wbGV0ZUNhbGxiYWNrKHsgcDEgfSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5sb2coXCJObyBjYWxsYmFjayFcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aGlzLmxvZyhlcnIpO1xuICAgICAgICBpZiAodGhpcy5fZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgIHRoaXMuX2Vycm9yQ2FsbGJhY2soe2Vycn0pO1xuICAgICAgICB9XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBmaWxsUENNQnVmZmVyKHh2YWw6bnVtYmVyLCB5dmFsOm51bWJlcikge1xuICAgIGxldCBzdGltID0gdGhpcy5nZW5lcmF0ZVN0aW11bHVzKHh2YWwsIHl2YWwsIFwibGVmdFwiKTtcbiAgICB0aGlzLmxvZygnZmlsbFBDTUJ1ZmZlcjogU3RpbSBjcmVhdGVkJyk7XG4gICAgLy8gcHJlcGFyZSBBVkF1ZGlvUENNQnVmZmVyXG5cbiAgICB0aGlzLl9zdGltYnVmZmVyID0gQVZBdWRpb1BDTUJ1ZmZlci5hbGxvYygpLmluaXRXaXRoUENNRm9ybWF0RnJhbWVDYXBhY2l0eSh0aGlzLl9hdWRpb2Zvcm1hdCwgc3RpbS5sZW5ndGgpO1xuICAgIHRoaXMubG9nKCdmaWxsUENNQnVmZmVyOiBidWZmZXIgaW5pdGlhbGl6ZWQsIGxlbmd0aCAnICsgdGhpcy5fc3RpbWJ1ZmZlci5mcmFtZUNhcGFjaXR5KTtcbiAgICBsZXQgY2hfaGFuZGxlID0gdGhpcy5fc3RpbWJ1ZmZlci5mbG9hdENoYW5uZWxEYXRhO1xuXG4gICAgaWYgKHRoaXMuX2NocyAhPT0gQ2hhbm5lbE9wdGlvbnMuTW9ub3RpY1JpZ2h0KSB7XG4gICAgICB0aGlzLmxvZygnZmlsbFBDTUJ1ZmZlcjogc3RhcnRpbmcgdG8gZmlsbCBidWZmZXInKTtcbiAgICAgIGxldCBjaF9kYXRhID0gY2hfaGFuZGxlWzBdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGltLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNoX2RhdGFbaV0gPSBzdGltW2ldO1xuICAgICAgfVxuICAgICAgdGhpcy5sb2coJ2ZpbGxQQ01CdWZmZXI6IGJ1ZmZlciBmdWxsJyk7XG4gICAgfVxuICAgIGlmICh0aGlzLl9jaHMgIT09IENoYW5uZWxPcHRpb25zLk1vbm90aWNMZWZ0KSB7XG4gICAgICB0aGlzLmxvZygnZmlsbFBDTUJ1ZmZlcjogRmlsbGluZyBhbHNvIHJpZ2h0IGJ1ZmZlcicpO1xuICAgICAgbGV0IHN0aW1fciA9IHRoaXMuZ2VuZXJhdGVTdGltdWx1cyh4dmFsLCB5dmFsLCBcInJpZ2h0XCIpO1xuICAgICAgbGV0IGNoX2RhdGEgPSBjaF9oYW5kbGVbMV07XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0aW0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2hfZGF0YVtpXSA9IHN0aW1fcltpXTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fc3RpbWJ1ZmZlci5mcmFtZUxlbmd0aCA9IHRoaXMuX3N0aW1idWZmZXIuZnJhbWVDYXBhY2l0eTtcblxuICAgIHRoaXMubG9nKCdmaWxsUENNQnVmZmVyOiByZXR1cm4gYnVmZmVyJyk7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlU3RpbXVsdXMoeHZhbDpudW1iZXIsIHl2YWw6bnVtYmVyLCBlYXI6c3RyaW5nKTpGbG9hdDMyQXJyYXkge1xuXG4gICAgdGhpcy5sb2coXCJnZW5lcmF0ZVN0aW11bHVzOiB4dmFsIFwiICsgeHZhbCArIFwiLCB5dmFsIFwiICsgeXZhbCk7XG4gICAgbGV0IG5zYW1wbGVzX3RhcmdldCA9IE1hdGguZmxvb3IodGhpcy5fdGFyZ2V0RHVyYXRpb24gKiB0aGlzLl9mcyk7XG4gICAgbGV0IG5zYW1wbGVzX21hc2tlciA9IE1hdGguZmxvb3IodGhpcy5fbWFza2VyRHVyYXRpb24gKiB0aGlzLl9mcyk7XG4gICAgbGV0IG5zYW1wbGVzID0gTWF0aC5tYXgobnNhbXBsZXNfdGFyZ2V0LCBuc2FtcGxlc19tYXNrZXIpO1xuICAgIGlmICh0aGlzLl9zaWxlbmNlRHVyYXRpb24pIHtcbiAgICAgIG5zYW1wbGVzID0gbnNhbXBsZXMgKyBNYXRoLmZsb29yKHRoaXMuX3NpbGVuY2VEdXJhdGlvbiAqIHRoaXMuX2ZzKTtcbiAgICB9XG5cbiAgICBsZXQgbWFza2VyX291dHB1dCA9IG5ldyBGbG9hdDMyQXJyYXkobnNhbXBsZXMpO1xuICAgIGlmICh0aGlzLl9oYXNNYXNrZXIpIHtcbiAgICAgIGxldCBlZGdlMSA9IDE7XG4gICAgICBsZXQgZWRnZTIgPSAoMSAtIHh2YWwpKnRoaXMuX2ZyZXE7XG4gICAgICBsZXQgZWRnZTMgPSAoMSArIHh2YWwpKnRoaXMuX2ZyZXE7XG4gICAgICBsZXQgZWRnZTQgPSB0aGlzLl9mcy8yIC0gMTtcbiAgICAgIGxldCBjdXJyYncgPSAoZWRnZTQgLSBlZGdlMykgKyAoZWRnZTIgLSBlZGdlMSk7XG4gICAgICBsZXQgZnVsbF9id19kQiA9IDEwKk1hdGgubG9nMTAodGhpcy5fZnMvMik7XG4gICAgICBsZXQgYndfY29ycl9kQiA9IDEwKk1hdGgubG9nMTAoY3VycmJ3KSAtIGZ1bGxfYndfZEI7XG5cbiAgICAgIGxldCBic19tYXNrZXJfd2luID0gbmV3IEZsb2F0MzJBcnJheShuc2FtcGxlcyk7XG4gICAgICBpZiAoKHRoaXMuX2NocyA9PSBDaGFubmVsT3B0aW9ucy5EaW90aWMpICYmICh0aGlzLl9kaW90aWNNYXNrZXIgIT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgdGhpcy5sb2coXCJGb3VuZCBvbGQgZGlvdGljIG1hc2tlciBoZXJlXCIpO1xuICAgICAgICBic19tYXNrZXJfd2luID0gdGhpcy5fZGlvdGljTWFza2VyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IG1hc2tlciA9IG5ldyBGbG9hdDMyQXJyYXkobnNhbXBsZXNfbWFza2VyKTtcbiAgICAgICAgbGV0IHJuZCA9IHV0aWwuaW5pdFJhbmRuKDAsIDEpOyAvLyBybXMgPSAxXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnNhbXBsZXNfbWFza2VyOyBpKyspIHtcbiAgICAgICAgICBtYXNrZXJbaV0gPSBybmQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBic19tYXNrZXIgPSBuZXcgRmxvYXQzMkFycmF5KG5zYW1wbGVzX21hc2tlcik7XG4gICAgICAgIGlmICh4dmFsID4gMCkge1xuICAgICAgICAgIC8vIGJhbmRzdG9wLWZpbHRlcmluZyB0aGUgbWFza2VyXG4gICAgICAgICAgbGV0IG5fZmZ0ID0gdXRpbC5nZXROZXh0UG93ZXJPZjIobnNhbXBsZXNfbWFza2VyKTtcbiAgICAgICAgICBjb25zb2xlLmxvZygnTkZGVDogJyArIG5fZmZ0KTtcbiAgICAgICAgICBsZXQgbWFza2VyX2ZmdCA9IHV0aWwuZmZ0KG1hc2tlciwgbl9mZnQpO1xuICAgICAgICAgIGxldCBic19tYXNrZXJfbG93X2ZmdCA9IHV0aWwuYm94Y2FyX3NwZWN0cnVtKG1hc2tlcl9mZnQsIGVkZ2UxLCBlZGdlMiwgdGhpcy5fZnMpO1xuICAgICAgICAgIGxldCBic19tYXNrZXJfaGlnaF9mZnQgPSB1dGlsLmJveGNhcl9zcGVjdHJ1bShtYXNrZXJfZmZ0LCBlZGdlMywgZWRnZTQsIHRoaXMuX2ZzKTtcbiAgICAgICAgICBsZXQgYnNfbWFza2VyX2xvd19wYWRkZWQgPSB1dGlsLmlmZnQoYnNfbWFza2VyX2xvd19mZnQsIG5fZmZ0KTtcbiAgICAgICAgICBsZXQgYnNfbWFza2VyX2hpZ2hfcGFkZGVkID0gdXRpbC5pZmZ0KGJzX21hc2tlcl9oaWdoX2ZmdCwgbl9mZnQpO1xuICAgICAgICAgIHZEU1BfdmFkZChpbnRlcm9wLmhhbmRsZW9mKGJzX21hc2tlcl9sb3dfcGFkZGVkKSwgMSwgaW50ZXJvcC5oYW5kbGVvZihic19tYXNrZXJfaGlnaF9wYWRkZWQpLCAxLFxuICAgICAgICAgICAgICAgICAgICBpbnRlcm9wLmhhbmRsZW9mKGJzX21hc2tlciksIDEsIG5zYW1wbGVzX21hc2tlcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnNfbWFza2VyID0gbWFza2VyLnNsaWNlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB3aW5kb3dpbmcgdGhlIG91dHB1dFxuICAgICAgICBpZiAodGhpcy5fd2luZG93KSB7XG4gICAgICAgICAgYnNfbWFza2VyX3dpbiA9IHV0aWwuYXBwbHlXaW5kb3coYnNfbWFza2VyLCB1dGlsLldpbmRvd1R5cGUuUmFpc2VkQ29zaW5lLCAwLjAwOCwgdGhpcy5fZnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJzX21hc2tlcl93aW4gPSBic19tYXNrZXIuc2xpY2UoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9kaW90aWNNYXNrZXIgPSBic19tYXNrZXJfd2luLnNsaWNlKCk7IC8vIHNsaWNlIHJldHVybnMgYSBjb3B5LCBub3QgYSByZWZlcmVuY2VcbiAgICAgICAgdGhpcy5sb2coJ2JzX21hc2tlcl93aW4gYWJzIG1heDogJyArIHV0aWwubWF4KHV0aWwuYWJzKGJzX21hc2tlcl93aW4pKSk7XG4gICAgICAgIHRoaXMubG9nKCdid19jb3JyX2RCIGxldmVsIGRCOiAnICsgYndfY29ycl9kQik7XG4gICAgICAgIHRoaXMubG9nKCdtYXNrZXIgbGV2ZWwgZGI6ICcgKyB0aGlzLl9tYXNrZXJMZXZlbCk7XG4gICAgICB9XG5cbiAgICAgIC8vIGZpbHRlcmluZyAmIHNldHRpbmcgbGV2ZWxcbiAgICAgIGxldCBic19tYXNrZXJfd2luX25vcm07XG4gICAgICBpZiAoZWFyID09PSBcImxlZnRcIikge1xuICAgICAgICBic19tYXNrZXJfd2luX25vcm0gPSB1dGlsLmNhbGZpbHRlcih0aGlzLl9sZWZ0RmlsdGVyLCA2ICsgKHRoaXMuX2xlZnRDYWxMZXZlbCAtIHRoaXMuX3JpZ2h0Q2FsTGV2ZWwpLFxuICAgICAgICAgIHRoaXMuX21hc2tlckxldmVsICsgYndfY29ycl9kQiwgYnNfbWFza2VyX3dpbik7XG4gICAgICB9IGVsc2UgaWYgKGVhciA9PT0gXCJyaWdodFwiKSB7XG4gICAgICAgIGJzX21hc2tlcl93aW5fbm9ybSA9IHV0aWwuY2FsZmlsdGVyKHRoaXMuX3JpZ2h0RmlsdGVyLCA2LFxuICAgICAgICAgIHRoaXMuX21hc2tlckxldmVsICsgYndfY29ycl9kQiwgYnNfbWFza2VyX3dpbik7XG4gICAgICB9XG5cbiAgICAgIG1hc2tlcl9vdXRwdXQuc2V0KGJzX21hc2tlcl93aW5fbm9ybSk7XG4gICAgICB0aGlzLmxvZygnbWFza2VyIGFicyBtYXg6ICcgKyB1dGlsLm1heCh1dGlsLmFicyhtYXNrZXJfb3V0cHV0KSkpO1xuICAgIH1cblxuICAgIGxldCB0YXJnZXRfb3V0cHV0ID0gbmV3IEZsb2F0MzJBcnJheShuc2FtcGxlcyk7XG4gICAgaWYgKHRoaXMuX2hhc1RhcmdldCkge1xuICAgICAgbGV0IHRhcmdldF93aW47XG4gICAgICBpZiAoKHRoaXMuX2NocyA9PSBDaGFubmVsT3B0aW9ucy5EaW90aWMpICYmICh0aGlzLl9kaW90aWNUYXJnZXQgIT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgdGhpcy5sb2coXCJGb3VuZCBkaW90aWMgdGFyZ2V0XCIpO1xuICAgICAgICB0YXJnZXRfd2luID0gdGhpcy5fZGlvdGljVGFyZ2V0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHRhcmdldCA9IG5ldyBGbG9hdDMyQXJyYXkobnNhbXBsZXNfdGFyZ2V0KTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuc2FtcGxlc190YXJnZXQ7IGkrKykge1xuICAgICAgICAgIHRhcmdldFtpXSA9IE1hdGguc2luKCgyKk1hdGguUEkqdGhpcy5fZnJlcSppKS90aGlzLl9mcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3dpbmRvdykge1xuICAgICAgICAgIHRhcmdldF93aW4gPSB1dGlsLmFwcGx5V2luZG93KHRhcmdldCwgdXRpbC5XaW5kb3dUeXBlLlJhaXNlZENvc2luZSwgMC4wMDgsIHRoaXMuX2ZzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0YXJnZXRfd2luID0gdGFyZ2V0LnNsaWNlKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9kaW90aWNUYXJnZXQgPSB0YXJnZXRfd2luLnNsaWNlKCk7XG4gICAgICB9XG5cbiAgICAgIGxldCB0YXJnZXRfbm9ybTtcbiAgICAgIGlmIChlYXIgPT0gXCJsZWZ0XCIpIHtcbiAgICAgICAgdGFyZ2V0X25vcm0gPSB1dGlsLmNhbGZpbHRlcih0aGlzLl9sZWZ0RmlsdGVyLCA2ICsgKHRoaXMuX2xlZnRDYWxMZXZlbCAtIHRoaXMuX3JpZ2h0Q2FsTGV2ZWwpLFxuICAgICAgICAgIHl2YWwsIHRhcmdldF93aW4pO1xuICAgICAgfSBlbHNlIGlmIChlYXIgPT0gXCJyaWdodFwiKSB7XG4gICAgICAgIHRhcmdldF9ub3JtID0gdXRpbC5jYWxmaWx0ZXIodGhpcy5fcmlnaHRGaWx0ZXIsIDYsXG4gICAgICAgICAgeXZhbCwgdGFyZ2V0X3dpbik7XG4gICAgICB9XG4gICAgICB0YXJnZXRfb3V0cHV0LnNldCh0YXJnZXRfbm9ybSk7XG4gICAgfVxuXG4gICAgbGV0IG91dHB1dCA9IG5ldyBGbG9hdDMyQXJyYXkobnNhbXBsZXMpO1xuICAgIHZEU1BfdmFkZChpbnRlcm9wLmhhbmRsZW9mKG1hc2tlcl9vdXRwdXQpLCAxLCBpbnRlcm9wLmhhbmRsZW9mKHRhcmdldF9vdXRwdXQpLCAxLFxuICAgICAgICAgICAgICBpbnRlcm9wLmhhbmRsZW9mKG91dHB1dCksIDEsIG5zYW1wbGVzKTtcblxuICAgIGxldCBtYXh2YWwgPSBuZXcgaW50ZXJvcC5SZWZlcmVuY2U8bnVtYmVyPigpO1xuICAgIHZEU1BfbWF4bWd2KGludGVyb3AuaGFuZGxlb2Yob3V0cHV0KSwgMSwgbWF4dmFsLCBuc2FtcGxlcyk7XG4gICAgdGhpcy5sb2coJ01heCB2YWx1ZSBmb3Igb3V0cHV0OiAnICsgbWF4dmFsLnZhbHVlKTtcblxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cblxuICBwdWJsaWMgYXVkaW9QbGF5ZXJEaWRGaW5pc2hQbGF5aW5nU3VjY2Vzc2Z1bGx5KHBsYXllcj86IGFueSwgZmxhZz86IGJvb2xlYW4pIHtcbiAgICBpZiAoZmxhZyAmJiB0aGlzLl9jb21wbGV0ZUNhbGxiYWNrKSB7XG4gICAgICB0aGlzLl9jb21wbGV0ZUNhbGxiYWNrKHtwbGF5ZXIsIGZsYWd9KTtcbiAgICB9IGVsc2UgaWYgKCFmbGFnICYmIHRoaXMuX2Vycm9yQ2FsbGJhY2spIHtcbiAgICAgIHRoaXMuX2Vycm9yQ2FsbGJhY2soe3BsYXllciwgZmxhZ30pO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBhdWRpb1BsYXllckRlY29kZUVycm9yRGlkT2NjdXJFcnJvcihwbGF5ZXI6IGFueSwgZXJyb3I6IE5TRXJyb3IpIHtcbiAgICBpZiAodGhpcy5fZXJyb3JDYWxsYmFjaykge1xuICAgICAgdGhpcy5fZXJyb3JDYWxsYmFjayh7cGxheWVyLCBlcnJvcn0pO1xuICAgIH1cbiAgfVxuXG59XG4iXX0=