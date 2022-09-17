// src/websocket-connection.ts
var logger = console;
var connectionAttempts = {};
var setWebsocket = Symbol("setWebsocket");
var connectionCallback = Symbol("connectionCallback");
async function connect(connectionString, callback) {
  return makeConnection(connectionString, callback);
}
async function reconnect(connection) {
  makeConnection(connection.url, connection[connectionCallback], connection);
}
async function makeConnection(url, callback, connection) {
  const connectionStatus = connectionAttempts[url] || (connectionAttempts[url] = {
    attemptsRemaining: 5,
    status: "disconnected"
  });
  try {
    callback({ type: "connection-status", status: "connecting" });
    const reconnecting = typeof connection !== "undefined";
    const ws = await createWebsocket(url);
    console.log(
      `%c\u26A1 %c${url}`,
      "font-size: 24px;color: green;font-weight: bold;",
      "color:green; font-size: 14px;"
    );
    if (connection !== void 0) {
      connection[setWebsocket](ws);
    }
    const websocketConnection = connection ?? new WebsocketConnection(ws, url, callback);
    const status = reconnecting ? "reconnected" : "connected";
    callback({ type: "connection-status", status });
    websocketConnection.status = status;
    return websocketConnection;
  } catch (evt) {
    const retry = --connectionStatus.attemptsRemaining > 0;
    callback({
      type: "connection-status",
      status: "disconnected",
      reason: "failed to connect",
      retry
    });
    if (retry) {
      return makeConnectionIn(url, callback, connection, 1e4);
    } else {
      throw Error("Failed to establish connection");
    }
  }
}
var makeConnectionIn = (url, callback, connection, delay) => new Promise((resolve) => {
  setTimeout(() => {
    resolve(makeConnection(url, callback, connection));
  }, delay);
});
var createWebsocket = (connectionString) => new Promise((resolve, reject) => {
  const ws = new WebSocket("ws://" + connectionString);
  ws.onopen = () => resolve(ws);
  ws.onerror = (evt) => reject(evt);
});
var closeWarn = () => {
  logger.log(`Connection cannot be closed, socket not yet opened`);
};
var sendWarn = (msg) => {
  logger.log(`Message cannot be sent, socket closed: ${msg.body.type}`);
};
var parseMessage = (message) => {
  try {
    return JSON.parse(message);
  } catch (e) {
    throw Error(`Error parsing JSON response from server ${message}`);
  }
};
var WebsocketConnection = class {
  [connectionCallback];
  close = closeWarn;
  requiresLogin = true;
  send = sendWarn;
  status = "ready";
  url;
  constructor(ws, url, callback) {
    this.url = url;
    this[connectionCallback] = callback;
    this[setWebsocket](ws);
  }
  reconnect() {
    reconnect(this);
  }
  [setWebsocket](ws) {
    const callback = this[connectionCallback];
    ws.onmessage = (evt) => {
      const vuuMessageFromServer = parseMessage(evt.data);
      callback(vuuMessageFromServer);
    };
    ws.onerror = () => {
      console.log(
        `%c\u26A1 %c${this.url}`,
        "font-size: 24px;color: red;font-weight: bold;",
        "color:red; font-size: 14px;"
      );
      callback({
        type: "connection-status",
        status: "disconnected",
        reason: "error"
      });
      if (this.status !== "closed") {
        reconnect(this);
        this.send = queue;
      }
    };
    ws.onclose = () => {
      console.log(
        `%c\u26A1 %c${this.url}`,
        "font-size: 24px;color: orange;font-weight: bold;",
        "color:orange; font-size: 14px;"
      );
      callback({
        type: "connection-status",
        status: "disconnected",
        reason: "close"
      });
      if (this.status !== "closed") {
        reconnect(this);
        this.send = queue;
      }
    };
    const send = (msg) => {
      ws.send(JSON.stringify(msg));
    };
    const queue = (msg) => {
      console.log(`queuing message ${JSON.stringify(msg)} until websocket reconnected`);
    };
    this.send = send;
    this.close = () => {
      console.log("[Connection] close websocket");
      this.status = "closed";
      ws.close();
      this.close = closeWarn;
      this.send = sendWarn;
    };
  }
};

