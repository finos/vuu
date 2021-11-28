// intended use is singleton storage atom within a hook, see useViewserver for examples
import { EventEmitter } from './event-emitter';

export class SimpleStore extends EventEmitter {
  #value;
  #status;
  constructor(value = null, status = '') {
    super();
    this.#value = value;
    this.#status = status;
  }
  set value(value) {
    this.#value = value;
    this.#status = 'ready';
    this.emit('loaded', value);
  }
  get value() {
    return this.#value;
  }
  set status(status) {
    this.#status = status;
  }
  get status() {
    return this.#status;
  }
}
