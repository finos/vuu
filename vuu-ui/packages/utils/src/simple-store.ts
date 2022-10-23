// intended use is singleton storage atom within a hook, see useViewserver for examples
import { EventEmitter } from "./event-emitter";

type StoreStatus = "" | "ready" | "loaded" | "loading";

export class SimpleStore<T = unknown> extends EventEmitter {
  private _value: T;
  private _status: StoreStatus = "";

  constructor(value: T, status: StoreStatus = "") {
    super();
    this._value = value;
    this._status = status;
  }

  set value(value: T) {
    this._value = value;
    this._status = "ready";
    this.emit("loaded", value);
  }

  get value(): T {
    return this._value;
  }

  set status(status: StoreStatus) {
    this._status = status;
  }

  get status() {
    return this._status;
  }
}
