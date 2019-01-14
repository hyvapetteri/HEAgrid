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
        this._compensate = options.compensate;
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
                var rnd = util.initRandn(0, util.db2a(-24));
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
            if (this._compensate) {
                var bs_masker_win_norm = void 0;
                if (ear === "left") {
                    bs_masker_win_norm = util.calfilter(this._leftFilter, 6 + (this._leftCalLevel - this._rightCalLevel), this._maskerLevel + bw_corr_dB, bs_masker_win);
                }
                else if (ear === "right") {
                    bs_masker_win_norm = util.calfilter(this._rightFilter, 6, this._maskerLevel + bw_corr_dB, bs_masker_win);
                }
                masker_output.set(bs_masker_win_norm);
            }
            else {
                masker_output.set(bs_masker_win);
            }
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
            if (this._compensate) {
                var target_norm = void 0;
                if (ear == "left") {
                    target_norm = util.calfilter(this._leftFilter, 6 + (this._leftCalLevel - this._rightCalLevel), yval, target_win);
                }
                else if (ear == "right") {
                    target_norm = util.calfilter(this._rightFilter, 6, yval, target_win);
                }
                target_output.set(target_norm);
            }
            else {
                masker_output.set(target_win);
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZC1wbGF5ZXItaW9zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ3JpZC1wbGF5ZXItaW9zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseUNBQTJDO0FBQzNDLGlEQUFtRDtBQUNuRCw4Q0FBZ0Q7QUFLaEQsSUFBWSxjQUtYO0FBTEQsV0FBWSxjQUFjO0lBQ3hCLGlFQUFXLENBQUE7SUFDWCxtRUFBWSxDQUFBO0lBQ1osdURBQU0sQ0FBQTtJQUNOLDJEQUFRLENBQUE7QUFDVixDQUFDLEVBTFcsY0FBYyxHQUFkLHNCQUFjLEtBQWQsc0JBQWMsUUFLekI7QUF3QkQ7SUFBZ0MsOEJBQVE7SUFBeEM7O0lBa1pBLENBQUM7SUEzV1EsK0JBQVUsR0FBakIsVUFBa0IsT0FBMEI7UUFBNUMsaUJBaURDO1FBaERDLElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQztRQUVyQyxJQUFJLENBQUMsZUFBZSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7UUFDOUMsSUFBSSxDQUFDLGVBQWUsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDO1FBQzlDLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQztRQUN4QyxJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDMUIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQztRQUN0RCxJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7UUFFbkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztRQUM5QixJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDeEQsSUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMs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QUN0QyxDQUFDO0lBQ0gsQ0FBQztJQUVNLHdEQUFtQyxHQUExQyxVQUEyQyxNQUFXLEVBQUUsS0FBYztRQUNwRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUMsTUFBTSxRQUFBLEVBQUUsS0FBSyxPQUFBLEVBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7SUFDSCxDQUFDO0lBL1lhLHdCQUFhLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0lBaVp4RCxpQkFBQztDQUFBLEFBbFpELENBQWdDLFFBQVEsR0FrWnZDO0FBbFpZLGdDQUFVIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgdXRpbCBmcm9tICcuLi8uLi9zaGFyZWQvdXRpbHMnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvZmlsZS1zeXN0ZW1cIjtcbmltcG9ydCAqIGFzIGVudiBmcm9tIFwiLi4vLi4vY29uZmlnL2Vudmlyb25tZW50XCI7XG5cbmRlY2xhcmUgdmFyIHpvbmVkQ2FsbGJhY2s6IEZ1bmN0aW9uO1xuZGVjbGFyZSB2YXIgQVZBdWRpb1BsYXllcjtcblxuZXhwb3J0IGVudW0gQ2hhbm5lbE9wdGlvbnMge1xuICBNb25vdGljTGVmdCxcbiAgTW9ub3RpY1JpZ2h0LFxuICBEaW90aWMsXG4gIERpY2hvdGljXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR3JpZFBsYXllck9wdGlvbnMge1xuICB0YXJnZXRGcmVxdWVuY3k6IG51bWJlcjtcblxuICBjb21wbGV0ZUNhbGxiYWNrPzogYW55O1xuICBlcnJvckNhbGxiYWNrPzogYW55O1xuICBpbmZvQ2FsbGJhY2s/OiBhbnk7XG5cbiAgY2hhbm5lbE9wdGlvbnM6IENoYW5uZWxPcHRpb25zO1xuXG4gIGxvb3A6IGJvb2xlYW47XG4gIHBhZGRlZFNpbGVuY2VEdXJhdGlvbj86IG51bWJlcjtcbiAgdGFyZ2V0RHVyYXRpb246IG51bWJlcjtcbiAgbWFza2VyRHVyYXRpb246IG51bWJlcjtcbiAgbWFza2VyTGV2ZWw6IG51bWJlcjtcbiAgd2luZG93Pzpib29sZWFuO1xuXG4gIHNldHRpbmdzUGF0aDogc3RyaW5nO1xuXG4gIGRlYnVnPzogYm9vbGVhbjtcbiAgY29tcGVuc2F0ZTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIEdyaWRQbGF5ZXIgZXh0ZW5kcyBOU09iamVjdCB7XG4gIHB1YmxpYyBzdGF0aWMgT2JqQ1Byb3RvY29scyA9IFtBVkF1ZGlvUGxheWVyRGVsZWdhdGVdO1xuXG4gIHByaXZhdGUgX3BsYXllcjogQVZBdWRpb1BsYXllck5vZGU7XG4gIHByaXZhdGUgX2VuZ2luZTogQVZBdWRpb0VuZ2luZTtcbiAgcHJpdmF0ZSBfbWl4ZXI6IEFWQXVkaW9NaXhlck5vZGU7XG4gIHByaXZhdGUgX2NoX2xheW91dDogQVZBdWRpb0NoYW5uZWxMYXlvdXQ7XG4gIHByaXZhdGUgX2F1ZGlvZm9ybWF0OiBBVkF1ZGlvRm9ybWF0O1xuXG4gIHByaXZhdGUgX2NvbXBsZXRlQ2FsbGJhY2s6IChwMTphbnkpID0+IHZvaWQ7XG4gIHByaXZhdGUgX2Vycm9yQ2FsbGJhY2s6IGFueTtcbiAgcHJpdmF0ZSBfaW5mb0NhbGxiYWNrOiBhbnk7XG5cbiAgcHJpdmF0ZSBfZGVidWc6Ym9vbGVhbjtcblxuICBwcml2YXRlIF90YXJnZXREdXJhdGlvbjogbnVtYmVyO1xuICBwcml2YXRlIF9tYXNrZXJEdXJhdGlvbjogbnVtYmVyO1xuICBwcml2YXRlIF9tYXNrZXJMZXZlbDogbnVtYmVyO1xuICBwcml2YXRlIF9mczogbnVtYmVyO1xuICBwcml2YXRlIF9sb29wOiBib29sZWFuO1xuICBwcml2YXRlIF9mcmVxOiBudW1iZXI7XG4gIHByaXZhdGUgX2hhc01hc2tlcjogYm9vbGVhbjtcbiAgcHJpdmF0ZSBfaGFzVGFyZ2V0OiBib29sZWFuO1xuICBwcml2YXRlIF9zaWxlbmNlRHVyYXRpb246IG51bWJlcjtcbiAgcHJpdmF0ZSBfd2luZG93OmJvb2xlYW47XG4gIHByaXZhdGUgX2NoczogQ2hhbm5lbE9wdGlvbnM7XG5cbiAgcHJpdmF0ZSBfZGlvdGljTWFza2VyOiBGbG9hdDMyQXJyYXk7XG4gIHByaXZhdGUgX2Rpb3RpY1RhcmdldDogRmxvYXQzMkFycmF5O1xuXG4gIHByaXZhdGUgX2xlZnRGaWx0ZXI6IEZsb2F0MzJBcnJheTtcbiAgcHJpdmF0ZSBfbGVmdENhbExldmVsOiBudW1iZXI7XG4gIHByaXZhdGUgX3JpZ2h0RmlsdGVyOiBGbG9hdDMyQXJyYXk7XG4gIHByaXZhdGUgX3JpZ2h0Q2FsTGV2ZWw6IG51bWJlcjtcblxuICBwcml2YXRlIF9zdGltYnVmZmVyOiBBVkF1ZGlvUENNQnVmZmVyO1xuXG4gIHByaXZhdGUgX2NvbXBlbnNhdGU6IGJvb2xlYW47XG5cbiAgcHVibGljIGluaXRpYWxpemUob3B0aW9uczogR3JpZFBsYXllck9wdGlvbnMpOlByb21pc2U8YW55PiB7XG4gICAgdGhpcy5fZnJlcSA9IG9wdGlvbnMudGFyZ2V0RnJlcXVlbmN5O1xuXG4gICAgdGhpcy5fdGFyZ2V0RHVyYXRpb24gPSBvcHRpb25zLnRhcmdldER1cmF0aW9uO1xuICAgIHRoaXMuX21hc2tlckR1cmF0aW9uID0gb3B0aW9ucy5tYXNrZXJEdXJhdGlvbjtcbiAgICB0aGlzLl9tYXNrZXJMZXZlbCA9IG9wdGlvbnMubWFza2VyTGV2ZWw7XG4gICAgdGhpcy5fbG9vcCA9IG9wdGlvbnMubG9vcDtcbiAgICB0aGlzLl9zaWxlbmNlRHVyYXRpb24gPSBvcHRpb25zLnBhZGRlZFNpbGVuY2VEdXJhdGlvbjtcbiAgICB0aGlzLl9jaHMgPSBvcHRpb25zLmNoYW5uZWxPcHRpb25zO1xuXG4gICAgdGhpcy5fZGVidWcgPSAhIW9wdGlvbnMuZGVidWc7XG4gICAgdGhpcy5fd2luZG93ID0gISFvcHRpb25zLndpbmRvdyA/IG9wdGlvbnMud2luZG93IDogdHJ1ZTtcbiAgICB0aGlzLl9jb21wZW5zYXRlID0gb3B0aW9ucy5jb21wZW5zYXRlO1xuXG4gICAgdGhpcy5fY29tcGxldGVDYWxsYmFjayA9IG9wdGlvbnMuY29tcGxldGVDYWxsYmFjaztcbiAgICB0aGlzLl9lcnJvckNhbGxiYWNrID0gb3B0aW9ucy5lcnJvckNhbGxiYWNrO1xuICAgIHRoaXMuX2luZm9DYWxsYmFjayA9IG9wdGlvbnMuaW5mb0NhbGxiYWNrO1xuICAgIHRoaXMuX2Rpb3RpY01hc2tlciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9kaW90aWNUYXJnZXQgPSB1bmRlZmluZWQ7XG5cbiAgICB0aGlzLmxvZyhcIlNldHRpbmdzIHBhdGg6IFwiICsgb3B0aW9ucy5zZXR0aW5nc1BhdGgpO1xuICAgIGNvbnN0IGxlZnRGaWx0ZXJGaWxlUGF0aCA9IGZzLnBhdGguam9pbihvcHRpb25zLnNldHRpbmdzUGF0aCwgZW52LmxlZnRGaWx0ZXJGaWxlbmFtZSk7XG4gICAgY29uc3QgbGVmdEZpbHRlckZpbGUgPSBmcy5GaWxlLmZyb21QYXRoKGxlZnRGaWx0ZXJGaWxlUGF0aCk7XG4gICAgY29uc3QgbGVmdEZpbHRlckRhdGEgPSBsZWZ0RmlsdGVyRmlsZS5yZWFkU3luYyhlcnIgPT4ge3RoaXMubG9nKGVycil9KTtcbiAgICBsZXQgdG1wQXJyYXkgPSBuZXcgQXJyYXlCdWZmZXIobGVmdEZpbHRlckRhdGEubGVuZ3RoKTtcbiAgICB0aGlzLmxvZygnVHlwZSBvZiByZWFkU3luYyBvdXRwdXQ6ICcgKyB0eXBlb2YobGVmdEZpbHRlckRhdGEpKTtcbiAgICBsZWZ0RmlsdGVyRGF0YS5nZXRCeXRlcyh0bXBBcnJheSk7XG4gICAgdGhpcy5fbGVmdEZpbHRlciA9IG5ldyBGbG9hdDMyQXJyYXkodG1wQXJyYXkpO1xuXG4gICAgY29uc3QgcmlnaHRGaWx0ZXJGaWxlUGF0aCA9IGZzLnBhdGguam9pbihvcHRpb25zLnNldHRpbmdzUGF0aCwgZW52LnJpZ2h0RmlsdGVyRmlsZW5hbWUpO1xuICAgIGNvbnN0IHJpZ2h0RmlsdGVyRmlsZSA9IGZzLkZpbGUuZnJvbVBhdGgocmlnaHRGaWx0ZXJGaWxlUGF0aCk7XG4gICAgY29uc3QgcmlnaHRGaWx0ZXJEYXRhID0gcmlnaHRGaWx0ZXJGaWxlLnJlYWRTeW5jKGVyciA9PiB7dGhpcy5sb2coZXJyKX0pO1xuICAgIHRtcEFycmF5ID0gbmV3IEFycmF5QnVmZmVyKHJpZ2h0RmlsdGVyRGF0YS5sZW5ndGgpO1xuICAgIHJpZ2h0RmlsdGVyRGF0YS5nZXRCeXRlcyh0bXBBcnJheSk7XG4gICAgdGhpcy5fcmlnaHRGaWx0ZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRtcEFycmF5KTtcblxuICAgIGNvbnN0IGNhbExldmVsRmlsZVBhdGggPSBmcy5wYXRoLmpvaW4ob3B0aW9ucy5zZXR0aW5nc1BhdGgsIGVudi5jYWxMZXZlbHNGaWxlbmFtZSk7XG4gICAgY29uc3QgY2FsTGV2ZWxGaWxlID0gZnMuRmlsZS5mcm9tUGF0aChjYWxMZXZlbEZpbGVQYXRoKTtcbiAgICByZXR1cm4gY2FsTGV2ZWxGaWxlLnJlYWRUZXh0KCkudGhlbigocmVzKSA9PiB7XG4gICAgICB0aGlzLmxvZyhcIkNhbCBsZXZlbCBmaWxlIGNvbnRlbnRzOiBcIiArIHJlcyk7XG4gICAgICBsZXQgdG1wTGV2ZWxzID0gSlNPTi5wYXJzZShyZXMpO1xuICAgICAgdGhpcy5fbGVmdENhbExldmVsID0gdG1wTGV2ZWxzLmxlZnQ7XG4gICAgICB0aGlzLl9yaWdodENhbExldmVsID0gdG1wTGV2ZWxzLnJpZ2h0O1xuICAgICAgdGhpcy5sb2coXCJMZWZ0IGZpbHRlciBsZW5ndGg6IFwiICsgdGhpcy5fbGVmdEZpbHRlci5sZW5ndGggKyBcIiwgMXN0IGNvZWZmOiBcIiArIHRoaXMuX2xlZnRGaWx0ZXJbMF0gKyBcIiwgY2FsIGxldmVsIFwiICsgdGhpcy5fbGVmdENhbExldmVsKTtcbiAgICAgIHRoaXMubG9nKFwiUmlnaHQgZmlsdGVyIGxlbmd0aDogXCIgKyB0aGlzLl9yaWdodEZpbHRlci5sZW5ndGggKyBcIiwgMXN0IGNvZWZmOiBcIiArIHRoaXMuX3JpZ2h0RmlsdGVyWzBdICsgXCIsIGNhbCBsZXZlbCBcIiArIHRoaXMuX3JpZ2h0Q2FsTGV2ZWwpO1xuICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIHRoaXMubG9nKFwiRXJyb3IgcmVhZGluZyBjYWwgbGV2ZWxzOiBcIiArIGVycik7XG4gICAgfSk7XG5cbiAgfVxuXG4gIHByaXZhdGUgbG9nKG1zZzpzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5fZGVidWcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdHcmlkUGxheWVyOiAnICsgbXNnKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZ2V0IHZvbHVtZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9wbGF5ZXIgPyB0aGlzLl9wbGF5ZXIudm9sdW1lIDogLTE7XG4gIH1cblxuICBwdWJsaWMgc2V0IHZvbHVtZSh2b2w6bnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuX3BsYXllciAmJiB2b2wgPj0gMCkge1xuICAgICAgdGhpcy5fcGxheWVyLnZvbHVtZSA9IHZvbDtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgaXNQbGF5aW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9wbGF5ZXIgPyB0aGlzLl9wbGF5ZXIucGxheWluZyA6IGZhbHNlO1xuICB9XG5cbiAgcHVibGljIHBsYXkoKTogUHJvbWlzZTxhbnk+IHtcbiAgICB0aGlzLmxvZygnUGxheSBncmlkJyk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICghdGhpcy5pc1BsYXlpbmcoKSkge1xuICAgICAgICAgIHRoaXMubG9nKCdub3cgcGxheScpO1xuICAgICAgICAgIHRoaXMuX3BsYXllci5wbGF5KCk7XG4gICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHRoaXMubG9nKCdFcnJvciBzY2hlZHVsaW5nIGJ1ZmZlciEnKTtcbiAgICAgICAgdGhpcy5sb2coZXJyKTtcbiAgICAgICAgaWYgKHRoaXMuX2Vycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICB0aGlzLl9lcnJvckNhbGxiYWNrKHsgZXJyIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIHBhdXNlKCk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICh0aGlzLmlzUGxheWluZygpKSB7XG4gICAgICAgICAgdGhpcy5fcGxheWVyLnBhdXNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBpZiAodGhpcy5fZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgIHRoaXMuX2Vycm9yQ2FsbGJhY2soeyBlcnIgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgZGlzcG9zZSgpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLl9wbGF5ZXIuc3RvcCgpO1xuICAgICAgICB0aGlzLl9lbmdpbmUuc3RvcCgpO1xuICAgICAgICB0aGlzLl9lbmdpbmUuZGlzY29ubmVjdE5vZGVJbnB1dCh0aGlzLl9taXhlcik7XG4gICAgICAgIHRoaXMuX2VuZ2luZS5kZXRhY2hOb2RlKHRoaXMuX3BsYXllcilcblxuICAgICAgICB0aGlzLl9wbGF5ZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX2VuZ2luZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBpZiAodGhpcy5fZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgIHRoaXMuX2Vycm9yQ2FsbGJhY2soeyBlcnIgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgcHJlbG9hZFN0aW11bHVzKHh2YWw6bnVtYmVyLCB5dmFsOm51bWJlciwgaGFzVGFyZ2V0OmJvb2xlYW4sIGhhc01hc2tlcjpib29sZWFuKTpQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLl9oYXNUYXJnZXQgPSBoYXNUYXJnZXQ7XG4gICAgICAgIHRoaXMuX2hhc01hc2tlciA9IGhhc01hc2tlcjtcbiAgICAgICAgdGhpcy5fZGlvdGljTWFza2VyID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIGxldCBhdWRpb1Nlc3Npb24gPSBBVkF1ZGlvU2Vzc2lvbi5zaGFyZWRJbnN0YW5jZSgpO1xuICAgICAgICBhdWRpb1Nlc3Npb24uc2V0QWN0aXZlRXJyb3IodHJ1ZSk7XG4gICAgICAgIHRoaXMuX2ZzID0gYXVkaW9TZXNzaW9uLnNhbXBsZVJhdGU7XG4gICAgICAgIHRoaXMubG9nKCdBdWRpb3Nlc3Npb24gZG9uZScpO1xuXG4gICAgICAgIHRoaXMuX2NoX2xheW91dCA9IG5ldyBBVkF1ZGlvQ2hhbm5lbExheW91dCh7bGF5b3V0VGFnOiBrQXVkaW9DaGFubmVsTGF5b3V0VGFnX1N0ZXJlb0hlYWRwaG9uZXN9KTtcbiAgICAgICAgdGhpcy5fYXVkaW9mb3JtYXQgPSBuZXcgQVZBdWRpb0Zvcm1hdCh7XG4gICAgICAgICAgY29tbW9uRm9ybWF0OiBBVkF1ZGlvQ29tbW9uRm9ybWF0LlBDTUZvcm1hdEZsb2F0MzIsXG4gICAgICAgICAgc2FtcGxlUmF0ZTogdGhpcy5fZnMsXG4gICAgICAgICAgaW50ZXJsZWF2ZWQ6IGZhbHNlLFxuICAgICAgICAgIGNoYW5uZWxMYXlvdXQ6IHRoaXMuX2NoX2xheW91dH0pO1xuXG4gICAgICAgIHRoaXMuZmlsbFBDTUJ1ZmZlcih4dmFsLCB5dmFsKTtcbiAgICAgICAgdGhpcy5sb2coJ2J1ZmZlciBjcmVhdGVkJyk7XG5cbiAgICAgICAgaWYgKCF0aGlzLl9lbmdpbmUgfHwgIXRoaXMuX2VuZ2luZS5ydW5uaW5nKSB7XG5cbiAgICAgICAgICB0aGlzLl9lbmdpbmUgPSBuZXcgQVZBdWRpb0VuZ2luZSgpO1xuICAgICAgICAgIHRoaXMubG9nKCdFbmdpbmUgY3JlYXRlZCcpO1xuICAgICAgICAgIHRoaXMuX3BsYXllciA9IG5ldyBBVkF1ZGlvUGxheWVyTm9kZSgpO1xuICAgICAgICAgIHRoaXMuX3BsYXllci52b2x1bWUgPSAwO1xuICAgICAgICAgIHRoaXMuX3BsYXllci5wYW4gPSAwO1xuICAgICAgICAgIHRoaXMubG9nKCdwbGF5ZXIgY3JlYXRlZCcpO1xuICAgICAgICAgIHRoaXMuX2VuZ2luZS5hdHRhY2hOb2RlKHRoaXMuX3BsYXllcik7XG4gICAgICAgICAgdGhpcy5sb2coJ3BsYXllciBhdHRhY2hlZCcpO1xuICAgICAgICAgIHRoaXMuX21peGVyID0gdGhpcy5fZW5naW5lLm1haW5NaXhlck5vZGU7XG4gICAgICAgICAgdGhpcy5fZW5naW5lLmNvbm5lY3RUb0Zvcm1hdCh0aGlzLl9wbGF5ZXIsIHRoaXMuX21peGVyLCB0aGlzLl9hdWRpb2Zvcm1hdCk7XG4gICAgICAgICAgdGhpcy5sb2coJ3BsYXllciBhdHRhY2hlZCB0byBtaXhlcicpO1xuXG4gICAgICAgICAgbGV0IHN1Y2Nlc3MgPSB0aGlzLl9lbmdpbmUuc3RhcnRBbmRSZXR1cm5FcnJvcigpO1xuICAgICAgICAgIHRoaXMubG9nKCdydW5uaW5nLCBlbmdpbmUgc3VjY2VzczogJyArIChzdWNjZXNzID8gJ3llcycgOiAnbm8nKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcGxheWVyLnBhdXNlKCk7XG5cbiAgICAgICAgdGhpcy5fcGxheWVyLnNjaGVkdWxlQnVmZmVyQXRUaW1lT3B0aW9uc0NvbXBsZXRpb25DYWxsYmFja1R5cGVDb21wbGV0aW9uSGFuZGxlcihcbiAgICAgICAgICB0aGlzLl9zdGltYnVmZmVyLFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgdGhpcy5fbG9vcCA/IEFWQXVkaW9QbGF5ZXJOb2RlQnVmZmVyT3B0aW9ucy5Mb29wcyA6IG51bGwsXG4gICAgICAgICAgQVZBdWRpb1BsYXllck5vZGVDb21wbGV0aW9uQ2FsbGJhY2tUeXBlLkRhdGFQbGF5ZWRCYWNrLFxuICAgICAgICAgIChwMTogQVZBdWRpb1BsYXllck5vZGVDb21wbGV0aW9uQ2FsbGJhY2tUeXBlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZyhcIkZpbmlzaGVkIHBsYXlpbmchLlwiKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9jb21wbGV0ZUNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIC8vIHdyYXAgaW4gYSBwcm9taXNlIHRvIGdldCBiYWNrIHRvIHRoZSBtYWluIHRocmVhZFxuICAgICAgICAgICAgICAvLyByZWY6IGh0dHBzOi8vZ2l0aHViLmNvbS9OYXRpdmVTY3JpcHQvTmF0aXZlU2NyaXB0L2lzc3Vlcy8xNjczXG4gICAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4gdGhpcy5fY29tcGxldGVDYWxsYmFjayh7IHAxIH0pKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMubG9nKFwiTm8gY2FsbGJhY2shXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgdGhpcy5sb2coZXJyKTtcbiAgICAgICAgaWYgKHRoaXMuX2Vycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICB0aGlzLl9lcnJvckNhbGxiYWNrKHtlcnJ9KTtcbiAgICAgICAgfVxuICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZmlsbFBDTUJ1ZmZlcih4dmFsOm51bWJlciwgeXZhbDpudW1iZXIpIHtcbiAgICBsZXQgc3RpbSA9IHRoaXMuZ2VuZXJhdGVTdGltdWx1cyh4dmFsLCB5dmFsLCBcImxlZnRcIik7XG4gICAgdGhpcy5sb2coJ2ZpbGxQQ01CdWZmZXI6IFN0aW0gY3JlYXRlZCcpO1xuICAgIC8vIHByZXBhcmUgQVZBdWRpb1BDTUJ1ZmZlclxuXG4gICAgdGhpcy5fc3RpbWJ1ZmZlciA9IEFWQXVkaW9QQ01CdWZmZXIuYWxsb2MoKS5pbml0V2l0aFBDTUZvcm1hdEZyYW1lQ2FwYWNpdHkodGhpcy5fYXVkaW9mb3JtYXQsIHN0aW0ubGVuZ3RoKTtcbiAgICB0aGlzLmxvZygnZmlsbFBDTUJ1ZmZlcjogYnVmZmVyIGluaXRpYWxpemVkLCBsZW5ndGggJyArIHRoaXMuX3N0aW1idWZmZXIuZnJhbWVDYXBhY2l0eSk7XG4gICAgbGV0IGNoX2hhbmRsZSA9IHRoaXMuX3N0aW1idWZmZXIuZmxvYXRDaGFubmVsRGF0YTtcblxuICAgIGlmICh0aGlzLl9jaHMgIT09IENoYW5uZWxPcHRpb25zLk1vbm90aWNSaWdodCkge1xuICAgICAgdGhpcy5sb2coJ2ZpbGxQQ01CdWZmZXI6IHN0YXJ0aW5nIHRvIGZpbGwgYnVmZmVyJyk7XG4gICAgICBsZXQgY2hfZGF0YSA9IGNoX2hhbmRsZVswXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RpbS5sZW5ndGg7IGkrKykge1xuICAgICAgICBjaF9kYXRhW2ldID0gc3RpbVtpXTtcbiAgICAgIH1cbiAgICAgIHRoaXMubG9nKCdmaWxsUENNQnVmZmVyOiBidWZmZXIgZnVsbCcpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fY2hzICE9PSBDaGFubmVsT3B0aW9ucy5Nb25vdGljTGVmdCkge1xuICAgICAgdGhpcy5sb2coJ2ZpbGxQQ01CdWZmZXI6IEZpbGxpbmcgYWxzbyByaWdodCBidWZmZXInKTtcbiAgICAgIGxldCBzdGltX3IgPSB0aGlzLmdlbmVyYXRlU3RpbXVsdXMoeHZhbCwgeXZhbCwgXCJyaWdodFwiKTtcbiAgICAgIGxldCBjaF9kYXRhID0gY2hfaGFuZGxlWzFdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGltLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNoX2RhdGFbaV0gPSBzdGltX3JbaV07XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX3N0aW1idWZmZXIuZnJhbWVMZW5ndGggPSB0aGlzLl9zdGltYnVmZmVyLmZyYW1lQ2FwYWNpdHk7XG5cbiAgICB0aGlzLmxvZygnZmlsbFBDTUJ1ZmZlcjogcmV0dXJuIGJ1ZmZlcicpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZVN0aW11bHVzKHh2YWw6bnVtYmVyLCB5dmFsOm51bWJlciwgZWFyOnN0cmluZyk6RmxvYXQzMkFycmF5IHtcblxuICAgIHRoaXMubG9nKFwiZ2VuZXJhdGVTdGltdWx1czogeHZhbCBcIiArIHh2YWwgKyBcIiwgeXZhbCBcIiArIHl2YWwpO1xuICAgIGxldCBuc2FtcGxlc190YXJnZXQgPSBNYXRoLmZsb29yKHRoaXMuX3RhcmdldER1cmF0aW9uICogdGhpcy5fZnMpO1xuICAgIGxldCBuc2FtcGxlc19tYXNrZXIgPSBNYXRoLmZsb29yKHRoaXMuX21hc2tlckR1cmF0aW9uICogdGhpcy5fZnMpO1xuICAgIGxldCBuc2FtcGxlcyA9IE1hdGgubWF4KG5zYW1wbGVzX3RhcmdldCwgbnNhbXBsZXNfbWFza2VyKTtcbiAgICBpZiAodGhpcy5fc2lsZW5jZUR1cmF0aW9uKSB7XG4gICAgICBuc2FtcGxlcyA9IG5zYW1wbGVzICsgTWF0aC5mbG9vcih0aGlzLl9zaWxlbmNlRHVyYXRpb24gKiB0aGlzLl9mcyk7XG4gICAgfVxuXG4gICAgbGV0IG1hc2tlcl9vdXRwdXQgPSBuZXcgRmxvYXQzMkFycmF5KG5zYW1wbGVzKTtcbiAgICBpZiAodGhpcy5faGFzTWFza2VyKSB7XG4gICAgICBsZXQgZWRnZTEgPSAxO1xuICAgICAgbGV0IGVkZ2UyID0gKDEgLSB4dmFsKSp0aGlzLl9mcmVxO1xuICAgICAgbGV0IGVkZ2UzID0gKDEgKyB4dmFsKSp0aGlzLl9mcmVxO1xuICAgICAgbGV0IGVkZ2U0ID0gdGhpcy5fZnMvMiAtIDE7XG4gICAgICBsZXQgY3VycmJ3ID0gKGVkZ2U0IC0gZWRnZTMpICsgKGVkZ2UyIC0gZWRnZTEpO1xuICAgICAgbGV0IGZ1bGxfYndfZEIgPSAxMCpNYXRoLmxvZzEwKHRoaXMuX2ZzLzIpO1xuICAgICAgbGV0IGJ3X2NvcnJfZEIgPSAxMCpNYXRoLmxvZzEwKGN1cnJidykgLSBmdWxsX2J3X2RCO1xuXG4gICAgICBsZXQgYnNfbWFza2VyX3dpbiA9IG5ldyBGbG9hdDMyQXJyYXkobnNhbXBsZXMpO1xuICAgICAgaWYgKCh0aGlzLl9jaHMgPT0gQ2hhbm5lbE9wdGlvbnMuRGlvdGljKSAmJiAodGhpcy5fZGlvdGljTWFza2VyICE9PSB1bmRlZmluZWQpKSB7XG4gICAgICAgIHRoaXMubG9nKFwiRm91bmQgb2xkIGRpb3RpYyBtYXNrZXIgaGVyZVwiKTtcbiAgICAgICAgYnNfbWFza2VyX3dpbiA9IHRoaXMuX2Rpb3RpY01hc2tlcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBtYXNrZXIgPSBuZXcgRmxvYXQzMkFycmF5KG5zYW1wbGVzX21hc2tlcik7XG4gICAgICAgIGxldCBybmQgPSB1dGlsLmluaXRSYW5kbigwLCB1dGlsLmRiMmEoLTI0KSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnNhbXBsZXNfbWFza2VyOyBpKyspIHtcbiAgICAgICAgICBtYXNrZXJbaV0gPSBybmQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBic19tYXNrZXIgPSBuZXcgRmxvYXQzMkFycmF5KG5zYW1wbGVzX21hc2tlcik7XG4gICAgICAgIGlmICh4dmFsID4gMCkge1xuICAgICAgICAgIC8vIGJhbmRzdG9wLWZpbHRlcmluZyB0aGUgbWFza2VyXG4gICAgICAgICAgbGV0IG5fZmZ0ID0gdXRpbC5nZXROZXh0UG93ZXJPZjIobnNhbXBsZXNfbWFza2VyKTtcbiAgICAgICAgICBjb25zb2xlLmxvZygnTkZGVDogJyArIG5fZmZ0KTtcbiAgICAgICAgICBsZXQgbWFza2VyX2ZmdCA9IHV0aWwuZmZ0KG1hc2tlciwgbl9mZnQpO1xuICAgICAgICAgIGxldCBic19tYXNrZXJfbG93X2ZmdCA9IHV0aWwuYm94Y2FyX3NwZWN0cnVtKG1hc2tlcl9mZnQsIGVkZ2UxLCBlZGdlMiwgdGhpcy5fZnMpO1xuICAgICAgICAgIGxldCBic19tYXNrZXJfaGlnaF9mZnQgPSB1dGlsLmJveGNhcl9zcGVjdHJ1bShtYXNrZXJfZmZ0LCBlZGdlMywgZWRnZTQsIHRoaXMuX2ZzKTtcbiAgICAgICAgICBsZXQgYnNfbWFza2VyX2xvd19wYWRkZWQgPSB1dGlsLmlmZnQoYnNfbWFza2VyX2xvd19mZnQsIG5fZmZ0KTtcbiAgICAgICAgICBsZXQgYnNfbWFza2VyX2hpZ2hfcGFkZGVkID0gdXRpbC5pZmZ0KGJzX21hc2tlcl9oaWdoX2ZmdCwgbl9mZnQpO1xuICAgICAgICAgIHZEU1BfdmFkZChpbnRlcm9wLmhhbmRsZW9mKGJzX21hc2tlcl9sb3dfcGFkZGVkKSwgMSwgaW50ZXJvcC5oYW5kbGVvZihic19tYXNrZXJfaGlnaF9wYWRkZWQpLCAxLFxuICAgICAgICAgICAgICAgICAgICBpbnRlcm9wLmhhbmRsZW9mKGJzX21hc2tlciksIDEsIG5zYW1wbGVzX21hc2tlcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnNfbWFza2VyID0gbWFza2VyLnNsaWNlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB3aW5kb3dpbmcgdGhlIG91dHB1dFxuICAgICAgICBpZiAodGhpcy5fd2luZG93KSB7XG4gICAgICAgICAgYnNfbWFza2VyX3dpbiA9IHV0aWwuYXBwbHlXaW5kb3coYnNfbWFza2VyLCB1dGlsLldpbmRvd1R5cGUuUmFpc2VkQ29zaW5lLCAwLjAwOCwgdGhpcy5fZnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJzX21hc2tlcl93aW4gPSBic19tYXNrZXIuc2xpY2UoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9kaW90aWNNYXNrZXIgPSBic19tYXNrZXJfd2luLnNsaWNlKCk7IC8vIHNsaWNlIHJldHVybnMgYSBjb3B5LCBub3QgYSByZWZlcmVuY2VcbiAgICAgICAgdGhpcy5sb2coJ2JzX21hc2tlcl93aW4gYWJzIG1heDogJyArIHV0aWwubWF4KHV0aWwuYWJzKGJzX21hc2tlcl93aW4pKSk7XG4gICAgICAgIHRoaXMubG9nKCdid19jb3JyX2RCIGxldmVsIGRCOiAnICsgYndfY29ycl9kQik7XG4gICAgICAgIHRoaXMubG9nKCdtYXNrZXIgbGV2ZWwgZGI6ICcgKyB0aGlzLl9tYXNrZXJMZXZlbCk7XG4gICAgICB9XG5cbiAgICAgIC8vIGZpbHRlcmluZyAmIHNldHRpbmcgbGV2ZWxcbiAgICAgIGlmICh0aGlzLl9jb21wZW5zYXRlKSB7XG4gICAgICAgIGxldCBic19tYXNrZXJfd2luX25vcm07XG4gICAgICAgIGlmIChlYXIgPT09IFwibGVmdFwiKSB7XG4gICAgICAgICAgYnNfbWFza2VyX3dpbl9ub3JtID0gdXRpbC5jYWxmaWx0ZXIodGhpcy5fbGVmdEZpbHRlciwgNiArICh0aGlzLl9sZWZ0Q2FsTGV2ZWwgLSB0aGlzLl9yaWdodENhbExldmVsKSxcbiAgICAgICAgICAgIHRoaXMuX21hc2tlckxldmVsICsgYndfY29ycl9kQiwgYnNfbWFza2VyX3dpbik7XG4gICAgICAgIH0gZWxzZSBpZiAoZWFyID09PSBcInJpZ2h0XCIpIHtcbiAgICAgICAgICBic19tYXNrZXJfd2luX25vcm0gPSB1dGlsLmNhbGZpbHRlcih0aGlzLl9yaWdodEZpbHRlciwgNixcbiAgICAgICAgICAgIHRoaXMuX21hc2tlckxldmVsICsgYndfY29ycl9kQiwgYnNfbWFza2VyX3dpbik7XG4gICAgICAgIH1cblxuICAgICAgICBtYXNrZXJfb3V0cHV0LnNldChic19tYXNrZXJfd2luX25vcm0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWFza2VyX291dHB1dC5zZXQoYnNfbWFza2VyX3dpbik7XG4gICAgICB9XG4gICAgICB0aGlzLmxvZygnbWFza2VyIGFicyBtYXg6ICcgKyB1dGlsLm1heCh1dGlsLmFicyhtYXNrZXJfb3V0cHV0KSkpO1xuICAgIH1cblxuICAgIGxldCB0YXJnZXRfb3V0cHV0ID0gbmV3IEZsb2F0MzJBcnJheShuc2FtcGxlcyk7XG4gICAgaWYgKHRoaXMuX2hhc1RhcmdldCkge1xuICAgICAgbGV0IHRhcmdldF93aW47XG4gICAgICBpZiAoKHRoaXMuX2NocyA9PSBDaGFubmVsT3B0aW9ucy5EaW90aWMpICYmICh0aGlzLl9kaW90aWNUYXJnZXQgIT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgdGhpcy5sb2coXCJGb3VuZCBkaW90aWMgdGFyZ2V0XCIpO1xuICAgICAgICB0YXJnZXRfd2luID0gdGhpcy5fZGlvdGljVGFyZ2V0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHRhcmdldCA9IG5ldyBGbG9hdDMyQXJyYXkobnNhbXBsZXNfdGFyZ2V0KTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuc2FtcGxlc190YXJnZXQ7IGkrKykge1xuICAgICAgICAgIHRhcmdldFtpXSA9IE1hdGguc2luKCgyKk1hdGguUEkqdGhpcy5fZnJlcSppKS90aGlzLl9mcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3dpbmRvdykge1xuICAgICAgICAgIHRhcmdldF93aW4gPSB1dGlsLmFwcGx5V2luZG93KHRhcmdldCwgdXRpbC5XaW5kb3dUeXBlLlJhaXNlZENvc2luZSwgMC4wMDgsIHRoaXMuX2ZzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0YXJnZXRfd2luID0gdGFyZ2V0LnNsaWNlKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9kaW90aWNUYXJnZXQgPSB0YXJnZXRfd2luLnNsaWNlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9jb21wZW5zYXRlKSB7XG4gICAgICAgIGxldCB0YXJnZXRfbm9ybTtcbiAgICAgICAgaWYgKGVhciA9PSBcImxlZnRcIikge1xuICAgICAgICAgIHRhcmdldF9ub3JtID0gdXRpbC5jYWxmaWx0ZXIodGhpcy5fbGVmdEZpbHRlciwgNiArICh0aGlzLl9sZWZ0Q2FsTGV2ZWwgLSB0aGlzLl9yaWdodENhbExldmVsKSxcbiAgICAgICAgICAgIHl2YWwsIHRhcmdldF93aW4pO1xuICAgICAgICB9IGVsc2UgaWYgKGVhciA9PSBcInJpZ2h0XCIpIHtcbiAgICAgICAgICB0YXJnZXRfbm9ybSA9IHV0aWwuY2FsZmlsdGVyKHRoaXMuX3JpZ2h0RmlsdGVyLCA2LFxuICAgICAgICAgICAgeXZhbCwgdGFyZ2V0X3dpbik7XG4gICAgICAgIH1cbiAgICAgICAgdGFyZ2V0X291dHB1dC5zZXQodGFyZ2V0X25vcm0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWFza2VyX291dHB1dC5zZXQodGFyZ2V0X3dpbik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IG91dHB1dCA9IG5ldyBGbG9hdDMyQXJyYXkobnNhbXBsZXMpO1xuICAgIHZEU1BfdmFkZChpbnRlcm9wLmhhbmRsZW9mKG1hc2tlcl9vdXRwdXQpLCAxLCBpbnRlcm9wLmhhbmRsZW9mKHRhcmdldF9vdXRwdXQpLCAxLFxuICAgICAgICAgICAgICBpbnRlcm9wLmhhbmRsZW9mKG91dHB1dCksIDEsIG5zYW1wbGVzKTtcblxuICAgIGxldCBtYXh2YWwgPSBuZXcgaW50ZXJvcC5SZWZlcmVuY2U8bnVtYmVyPigpO1xuICAgIHZEU1BfbWF4bWd2KGludGVyb3AuaGFuZGxlb2Yob3V0cHV0KSwgMSwgbWF4dmFsLCBuc2FtcGxlcyk7XG4gICAgdGhpcy5sb2coJ01heCB2YWx1ZSBmb3Igb3V0cHV0OiAnICsgbWF4dmFsLnZhbHVlKTtcblxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cblxuICBwdWJsaWMgYXVkaW9QbGF5ZXJEaWRGaW5pc2hQbGF5aW5nU3VjY2Vzc2Z1bGx5KHBsYXllcj86IGFueSwgZmxhZz86IGJvb2xlYW4pIHtcbiAgICBpZiAoZmxhZyAmJiB0aGlzLl9jb21wbGV0ZUNhbGxiYWNrKSB7XG4gICAgICB0aGlzLl9jb21wbGV0ZUNhbGxiYWNrKHtwbGF5ZXIsIGZsYWd9KTtcbiAgICB9IGVsc2UgaWYgKCFmbGFnICYmIHRoaXMuX2Vycm9yQ2FsbGJhY2spIHtcbiAgICAgIHRoaXMuX2Vycm9yQ2FsbGJhY2soe3BsYXllciwgZmxhZ30pO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBhdWRpb1BsYXllckRlY29kZUVycm9yRGlkT2NjdXJFcnJvcihwbGF5ZXI6IGFueSwgZXJyb3I6IE5TRXJyb3IpIHtcbiAgICBpZiAodGhpcy5fZXJyb3JDYWxsYmFjaykge1xuICAgICAgdGhpcy5fZXJyb3JDYWxsYmFjayh7cGxheWVyLCBlcnJvcn0pO1xuICAgIH1cbiAgfVxuXG59XG4iXX0=