// src/server-proxy/messages.ts
var CHANGE_VP = "CHANGE_VP";
var CHANGE_VP_SUCCESS = "CHANGE_VP_SUCCESS";
var CHANGE_VP_RANGE = "CHANGE_VP_RANGE";
var CHANGE_VP_RANGE_SUCCESS = "CHANGE_VP_RANGE_SUCCESS";
var CLOSE_TREE_NODE = "CLOSE_TREE_NODE";
var CLOSE_TREE_SUCCESS = "CLOSE_TREE_SUCCESS";
var CREATE_VISUAL_LINK = "CREATE_VISUAL_LINK";
var CREATE_VISUAL_LINK_SUCCESS = "CREATE_VISUAL_LINK_SUCCESS";
var CREATE_VP = "CREATE_VP";
var CREATE_VP_SUCCESS = "CREATE_VP_SUCCESS";
var DISABLE_VP = "DISABLE_VP";
var DISABLE_VP_SUCCESS = "DISABLE_VP_SUCCESS";
var ENABLE_VP = "ENABLE_VP";
var ENABLE_VP_SUCCESS = "ENABLE_VP_SUCCESS";
var GET_TABLE_LIST = "GET_TABLE_LIST";
var GET_TABLE_META = "GET_TABLE_META";
var GET_VP_VISUAL_LINKS = "GET_VP_VISUAL_LINKS";
var GET_VIEW_PORT_MENUS = "GET_VIEW_PORT_MENUS";
var VIEW_PORT_MENUS_RESP = "VIEW_PORT_MENUS_RESP";
var VIEW_PORT_MENU_RESP = "VIEW_PORT_MENU_RESP";
var HB = "HB";
var HB_RESP = "HB_RESP";
var LOGIN = "LOGIN";
var LOGIN_SUCCESS = "LOGIN_SUCCESS";
var OPEN_TREE_NODE = "OPEN_TREE_NODE";
var OPEN_TREE_SUCCESS = "OPEN_TREE_SUCCESS";
var REMOVE_VP = "REMOVE_VP";
var REMOVE_VP_SUCCESS = "REMOVE_VP_SUCCESS";
var RPC_CALL = "RPC_CALL";
var RPC_RESP = "RPC_RESP";
var SET_SELECTION = "SET_SELECTION";
var SET_SELECTION_SUCCESS = "SET_SELECTION_SUCCESS";
var TABLE_META_RESP = "TABLE_META_RESP";
var TABLE_LIST_RESP = "TABLE_LIST_RESP";
var VP_VISUAL_LINKS_RESP = "VP_VISUAL_LINKS_RESP";
var TABLE_ROW = "TABLE_ROW";

// src/server-proxy/keyset.ts
var KeySet = class {
  keys;
  free;
  nextKeyValue;
  constructor(range) {
    this.keys = /* @__PURE__ */ new Map();
    this.free = [];
    this.nextKeyValue = 0;
    this.reset(range);
  }
  next() {
    if (this.free.length > 0) {
      return this.free.pop();
    } else {
      return this.nextKeyValue++;
    }
  }
  reset({ from, to }) {
    this.keys.forEach((keyValue, rowIndex) => {
      if (rowIndex < from || rowIndex >= to) {
        this.free.push(keyValue);
        this.keys.delete(rowIndex);
      }
    });
    const size = to - from;
    if (this.keys.size + this.free.length > size) {
      this.free.length = size - this.keys.size;
    }
    for (let rowIndex = from; rowIndex < to; rowIndex++) {
      if (!this.keys.has(rowIndex)) {
        const nextKeyValue = this.next();
        this.keys.set(rowIndex, nextKeyValue);
      }
    }
  }
  keyFor(rowIndex) {
    const key = this.keys.get(rowIndex);
    if (key === void 0) {
      throw Error(`KeySet, no key found for rowIndex ${rowIndex}`);
    }
    return key;
  }
};

// ../utils/src/input-utils.ts
var actionKeys = {
  Enter: "Enter",
  Delete: "Delete"
};
var navigationKeys = {
  Home: "Home",
  End: "End",
  ArrowRight: "ArrowRight",
  ArrowLeft: "ArrowLeft",
  ArrowDown: "ArrowDown",
  ArrowUp: "ArrowUp",
  Tab: "Tab"
};
var functionKeys = {
  F1: "F1",
  F2: "F2",
  F3: "F3",
  F4: "F4",
  F5: "F5",
  F6: "F6",
  F7: "F7",
  F8: "F8",
  F9: "F9",
  F10: "F10",
  F11: "F11",
  F12: "F12"
};
var specialKeys = {
  ...actionKeys,
  ...navigationKeys,
  ...functionKeys
};

// ../utils/src/range-utils.ts
function getFullRange({ from, to }, bufferSize = 0, rowCount = Number.MAX_SAFE_INTEGER) {
  if (bufferSize === 0) {
    return { from, to: Math.min(to, rowCount) };
  } else if (from === 0) {
    return { from, to: Math.min(to + bufferSize, rowCount) };
  } else {
    const rangeSize = to - from;
    const buff = Math.round(bufferSize / 2);
    const shortfallBefore = from - buff < 0;
    const shortFallAfter = rowCount - (to + buff) < 0;
    if (shortfallBefore && shortFallAfter) {
      return { from: 0, to: rowCount };
    } else if (shortfallBefore) {
      return { from: 0, to: rangeSize + bufferSize };
    } else if (shortFallAfter) {
      return { from: Math.max(0, rowCount - (rangeSize + bufferSize)), to: rowCount };
    } else {
      return { from: from - buff, to: to + buff };
    }
  }
}
var WindowRange = class {
  from;
  to;
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }
  isWithin(index) {
    return index >= this.from && index < this.to;
  }
  overlap(from, to) {
    return from >= this.to || to < this.from ? [0, 0] : [Math.max(from, this.from), Math.min(to, this.to)];
  }
  copy() {
    return new WindowRange(this.from, this.to);
  }
};

// src/server-proxy/buffer-range.ts
var bufferBreakout = (range, from, to, bufferSize) => {
  const bufferPerimeter = bufferSize * 0.25;
  if (!range || !bufferSize) {
    return true;
  } else if (range.to - to < bufferPerimeter) {
    return true;
  } else if (range.from > 0 && from - range.from < bufferPerimeter) {
    return true;
  } else {
    return false;
  }
};

