export interface Event {}

export type EventListener = (evtName: string, ...args: any[]) => void;

export type EventListenerMap = {
  [eventName: string]: EventListener[] | EventListener;
};

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

export interface IEventEmitter {
  emit: (type: string, ...args: unknown[]) => void;
}

export class EventEmitter implements IEventEmitter {
  private _events?: EventListenerMap;

  constructor() {
    this._events = {};
  }

  addListener(type: string, listener: EventListener) {
    if (!this._events) {
      this._events = {};
    }

    const listeners = this._events[type];

    if (!listeners) {
      this._events[type] = listener;
    } else if (isArrayOfListeners(listeners)) {
      listeners.push(listener);
    } else if (isOnlyListener(listeners)) {
      this._events[type] = [listeners, listener];
    }
  }

  removeListener(type: string, listener: EventListener) {
    if (!this._events || !this._events[type]) {
      return;
    }

    const listenerOrListeners = this._events[type];
    let position = -1;

    if (listenerOrListeners === listener) {
      delete this._events[type];
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
        delete this._events[type];
      } else {
        listenerOrListeners.splice(position, 1);
      }
    }
  }

  removeAllListeners(type: string) {
    if (!this._events) {
      return;
    } else if (type === undefined) {
      delete this._events;
    } else {
      delete this._events[type];
    }
  }

  emit(type: string, ...args: unknown[]) {
    if (this._events) {
      const handler = this._events[type];
      if (handler) {
        invokeHandler(handler, type, args);
      }
      const wildcardHandler = this._events["*"];
      if (wildcardHandler) {
        invokeHandler(wildcardHandler, type, args);
      }
    }
  }

  once(type: string, listener: EventListener) {
    const handler = (evtName: string, message: unknown) => {
      this.removeListener(evtName, handler);
      listener(evtName, message);
    };

    this.on(type, handler);
  }

  on(type: string, listener: EventListener) {
    return this.addListener(type, listener);
  }
}

function invokeHandler(
  handler: EventListener | EventListener[],
  type: string,
  args: unknown[]
) {
  if (isArrayOfListeners(handler)) {
    handler.slice().forEach((listener) => invokeHandler(listener, type, args));
  } else {
    switch (args.length) {
      case 0:
        handler(type);
        break;
      case 1:
        handler(type, args[0]);
        break;
      case 2:
        handler(type, args[0], args[1]);
        break;
      // slower
      default:
        handler.call(null, type, ...args);
    }
  }
}
