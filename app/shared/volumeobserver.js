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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidm9sdW1lb2JzZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ2b2x1bWVvYnNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBO0lBQW9DLGtDQUFRO0lBQTVDOztJQWFBLENBQUM7SUFWUSxvQ0FBVyxHQUFsQixVQUFtQixJQUF5QjtRQUMxQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztJQUN4QixDQUFDO0lBRUQsb0VBQTJDLEdBQTNDLFVBQTRDLE9BQWUsRUFBRSxNQUFXLEVBQUUsTUFBaUMsRUFBRSxPQUFpRDtRQUM1SixFQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUssY0FBYyxDQUFDLENBQUMsQ0FBQztZQUMvQixPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMvRCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3pCLENBQUM7SUFDSCxDQUFDO0lBQ0gscUJBQUM7QUFBRCxDQUFDLEFBYkQsQ0FBb0MsUUFBUSxHQWEzQztBQWJZLHdDQUFjIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIFZvbHVtZU9ic2VydmVyIGV4dGVuZHMgTlNPYmplY3Qge1xuICBwcml2YXRlIF9jYWxsYmFjazogKG9iamVjdDphbnkpID0+IHZvaWQ7XG5cbiAgcHVibGljIHNldENhbGxiYWNrKGZ1bmM6KG9iamVjdDphbnkpID0+IHZvaWQpOnZvaWQge1xuICAgIHRoaXMuX2NhbGxiYWNrID0gZnVuYztcbiAgfVxuXG4gIG9ic2VydmVWYWx1ZUZvcktleVBhdGhPZk9iamVjdENoYW5nZUNvbnRleHQoa2V5UGF0aDogc3RyaW5nLCBvYmplY3Q6IGFueSwgY2hhbmdlOiBOU0RpY3Rpb25hcnk8c3RyaW5nLCBhbnk+LCBjb250ZXh0OiBpbnRlcm9wLlBvaW50ZXIgfCBpbnRlcm9wLlJlZmVyZW5jZTxhbnk+KTp2b2lkIHtcbiAgICBpZiAoa2V5UGF0aCA9PT0gXCJvdXRwdXRWb2x1bWVcIikge1xuICAgICAgY29uc29sZS5sb2coXCJvYmoub3V0cHV0Vm9sdW1lIGlzIG5vdzogXCIgKyBvYmplY3Qub3V0cHV0Vm9sdW1lKTtcbiAgICAgIHRoaXMuX2NhbGxiYWNrKG9iamVjdCk7XG4gICAgfVxuICB9XG59XG4iXX0=