// src/server-proxy/array-backed-moving-window.ts
var EMPTY_ARRAY = [];
var ArrayBackedMovingWindow = class {
  bufferSize;
  range;
  internalData;
  rowsWithinRange;
  clientRange;
  rowCount;
  constructor({ from: clientFrom, to: clientTo }, { from, to }, bufferSize) {
    this.bufferSize = bufferSize;
    this.clientRange = new WindowRange(clientFrom, clientTo);
    this.range = new WindowRange(from, to);
    this.internalData = new Array(bufferSize);
    this.rowsWithinRange = 0;
    this.rowCount = 0;
  }
  get hasAllRowsWithinRange() {
    return this.rowsWithinRange === this.clientRange.to - this.clientRange.from || this.rowCount > 0 && this.rowsWithinRange === this.rowCount;
  }
  setRowCount = (rowCount) => {
    if (rowCount < this.internalData.length) {
      this.internalData.length = rowCount;
    }
    if (rowCount < this.rowCount) {
      this.rowsWithinRange = 0;
      const end = Math.min(rowCount, this.clientRange.to);
      for (let i = this.clientRange.from; i < end; i++) {
        const rowIndex = i - this.range.from;
        if (this.internalData[rowIndex] !== void 0) {
          this.rowsWithinRange += 1;
        }
      }
    }
    this.rowCount = rowCount;
  };
  setAtIndex(index, data) {
    const isWithinClientRange = this.isWithinClientRange(index);
    if (isWithinClientRange || this.isWithinRange(index)) {
      const internalIndex = index - this.range.from;
      if (!this.internalData[internalIndex] && isWithinClientRange) {
        this.rowsWithinRange += 1;
      }
      this.internalData[internalIndex] = data;
    }
    return isWithinClientRange;
  }
  getAtIndex(index) {
    return this.range.isWithin(index) && this.internalData[index - this.range.from] != null ? this.internalData[index - this.range.from] : void 0;
  }
  isWithinRange(index) {
    return this.range.isWithin(index);
  }
  isWithinClientRange(index) {
    return this.clientRange.isWithin(index);
  }
  setClientRange(from, to) {
    const currentFrom = this.clientRange.from;
    const currentTo = Math.min(this.clientRange.to, this.rowCount);
    if (from === currentFrom && to === currentTo) {
      return [false, EMPTY_ARRAY, EMPTY_ARRAY];
    }
    const originalRange = this.clientRange.copy();
    this.clientRange.from = from;
    this.clientRange.to = to;
    this.rowsWithinRange = 0;
    for (let i = from; i < to; i++) {
      const internalIndex = i - this.range.from;
      if (this.internalData[internalIndex]) {
        this.rowsWithinRange += 1;
      }
    }
    let clientRows = EMPTY_ARRAY;
    let holdingRows = EMPTY_ARRAY;
    const offset = this.range.from;
    if (this.hasAllRowsWithinRange) {
      if (to > originalRange.to) {
        const start = Math.max(from, originalRange.to);
        clientRows = this.internalData.slice(start - offset, to - offset);
      } else {
        const end = Math.min(originalRange.from, to);
        clientRows = this.internalData.slice(from - offset, end - offset);
      }
    } else if (this.rowsWithinRange > 0) {
      if (to > originalRange.to) {
        const start = Math.max(from, originalRange.to);
        holdingRows = this.internalData.slice(start - offset, to - offset).filter((row) => !!row);
      } else {
        const end = Math.max(originalRange.from, to);
        holdingRows = this.internalData.slice(Math.max(0, from - offset), end - offset).filter((row) => !!row);
      }
    }
    const serverDataRequired = bufferBreakout(this.range, from, to, this.bufferSize);
    return [serverDataRequired, clientRows, holdingRows];
  }
  setRange(from, to) {
    const [overlapFrom, overlapTo] = this.range.overlap(from, to);
    const newData = new Array(to - from + this.bufferSize);
    this.rowsWithinRange = 0;
    for (let i = overlapFrom; i < overlapTo; i++) {
      const data = this.getAtIndex(i);
      if (data) {
        const index = i - from;
        newData[index] = data;
        if (this.isWithinClientRange(i)) {
          this.rowsWithinRange += 1;
        }
      }
    }
    this.internalData = newData;
    this.range.from = from;
    this.range.to = to;
  }
  getData() {
    const { from, to } = this.range;
    const { from: clientFrom, to: clientTo } = this.clientRange;
    const startOffset = Math.max(0, clientFrom - from);
    const endOffset = Math.min(to - from, to, clientTo - from, this.rowCount ?? to);
    return this.internalData.slice(startOffset, endOffset);
  }
};

