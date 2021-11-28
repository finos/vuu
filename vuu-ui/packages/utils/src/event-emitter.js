export class EventEmitter {
  constructor() {
    this._events = {};
  }

  addListener(type, listener) {
    if (!this._events) {
      this._events = {};
    }

    if (!this._events[type]) {
      this._events[type] = listener;
    } else if (Array.isArray(this._events[type])) {
      this._events[type].push(listener);
    } else {
      this._events[type] = [this._events[type], listener];
    }
  }

  removeListener(type, listener) {
    let list, position, length, i;

    if (!this._events || !this._events[type]) {
      return;
    }

    list = this._events[type];
    length = list.length;
    position = -1;

    if (list === listener) {
      delete this._events[type];
    } else if (Array.isArray(list)) {
      for (i = length; i-- > 0; ) {
        if (list[i] === listener) {
          position = i;
          break;
        }
      }

      if (position < 0) {
        return;
      }

      if (list.length === 1) {
        list.length = 0;
        delete this._events[type];
      } else {
        list.splice(position, 1);
      }
    }
  }

  removeAllListeners(type) {
    if (!this._events) {
      return;
    } else if (type === undefined) {
      delete this._events;
    } else {
      delete this._events[type];
    }
  }

  emit(type, ...args) {
    if (this._events) {
      const handler = this._events[type];
      if (handler) {
        invokeHandler(handler, type, args);
      }
      const wildcardHandler = this._events['*'];
      if (wildcardHandler) {
        invokeHandler(wildcardHandler, type, args);
      }
    }
  }

  once(type, listener) {
    const handler = (evtName, message) => {
      this.removeListener(evtName, handler);
      listener(evtName, message);
    };

    this.on(type, handler);
  }

  on(type, listener) {
    return this.addListener(type, listener);
  }
}

function invokeHandler(handler, type, args) {
  if (Array.isArray(handler)) {
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
