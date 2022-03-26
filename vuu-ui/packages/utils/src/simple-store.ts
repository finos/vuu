// intended use is singleton storage atom within a hook, see useViewserver for examples
import { EventEmitter } from './event-emitter';

export class SimpleStore<T = any> extends EventEmitter {
  private _value: T;
  private _status: string;

  constructor(value: T = null, status = '') {
    super();
    this._value = value;
    this._status = status;
  }

  set value(value: T) {
    this._value = value;
    this._status = 'ready';
    this.emit('loaded', value);
  }

  get value(): T {
    return this._value;
  }

  set status(status: string) {
    this._status = status;
  }

  get status() {
    return this._status;
  }
}