// src/server-proxy/viewport.ts
var EMPTY_ARRAY2 = [];
var EMPTY_GROUPBY = [];
var byRowIndex = ([index1], [index2]) => index1 - index2;
var Viewport = class {
  aggregations;
  bufferSize;
  clientRange;
  columns;
  dataWindow = void 0;
  disabled = false;
  filter;
  filterSpec;
  groupBy;
  hasUpdates = false;
  holdingPen = [];
  keys;
  lastTouchIdx = null;
  links = [];
  linkedParent = null;
  pendingLinkedParent;
  pendingOperations = /* @__PURE__ */ new Map();
  pendingRangeRequest = null;
  rowCountChanged = false;
  sort;
  clientViewportId;
  isTree = false;
  serverViewportId;
  status = "";
  suspended = false;
  table;
  constructor({
    viewport,
    tablename,
    aggregations,
    columns,
    range,
    bufferSize = 50,
    filter = "",
    filterQuery = "",
    sort = [],
    groupBy = [],
    visualLink
  }) {
    this.clientViewportId = viewport;
    this.table = tablename;
    this.aggregations = aggregations;
    this.columns = columns;
    this.clientRange = range;
    this.bufferSize = bufferSize;
    this.sort = {
      sortDefs: sort
    };
    this.groupBy = groupBy;
    this.filterSpec = {
      filter: filterQuery
    };
    this.filter = filter;
    this.keys = new KeySet(range);
    this.pendingLinkedParent = visualLink;
  }
  get hasUpdatesToProcess() {
    if (this.suspended) {
      return false;
    }
    return this.rowCountChanged || this.hasUpdates;
  }
  subscribe() {
    return {
      type: CREATE_VP,
      table: this.table,
      range: getFullRange(this.clientRange, this.bufferSize),
      aggregations: this.aggregations,
      columns: this.columns,
      sort: this.sort,
      groupBy: this.groupBy,
      filterSpec: this.filterSpec
    };
  }
  handleSubscribed({
    viewPortId,
    aggregations,
    columns,
    range,
    sort,
    groupBy,
    filterSpec
  }) {
    this.serverViewportId = viewPortId;
    this.status = "subscribed";
    this.aggregations = aggregations;
    this.columns = columns;
    this.groupBy = groupBy;
    this.filterSpec = filterSpec;
    this.isTree = groupBy && groupBy.length > 0;
    this.dataWindow = new ArrayBackedMovingWindow(this.clientRange, range, this.bufferSize);
    console.log(
      `%cViewport subscribed
        clientVpId: ${this.clientViewportId}
        serverVpId: ${this.serverViewportId}
        table: ${this.table}
        aggregations: ${JSON.stringify(aggregations)}
        columns: ${columns.join(",")}
        range: ${JSON.stringify(range)}
        sort: ${JSON.stringify(sort)}
        groupBy: ${JSON.stringify(groupBy)}
        filterSpec: ${JSON.stringify(filterSpec)}
        bufferSize: ${this.bufferSize}
      `,
      "color: blue"
    );
    return {
      type: "subscribed",
      clientViewportId: this.clientViewportId,
      columns,
      filter: this.filter,
      filterSpec: this.filterSpec
    };
  }
  awaitOperation(requestId, msg) {
    this.pendingOperations.set(requestId, msg);
  }
  completeOperation(requestId, ...params) {
    const { clientViewportId, pendingOperations } = this;
    const { type, data } = pendingOperations.get(requestId);
    pendingOperations.delete(requestId);
    if (type === CHANGE_VP_RANGE) {
      const [from, to] = params;
      this.dataWindow?.setRange(from, to);
      this.pendingRangeRequest = null;
    } else if (type === "groupBy") {
      this.isTree = true;
      this.groupBy = data;
      return { clientViewportId, type, groupBy: data };
    } else if (type === "groupByClear") {
      this.isTree = false;
      this.groupBy = [];
      return { clientViewportId, type: "groupBy", groupBy: null };
    } else if (type === "filter") {
      this.filterSpec = { filter: data.filterQuery };
      return { clientViewportId, type, ...data };
    } else if (type === "aggregate") {
      this.aggregations = data;
      return { clientViewportId, type, aggregations: data };
    } else if (type === "sort") {
      this.sort = { sortDefs: data };
      return { clientViewportId, type, sort: data };
    } else if (type === "selection") {
    } else if (type === "disable") {
      this.disabled = true;
      return {
        type: "disabled",
        clientViewportId
      };
    } else if (type === "enable") {
      this.disabled = false;
      return {
        type: "enabled",
        clientViewportId
      };
    } else if (type === CREATE_VISUAL_LINK) {
      const [colName, parentViewportId, parentColName] = params;
      this.linkedParent = {
        colName,
        parentViewportId,
        parentColName
      };
      this.pendingLinkedParent = null;
      return {
        type: "visual-link-created",
        clientViewportId,
        colName,
        parentViewportId,
        parentColName
      };
    }
  }
  rangeRequest(requestId, range) {
    const type = CHANGE_VP_RANGE;
    if (this.dataWindow) {
      const [serverDataRequired, clientRows, holdingRows] = this.dataWindow.setClientRange(
        range.from,
        range.to
      );
      const serverRequest = serverDataRequired && bufferBreakout(this.pendingRangeRequest, range.from, range.to, this.bufferSize) ? {
        type,
        viewPortId: this.serverViewportId,
        ...getFullRange(range, this.bufferSize, this.dataWindow.rowCount)
      } : null;
      if (serverRequest) {
        this.awaitOperation(requestId, { type });
        this.pendingRangeRequest = serverRequest;
      }
      this.keys.reset(this.dataWindow.clientRange);
      const rowWithinRange = ([index]) => index < range.from || index >= range.to;
      if (this.holdingPen.some(rowWithinRange)) {
        this.holdingPen = this.holdingPen.filter(
          ([index]) => index >= range.from && index < range.to
        );
      }
      const toClient = this.isTree ? toClientRowTree(this.groupBy, this.columns) : toClientRow;
      if (holdingRows.length) {
        holdingRows.forEach((row) => {
          this.holdingPen.push(toClient(row, this.keys));
        });
      }
      if (clientRows.length) {
        return [
          serverRequest,
          clientRows.map((row) => {
            return toClient(row, this.keys);
          })
        ];
      } else {
        return [serverRequest];
      }
    } else {
      return [null];
    }
  }
  setLinks(links) {
    this.links = links;
    return [
      {
        type: "VP_VISUAL_LINKS_RESP",
        links,
        clientViewportId: this.clientViewportId
      },
      this.pendingLinkedParent
    ];
  }
  setMenu(menu) {
    return {
      type: "VIEW_PORT_MENUS_RESP",
      menu,
      clientViewportId: this.clientViewportId
    };
  }
  createLink(requestId, colName, parentVpId, parentColumnName) {
    const message = {
      type: CREATE_VISUAL_LINK,
      parentVpId,
      childVpId: this.serverViewportId,
      parentColumnName,
      childColumnName: colName
    };
    this.awaitOperation(requestId, message);
    return message;
  }
  suspend() {
    this.suspended = true;
  }
  resume() {
    this.suspended = false;
    return this.currentData();
  }
  currentData() {
    const out = [];
    if (this.dataWindow) {
      const records = this.dataWindow.getData();
      const { keys } = this;
      const toClient = this.isTree ? toClientRowTree(this.groupBy, this.columns) : toClientRow;
      for (let row of records) {
        if (row) {
          out.push(toClient(row, keys));
        }
      }
    }
    return out;
  }
  enable(requestId) {
    this.awaitOperation(requestId, { type: "enable" });
    return {
      type: ENABLE_VP,
      viewPortId: this.serverViewportId
    };
  }
  disable(requestId) {
    this.awaitOperation(requestId, { type: "disable" });
    return {
      type: DISABLE_VP,
      viewPortId: this.serverViewportId
    };
  }
  filterRequest(requestId, filter, filterQuery) {
    this.awaitOperation(requestId, { type: "filter", data: { filter, filterQuery } });
    return this.createRequest({ filterSpec: { filter: filterQuery } });
  }
  aggregateRequest(requestId, aggregations) {
    this.awaitOperation(requestId, { type: "aggregate", data: aggregations });
    return this.createRequest({ aggregations });
  }
  sortRequest(requestId, sortCols) {
    this.awaitOperation(requestId, { type: "sort", data: sortCols });
    return this.createRequest({ sort: { sortDefs: sortCols } });
  }
  groupByRequest(requestId, groupBy = EMPTY_GROUPBY) {
    const type = groupBy === EMPTY_ARRAY2 ? "groupByClear" : "groupBy";
    this.awaitOperation(requestId, { type, data: groupBy });
    return this.createRequest({ groupBy });
  }
  selectRequest(requestId, selection) {
    this.awaitOperation(requestId, { type: "selection", data: selection });
    return {
      type: SET_SELECTION,
      vpId: this.serverViewportId,
      selection
    };
  }
  handleUpdate(updateType, rowIndex, row) {
    if (this.dataWindow) {
      if (this.dataWindow.rowCount !== row.vpSize) {
        this.dataWindow.setRowCount(row.vpSize);
        this.rowCountChanged = true;
      }
      if (updateType === "U") {
        if (this.dataWindow.setAtIndex(rowIndex, row)) {
          this.hasUpdates = true;
        }
      }
    }
  }
  getNewRowCount = () => {
    if (this.rowCountChanged && this.dataWindow) {
      this.rowCountChanged = false;
      return this.dataWindow.rowCount;
    }
  };
  getClientRows(timeStamp) {
    if (this.hasUpdates && this.dataWindow) {
      const records = this.dataWindow.getData();
      const { keys } = this;
      const toClient = this.isTree ? toClientRowTree(this.groupBy, this.columns) : toClientRow;
      const clientRows = this.dataWindow.hasAllRowsWithinRange ? this.holdingPen.splice(0) : void 0;
      const out = clientRows || this.holdingPen;
      for (let row of records) {
        if (row && row.ts >= timeStamp) {
          out.push(toClient(row, keys));
        }
      }
      this.hasUpdates = false;
      return clientRows && clientRows.sort(byRowIndex);
    }
  }
  createRequest(params) {
    return {
      type: CHANGE_VP,
      viewPortId: this.serverViewportId,
      aggregations: this.aggregations,
      columns: this.columns,
      sort: this.sort,
      groupBy: this.groupBy,
      filterSpec: this.filterSpec,
      ...params
    };
  }
};
var toClientRow = ({ rowIndex, rowKey, sel: isSelected, data }, keys) => [rowIndex, keys.keyFor(rowIndex), true, null, null, 1, rowKey, isSelected].concat(
  data
);
var toClientRowTree = (groupBy, columns) => ({ rowIndex, rowKey, sel: isSelected, data }, keys) => {
  let [depth, isExpanded, , isLeaf, , count, ...rest] = data;
  const steps = rowKey.split("|").slice(1);
  groupBy.forEach((col, i) => {
    const idx = columns.indexOf(col);
    rest[idx] = steps[i];
  });
  const record = [
    rowIndex,
    keys.keyFor(rowIndex),
    isLeaf,
    isExpanded,
    depth,
    count,
    rowKey,
    isSelected
  ].concat(rest);
  return record;
};

