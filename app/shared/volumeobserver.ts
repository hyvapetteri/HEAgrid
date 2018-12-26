export class VolumeObserver extends NSObject {
  private _callback: (object:any) => void;

  public setCallback(func:(object:any) => void):void {
    this._callback = func;
  }

  observeValueForKeyPathOfObjectChangeContext(keyPath: string, object: any, change: NSDictionary<string, any>, context: interop.Pointer | interop.Reference<any>):void {
    if (keyPath === "outputVolume") {
      console.log("obj.outputVolume is now: " + object.outputVolume);
      this._callback(object);
    }
  }
}
