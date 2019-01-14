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