// src/server-proxy/rpc-services.js
var getRpcService = (method) => {
  switch (method) {
    case "getUniqueFieldValues":
      return ["TypeAheadRpcHandler", "TYPEAHEAD"];
    default:
      return ["OrderEntryRpcHandler", "SIMUL"];
  }
};

// src/vuuUIMessageTypes.ts
var isConnectionStatusMessage = (msg) => msg.type === "connection-status";
var isViewporttMessage = (msg) => "viewport" in msg;

// src/server-proxy/server-proxy.ts
var _requestId = 1;
var nextRequestId = () => `${_requestId++}`;
var EMPTY_ARRAY3 = [];
var DEFAULT_OPTIONS = {};
var getRPCType = (msgType2, context) => {
  if (msgType2 === "MENU_RPC_CALL" && context === "selected-rows") {
    return "VIEW_PORT_MENUS_SELECT_RPC";
  } else {
    throw Error("No RPC command for ${msgType} / ${context}");
  }
};
var ServerProxy = class {
  connection;
  postMessageToClient;
  viewports;
  mapClientToServerViewport;
  authToken;
  pendingLogin;
  sessionId;
  queuedRequests = [];
  constructor(connection, callback) {
    this.connection = connection;
    this.postMessageToClient = callback;
    this.viewports = /* @__PURE__ */ new Map();
    this.mapClientToServerViewport = /* @__PURE__ */ new Map();
  }
  async login(authToken) {
    if (authToken) {
      this.authToken = authToken;
    }
    const token = this.authToken;
    if (token === void 0) {
      throw Error(`ServerProxy login, cannot login until auth token has been obtained`);
    }
    return new Promise((resolve, reject) => {
      this.sendMessageToServer({ type: LOGIN, token, user: "user" }, "");
      this.pendingLogin = { resolve, reject };
    });
  }
  subscribe(message) {
    if (!this.mapClientToServerViewport.has(message.viewport)) {
      const viewport = new Viewport(message);
      this.viewports.set(message.viewport, viewport);
      this.sendIfReady(viewport.subscribe(), message.viewport, this.sessionId !== "");
    } else {
      console.log(`ServerProxy spurious subscribe call ${message.viewport}`);
    }
  }
  unsubscribe(clientViewportId) {
    const serverViewportId = this.mapClientToServerViewport.get(clientViewportId);
    if (serverViewportId) {
      this.sendMessageToServer({
        type: REMOVE_VP,
        viewPortId: serverViewportId
      });
    } else {
      console.error(`ServerProxy: failed to unsubscribe client viewport ${clientViewportId}`);
    }
  }
  getViewportForClient(clientViewportId) {
    const serverViewportId = this.mapClientToServerViewport.get(clientViewportId);
    if (serverViewportId) {
      const viewport = this.viewports.get(serverViewportId);
      if (viewport) {
        return viewport;
      } else {
        throw Error(`Viewport not found for client viewport ${clientViewportId}`);
      }
    } else {
      throw Error(`Viewport server id not found for client viewport ${clientViewportId}`);
    }
  }
  setViewRange(viewport, message) {
    const requestId = nextRequestId();
    const [serverRequest, rows] = viewport.rangeRequest(requestId, message.range);
    if (serverRequest) {
      this.sendIfReady(serverRequest, requestId, viewport.status === "subscribed");
    }
    if (rows) {
      this.postMessageToClient({
        type: "viewport-updates",
        viewports: {
          [viewport.clientViewportId]: { rows }
        }
      });
    }
  }
  aggregate(viewport, message) {
    const requestId = nextRequestId();
    const request = viewport.aggregateRequest(requestId, message.aggregations);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }
  sort(viewport, message) {
    const requestId = nextRequestId();
    const request = viewport.sortRequest(requestId, message.sortCriteria);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }
  groupBy(viewport, message) {
    const requestId = nextRequestId();
    const request = viewport.groupByRequest(requestId, message.groupBy);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }
  filter(viewport, message) {
    const requestId = nextRequestId();
    const { filter, filterQuery } = message;
    const request = viewport.filterRequest(requestId, filter, filterQuery);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }
  select(viewport, message) {
    const requestId = nextRequestId();
    const { selected } = message;
    const request = viewport.selectRequest(requestId, selected);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }
  disableViewport(viewport, message) {
    const requestId = nextRequestId();
    const request = viewport.disable(requestId);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }
  enableViewport(viewport, message) {
    const requestId = nextRequestId();
    const request = viewport.enable(requestId);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }
  resumeViewport(viewport) {
    const rows = viewport.resume();
    this.postMessageToClient({
      type: "viewport-updates",
      viewports: {
        [viewport.clientViewportId]: { rows }
      }
    });
  }
  openTreeNode(viewport, message) {
    if (viewport.serverViewportId) {
      this.sendIfReady(
        {
          type: OPEN_TREE_NODE,
          vpId: viewport.serverViewportId,
          treeKey: message.key
        },
        nextRequestId(),
        viewport.status === "subscribed"
      );
    }
  }
  closeTreeNode(viewport, message) {
    if (viewport.serverViewportId) {
      this.sendIfReady(
        {
          type: CLOSE_TREE_NODE,
          vpId: viewport.serverViewportId,
          treeKey: message.key
        },
        nextRequestId(),
        viewport.status === "subscribed"
      );
    }
  }
  createLink(viewport, message) {
    const { parentVpId, parentColumnName, childColumnName } = message;
    const requestId = nextRequestId();
    const request = viewport.createLink(requestId, childColumnName, parentVpId, parentColumnName);
    this.sendMessageToServer(request, requestId);
  }
  menuRpcCall(viewport, message) {
    if (viewport.serverViewportId) {
      const { context, rpcName } = message;
      this.sendMessageToServer(
        {
          type: getRPCType(message.type, context),
          rpcName,
          vpId: viewport.serverViewportId
        },
        message.requestId
      );
    }
  }
  rpcCall(message) {
    const { method, requestId, type } = message;
    const [service, module] = getRpcService(method);
    this.sendMessageToServer(
      {
        type,
        service,
        method,
        params: message.params,
        namedParams: {}
      },
      requestId,
      { module }
    );
  }
  handleMessageFromClient(message) {
    if (isViewporttMessage(message)) {
      const viewport = this.getViewportForClient(message.viewport);
      switch (message.type) {
        case "setViewRange":
          return this.setViewRange(viewport, message);
        case "aggregate":
          return this.aggregate(viewport, message);
        case "sort":
          return this.sort(viewport, message);
        case "groupBy":
          return this.groupBy(viewport, message);
        case "filterQuery":
          return this.filter(viewport, message);
        case "select":
          return this.select(viewport, message);
        case "suspend":
          return viewport.suspend();
        case "resume":
          return this.resumeViewport(viewport);
        case "disable":
          return this.disableViewport(viewport, message);
        case "enable":
          return this.enableViewport(viewport, message);
        case "openTreeNode":
          return this.openTreeNode(viewport, message);
        case "closeTreeNode":
          return this.closeTreeNode(viewport, message);
        case "createLink":
          return this.createLink(viewport, message);
        case "MENU_RPC_CALL":
          return this.menuRpcCall(viewport, message);
        default:
      }
    } else {
      const { type, requestId } = message;
      switch (type) {
        case GET_TABLE_LIST:
          return this.sendMessageToServer({ type }, requestId);
        case GET_TABLE_META:
          return this.sendMessageToServer({ type, table: message.table }, requestId);
        case RPC_CALL:
          return this.rpcCall(message);
        default:
      }
    }
    console.log(`Vuu ServerProxy Unexpected message from client ${JSON.stringify(message)}`);
  }
  sendIfReady(message, requestId, isReady = true, options) {
    if (isReady) {
      this.sendMessageToServer(message, requestId, options);
    } else {
      this.queuedRequests.push(message);
    }
    return isReady;
  }
  sendMessageToServer(body, requestId = `${_requestId++}`, options = DEFAULT_OPTIONS) {
    const { module = "CORE", ...restOptions } = options;
    if (this.authToken) {
      this.connection.send(
        {
          requestId,
          sessionId: this.sessionId,
          token: this.authToken,
          user: "user",
          module,
          body
        }
      );
    }
  }
  handleMessageFromServer(message) {
    const { body, requestId, sessionId } = message;
    const { viewports } = this;
    switch (body.type) {
      case HB:
        this.sendMessageToServer({ type: HB_RESP, ts: +new Date() }, "NA");
        break;
      case LOGIN_SUCCESS:
        this.sessionId = sessionId;
        this.pendingLogin?.resolve(sessionId);
        break;
      case CREATE_VP_SUCCESS:
        {
          const viewport2 = viewports.get(requestId);
          if (viewport2) {
            const { viewPortId: serverViewportId } = body;
            if (requestId !== serverViewportId) {
              viewports.delete(requestId);
              viewports.set(serverViewportId, viewport2);
            }
            this.mapClientToServerViewport.set(requestId, serverViewportId);
            const response = viewport2.handleSubscribed(body);
            if (response) {
              this.postMessageToClient(response);
            }
            this.sendMessageToServer({ type: GET_VP_VISUAL_LINKS, vpId: serverViewportId });
            this.sendMessageToServer({ type: GET_VIEW_PORT_MENUS, vpId: serverViewportId });
          }
        }
        break;
      case REMOVE_VP_SUCCESS:
        {
          const viewport2 = this.viewports.get(body.viewPortId);
          if (viewport2) {
            this.mapClientToServerViewport.delete(viewport2.clientViewportId);
            viewports.delete(body.viewPortId);
          }
        }
        break;
      case SET_SELECTION_SUCCESS:
        const viewport = this.viewports.get(body.vpId);
        if (viewport) {
          viewport.completeOperation(requestId);
        }
        break;
      case CHANGE_VP_SUCCESS:
      case DISABLE_VP_SUCCESS:
        if (viewports.has(body.viewPortId)) {
          const viewport2 = this.viewports.get(body.viewPortId);
          if (viewport2) {
            const response = viewport2.completeOperation(requestId);
            if (response) {
              this.postMessageToClient(response);
            }
          }
        }
        break;
      case ENABLE_VP_SUCCESS:
        {
          const viewport2 = this.viewports.get(body.viewPortId);
          if (viewport2) {
            const response = viewport2.completeOperation(requestId);
            if (response) {
              this.postMessageToClient(response);
              const rows = viewport2.currentData();
              const clientMessage = {
                type: "viewport-updates",
                viewports: {
                  [viewport2.clientViewportId]: { rows }
                }
              };
              this.postMessageToClient(clientMessage);
            }
          }
        }
        break;
      case TABLE_ROW:
        {
          const { timeStamp } = body;
          const [{ ts: firstBatchTimestamp } = { ts: timeStamp }] = body.rows || EMPTY_ARRAY3;
          for (const row of body.rows) {
            const { viewPortId, rowIndex, rowKey, updateType } = row;
            const viewport2 = viewports.get(viewPortId);
            if (viewport2) {
              if (viewport2.isTree && updateType === "U" && !rowKey.startsWith("$root")) {
                console.log("Ignore blank rows sent after GroupBy");
              } else {
                viewport2.handleUpdate(updateType, rowIndex, row);
              }
            } else {
              console.warn(`TABLE_ROW message received for non registered viewport ${viewPortId}`);
            }
          }
          this.processUpdates(firstBatchTimestamp);
        }
        break;
      case CHANGE_VP_RANGE_SUCCESS:
        {
          const viewport2 = this.viewports.get(body.viewPortId);
          if (viewport2) {
            const { from, to } = body;
            viewport2.completeOperation(requestId, from, to);
          }
        }
        break;
      case OPEN_TREE_SUCCESS:
      case CLOSE_TREE_SUCCESS:
        break;
      case CREATE_VISUAL_LINK_SUCCESS:
        {
          const viewport2 = this.viewports.get(body.childVpId);
          const parentViewport = this.viewports.get(body.parentVpId);
          if (viewport2 && parentViewport) {
            const { childColumnName, parentColumnName } = body;
            const response = viewport2.completeOperation(
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
      case TABLE_LIST_RESP:
        this.postMessageToClient({
          type: TABLE_LIST_RESP,
          tables: body.tables,
          requestId
        });
        break;
      case TABLE_META_RESP:
        this.postMessageToClient({
          type: TABLE_META_RESP,
          table: body.table,
          columns: body.columns,
          dataTypes: body.dataTypes,
          requestId
        });
        break;
      case VP_VISUAL_LINKS_RESP:
        {
          const links = this.getActiveLinks(body.links);
          const viewport2 = this.viewports.get(body.vpId);
          if (links.length && viewport2) {
            const [clientMessage, pendingLink] = viewport2.setLinks(links);
            this.postMessageToClient(clientMessage);
            if (pendingLink) {
              const { colName, parentViewportId, parentColName } = pendingLink;
              const requestId2 = nextRequestId();
              const serverViewportId = this.mapClientToServerViewport.get(parentViewportId);
              if (serverViewportId) {
                const message2 = viewport2.createLink(
                  requestId2,
                  colName,
                  serverViewportId,
                  parentColName
                );
                this.sendMessageToServer(message2, requestId2);
              }
            }
          }
        }
        break;
      case VIEW_PORT_MENUS_RESP:
        if (body.menu.name) {
          const viewport2 = this.viewports.get(body.vpId);
          if (viewport2) {
            const clientMessage = viewport2.setMenu(body.menu);
            this.postMessageToClient(clientMessage);
          }
        }
        break;
      case VIEW_PORT_MENU_RESP:
        {
          const { action } = body;
          this.postMessageToClient({
            type: VIEW_PORT_MENU_RESP,
            action,
            tableAlreadyOpen: this.isTableOpen(action.table),
            requestId
          });
        }
        break;
      case RPC_RESP:
        {
          const { method, result } = body;
          this.postMessageToClient({
            type: RPC_RESP,
            method,
            result,
            requestId
          });
        }
        break;
      case "ERROR":
        console.error(body.msg);
        break;
      default:
        console.log(`handleMessageFromServer ${body.type}.`);
    }
  }
  isTableOpen(table) {
    if (table) {
      const tableName = table.table;
      for (let viewport of this.viewports.values()) {
        if (!viewport.suspended && viewport.table.table === tableName) {
          return true;
        }
      }
    }
  }
  getActiveLinks(links) {
    return links.filter((link) => {
      const viewport = this.viewports.get(link.parentVpId);
      return viewport && !viewport.suspended;
    });
  }
  processUpdates(timeStamp) {
    let clientMessage;
    this.viewports.forEach((viewport) => {
      if (viewport.hasUpdatesToProcess) {
        const rows = viewport.getClientRows(timeStamp);
        const size = viewport.getNewRowCount();
        if (size !== void 0 || rows && rows.length > 0) {
          clientMessage = clientMessage || {
            type: "viewport-updates",
            viewports: {}
          };
          clientMessage.viewports[viewport.clientViewportId] = { rows, size };
        }
      }
      if (clientMessage) {
        this.postMessageToClient(clientMessage);
      }
    });
  }
};

// src/worker.ts
var server;
async function connectToServer(url, token, onConnectionStatusChange) {
  const connection = await connect(
    url,
    (msg) => isConnectionStatusMessage(msg) ? onConnectionStatusChange(msg) : server.handleMessageFromServer(msg)
  );
  server = new ServerProxy(connection, (msg) => sendMessageToClient(msg));
  if (connection.requiresLogin) {
    await server.login(token);
  }
}
var lastTime = 0;
var timings = [];
function sendMessageToClient(message) {
  const now = Math.round(performance.now());
  if (lastTime) {
    timings.push(now - lastTime);
  }
  postMessage(message);
  lastTime = now;
}
var handleMessageFromClient = async ({ data: message }) => {
  switch (message.type) {
    case "connect":
      await connectToServer(message.url, message.token, postMessage);
      postMessage({ type: "connected" });
      break;
    case "subscribe":
      server.subscribe(message);
      break;
    case "unsubscribe":
      server.unsubscribe(message.viewport);
      break;
    default:
      server.handleMessageFromClient(message);
  }
};
self.addEventListener("message", handleMessageFromClient);
postMessage({ type: "ready" });
//# sourceMappingURL=worker.js.map
