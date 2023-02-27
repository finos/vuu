type Listener = (...args: any[]) => void;
export type EmittedEvents = Record<string, Listener>;

function isArrayOfListeners(
  listeners: EventListener | EventListener[]
): listeners is EventListener[] {
  return Array.isArray(listeners);
}

function isOnlyListener(
  listeners: EventListener | EventListener[]
): listeners is EventListener {
  return !Array.isArray(listeners);
}

export class EventEmitter<Events extends EmittedEvents> {
  #events: Map<keyof Events, Listener | Listener[]> = new Map();

  addListener<E extends keyof Events>(event: E, listener: Events[E]) {
    const listeners = this.#events.get(event);

    if (!listeners) {
      this.#events.set(event, listener);
    } else if (isArrayOfListeners(listeners)) {
      listeners.push(listener);
    } else if (isOnlyListener(listeners)) {
      this.#events.set(event, [listeners, listener]);
    }
  }

  removeListener<E extends keyof Events>(event: E, listener: Events[E]) {
    if (!this.#events.has(event)) {
      return;
    }

    const listenerOrListeners = this.#events.get(event);
    let position = -1;

    if (listenerOrListeners === listener) {
      this.#events.delete(event);
    } else if (Array.isArray(listenerOrListeners)) {
      for (let i = length; i-- > 0; ) {
        if (listenerOrListeners[i] === listener) {
          position = i;
          break;
        }
      }

      if (position < 0) {
        return;
      }

      if (listenerOrListeners.length === 1) {
        listenerOrListeners.length = 0;
        this.#events.delete(event);
      } else {
        listenerOrListeners.splice(position, 1);
      }
    }
  }

  removeAllListeners<E extends keyof Events>(event?: E) {
    if (event && this.#events.has(event)) {
      this.#events.delete(event);
    } else if (event === undefined) {
      this.#events.clear();
    }
  }

  emit<E extends keyof Events>(event: E, ...args: Parameters<Events[E]>) {
    if (this.#events) {
      const handler = this.#events.get(event);
      if (handler) {
        this.invokeHandler(handler, args);
      }
    }
  }

  once<E extends keyof Events>(event: E, listener: Events[E]) {
    const handler = ((...args) => {
      this.removeListener(event, handler);
      listener(...args);
    }) as Events[E];

    this.on(event, handler);
  }

  on<E extends keyof Events>(event: E, listener: Events[E]) {
    this.addListener(event, listener);
  }

  private invokeHandler(handler: Listener | Array<Listener>, args: unknown[]) {
    if (isArrayOfListeners(handler)) {
      handler.slice().forEach((listener) => this.invokeHandler(listener, args));
    } else {
      switch (args.length) {
        case 0:
          handler();
          break;
        case 1:
          handler(args[0]);
          break;
        case 2:
          handler(args[0], args[1]);
          break;
        // slower
        default:
          handler.call(null, ...args);
      }
    }
  }
}
