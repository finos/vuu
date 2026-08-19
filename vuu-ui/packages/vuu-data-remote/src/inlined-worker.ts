export const workerSourceCode = `
var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);

// ../vuu-utils/src/array-utils.ts
function partition(array, test, pass = [], fail = []) {
  for (let i = 0, len = array.length; i < len; i++) {
    (test(array[i], i) ? pass : fail).push(array[i]);
  }
  return [pass, fail];
}

// ../vuu-utils/src/cookie-utils.ts
var getCookieValue = (name) => {
  var _a, _b;
  if (((_a = globalThis.document) == null ? void 0 : _a.cookie) !== void 0) {
    return (_b = globalThis.document.cookie.split("; ").find((row) => row.startsWith(\`\${name}=\`))) == null ? void 0 : _b.split("=")[1];
  }
};

// ../vuu-utils/src/event-emitter.ts
function isArrayOfListeners(listeners) {
  return Array.isArray(listeners);
}
function isOnlyListener(listeners) {
  return !Array.isArray(listeners);
}
var _events;
var EventEmitter = class {
  constructor() {
    __privateAdd(this, _events, /* @__PURE__ */ new Map());
  }
  addListener(event, listener) {
    const listeners = __privateGet(this, _events).get(event);
    if (!listeners) {
      __privateGet(this, _events).set(event, listener);
    } else if (isArrayOfListeners(listeners)) {
      listeners.push(listener);
    } else if (isOnlyListener(listeners)) {
      __privateGet(this, _events).set(event, [listeners, listener]);
    }
  }
  removeListener(event, listener) {
    if (!__privateGet(this, _events).has(event)) {
      return;
    }
    const listenerOrListeners = __privateGet(this, _events).get(event);
    let position = -1;
    if (listenerOrListeners === listener) {
      __privateGet(this, _events).delete(event);
    } else if (Array.isArray(listenerOrListeners)) {
      for (let i = listenerOrListeners.length; i-- > 0; ) {
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
        __privateGet(this, _events).delete(event);
      } else {
        listenerOrListeners.splice(position, 1);
      }
    }
  }
  removeAllListeners(event) {
    if (event && __privateGet(this, _events).has(event)) {
      __privateGet(this, _events).delete(event);
    } else if (event === void 0) {
      __privateGet(this, _events).clear();
    }
  }
  emit(event, ...args) {
    if (__privateGet(this, _events)) {
      const handler = __privateGet(this, _events).get(event);
      if (handler) {
        this.invokeHandler(handler, args);
      }
    }
  }
  once(event, listener) {
    const handler = ((...args) => {
      this.removeListener(event, handler);
      listener(...args);
    });
    this.on(event, handler);
  }
  on(event, listener) {
    this.addListener(event, listener);
  }
  hasListener(event, listener) {
    const listeners = __privateGet(this, _events).get(event);
    if (Array.isArray(listeners)) {
      return listeners.includes(listener);
    } else {
      return listeners === listener;
    }
  }
  invokeHandler(handler, args) {
    if (isArrayOfListeners(handler)) {
      handler.slice().forEach((listener) => {
        this.invokeHandler(listener, args);
      });
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
};
_events = new WeakMap();

// ../vuu-utils/src/datasource/datasource-utils.ts
var isConnectionQualityMetrics = (msg) => msg.type === "connection-metrics";
var isVisualLinkMessage = (msg) => msg.type.endsWith("_VISUAL_LINK");
var isViewportMessage = (msg) => "viewport" in msg;

// ../vuu-utils/src/range-utils.ts
var _baseFrom, _renderBufferSize, _baseTo;
var _RangeImpl = class _RangeImpl {
  // We have to keep from and to as simple public properties (not getters) so they survive structuredClone
  constructor(from, to, renderBufferSize = 0) {
    this.from = from;
    this.to = to;
    __privateAdd(this, _baseFrom);
    __privateAdd(this, _renderBufferSize, 0);
    __privateAdd(this, _baseTo);
    __privateSet(this, _baseFrom, from);
    __privateSet(this, _baseTo, to);
    __privateSet(this, _renderBufferSize, renderBufferSize);
  }
  get reset() {
    return new _RangeImpl(
      0,
      __privateGet(this, _baseTo) - __privateGet(this, _baseFrom),
      __privateGet(this, _renderBufferSize)
    );
  }
  get withBuffer() {
    return getFullRange(this, __privateGet(this, _renderBufferSize));
  }
  equals(range) {
    return range.from === __privateGet(this, _baseFrom) && range.to === __privateGet(this, _baseTo);
  }
  toJson() {
    return {
      from: this.from,
      to: this.to,
      baseFrom: __privateGet(this, _baseFrom),
      baseTo: __privateGet(this, _baseTo),
      renderBufferSize: __privateGet(this, _renderBufferSize)
    };
  }
};
_baseFrom = new WeakMap();
_renderBufferSize = new WeakMap();
_baseTo = new WeakMap();
var RangeImpl = _RangeImpl;
var Range = (from, to, renderBufferSize) => new RangeImpl(from, to, renderBufferSize);
var NULL_RANGE = Range(0, 0);
function getFullRange({ from, to }, bufferSize = 0, maxRangeEnd = Number.MAX_SAFE_INTEGER) {
  if (from === 0 && to === 0) {
    return { from, to };
  } else if (bufferSize === 0) {
    if (maxRangeEnd < from) {
      return { from: 0, to: 0 };
    } else {
      return { from, to: Math.min(to, maxRangeEnd) };
    }
  } else if (from === 0) {
    return { from, to: Math.min(to + bufferSize, maxRangeEnd) };
  } else {
    const shortfallBefore = from - bufferSize < 0;
    const shortfallAfter = maxRangeEnd - (to + bufferSize) < 0;
    if (shortfallBefore && shortfallAfter) {
      return { from: 0, to: maxRangeEnd };
    } else if (shortfallBefore) {
      return { from: 0, to: to + bufferSize };
    } else if (shortfallAfter) {
      return {
        from: Math.max(0, from - bufferSize),
        to: maxRangeEnd
      };
    } else {
      return { from: from - bufferSize, to: to + bufferSize };
    }
  }
}
var withinRange = (value, { from, to }) => value >= from && value < to;
var WindowRange = class _WindowRange {
  constructor(from, to) {
    __publicField(this, "from");
    __publicField(this, "to");
    this.from = from;
    this.to = to;
  }
  isWithin(index) {
    return withinRange(index, this);
  }
  //find the overlap of this range and a new one
  overlap(from, to) {
    return from >= this.to || to < this.from ? [0, 0] : [Math.max(from, this.from), Math.min(to, this.to)];
  }
  copy() {
    return new _WindowRange(this.from, this.to);
  }
};

// ../vuu-utils/src/logging-utils.ts
var logLevels = ["error", "warn", "info", "debug"];
var isValidLogLevel = (value) => typeof value === "string" && logLevels.includes(value);
var DEFAULT_LOG_LEVEL = "error";
var NO_OP = () => void 0;
var DEFAULT_DEBUG_LEVEL = false ? "error" : "info";
var { loggingLevel = DEFAULT_DEBUG_LEVEL } = getLoggingSettings();
var logger = (category) => {
  const debugEnabled5 = loggingLevel === "debug";
  const infoEnabled4 = debugEnabled5 || loggingLevel === "info";
  const warnEnabled = infoEnabled4 || loggingLevel === "warn";
  const errorEnabled = warnEnabled || loggingLevel === "error";
  const info5 = infoEnabled4 ? (message) => console.info(\`\${Date.now()} [\${category}] \${message}\`) : NO_OP;
  const warn3 = warnEnabled ? (message) => console.warn(\`[\${category}] \${message}\`) : NO_OP;
  const debug5 = debugEnabled5 ? (message) => console.debug(\`\${Date.now()} [\${category}] \${message}\`) : NO_OP;
  const error3 = errorEnabled ? (message) => console.error(\`[\${category}] \${message}\`) : NO_OP;
  if (false) {
    return {
      errorEnabled,
      error: error3
    };
  } else {
    return {
      debugEnabled: debugEnabled5,
      infoEnabled: infoEnabled4,
      warnEnabled,
      errorEnabled,
      info: info5,
      warn: warn3,
      debug: debug5,
      error: error3
    };
  }
};
function getLoggingSettings() {
  if (typeof loggingSettings !== "undefined") {
    return loggingSettings;
  } else {
    return {
      loggingLevel: getLoggingLevelFromCookie()
    };
  }
}
function getLoggingLevelFromCookie() {
  const value = getCookieValue("vuu-logging-level");
  if (isValidLogLevel(value)) {
    return value;
  } else {
    return DEFAULT_LOG_LEVEL;
  }
}

// ../vuu-utils/src/debug-utils.ts
var { debug, debugEnabled } = logger("range-monitor");
var RangeMonitor = class {
  constructor(source) {
    this.source = source;
    __publicField(this, "range", { from: 0, to: 0 });
    __publicField(this, "timestamp", 0);
  }
  isSet() {
    return this.timestamp !== 0;
  }
  set({ from, to }) {
    const { timestamp } = this;
    this.range.from = from;
    this.range.to = to;
    this.timestamp = performance.now();
    if (timestamp) {
      debugEnabled && debug(
        \`<\${this.source}> [\${from}-\${to}], \${(this.timestamp - timestamp).toFixed(0)} ms elapsed\`
      );
    } else {
      return 0;
    }
  }
};

// ../vuu-utils/src/protocol-message-utils.ts
var MENU_RPC_TYPES = [
  "VIEW_PORT_MENUS_SELECT_RPC",
  "VIEW_PORT_MENU_TABLE_RPC",
  "VIEW_PORT_MENU_ROW_RPC",
  "VIEW_PORT_MENU_CELL_RPC"
];
var INVALID_SESSION = "Invalid session";
var SESSION_LIMIT_EXCEEDED = "User session limit exceeded";
var INVALID_TOKEN = "Invalid token";
var TOKEN_EXPIRED = "Token has expired";
var InvalidLoginMessages = [
  INVALID_SESSION,
  SESSION_LIMIT_EXCEEDED,
  INVALID_TOKEN,
  TOKEN_EXPIRED
];
var isErrorMessage = (message) => typeof message == "object" && (message == null ? void 0 : message.type) === "ERROR";
var isLoginErrorMessage = (message) => typeof message === "string" && InvalidLoginMessages.includes(message);
var isSelectRequest = (message) => message && typeof message === "object" && "type" in message && (message.type === "SELECT_ROW" || message.type === "DESELECT_ROW" || message.type === "SELECT_ROW_RANGE" || message.type === "SELECT_ALL" || message.type === "DESELECT_ALL");
var isRpcServiceRequest = (message) => message.type === "RPC_REQUEST";
var hasViewPortContext = (message) => message.context.type === "VIEWPORT_CONTEXT";
var isVuuMenuRpcRequest = (message) => MENU_RPC_TYPES.includes(message["type"]);
var isOpenDialogAction = (action) => action !== void 0 && action.type === "OPEN_DIALOG_ACTION";
var isCreateVpSuccess = (response) => response.type === "CREATE_VP_SUCCESS";
var isSessionTable = (table) => {
  if (table !== null && typeof table === "object" && "table" in table && "module" in table) {
    return table.table.startsWith("session");
  }
  return false;
};
function isActionMessage(rpcResponse) {
  return rpcResponse.type === "VIEW_PORT_MENU_RESP";
}
function isSessionTableActionMessage(rpcResponse) {
  var _a, _b;
  return isActionMessage(rpcResponse) && isOpenDialogAction(rpcResponse.action) && isSessionTable(rpcResponse.action.table) && (((_a = rpcResponse.action) == null ? void 0 : _a.renderComponent) === "inline-form" || ((_b = rpcResponse.action) == null ? void 0 : _b.renderComponent) === "grid");
}

// ../vuu-utils/src/keyset.ts
var EMPTY = [];
var KeySet = class {
  constructor(range) {
    __publicField(this, "keys", /* @__PURE__ */ new Map());
    __publicField(this, "nextKeyValue", 0);
    __publicField(this, "range");
    this.range = range;
    this.init(range);
  }
  next(free = EMPTY) {
    if (free.length > 0) {
      return free.shift();
    } else {
      return this.nextKeyValue++;
    }
  }
  init({ from, to }) {
    this.keys.clear();
    this.nextKeyValue = 0;
    for (let rowIndex = from; rowIndex < to; rowIndex++) {
      const nextKeyValue = this.next();
      this.keys.set(rowIndex, nextKeyValue);
    }
    return true;
  }
  reset(range) {
    const { from, to } = range;
    const newSize = to - from;
    const currentSize = this.range.to - this.range.from;
    this.range = range;
    if (currentSize > newSize) {
      return this.init(range);
    }
    const freeKeys = [];
    this.keys.forEach((keyValue, rowIndex) => {
      if (rowIndex < from || rowIndex >= to) {
        freeKeys.push(keyValue);
        this.keys.delete(rowIndex);
      }
    });
    for (let rowIndex = from; rowIndex < to; rowIndex++) {
      if (!this.keys.has(rowIndex)) {
        const nextKeyValue = this.next(freeKeys);
        this.keys.set(rowIndex, nextKeyValue);
      }
    }
    return false;
  }
  keyFor(rowIndex) {
    const key = this.keys.get(rowIndex);
    if (key === void 0) {
      console.log(\`key not found
        keys: \${this.toDebugString()}
      \`);
      throw Error(\`KeySet, no key found for rowIndex \${rowIndex}\`);
    }
    return key;
  }
  toDebugString() {
    return \`\${this.keys.size} keys
\${Array.from(this.keys.entries()).sort(([key1], [key2]) => key1 - key2).map(([k, v]) => \`\${k}=>\${v}\`).join(",")}]
\`;
  }
};

// ../vuu-utils/src/promise-utils.ts
var _promise, _resolve, _reject, _resolved;
var DeferredPromise = class {
  constructor() {
    __privateAdd(this, _promise);
    __privateAdd(this, _resolve, () => console.log("resolve was not set"));
    __privateAdd(this, _reject, () => console.log("reject was not set"));
    __privateAdd(this, _resolved, false);
    __privateSet(this, _promise, new Promise((resolve, reject) => {
      __privateSet(this, _resolve, resolve);
      __privateSet(this, _reject, reject);
    }));
  }
  get promise() {
    return __privateGet(this, _promise);
  }
  get isResolved() {
    return __privateGet(this, _resolved);
  }
  resolve(value) {
    __privateSet(this, _resolved, true);
    return __privateGet(this, _resolve).call(this, value);
  }
  get reject() {
    return __privateGet(this, _reject);
  }
};
_promise = new WeakMap();
_resolve = new WeakMap();
_reject = new WeakMap();
_resolved = new WeakMap();

// src/message-utils.ts
var hasRequestId = (message) => {
  return "requestId" in message;
};
var stripRequestId = ({
  requestId,
  ...rest
}) => [requestId, rest];
var getFirstAndLastRows = (rows) => {
  let firstRow = rows.at(0);
  if (firstRow.updateType === "SIZE") {
    if (rows.length === 1) {
      return rows;
    } else {
      firstRow = rows.at(1);
    }
  }
  const lastRow = rows.at(-1);
  return [firstRow, lastRow];
};
var insertRow = (rows, row) => {
  const lastRow = rows.at(-1);
  if (lastRow === void 0 || row.rowIndex > lastRow.rowIndex) {
    rows.push(row);
  } else {
    for (let i = 0; i < rows.length; i++) {
      if (row.rowIndex < rows[i].rowIndex) {
        rows.splice(i, 0, row);
        return;
      } else if (row.rowIndex === rows[i].rowIndex) {
        if (row.ts < rows[i].ts) {
        } else {
          rows[i] = row;
        }
        return;
      }
    }
    throw Error("don't expect to get this far");
  }
};
var groupRowsByViewport = (rows) => {
  const result = {};
  for (const row of rows) {
    const rowsForViewport = result[row.viewPortId] || (result[row.viewPortId] = []);
    insertRow(rowsForViewport, row);
  }
  return result;
};
var createSchemaFromTableMetadata = ({
  columns,
  dataTypes,
  editableColumns = [],
  key,
  maxRangeEnd,
  maxRangeWidth,
  table
}) => {
  return {
    table,
    columns: columns.map((col, idx) => {
      if (editableColumns.includes(col)) {
        return {
          editable: true,
          name: col,
          serverDataType: dataTypes[idx]
        };
      }
      return {
        name: col,
        serverDataType: dataTypes[idx]
      };
    }),
    key,
    rangeLimits: {
      maxRangeEnd,
      maxRangeWidth
    }
  };
};

// src/server-proxy/messages.ts
var CHANGE_VP_SUCCESS = "CHANGE_VP_SUCCESS";
var CLOSE_TREE_NODE = "CLOSE_TREE_NODE";
var CLOSE_TREE_SUCCESS = "CLOSE_TREE_SUCCESS";
var CREATE_VP = "CREATE_VP";
var DISABLE_VP = "DISABLE_VP";
var DISABLE_VP_SUCCESS = "DISABLE_VP_SUCCESS";
var ENABLE_VP = "ENABLE_VP";
var ENABLE_VP_SUCCESS = "ENABLE_VP_SUCCESS";
var GET_VP_VISUAL_LINKS = "GET_VP_VISUAL_LINKS";
var GET_VIEW_PORT_MENUS = "GET_VIEW_PORT_MENUS";
var HB = "HB";
var HB_RESP = "HB_RESP";
var OPEN_TREE_NODE = "OPEN_TREE_NODE";
var OPEN_TREE_SUCCESS = "OPEN_TREE_SUCCESS";
var REMOVE_VP = "REMOVE_VP";

// src/server-proxy/array-backed-moving-window.ts
var EMPTY_ARRAY = [];
var log = logger("array-backed-moving-window");
function dataIsUnchanged(newRow, existingRow) {
  if (!existingRow) {
    return false;
  }
  if (existingRow.data.length !== newRow.data.length) {
    return false;
  }
  if (existingRow.sel !== newRow.sel) {
    return false;
  }
  for (let i = 0; i < existingRow.data.length; i++) {
    if (existingRow.data[i] !== newRow.data[i]) {
      return false;
    }
  }
  return true;
}
var _range;
var ArrayBackedMovingWindow = class {
  // Note, the buffer is already accounted for in the range passed in here
  constructor({ from: clientFrom, to: clientTo }, { from, to }, bufferSize) {
    __privateAdd(this, _range);
    __publicField(this, "bufferSize");
    __publicField(this, "internalData");
    __publicField(this, "rowsWithinRange");
    __publicField(this, "clientRange");
    __publicField(this, "rowCount");
    __publicField(this, "setRowCount", (rowCount) => {
      var _a;
      (_a = log.info) == null ? void 0 : _a.call(log, \`setRowCount \${rowCount}\`);
      if (rowCount < this.internalData.length) {
        this.internalData.length = rowCount;
      }
      if (rowCount < this.rowCount) {
        this.rowsWithinRange = 0;
        const end = Math.min(rowCount, this.clientRange.to);
        for (let i = this.clientRange.from; i < end; i++) {
          const rowIndex = i - __privateGet(this, _range).from;
          if (this.internalData[rowIndex] !== void 0) {
            this.rowsWithinRange += 1;
          }
        }
      }
      this.rowCount = rowCount;
    });
    __publicField(this, "bufferBreakout", (from, to) => {
      const bufferPerimeter = this.bufferSize * 0.25;
      if (__privateGet(this, _range).to - to < bufferPerimeter) {
        return true;
      } else if (__privateGet(this, _range).from > 0 && from - __privateGet(this, _range).from < bufferPerimeter) {
        return true;
      } else {
        return false;
      }
    });
    this.bufferSize = bufferSize;
    this.clientRange = new WindowRange(clientFrom, clientTo);
    __privateSet(this, _range, new WindowRange(from, to));
    this.internalData = new Array(bufferSize);
    this.rowsWithinRange = 0;
    this.rowCount = 0;
  }
  get range() {
    return __privateGet(this, _range);
  }
  // get hasAllRowsWithinRange(): boolean {
  //   return (
  //     this.rowsWithinRange === this.clientRange.to - this.clientRange.from ||
  //     (this.rowCount > 0 &&
  //       this.clientRange.from + this.rowsWithinRange === this.rowCount)
  //   );
  // }
  // Check to see if set of rows is outside the current viewport range, indicating
  // that veiwport is being scrolled quickly and server is not able to keep up.
  outOfRange(firstIndex, lastIndex) {
    const { from, to } = this.range;
    if (lastIndex < from) {
      return true;
    }
    if (firstIndex >= to) {
      return true;
    }
  }
  setAtIndex(row) {
    const { rowIndex: index } = row;
    const internalIndex = index - __privateGet(this, _range).from;
    if (dataIsUnchanged(row, this.internalData[internalIndex])) {
      return false;
    }
    const isWithinClientRange = this.isWithinClientRange(index);
    if (isWithinClientRange || this.isWithinRange(index)) {
      if (!this.internalData[internalIndex] && isWithinClientRange) {
        this.rowsWithinRange += 1;
      }
      this.internalData[internalIndex] = row;
    }
    return isWithinClientRange;
  }
  getAtIndex(index) {
    return __privateGet(this, _range).isWithin(index) && this.internalData[index - __privateGet(this, _range).from] != null ? this.internalData[index - __privateGet(this, _range).from] : void 0;
  }
  isWithinRange(index) {
    return __privateGet(this, _range).isWithin(index);
  }
  isWithinClientRange(index) {
    return this.clientRange.isWithin(index);
  }
  // Returns [false] or [serverDataRequired, clientRows]
  setClientRange(from, to) {
    var _a;
    (_a = log.debug) == null ? void 0 : _a.call(log, \`setClientRange \${from} - \${to}\`);
    const currentFrom = this.clientRange.from;
    const currentTo = Math.min(this.clientRange.to, this.rowCount);
    if (from === currentFrom && to === currentTo) {
      return [false, EMPTY_ARRAY];
    }
    const originalRange = this.clientRange.copy();
    this.clientRange.from = from;
    this.clientRange.to = to;
    this.rowsWithinRange = 0;
    for (let i = from; i < to; i++) {
      const internalIndex = i - __privateGet(this, _range).from;
      if (this.internalData[internalIndex]) {
        this.rowsWithinRange += 1;
      }
    }
    const clientRows = [];
    const offset = __privateGet(this, _range).from;
    if (to > originalRange.to) {
      const start = Math.max(from, originalRange.to);
      for (let i = start - offset; i < to - offset; i++) {
        const row = this.internalData[i];
        if (row) {
          clientRows.push(row);
        }
      }
    } else {
      const end = Math.min(originalRange.from, to);
      for (let i = from - offset; i < end - offset; i++) {
        const row = this.internalData[i];
        if (row) {
          clientRows.push(row);
        }
      }
    }
    const serverDataRequired = this.bufferBreakout(from, to);
    return [serverDataRequired, clientRows];
  }
  setRange(from, to) {
    var _a, _b;
    if (from !== __privateGet(this, _range).from || to !== __privateGet(this, _range).to) {
      (_a = log.debug) == null ? void 0 : _a.call(log, \`setRange \${from} - \${to}\`);
      const [overlapFrom, overlapTo] = __privateGet(this, _range).overlap(from, to);
      const newData = new Array(to - from);
      this.rowsWithinRange = 0;
      for (let i = overlapFrom; i < overlapTo; i++) {
        const row = this.getAtIndex(i);
        if (row) {
          const index = i - from;
          newData[index] = row;
          if (this.isWithinClientRange(i)) {
            this.rowsWithinRange += 1;
          }
        }
      }
      this.internalData = newData;
      __privateGet(this, _range).from = from;
      __privateGet(this, _range).to = to;
    } else {
      (_b = log.debug) == null ? void 0 : _b.call(log, \`setRange \${from} - \${to} IGNORED because not changed\`);
    }
  }
  //TODO temp
  get data() {
    return this.internalData;
  }
  getData() {
    var _a;
    const { from, to } = __privateGet(this, _range);
    const { from: clientFrom, to: clientTo } = this.clientRange;
    const startOffset = Math.max(0, clientFrom - from);
    const endOffset = Math.min(
      to - from,
      to,
      clientTo - from,
      (_a = this.rowCount) != null ? _a : to
    );
    return this.internalData.slice(startOffset, endOffset);
  }
  clear() {
    var _a;
    (_a = log.debug) == null ? void 0 : _a.call(log, "clear");
    this.internalData.length = 0;
    this.rowsWithinRange = 0;
    this.setRowCount(0);
  }
  // used only for debugging
  getCurrentDataRange() {
    const rows = this.internalData;
    const len = rows.length;
    let [firstRow] = this.internalData;
    let lastRow = this.internalData[len - 1];
    if (firstRow && lastRow) {
      return [firstRow.rowIndex, lastRow.rowIndex];
    } else {
      for (let i = 0; i < len; i++) {
        if (rows[i] !== void 0) {
          firstRow = rows[i];
          break;
        }
      }
      for (let i = len - 1; i >= 0; i--) {
        if (rows[i] !== void 0) {
          lastRow = rows[i];
          break;
        }
      }
      if (firstRow && lastRow) {
        return [firstRow.rowIndex, lastRow.rowIndex];
      } else {
        return [-1, -1];
      }
    }
  }
};
_range = new WeakMap();

// src/server-proxy/viewport.ts
var { debug: debug2, debugEnabled: debugEnabled2, error, info, infoEnabled, warn } = logger("Viewport");
var isLeafUpdate = ({ rowKey, updateType }) => updateType === "U" && !rowKey.startsWith("\$root");
var NO_DATA_UPDATE = [
  void 0,
  void 0
];
var NO_UPDATE_STATUS = {
  count: 0,
  mode: void 0,
  size: 0,
  ts: 0
};
var _status, _clientRange, _maxRangeEnd;
var Viewport = class {
  constructor({
    aggregations,
    bufferSize = 50,
    columns,
    filterSpec: filter,
    groupBy = [],
    table,
    range,
    sort,
    title,
    viewport,
    visualLink
  }, postMessageToClient) {
    __privateAdd(this, _status, "");
    __publicField(this, "aggregations");
    __publicField(this, "batchMode", false);
    __publicField(this, "bufferSize");
    /**
     * clientRange is always the range requested by the client. We should assume
     * these are the rows visible to the user
     * TODO what is clientRange needed for ?
     */
    __privateAdd(this, _clientRange);
    __publicField(this, "columns");
    __publicField(this, "dataWindow");
    __publicField(this, "filter");
    __publicField(this, "groupBy");
    __publicField(this, "sort");
    __publicField(this, "hasUpdates", false);
    __publicField(this, "pendingUpdates", []);
    __publicField(this, "keys");
    __privateAdd(this, _maxRangeEnd, Number.MAX_SAFE_INTEGER);
    __publicField(this, "pendingLinkedParent");
    __publicField(this, "pendingOperations", /* @__PURE__ */ new Map());
    __publicField(this, "pendingRangeRequests", []);
    __publicField(this, "postMessageToClient");
    __publicField(this, "rowCountChanged", false);
    __publicField(this, "lastUpdateStatus", NO_UPDATE_STATUS);
    __publicField(this, "updateThrottleTimer");
    __publicField(this, "rangeMonitor", new RangeMonitor("ViewPort"));
    __publicField(this, "clientViewportId");
    __publicField(this, "disabled", false);
    /**
     * disabledActive is a state assigned when all active viewports are disabled, used
     * when browser window is hidden or minimised.
     */
    __publicField(this, "disabledActive", false);
    __publicField(this, "frozen", false);
    __publicField(this, "isTree", false);
    __publicField(this, "links");
    __publicField(this, "linkedParent");
    __publicField(this, "serverViewportId");
    // TODO roll disabled/suspended into status
    __publicField(this, "suspended", false);
    __publicField(this, "suspendTimer", null);
    __publicField(this, "table");
    __publicField(this, "title");
    // Records SIZE only updates
    __publicField(this, "setLastSizeOnlyUpdateSize", (size) => {
      this.lastUpdateStatus.size = size;
    });
    __publicField(this, "setLastUpdate", (mode) => {
      const { ts: lastTS, mode: lastMode } = this.lastUpdateStatus;
      let elapsedTime = 0;
      if (lastMode === mode) {
        const ts = Date.now();
        this.lastUpdateStatus.count += 1;
        this.lastUpdateStatus.ts = ts;
        elapsedTime = lastTS === 0 ? 0 : ts - lastTS;
      } else {
        this.lastUpdateStatus.count = 1;
        this.lastUpdateStatus.ts = 0;
        elapsedTime = 0;
      }
      this.lastUpdateStatus.mode = mode;
      return elapsedTime;
    });
    __publicField(this, "rangeRequestAlreadyPending", (range) => {
      const { bufferSize } = this;
      const bufferThreshold = bufferSize * 0.25;
      let { from: stillPendingFrom } = range;
      for (const { from, to } of this.pendingRangeRequests) {
        if (stillPendingFrom >= from && stillPendingFrom < to) {
          if (range.to + bufferThreshold <= to) {
            return true;
          } else {
            stillPendingFrom = to;
          }
        }
      }
      return false;
    });
    __publicField(this, "sendThrottledSizeMessage", () => {
      this.updateThrottleTimer = void 0;
      this.lastUpdateStatus.count = 3;
      this.postMessageToClient({
        clientViewportId: this.clientViewportId,
        mode: "size-only",
        size: this.lastUpdateStatus.size,
        type: "viewport-update"
      });
    });
    // If we are receiving multiple SIZE updates but no data, table is loading rows
    // outside of our viewport. We can safely throttle these requests. Doing so will
    // alleviate pressure on UI DataTable.
    __publicField(this, "shouldThrottleMessage", (mode) => {
      const elapsedTime = this.setLastUpdate(mode);
      return mode === "size-only" && elapsedTime > 0 && elapsedTime < 500 && this.lastUpdateStatus.count > 3;
    });
    __publicField(this, "throttleMessage", (mode) => {
      if (this.shouldThrottleMessage(mode)) {
        info == null ? void 0 : info("[Viewport] throttling updates setTimeout to 300");
        this.setLastSizeOnlyUpdateSize(this.dataWindow.rowCount);
        if (this.updateThrottleTimer === void 0) {
          this.updateThrottleTimer = setTimeout(
            this.sendThrottledSizeMessage,
            100
          );
        }
        return true;
      } else if (this.updateThrottleTimer !== void 0) {
        clearTimeout(this.updateThrottleTimer);
        this.updateThrottleTimer = void 0;
      }
      return false;
    });
    __publicField(this, "getNewRowCount", () => {
      if (this.rowCountChanged && this.dataWindow) {
        this.rowCountChanged = false;
        return this.dataWindow.rowCount;
      }
    });
    this.aggregations = aggregations;
    this.bufferSize = bufferSize;
    __privateSet(this, _clientRange, range);
    this.clientViewportId = viewport;
    this.columns = columns;
    this.filter = filter;
    this.groupBy = groupBy;
    this.keys = new KeySet(range);
    this.pendingLinkedParent = visualLink;
    this.table = table;
    this.sort = sort;
    this.title = title;
    infoEnabled && (info == null ? void 0 : info(\`\${table.table} #\${viewport},  bufferSize=\${bufferSize}\`));
    this.dataWindow = new ArrayBackedMovingWindow(
      __privateGet(this, _clientRange),
      range,
      this.bufferSize
    );
    this.postMessageToClient = postMessageToClient;
  }
  get hasUpdatesToProcess() {
    if (this.suspended) {
      return false;
    }
    return this.rowCountChanged || this.hasUpdates;
  }
  get size() {
    var _a;
    return (_a = this.dataWindow.rowCount) != null ? _a : 0;
  }
  get clientRange() {
    return __privateGet(this, _clientRange);
  }
  get status() {
    return __privateGet(this, _status);
  }
  set status(status) {
    __privateSet(this, _status, status);
  }
  subscribe() {
    const { filter } = this.filter;
    this.status = __privateGet(this, _status) === "subscribed" ? "resubscribing" : "subscribing";
    return {
      type: CREATE_VP,
      table: this.table,
      range: getFullRange(__privateGet(this, _clientRange), this.bufferSize),
      aggregations: this.aggregations,
      columns: this.columns,
      sort: this.sort,
      groupBy: this.groupBy,
      filterSpec: { filter }
    };
  }
  handleSubscribed({
    viewPortId,
    aggregations,
    columns,
    filterSpec: filter,
    range,
    sort,
    groupBy,
    table
  }, baseTableSchema) {
    var _a;
    this.serverViewportId = viewPortId;
    this.status = "subscribed";
    this.aggregations = aggregations;
    this.columns = columns;
    this.groupBy = groupBy;
    this.isTree = groupBy && groupBy.length > 0;
    this.dataWindow.setRange(range.from, range.to);
    const tableSchema = table === baseTableSchema.table.table ? baseTableSchema : {
      ...baseTableSchema,
      table: {
        ...baseTableSchema.table,
        session: table
      }
    };
    if (tableSchema.rangeLimits) {
      __privateSet(this, _maxRangeEnd, (_a = tableSchema.rangeLimits) == null ? void 0 : _a.maxRangeEnd);
    }
    return {
      aggregations,
      type: "subscribed",
      clientViewportId: this.clientViewportId,
      columns,
      filterSpec: filter,
      groupBy,
      range,
      sort,
      tableSchema
    };
  }
  awaitOperation(requestId, msg) {
    this.pendingOperations.set(requestId, msg);
  }
  rejectOperation(requestId, _msg) {
    const { pendingOperations } = this;
    const pendingOperation = pendingOperations.get(requestId);
    if (!pendingOperation) {
      error(
        \`no matching operation found to reject for requestId \${requestId}\`
      );
      return;
    }
    const { type } = pendingOperation;
    pendingOperations.delete(requestId);
    if (type === "CHANGE_VP_RANGE") {
      for (let i = this.pendingRangeRequests.length - 1; i >= 0; i--) {
        const pendingRangeRequest = this.pendingRangeRequests[i];
        if (pendingRangeRequest.requestId === requestId) {
          pendingRangeRequest.nacked = true;
          break;
        } else {
          warn == null ? void 0 : warn("range requests sent faster than they are being ACKed");
        }
      }
    }
  }
  // Return a message if we need to communicate this to client UI
  completeOperation(requestId, ...params) {
    var _a;
    const { clientViewportId, pendingOperations } = this;
    const pendingOperation = pendingOperations.get(requestId);
    if (!pendingOperation) {
      error(
        \`no matching operation found to complete for requestId \${requestId}\`
      );
      return;
    }
    const { type } = pendingOperation;
    info == null ? void 0 : info(\`completeOperation \${type}\`);
    pendingOperations.delete(requestId);
    if (type === "CHANGE_VP_RANGE") {
      const [from, to] = params;
      infoEnabled && info(
        \`completeOperation CHANGE_VP_RANGE
        window setRange (\${from}:\${to}) \${this.pendingRangeRequests.length} range requests pending\`
      );
      (_a = this.dataWindow) == null ? void 0 : _a.setRange(from, to);
      for (let i = this.pendingRangeRequests.length - 1; i >= 0; i--) {
        const pendingRangeRequest = this.pendingRangeRequests[i];
        if (pendingRangeRequest.requestId === requestId) {
          pendingRangeRequest.acked = true;
          break;
        } else {
          warn == null ? void 0 : warn("range requests sent faster than they are being ACKed");
        }
      }
    } else if (type === "config") {
      const {
        aggregations,
        columns,
        filterSpec: filter,
        groupBy,
        sort
      } = pendingOperation.data;
      this.aggregations = aggregations;
      this.columns = columns;
      this.filter = filter;
      this.groupBy = groupBy;
      this.sort = sort;
      if (groupBy.length > 0) {
        this.isTree = true;
      } else if (this.isTree) {
        this.isTree = false;
      }
      debug2 == null ? void 0 : debug2(\`config change confirmed, isTree : \${this.isTree}\`);
      return {
        clientViewportId,
        type,
        config: pendingOperation.data
      };
    } else if (type === "selection") {
    } else if (type === "disable") {
      this.suspended = false;
      this.disabled = true;
      this.disabledActive = pendingOperation.disableActive;
      return {
        type: "disabled",
        clientViewportId
      };
    } else if (type === "enable") {
      this.disabled = false;
      this.disabledActive = false;
      return {
        type: "enabled",
        clientViewportId
      };
    } else if (type === "freeze") {
      this.frozen = true;
      return {
        type: "frozen",
        clientViewportId
      };
    } else if (type === "unfreeze") {
      this.frozen = false;
      return {
        type: "unfrozen",
        clientViewportId
      };
    } else if (type === "CREATE_VISUAL_LINK") {
      const [colName, parentViewportId, parentColName] = params;
      this.linkedParent = {
        colName,
        parentViewportId,
        parentColName
      };
      this.pendingLinkedParent = void 0;
      return {
        requestId,
        type: "vuu-link-created",
        clientViewportId,
        colName,
        parentViewportId,
        parentColName
      };
    } else if (type === "REMOVE_VISUAL_LINK") {
      this.linkedParent = void 0;
      return {
        requestId,
        type: "vuu-link-removed",
        clientViewportId
      };
    }
  }
  // TODO when a range request arrives, consider the viewport to be scrolling
  // until data arrives and we have the full range.
  // When not scrolling, any server data is an update
  // When scrolling, we are in batch mode
  rangeRequest(requestId, range) {
    if (debugEnabled2) {
      this.rangeMonitor.set(range);
    }
    infoEnabled && info(
      \`(bufferSize \${this.bufferSize}) rangeRequest (\${range.from}:\${range.to}) current: window client (\${this.dataWindow.clientRange.from}:\${this.dataWindow.clientRange.to}), full (\${this.dataWindow.range.from}:\${this.dataWindow.range.to}) \`
    );
    const type = "CHANGE_VP_RANGE";
    if (this.dataWindow) {
      const [serverDataRequired, clientRows] = this.dataWindow.setClientRange(
        range.from,
        range.to
      );
      infoEnabled && info(
        \`updated: dataWindow clientRange (\${this.dataWindow.clientRange.from}:\${this.dataWindow.clientRange.to}), fullRange (\${this.dataWindow.range.from}:\${this.dataWindow.range.to}) serverDataRequired \${serverDataRequired ? "Y" : "N"} \${clientRows.length} rows returned from local buffer\`
      );
      let debounceRequest;
      const maxRange = __privateGet(this, _maxRangeEnd);
      const serverRequest = serverDataRequired && !this.rangeRequestAlreadyPending(range) ? {
        type,
        viewPortId: this.serverViewportId,
        ...getFullRange(range, this.bufferSize, maxRange)
      } : null;
      if (serverRequest) {
        infoEnabled && info(
          \`create CHANGE_VP_RANGE: (\${serverRequest.from} - \${serverRequest.to})\`
        );
        debugEnabled2 && (debug2 == null ? void 0 : debug2(
          \`create CHANGE_VP_RANGE: [\${serverRequest.from} - \${serverRequest.to}]\`
        ));
        this.awaitOperation(requestId, { type });
        const pendingRequest = this.pendingRangeRequests.at(-1);
        if (pendingRequest) {
          if (pendingRequest.acked) {
            console.warn("Range Request before previous request is filled");
          } else {
            const { from, to } = pendingRequest;
            if (this.dataWindow.outOfRange(from, to)) {
              debounceRequest = {
                clientViewportId: this.clientViewportId,
                type: "debounce-begin"
              };
            } else {
              warn == null ? void 0 : warn("Range Request before previous request is acked");
            }
          }
        }
        this.pendingRangeRequests.push({ ...serverRequest, requestId });
      } else if (clientRows.length > 0) {
        this.batchMode = false;
      }
      this.keys.reset(this.dataWindow.clientRange);
      const toClient = this.isTree ? toClientRowTree : toClientRow;
      if (clientRows.length) {
        return [
          serverRequest,
          clientRows.map((row) => {
            return toClient(row, this.keys);
          })
        ];
      } else if (debounceRequest) {
        return [serverRequest, void 0, debounceRequest];
      } else {
        return [serverRequest];
      }
    } else {
      return [null];
    }
  }
  setLinks(links) {
    this.links = links.filter(
      (link) => link.parentVpId !== this.serverViewportId
    );
    return [
      {
        type: "vuu-links",
        links: this.links,
        clientViewportId: this.clientViewportId
      },
      this.pendingLinkedParent
    ];
  }
  setMenu(menu) {
    return {
      type: "vuu-menu",
      menu,
      clientViewportId: this.clientViewportId
    };
  }
  openTreeNode(requestId, message) {
    const treeKey = message.index === void 0 ? message.key : this.getKeyForRowAtIndex(message.index);
    infoEnabled && info(\`treeKey \${treeKey}\`);
    return {
      type: OPEN_TREE_NODE,
      vpId: this.serverViewportId,
      treeKey
    };
  }
  closeTreeNode(requestId, message) {
    const treeKey = message.index === void 0 ? message.key : this.getKeyForRowAtIndex(message.index);
    return {
      type: CLOSE_TREE_NODE,
      vpId: this.serverViewportId,
      treeKey
    };
  }
  createLink(requestId, vuuCreateVisualLink) {
    const message = {
      ...vuuCreateVisualLink,
      childVpId: this.serverViewportId
    };
    this.awaitOperation(requestId, message);
    return message;
  }
  removeLink(requestId) {
    const message = {
      type: "REMOVE_VISUAL_LINK",
      childVpId: this.serverViewportId
    };
    this.awaitOperation(requestId, message);
    return message;
  }
  suspend() {
    this.suspended = true;
    this.pendingUpdates.length = 0;
    info == null ? void 0 : info("suspend");
  }
  resume() {
    this.suspended = false;
    if (debugEnabled2) {
      debug2 == null ? void 0 : debug2(\`resume: \${this.currentData()}\`);
    }
    return [this.size, this.currentData()];
  }
  currentData() {
    const out = [];
    if (this.dataWindow) {
      const records = this.dataWindow.getData();
      const { keys } = this;
      const toClient = this.isTree ? toClientRowTree : toClientRow;
      for (const row of records) {
        if (row) {
          out.push(toClient(row, keys));
        }
      }
    }
    return out;
  }
  enable(requestId) {
    this.awaitOperation(requestId, { type: "enable" });
    info == null ? void 0 : info(\`enable: \${this.serverViewportId}\`);
    return {
      type: ENABLE_VP,
      viewPortId: this.serverViewportId
    };
  }
  disable(requestId, disableActive = false) {
    this.awaitOperation(requestId, { type: "disable", disableActive });
    info == null ? void 0 : info(\`disable: \${this.serverViewportId}\`);
    return {
      type: DISABLE_VP,
      viewPortId: this.serverViewportId
    };
  }
  freeze(requestId) {
    this.awaitOperation(requestId, { type: "freeze" });
    info == null ? void 0 : info(\`freeze: \${this.serverViewportId}\`);
    return {
      type: "FREEZE_VP",
      viewPortId: this.serverViewportId
    };
  }
  unfreeze(requestId) {
    this.awaitOperation(requestId, { type: "unfreeze" });
    info == null ? void 0 : info(\`unfreeze: \${this.serverViewportId}\`);
    this.frozen = false;
    return {
      type: "UNFREEZE_VP",
      viewPortId: this.serverViewportId
    };
  }
  setConfig(requestId, config) {
    var _a;
    this.awaitOperation(requestId, { type: "config", data: config });
    const { filterSpec: filter, ...remainingConfig } = config;
    debugEnabled2 ? debug2 == null ? void 0 : debug2(\`setConfig \${JSON.stringify(config)}\`) : info == null ? void 0 : info(\`setConfig\`);
    if (!this.isTree && config.groupBy.length > 0) {
      (_a = this.dataWindow) == null ? void 0 : _a.clear();
    }
    return this.createRequest(
      {
        ...remainingConfig,
        filterSpec: typeof (filter == null ? void 0 : filter.filter) === "string" ? {
          filter: filter.filter
        } : {
          filter: ""
        }
      },
      true
    );
  }
  selectRequest(request) {
    info == null ? void 0 : info(\`selectRequest: \${request.type}\`);
    if (this.serverViewportId) {
      return {
        ...request,
        vpId: this.serverViewportId
      };
    } else {
      throw Error(
        \`[Viewport] cannot process \${request.type} before serverViewportId has been set\`
      );
    }
  }
  removePendingRangeRequest(firstIndex, lastIndex) {
    for (let i = this.pendingRangeRequests.length - 1; i >= 0; i--) {
      const { from, to } = this.pendingRangeRequests[i];
      let isLast = true;
      if (firstIndex >= from && firstIndex < to || lastIndex > from && lastIndex < to) {
        if (!isLast) {
          console.warn(
            "removePendingRangeRequest TABLE_ROWS are not for latest request"
          );
        }
        this.pendingRangeRequests.splice(i, 1);
        break;
      } else {
        isLast = false;
      }
    }
  }
  clearCache() {
    this.dataWindow.setRowCount(0);
    this.postMessageToClient({
      clientViewportId: this.clientViewportId,
      type: "viewport-clear"
    });
  }
  updateRows(rows) {
    var _a, _b, _c;
    const [firstRow, lastRow] = getFirstAndLastRows(rows);
    if (firstRow && lastRow) {
      this.removePendingRangeRequest(firstRow.rowIndex, lastRow.rowIndex);
    }
    if (rows.length === 1) {
      if (firstRow.vpSize === 0 && this.disabled) {
        debug2 == null ? void 0 : debug2(
          \`ignore a SIZE=0 message on disabled viewport (\${rows.length} rows)\`
        );
        return;
      }
    }
    for (const row of rows) {
      if (this.isTree && isLeafUpdate(row)) {
        continue;
      } else {
        if (row.updateType === "SIZE" || ((_a = this.dataWindow) == null ? void 0 : _a.rowCount) !== row.vpSize) {
          (_b = this.dataWindow) == null ? void 0 : _b.setRowCount(row.vpSize);
          this.rowCountChanged = true;
        }
        if (row.updateType === "U") {
          if ((_c = this.dataWindow) == null ? void 0 : _c.setAtIndex(row)) {
            if (this.suspended !== true) {
              this.hasUpdates = true;
              if (!this.batchMode) {
                this.pendingUpdates.push(row);
              }
            }
          }
        }
      }
    }
  }
  getKeyForRowAtIndex(rowIndex) {
    const row = this.dataWindow.getAtIndex(rowIndex);
    return row == null ? void 0 : row.rowKey;
  }
  // This is called only after new data has been received from server - data
  // returned direcly from buffer does not use this.
  getClientRows() {
    let out = void 0;
    let mode = "size-only";
    if (!this.hasUpdates && !this.rowCountChanged) {
      return NO_DATA_UPDATE;
    }
    if (this.hasUpdates) {
      const { keys } = this;
      const toClient = this.isTree ? toClientRowTree : toClientRow;
      if (this.updateThrottleTimer) {
        self.clearTimeout(this.updateThrottleTimer);
        this.updateThrottleTimer = void 0;
      }
      if (this.pendingUpdates.length > 0) {
        out = [];
        mode = "update";
        for (const row of this.pendingUpdates) {
          out.push(toClient(row, keys));
        }
      }
      this.pendingUpdates.length = 0;
      this.hasUpdates = false;
    }
    if (this.throttleMessage(mode)) {
      return NO_DATA_UPDATE;
    } else {
      return [out, mode];
    }
  }
  createRequest(params, overWrite = false) {
    if (overWrite) {
      return {
        type: "CHANGE_VP",
        viewPortId: this.serverViewportId,
        ...params
      };
    } else {
      return {
        type: "CHANGE_VP",
        viewPortId: this.serverViewportId,
        aggregations: this.aggregations,
        columns: this.columns,
        sort: this.sort,
        groupBy: this.groupBy,
        filterSpec: {
          filter: this.filter.filter
        },
        ...params
      };
    }
  }
};
_status = new WeakMap();
_clientRange = new WeakMap();
_maxRangeEnd = new WeakMap();
var isNew = false;
var toClientRow = ({ rowIndex, rowKey, sel: isSelected, data, ts }, keys) => {
  return [
    rowIndex,
    keys.keyFor(rowIndex),
    true,
    false,
    0,
    0,
    rowKey,
    isSelected,
    ts,
    isNew
  ].concat(data);
};
var toClientRowTree = ({ rowIndex, rowKey, sel: isSelected, data, ts }, keys) => {
  const [depth, isExpanded, , isLeaf, , count, ...rest] = data;
  return [
    rowIndex,
    keys.keyFor(rowIndex),
    isLeaf,
    isExpanded,
    depth,
    count,
    rowKey,
    isSelected,
    ts,
    isNew
  ].concat(rest);
};

// src/WebSocketConnection.ts
var { debug: debug3, debugEnabled: debugEnabled3, info: info2 } = logger("WebSocketConnection");
var isLoginRejectedMessage = (message) => message !== null && "type" in message && message.type === "LOGIN_REJECTED";
var DEFAULT_CONNECTION_TIMEOUT = 1e4;
var parseWebSocketMessage = (message) => {
  try {
    return JSON.parse(message);
  } catch (e) {
    throw Error(\`Error parsing JSON response from server \${message}\`);
  }
};
var _callback, _confirmedOpen, _connectionPhase, _connectionStatus, _connectionTimeout, _deferredOpen, _protocols, _url, _ws;
var WebSocketConnection = class extends EventEmitter {
  constructor({
    callback,
    connectionTimeout = DEFAULT_CONNECTION_TIMEOUT,
    protocols,
    url
  }) {
    super();
    __privateAdd(this, _callback);
    /**
     We are not confirmedOpen until we receive the first message from the
     server. If we get an unexpected close event before that, we consider
     the reconnect attempts as still within the connection phase, not true
     reconnection. This can happen e.g. when connecting to remote host via
     a proxy.
    */
    __privateAdd(this, _confirmedOpen, false);
    __privateAdd(this, _connectionPhase, "initial-connection");
    __privateAdd(this, _connectionStatus, "closed");
    __privateAdd(this, _connectionTimeout);
    __privateAdd(this, _deferredOpen);
    __privateAdd(this, _protocols);
    __privateAdd(this, _url);
    __privateAdd(this, _ws);
    __publicField(this, "receive", (evt) => {
      if (isLoginErrorMessage(evt.data)) {
        console.warn(\`[WebSocketConnection] closed because of login issue\`);
        if (__privateGet(this, _deferredOpen)) {
          console.warn(\`... and we have a deferred connection\`);
        }
        __privateGet(this, _callback).call(this, {
          type: "LOGIN_REJECTED",
          reason: evt.data
        });
        this.close(evt.data);
      } else {
        const vuuMessageFromServer = parseWebSocketMessage(evt.data);
        if (debugEnabled3) {
          if (vuuMessageFromServer.body.type !== "HB") {
            debug3(\`<=== \${vuuMessageFromServer.body.type}\`);
            if (vuuMessageFromServer.body.type === "CHANGE_VP_SUCCESS") {
              debug3(JSON.stringify(vuuMessageFromServer.body));
            }
          }
        }
        __privateGet(this, _callback).call(this, vuuMessageFromServer);
        if (!this.confirmedOpen) {
          if (vuuMessageFromServer.body.type === "LOGIN_SUCCESS") {
            this.connectionStatus = __privateGet(this, _connectionPhase) === "initial-connection" ? "connected" : "reconnected";
            this.confirmedOpen = true;
          }
        }
      }
    });
    __publicField(this, "send", (msg) => {
      var _a;
      if (msg.body.type === "CHANGE_VP_RANGE") {
        info2 == null ? void 0 : info2(
          \`===> CHANGE_VP_RANGE<#\${msg.requestId}> \${msg.body.from}-\${msg.body.to}\`
        );
      }
      (_a = __privateGet(this, _ws)) == null ? void 0 : _a.send(JSON.stringify(msg));
    });
    __privateSet(this, _callback, callback);
    __privateSet(this, _connectionTimeout, connectionTimeout);
    __privateSet(this, _url, url);
    __privateSet(this, _protocols, protocols);
  }
  get connectionTimeout() {
    return __privateGet(this, _connectionTimeout);
  }
  get protocols() {
    return __privateGet(this, _protocols);
  }
  get isClosed() {
    return __privateGet(this, _connectionStatus) === "closed";
  }
  get isDisconnected() {
    return __privateGet(this, _connectionStatus) === "disconnected";
  }
  get connectionPhase() {
    return __privateGet(this, _connectionPhase);
  }
  get connectionStatus() {
    return __privateGet(this, _connectionStatus);
  }
  set connectionStatus(connectionStatus) {
    if (connectionStatus !== "connecting" && connectionStatus !== "reconnecting") {
      __privateSet(this, _connectionStatus, connectionStatus);
      this.emit("connection-status", __privateGet(this, _connectionStatus));
    }
  }
  get confirmedOpen() {
    return __privateGet(this, _confirmedOpen);
  }
  /**
   * We are 'confirmedOpen' when we see the first message transmitted
   * from the server. This ensures that even if we have one or more
   * proxies in our route to the endPoint, all connections have been
   * opened successfully.
   * First time in here (on our initial successful connection) we switch
   * from 'connect' phase to 'reconnect' phase. We may have different
   * retry configurations for these two phases.
   */
  set confirmedOpen(confirmedOpen) {
    __privateSet(this, _confirmedOpen, confirmedOpen);
    if (confirmedOpen && __privateGet(this, _connectionPhase) === "initial-connection") {
      __privateSet(this, _connectionPhase, "post-disconnect-reconnection");
    }
  }
  get url() {
    return __privateGet(this, _url);
  }
  async openWebSocket() {
    var _a;
    const initialConnect = __privateGet(this, _connectionPhase) === "initial-connection";
    if (__privateGet(this, _deferredOpen) === void 0) {
      __privateSet(this, _deferredOpen, new DeferredPromise());
    }
    const { connectionTimeout, protocols, url } = this;
    __privateSet(this, _connectionStatus, initialConnect ? "connecting" : "reconnecting");
    const timer = setTimeout(() => {
      throw Error(
        \`Failed to open WebSocket connection to \${url}, timed out after \${connectionTimeout}ms\`
      );
    }, connectionTimeout);
    console.log(\`create websocket \${url} \${protocols}\`);
    try {
      __privateSet(this, _ws, new WebSocket(url, protocols));
    } catch (e) {
      console.error(e);
      return;
    }
    const ws = __privateGet(this, _ws);
    ws.onopen = () => {
      this.connectionStatus = "websocket-open";
      clearTimeout(timer);
      if (__privateGet(this, _deferredOpen)) {
        __privateGet(this, _deferredOpen).resolve(void 0);
        __privateSet(this, _deferredOpen, void 0);
      }
    };
    ws.onerror = () => {
      clearTimeout(timer);
    };
    ws.onclose = () => {
      if (!this.isClosed) {
        this.confirmedOpen = false;
        this.connectionStatus = "disconnected";
        this.close("failure");
      }
    };
    ws.onmessage = (evt) => {
      this.receive(evt);
    };
    return (_a = __privateGet(this, _deferredOpen)) == null ? void 0 : _a.promise;
  }
  close(reason = "shutdown") {
    var _a;
    this.connectionStatus = "closed";
    if (reason === "failure") {
      if (__privateGet(this, _deferredOpen)) {
        __privateGet(this, _deferredOpen).reject(Error("connection failed"));
        __privateSet(this, _deferredOpen, void 0);
      }
    } else {
      (_a = __privateGet(this, _ws)) == null ? void 0 : _a.close();
    }
    __privateSet(this, _ws, void 0);
  }
};
_callback = new WeakMap();
_confirmedOpen = new WeakMap();
_connectionPhase = new WeakMap();
_connectionStatus = new WeakMap();
_connectionTimeout = new WeakMap();
_deferredOpen = new WeakMap();
_protocols = new WeakMap();
_url = new WeakMap();
_ws = new WeakMap();

// src/server-proxy/server-proxy.ts
var _requestId = 1;
var { debug: debug4, debugEnabled: debugEnabled4, error: error2, info: info3, infoEnabled: infoEnabled2, warn: warn2 } = logger("ServerProxy");
var nextRequestId = () => \`\${_requestId++}\`;
var DEFAULT_OPTIONS = {};
var isActiveViewport = (viewPort) => viewPort.disabled !== true && viewPort.suspended !== true;
var addTitleToLinks = (links, serverViewportId, label) => links.map(
  (link) => link.parentVpId === serverViewportId ? { ...link, label } : link
);
function addLabelsToLinks(links, viewports) {
  return links.map((linkDescriptor) => {
    const { parentVpId } = linkDescriptor;
    const viewport = viewports.get(parentVpId);
    if (viewport) {
      return {
        ...linkDescriptor,
        parentClientVpId: viewport.clientViewportId,
        label: viewport.title
      };
    } else {
      throw Error("addLabelsToLinks viewport not found");
    }
  });
}
var ServerProxy = class {
  constructor(connection, callback) {
    __publicField(this, "connection");
    __publicField(this, "postMessageToClient");
    __publicField(this, "viewports");
    __publicField(this, "mapClientToServerViewport");
    __publicField(this, "authToken", "");
    __publicField(this, "pendingLogin");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __publicField(this, "pendingRequests", /* @__PURE__ */ new Map());
    __publicField(this, "sessionId");
    __publicField(this, "queuedRequests", []);
    __publicField(this, "cachedTableMetaRequests", /* @__PURE__ */ new Map());
    __publicField(this, "cachedTableSchemas", /* @__PURE__ */ new Map());
    __publicField(this, "tableList");
    __publicField(this, "connectionStatusChanged", (status) => {
      if (status === "disconnected") {
        this.sessionId = void 0;
        this.clearAllViewports();
      } else if (status === "reconnected") {
        this.reconnect();
      }
    });
    __publicField(this, "reconnect", async () => {
      const [activeViewports, inactiveViewports] = partition(
        Array.from(this.viewports.values()),
        isActiveViewport
      );
      this.viewports.clear();
      this.mapClientToServerViewport.clear();
      const reconnectViewports = (viewports) => {
        viewports.forEach((viewport) => {
          const { clientViewportId } = viewport;
          this.awaitResponseToMessage(
            viewport.subscribe(),
            clientViewportId
          ).then((msg) => {
            if (msg.type === "CREATE_VP_SUCCESS") {
              this.mapClientToServerViewport.set(
                clientViewportId,
                msg.viewPortId
              );
              this.viewports.set(msg.viewPortId, viewport);
              viewport.status = "subscribed";
              viewport.serverViewportId = msg.viewPortId;
            } else {
            }
          });
        });
      };
      reconnectViewports(activeViewports);
      setTimeout(() => {
        reconnectViewports(inactiveViewports);
      }, 2e3);
    });
    this.connection = connection;
    this.postMessageToClient = callback;
    this.viewports = /* @__PURE__ */ new Map();
    this.mapClientToServerViewport = /* @__PURE__ */ new Map();
    connection.on("connection-status", this.connectionStatusChanged);
  }
  async login(authToken) {
    if (authToken) {
      this.authToken = authToken;
      return new Promise((resolve, reject) => {
        this.sendMessageToServer({ type: "LOGIN", token: this.authToken }, "");
        this.pendingLogin = { resolve, reject };
      });
    } else if (this.authToken === "") {
      error2("login, cannot login until auth token has been obtained");
    }
  }
  clearAllViewports() {
    this.viewports.forEach((viewport) => {
      viewport.clearCache();
    });
  }
  disconnect() {
    this.viewports.forEach((viewport) => {
      const { clientViewportId } = viewport;
      this.unsubscribe(clientViewportId);
      this.postMessageToClient({
        clientViewportId,
        type: "viewport-clear"
      });
    });
  }
  async subscribe(message) {
    if (!this.mapClientToServerViewport.has(message.viewport)) {
      const pendingTableSchema = this.getTableMeta(message.table);
      const viewport = new Viewport(message, this.postMessageToClient);
      this.viewports.set(message.viewport, viewport);
      const pendingSubscription = this.awaitResponseToMessage(
        viewport.subscribe(),
        message.viewport
      );
      const [subscribeResponse, tableSchema] = await Promise.all([
        pendingSubscription,
        pendingTableSchema
      ]);
      if (isErrorMessage(tableSchema)) {
        this.postMessageToClient({
          clientViewportId: message.viewport,
          type: "subscribe-failed",
          msg: \`failed to fetch schema for table \${message.table.table}: \${tableSchema.msg}\`
        });
      } else if (isCreateVpSuccess(subscribeResponse)) {
        const { viewPortId: serverViewportId } = subscribeResponse;
        const { status: previousViewportStatus } = viewport;
        if (message.viewport !== serverViewportId) {
          this.viewports.delete(message.viewport);
          this.viewports.set(serverViewportId, viewport);
        }
        this.mapClientToServerViewport.set(message.viewport, serverViewportId);
        const clientResponse = viewport.handleSubscribed(
          subscribeResponse,
          tableSchema
        );
        if (clientResponse) {
          this.postMessageToClient(clientResponse);
          if (debugEnabled4) {
            debug4(
              \`post DataSourceSubscribedMessage to client: \${JSON.stringify(
                clientResponse
              )}\`
            );
          }
        }
        if (viewport.disabled) {
          this.disableViewport(viewport);
        }
        if (this.queuedRequests.length > 0) {
          this.processQueuedRequests();
        }
        if (previousViewportStatus === "subscribing" && // A session table will never have Visual Links, nor Context Menus
        !isSessionTable(viewport.table)) {
          this.sendMessageToServer({
            type: GET_VP_VISUAL_LINKS,
            vpId: serverViewportId
          });
          this.sendMessageToServer({
            type: GET_VIEW_PORT_MENUS,
            vpId: serverViewportId
          });
          Array.from(this.viewports.entries()).filter(
            ([id, { disabled, status }]) => id !== serverViewportId && !disabled && status === "subscribed"
          ).forEach(([vpId]) => {
            this.sendMessageToServer({
              type: GET_VP_VISUAL_LINKS,
              vpId
            });
          });
        }
      } else {
        this.postMessageToClient({
          clientViewportId: message.viewport,
          type: "subscribe-failed",
          msg: \`failed to open subscription on table \${message.table.table}: \${subscribeResponse.msg}\`
        });
      }
    } else {
      error2(\`spurious subscribe call \${message.viewport}\`);
    }
  }
  /**
   * Currently we only queue range requests, this may change
   */
  addRequestToQueue(queuedRequest) {
    const isDifferentTypeViewport = (qr) => qr.clientViewportId !== queuedRequest.clientViewportId || queuedRequest.message.type !== qr.message.type;
    if (!this.queuedRequests.every(isDifferentTypeViewport)) {
      this.queuedRequests = this.queuedRequests.filter(isDifferentTypeViewport);
    }
    this.queuedRequests.push(queuedRequest);
  }
  processQueuedRequests() {
    const newQueue = [];
    for (const queuedRequest of this.queuedRequests) {
      const { clientViewportId, message, requestId } = queuedRequest;
      const serverViewportId = this.mapClientToServerViewport.get(clientViewportId);
      if (serverViewportId) {
        this.sendMessageToServer(
          {
            ...message,
            viewPortId: serverViewportId
          },
          requestId
        );
      } else if (this.viewports.has(clientViewportId)) {
        newQueue.push(queuedRequest);
      } else {
        console.warn(
          \`ServerProxy processQueuedRequests, \${message.type} request not found \${clientViewportId}\`
        );
      }
    }
    this.queuedRequests = newQueue;
  }
  unsubscribe(clientViewportId) {
    const serverViewportId = this.mapClientToServerViewport.get(clientViewportId);
    if (serverViewportId) {
      info3 == null ? void 0 : info3(
        \`Unsubscribe Message (Client to Server):
        \${serverViewportId}\`
      );
      this.sendMessageToServer({
        type: REMOVE_VP,
        viewPortId: serverViewportId
      });
    } else {
      error2(
        \`failed to unsubscribe client viewport \${clientViewportId}, viewport not found\`
      );
    }
  }
  getViewportForClient(clientViewportId, throws = true) {
    const serverViewportId = this.mapClientToServerViewport.get(clientViewportId);
    if (serverViewportId) {
      const viewport = this.viewports.get(serverViewportId);
      if (viewport) {
        return viewport;
      } else if (throws) {
        throw Error(
          \`Viewport not found for client viewport \${clientViewportId}\`
        );
      } else {
        return null;
      }
    } else if (this.viewports.has(clientViewportId)) {
      return this.viewports.get(clientViewportId);
    } else if (throws) {
      throw Error(
        \`Viewport server id not found for client viewport \${clientViewportId}\`
      );
    } else {
      return null;
    }
  }
  /**********************************************************************/
  /* Handle messages from client                                        */
  /**********************************************************************/
  setViewRange(viewport, message) {
    const requestId = nextRequestId();
    infoEnabled2 && info3(\`setViewRange (\${message.range.from}:\${message.range.to})\`);
    const [serverRequest, rows, debounceRequest] = viewport.rangeRequest(
      requestId,
      message.range
    );
    if (viewport.status === "subscribed") {
      info3 == null ? void 0 : info3(\`setViewRange \${message.range.from} - \${message.range.to}\`);
      if (serverRequest) {
        if (true) {
          info3 == null ? void 0 : info3(
            \`CHANGE_VP_RANGE (\${message.range.from}-\${message.range.to}) => (\${serverRequest.from}-\${serverRequest.to})\`
          );
        }
        infoEnabled2 && info3(
          \`setViewRange send CHANGE_VP_RANGE<#\${requestId}> (\${serverRequest.from}-\${serverRequest.to})\`
        );
        this.sendMessageToServer(serverRequest, requestId);
      }
      if (rows) {
        info3 == null ? void 0 : info3(\`setViewRange \${rows.length} rows returned from cache\`);
        this.postMessageToClient({
          mode: "update",
          type: "viewport-update",
          clientViewportId: viewport.clientViewportId,
          range: message.range,
          rows
        });
      } else if (debounceRequest) {
        this.postMessageToClient(debounceRequest);
      }
    } else if (serverRequest) {
      this.addRequestToQueue({
        clientViewportId: message.viewport,
        message: serverRequest,
        requestId
      });
    }
  }
  // TODO check config has actually changed
  setConfig(viewport, message) {
    const requestId = nextRequestId();
    const request = viewport.setConfig(requestId, message.config);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }
  setTitle(viewport, message) {
    if (viewport) {
      viewport.title = message.title;
      this.updateTitleOnVisualLinks(viewport);
    }
  }
  select(viewport, message) {
    const [requestId, selectRequest] = stripRequestId(message);
    const request = viewport.selectRequest(selectRequest);
    this.sendMessageToServer(request, requestId);
  }
  disableAllActiveViewports() {
    console.log(\`[ServerProxy] disableAllActiveViewports\`);
    this.viewports.forEach((vp) => {
      if (isActiveViewport(vp)) {
        this.disableViewport(vp, true);
      }
    });
  }
  enableAllActiveViewports() {
    this.viewports.forEach((vp) => {
      if (vp.disabledActive) {
        this.enableViewport(vp);
      }
    });
  }
  disableViewport(viewport, disableActive = false) {
    const requestId = nextRequestId();
    const request = viewport.disable(requestId, disableActive);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }
  enableViewport(viewport) {
    if (viewport.disabled) {
      const requestId = nextRequestId();
      const request = viewport.enable(requestId);
      this.sendIfReady(request, requestId, viewport.status === "subscribed");
    }
  }
  freezeViewport(viewport) {
    const requestId = nextRequestId();
    const request = viewport.freeze(requestId);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }
  unfreezeViewport(viewport) {
    if (viewport.frozen) {
      const requestId = nextRequestId();
      const request = viewport.unfreeze(requestId);
      this.sendIfReady(request, requestId, viewport.status === "subscribed");
    }
  }
  suspendViewport(viewport, escalateToDisable = true, escalateDelay = 3e3) {
    viewport.suspend();
    if (escalateToDisable) {
      viewport.suspendTimer = setTimeout(() => {
        info3 == null ? void 0 : info3("suspendTimer expired, escalate suspend to disable");
        this.disableViewport(viewport);
      }, escalateDelay);
    }
  }
  resumeViewport(viewport) {
    if (viewport.suspendTimer) {
      debug4 == null ? void 0 : debug4("clear suspend timer");
      clearTimeout(viewport.suspendTimer);
      viewport.suspendTimer = null;
    }
    const [size, rows] = viewport.resume();
    debug4 == null ? void 0 : debug4(\`resumeViewport size \${size}, \${rows.length} rows sent to client\`);
    this.postMessageToClient({
      clientViewportId: viewport.clientViewportId,
      mode: "update",
      rows,
      size,
      type: "viewport-update"
    });
  }
  openTreeNode(viewport, message) {
    if (viewport.serverViewportId) {
      const requestId = nextRequestId();
      this.sendIfReady(
        viewport.openTreeNode(requestId, message),
        requestId,
        viewport.status === "subscribed"
      );
    }
  }
  closeTreeNode(viewport, message) {
    if (viewport.serverViewportId) {
      const requestId = nextRequestId();
      this.sendIfReady(
        viewport.closeTreeNode(requestId, message),
        requestId,
        viewport.status === "subscribed"
      );
    }
  }
  createLink(viewport, message) {
    const [requestId, visualLinkRequest] = stripRequestId(message);
    const parentVpId = this.mapClientToServerViewport.get(message.parentVpId);
    if (parentVpId) {
      const request = viewport.createLink(requestId, {
        ...visualLinkRequest,
        parentVpId
      });
      this.sendMessageToServer(request, requestId);
    } else {
      throw Error(\`createLink parent viewport not found \${message.parentVpId}\`);
    }
  }
  removeLink(viewport, message) {
    const { requestId } = message;
    const request = viewport.removeLink(requestId);
    this.sendMessageToServer(request, requestId);
  }
  updateTitleOnVisualLinks(viewport) {
    var _a;
    const { serverViewportId, title } = viewport;
    for (const vp of this.viewports.values()) {
      if (vp !== viewport && vp.links && serverViewportId && title) {
        if ((_a = vp.links) == null ? void 0 : _a.some((link) => link.parentVpId === serverViewportId)) {
          const [messageToClient] = vp.setLinks(
            addTitleToLinks(vp.links, serverViewportId, title)
          );
          this.postMessageToClient(messageToClient);
        }
      }
    }
  }
  removeViewportFromVisualLinks(serverViewportId) {
    var _a;
    for (const vp of this.viewports.values()) {
      if ((_a = vp.links) == null ? void 0 : _a.some(({ parentVpId }) => parentVpId === serverViewportId)) {
        const [messageToClient] = vp.setLinks(
          vp.links.filter(({ parentVpId }) => parentVpId !== serverViewportId)
        );
        this.postMessageToClient(messageToClient);
      }
    }
  }
  menuRpcCall(message) {
    const viewport = this.getViewportForClient(message.vpId, false);
    if (viewport == null ? void 0 : viewport.serverViewportId) {
      const [requestId, rpcRequest] = stripRequestId(message);
      this.sendMessageToServer(
        {
          ...rpcRequest,
          vpId: viewport.serverViewportId
        },
        requestId
      );
    }
  }
  rpcRequest(message) {
    if (hasViewPortContext(message)) {
      const viewport = this.getViewportForClient(
        message.context.viewPortId,
        false
      );
      if (viewport == null ? void 0 : viewport.serverViewportId) {
        const [requestId, rpcRequest] = stripRequestId(message);
        this.sendMessageToServer(
          {
            ...rpcRequest,
            context: {
              type: "VIEWPORT_CONTEXT",
              viewPortId: viewport.serverViewportId
            }
          },
          requestId
        );
      }
    } else {
      throw Error(
        \`[ServerProxy] rpcRequest only supports VIEWPORT_CONTEXT at present\`
      );
    }
  }
  handleMessageFromClient(message) {
    var _a;
    if (isViewportMessage(message) || isVisualLinkMessage(message)) {
      if (message.type === "disable") {
        const viewport = this.getViewportForClient(message.viewport, false);
        if (viewport !== null) {
          return this.disableViewport(viewport);
        } else {
          return;
        }
      } else {
        const viewport = isVisualLinkMessage(message) ? this.getViewportForClient(message.childVpId) : this.getViewportForClient(message.viewport);
        switch (message.type) {
          case "setViewRange":
            return this.setViewRange(viewport, message);
          case "config":
            return this.setConfig(viewport, message);
          case "suspend": {
            const { escalateToDisable, escalateDelay } = message;
            return this.suspendViewport(
              viewport,
              escalateToDisable,
              escalateDelay
            );
          }
          case "resume":
            return this.resumeViewport(viewport);
          case "enable":
            return this.enableViewport(viewport);
          case "FREEZE_VP":
            return this.freezeViewport(viewport);
          case "UNFREEZE_VP":
            return this.unfreezeViewport(viewport);
          case "openTreeNode":
            return this.openTreeNode(viewport, message);
          case "closeTreeNode":
            return this.closeTreeNode(viewport, message);
          case "CREATE_VISUAL_LINK":
            return this.createLink(viewport, message);
          case "REMOVE_VISUAL_LINK":
            return this.removeLink(viewport, message);
          case "setTitle":
            return this.setTitle(viewport, message);
          default:
        }
      }
    } else if (isSelectRequest(message)) {
      if (hasRequestId(message)) {
        const viewport = this.getViewportForClient(message.vpId);
        return this.select(viewport, message);
      } else {
        console.warn(\`selectRequest must have requestId\`);
      }
    } else if (isRpcServiceRequest(message)) {
      return this.rpcRequest(message);
    } else if (isVuuMenuRpcRequest(message)) {
      return this.menuRpcCall(message);
    } else if (message.type === "disconnect") {
      return this.disconnect();
    } else if (message.type === "disable-all-active") {
      return this.disableAllActiveViewports();
    } else if (message.type === "enable-all-active") {
      return this.enableAllActiveViewports();
    } else {
      const { type, requestId } = message;
      switch (type) {
        case "GET_TABLE_LIST": {
          (_a = this.tableList) != null ? _a : this.tableList = this.awaitResponseToMessage(
            { type },
            requestId
          );
          this.tableList.then((response) => {
            this.postMessageToClient({
              type: "TABLE_LIST_RESP",
              tables: response.tables,
              requestId
            });
          });
          return;
        }
        case "GET_TABLE_META": {
          this.getTableMeta(message.table, requestId).then((tableSchema) => {
            if (isErrorMessage(tableSchema)) {
            } else if (tableSchema) {
              this.postMessageToClient({
                type: "TABLE_META_RESP",
                tableSchema,
                requestId
              });
            }
          });
          return;
        }
        default:
      }
    }
    error2(
      \`Vuu ServerProxy Unexpected message from client \${JSON.stringify(
        message
      )}\`
    );
  }
  getTableMeta(table, requestId = nextRequestId()) {
    if (isSessionTable(table)) {
      return this.awaitResponseToMessage({ type: "GET_TABLE_META", table }, requestId).then(
        (resp) => isErrorMessage(resp) ? resp : createSchemaFromTableMetadata(resp)
      );
    }
    const key = \`\${table.module}:\${table.table}\`;
    let tableMetaRequest = this.cachedTableMetaRequests.get(key);
    if (!tableMetaRequest) {
      tableMetaRequest = this.awaitResponseToMessage(
        { type: "GET_TABLE_META", table },
        requestId
      );
      this.cachedTableMetaRequests.set(key, tableMetaRequest);
    }
    return tableMetaRequest == null ? void 0 : tableMetaRequest.then((response) => {
      if (isErrorMessage(response)) {
        return response;
      } else {
        return this.cacheTableMeta(response);
      }
    });
  }
  awaitResponseToMessage(message, requestId = nextRequestId()) {
    return new Promise((resolve, reject) => {
      this.sendMessageToServer(message, requestId);
      this.pendingRequests.set(requestId, { reject, resolve });
    });
  }
  sendIfReady(message, requestId, isReady = true) {
    if (isReady) {
      this.sendMessageToServer(message, requestId);
    }
    return isReady;
  }
  sendMessageToServer(body, requestId = \`\${_requestId++}\`, options = DEFAULT_OPTIONS) {
    const { module = "CORE" } = options;
    if (this.authToken) {
      this.connection.send({
        requestId,
        sessionId: this.sessionId,
        module,
        body
      });
    }
  }
  handleMessageFromServer(message) {
    var _a, _b;
    if (isLoginRejectedMessage(message)) {
      if (this.pendingLogin) {
        this.pendingLogin.reject(message.reason);
        this.pendingLogin = void 0;
        this.authToken = "";
      }
      return;
    }
    const { body, requestId, sessionId } = message;
    const pendingRequest = this.pendingRequests.get(requestId);
    if (pendingRequest) {
      const { resolve } = pendingRequest;
      this.pendingRequests.delete(requestId);
      resolve(body);
      return;
    }
    const { viewports } = this;
    switch (body.type) {
      case HB:
        this.sendMessageToServer(
          { type: HB_RESP, ts: +/* @__PURE__ */ new Date() },
          "NA"
        );
        break;
      case "LOGIN_SUCCESS":
        if (sessionId) {
          this.sessionId = sessionId;
          const loginResponse = { ...body, sessionId };
          (_a = this.pendingLogin) == null ? void 0 : _a.resolve(loginResponse);
          this.pendingLogin = void 0;
          this.postMessageToClient(loginResponse);
        } else {
          throw Error("LOGIN_SUCCESS did not provide sessionId");
        }
        break;
      case "REMOVE_VP_SUCCESS":
        {
          const viewport = viewports.get(body.viewPortId);
          if (viewport) {
            this.mapClientToServerViewport.delete(viewport.clientViewportId);
            viewports.delete(body.viewPortId);
            this.removeViewportFromVisualLinks(body.viewPortId);
          }
        }
        break;
      case "SELECT_ALL_SUCCESS":
      case "SELECT_ROW_SUCCESS":
      case "SELECT_ROW_RANGE_SUCCESS":
      case "DESELECT_ROW_SUCCESS": {
        const { type, selectedRowCount } = body;
        this.postMessageToClient({
          requestId,
          type,
          selectedRowCount
        });
        break;
      }
      case "DESELECT_ALL_SUCCESS": {
        const { type } = body;
        this.postMessageToClient({
          requestId,
          type,
          selectedRowCount: 0
        });
        break;
      }
      case "SELECT_ROW_REJECT":
      case "DESELECT_ROW_REJECT":
      case "SELECT_ROW_RANGE_REJECT":
      case "SELECT_ALL_REJECT":
      case "DESELECT_ALL_REJECT":
        console.warn(\`select error \${body.type} \${body.errorMsg}\`);
        break;
      case CHANGE_VP_SUCCESS:
      case DISABLE_VP_SUCCESS:
        if (viewports.has(body.viewPortId)) {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            const response = viewport.completeOperation(requestId);
            if (response !== void 0) {
              this.postMessageToClient(response);
              if (debugEnabled4) {
                debug4(\`postMessageToClient \${JSON.stringify(response)}\`);
              }
            }
          }
        }
        break;
      case ENABLE_VP_SUCCESS:
        {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            const response = viewport.completeOperation(requestId);
            if (response) {
              this.postMessageToClient(response);
              const [size, rows] = viewport.resume();
              this.postMessageToClient({
                clientViewportId: viewport.clientViewportId,
                mode: "update",
                rows,
                size,
                type: "viewport-update"
              });
            }
          }
        }
        break;
      case "FREEZE_VP_SUCCESS":
        {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            const response = viewport.completeOperation(requestId);
            if (response) {
              this.postMessageToClient(response);
            }
          }
        }
        break;
      case "UNFREEZE_VP_SUCCESS":
        {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            const response = viewport.completeOperation(requestId);
            if (response) {
              this.postMessageToClient(response);
            }
          }
        }
        break;
      case "TABLE_ROW":
        {
          const viewportRowMap = groupRowsByViewport(body.rows);
          if (debugEnabled4) {
            const [firstRow] = body.rows;
            if (body.rows.length === 0) {
              infoEnabled2 && info3("<=== TABLE_ROW 0 rows");
            } else if ((firstRow == null ? void 0 : firstRow.rowIndex) === -1) {
              if (body.rows.length === 1) {
                if (firstRow.updateType === "SIZE") {
                  infoEnabled2 && info3(
                    \`<=== [\${firstRow.viewPortId}] TABLE_ROW SIZE ONLY \${firstRow.vpSize}\`
                  );
                } else {
                  infoEnabled2 && info3(
                    \`<=== [\${firstRow.viewPortId}] TABLE_ROW SIZE \${firstRow.vpSize} rowIdx \${firstRow.rowIndex}\`
                  );
                }
              } else {
                infoEnabled2 && info3(
                  \`<=== TABLE_ROW \${body.rows.length} rows, SIZE \${firstRow.vpSize}, [\${body.rows.map((r) => r.rowIndex).join(",")}]\`
                );
              }
            } else {
              infoEnabled2 && info3(
                \`<=== TABLE_ROW \${body.rows.length} rows [\${body.rows.map((r) => r.rowIndex).join(",")}]\`
              );
            }
          }
          for (const [viewportId, rows] of Object.entries(viewportRowMap)) {
            const viewport = viewports.get(viewportId);
            if (viewport) {
              viewport.updateRows(rows);
            } else {
              warn2 == null ? void 0 : warn2(
                \`TABLE_ROW message received for non registered viewport \${viewportId}\`
              );
            }
          }
          this.processUpdates();
        }
        break;
      case "CHANGE_VP_RANGE_SUCCESS":
        {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            const { from, to } = body;
            infoEnabled2 && info3(
              \`<=== CHANGE_VP_RANGE_SUCCESS<#\${requestId}> \${from} - \${to}\`
            );
            viewport.completeOperation(requestId, from, to);
          }
        }
        break;
      case "CHANGE_VP_RANGE_REJECT":
        {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            infoEnabled2 && info3(
              \`<=== CHANGE_VP_RANGE_REJECT<#\${requestId}>\`
            );
            viewport.rejectOperation(requestId, body.msg);
          }
        }
        break;
      case OPEN_TREE_SUCCESS:
      case CLOSE_TREE_SUCCESS:
        break;
      case "CREATE_VISUAL_LINK_SUCCESS":
        {
          const viewport = this.viewports.get(body.childVpId);
          const parentViewport = this.viewports.get(body.parentVpId);
          if (viewport && parentViewport) {
            const { childColumnName, parentColumnName } = body;
            const response = viewport.completeOperation(
              requestId,
              childColumnName,
              parentViewport.clientViewportId,
              parentColumnName
            );
            if (response) {
              this.postMessageToClient(response);
            }
          }
        }
        break;
      case "REMOVE_VISUAL_LINK_SUCCESS":
        {
          const viewport = this.viewports.get(body.childVpId);
          if (viewport) {
            const response = viewport.completeOperation(
              requestId
            );
            if (response) {
              this.postMessageToClient(response);
            }
          }
        }
        break;
      case "VP_VISUAL_LINKS_RESP":
        {
          const activeLinkDescriptors = this.getActiveLinks(body.links);
          const viewport = this.viewports.get(body.vpId);
          if (activeLinkDescriptors.length && viewport) {
            const linkDescriptorsWithLabels = addLabelsToLinks(
              activeLinkDescriptors,
              this.viewports
            );
            const [clientMessage, pendingLink] = viewport.setLinks(
              linkDescriptorsWithLabels
            );
            this.postMessageToClient(clientMessage);
            if (pendingLink) {
              const { link, parentClientVpId } = pendingLink;
              const requestId2 = nextRequestId();
              const parentVpId = this.mapClientToServerViewport.get(parentClientVpId);
              if (parentVpId) {
                const message2 = viewport.createLink(requestId2, {
                  childVpId: body.vpId,
                  childColumnName: link.fromColumn,
                  parentColumnName: link.toColumn,
                  parentVpId,
                  type: "CREATE_VISUAL_LINK"
                });
                this.sendMessageToServer(message2, requestId2);
              }
            }
          }
        }
        break;
      case "VIEW_PORT_MENUS_RESP":
        if ((_b = body.menu) == null ? void 0 : _b.name) {
          const viewport = this.viewports.get(body.vpId);
          if (viewport) {
            const clientMessage = viewport.setMenu(body.menu);
            this.postMessageToClient(clientMessage);
          }
        }
        break;
      case "VIEW_PORT_MENU_REJ": {
        const { error: error3, rpcName, vpId } = body;
        const viewport = this.viewports.get(vpId);
        if (viewport) {
          this.postMessageToClient({
            clientViewportId: viewport.clientViewportId,
            error: error3,
            rpcName,
            type: "VIEW_PORT_MENU_REJ",
            requestId
          });
        }
        break;
      }
      case "VIEW_PORT_MENU_RESP":
        {
          if (isSessionTableActionMessage(body)) {
            const { action, rpcName } = body;
            this.awaitResponseToMessage({
              type: "GET_TABLE_META",
              table: action.table
            }).then((response) => {
              const tableSchema = createSchemaFromTableMetadata(
                response
              );
              this.postMessageToClient({
                /* MenuRpcResponse */
                rpcName,
                type: "VIEW_PORT_MENU_RESP",
                action: {
                  ...action,
                  tableSchema
                },
                tableAlreadyOpen: this.isTableOpen(action.table),
                requestId
              });
            });
          } else {
            const { action, rpcName } = body;
            this.postMessageToClient({
              /* MenuRpcResponse */
              action,
              rpcName,
              requestId,
              tableAlreadyOpen: isOpenDialogAction(action) && this.isTableOpen(action.table),
              type: "VIEW_PORT_MENU_RESP"
            });
          }
        }
        break;
      case "RPC_RESPONSE":
        {
          const { action, error: error3, result } = body;
          this.postMessageToClient({
            action,
            type: "RPC_RESPONSE",
            error: error3,
            result,
            requestId
          });
        }
        break;
      case "ERROR":
        error2(body.msg);
        break;
      default:
        infoEnabled2 && info3(\`<=== \${body["type"]}.\`);
    }
  }
  cacheTableMeta(messageBody) {
    const { module, table } = messageBody.table;
    const key = \`\${module}:\${table}\`;
    let tableSchema = this.cachedTableSchemas.get(key);
    if (!tableSchema) {
      tableSchema = createSchemaFromTableMetadata(messageBody);
      this.cachedTableSchemas.set(key, tableSchema);
    }
    return tableSchema;
  }
  isTableOpen(table) {
    if (table) {
      const tableName = table.table;
      for (const viewport of this.viewports.values()) {
        if (!viewport.suspended && viewport.table.table === tableName) {
          return true;
        }
      }
    }
  }
  // Eliminate links to suspended viewports
  getActiveLinks(linkDescriptors) {
    return linkDescriptors.filter((linkDescriptor) => {
      const viewport = this.viewports.get(linkDescriptor.parentVpId);
      return viewport && !viewport.suspended;
    });
  }
  processUpdates() {
    this.viewports.forEach((viewport) => {
      var _a;
      if (viewport.hasUpdatesToProcess) {
        const result = viewport.getClientRows();
        if (result !== NO_DATA_UPDATE) {
          const [rows, mode] = result;
          const size = viewport.getNewRowCount();
          if (size !== void 0 || rows && rows.length > 0) {
            debugEnabled4 && debug4(
              \`===> #\${viewport.clientViewportId} viewport-update \${mode}, \${(_a = rows == null ? void 0 : rows.length) != null ? _a : "no"} rows, size \${size}\`
            );
            if (mode) {
              this.postMessageToClient({
                clientViewportId: viewport.clientViewportId,
                mode,
                rows,
                size,
                type: "viewport-update"
              });
            }
          }
        }
      }
    });
  }
};

// src/worker.ts
var serverProxy;
var webSocketConnection;
var { info: info4, infoEnabled: infoEnabled3 } = logger("worker");
var sendMessageToClient = (message) => {
  postMessage(message);
};
async function connectToServer(url, protocols, token) {
  if (webSocketConnection === void 0 && serverProxy === void 0) {
    webSocketConnection = new WebSocketConnection({
      callback: (msg) => {
        if (isConnectionQualityMetrics(msg)) {
          postMessage({ type: "connection-metrics", messages: msg });
        } else {
          serverProxy.handleMessageFromServer(msg);
        }
      },
      protocols,
      url
    });
    webSocketConnection.on("connection-status", postMessage);
    serverProxy = new ServerProxy(webSocketConnection, sendMessageToClient);
  }
  await webSocketConnection.openWebSocket();
  return serverProxy.login(token);
}
var handleMessageFromClient = async ({
  data: message
}) => {
  switch (message.type) {
    case "connect":
      try {
        const loginResponse = await connectToServer(
          message.url,
          message.protocol,
          message.token
        );
        if (!loginResponse) {
          throw Error("VUU server did not return a LOGIN_SUCCESS response");
        }
        postMessage({ type: "connected", loginResponse });
      } catch (err) {
        postMessage({ type: "connection-failed", reason: String(err) });
      }
      break;
    // If any of the messages below are received BEFORE we have connected and created
    // the server - handle accordingly
    case "disconnect":
      serverProxy.disconnect();
      webSocketConnection == null ? void 0 : webSocketConnection.close();
      break;
    case "subscribe":
      infoEnabled3 && info4(\`===> \${JSON.stringify(message)}\`);
      serverProxy.subscribe(message);
      break;
    case "unsubscribe":
      infoEnabled3 && info4(\`===> \${JSON.stringify(message)}\`);
      serverProxy.unsubscribe(message.viewport);
      break;
    default:
      infoEnabled3 && info4(\`===> \${JSON.stringify(message)}\`);
      serverProxy.handleMessageFromClient(message);
  }
};
self.addEventListener("message", handleMessageFromClient);
postMessage({ type: "ready" });

`;