"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var VolumeObserver = /** @class */ (function (_super) {
    __extends(VolumeObserver, _super);
    function VolumeObserver() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    VolumeObserver.prototype.setCallback = function (func) {
        this._callback = func;
    };
    VolumeObserver.prototype.observeValueForKeyPathOfObjectChangeContext = function (keyPath, object, change, context) {
        if (keyPath === "outputVolume") {
            console.log("obj.outputVolume is now: " + object.outputVolume);
            this._callback(object);
        }
    };
    return VolumeObserver;
}(NSObject));
exports.VolumeObserver = VolumeObserver;
