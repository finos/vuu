export const workerSourceCode = `
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};

// ../vuu-utils/src/array-utils.ts
function partition(array, test, pass = [], fail = []) {
  for (let i = 0, len = array.length; i < len; i++) {
    (test(array[i], i) ? pass : fail).push(array[i]);
  }
  return [pass, fail];
}

// ../vuu-utils/src/column-utils.ts
var metadataKeys = {
  IDX: 0,
  RENDER_IDX: 1,
  IS_LEAF: 2,
  IS_EXPANDED: 3,
  DEPTH: 4,
  COUNT: 5,
  KEY: 6,
  SELECTED: 7,
  count: 8,
  // TODO following only used in datamodel
  PARENT_IDX: "parent_idx",
  IDX_POINTER: "idx_pointer",
  FILTER_COUNT: "filter_count",
  NEXT_FILTER_IDX: "next_filter_idx"
};
var { DEPTH, IS_LEAF } = metadataKeys;

// ../vuu-utils/src/cookie-utils.ts
var getCookieValue = (name) => {
  var _a, _b;
  if (((_a = globalThis.document) == null ? void 0 : _a.cookie) !== void 0) {
    return (_b = globalThis.document.cookie.split("; ").find((row) => row.startsWith(\`\${name}=\`))) == null ? void 0 : _b.split("=")[1];
  }
};

// ../vuu-utils/src/range-utils.ts
function getFullRange({ from, to }, bufferSize = 0, rowCount = Number.MAX_SAFE_INTEGER) {
  if (bufferSize === 0) {
    if (rowCount < from) {
      return { from: 0, to: 0 };
    } else {
      return { from, to: Math.min(to, rowCount) };
    }
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
      return {
        from: Math.max(0, rowCount - (rangeSize + bufferSize)),
        to: rowCount
      };
    } else {
      return { from: from - buff, to: to + buff };
    }
  }
}
var withinRange = (value, { from, to }) => value >= from && value < to;
var WindowRange = class {
  constructor(from, to) {
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
    return new WindowRange(this.from, this.to);
  }
};

// ../vuu-utils/src/DataWindow.ts
var { KEY } = metadataKeys;

// ../vuu-utils/src/logging-utils.ts
var logLevels = ["error", "warn", "info", "debug"];
var isValidLogLevel = (value) => typeof value === "string" && logLevels.includes(value);
var DEFAULT_LOG_LEVEL = "error";
var NO_OP = () => void 0;
var DEFAULT_DEBUG_LEVEL = false ? "error" : "info";
var { loggingLevel = DEFAULT_DEBUG_LEVEL } = getLoggingSettings();
var logger = (category) => {
  const debugEnabled5 = loggingLevel === "debug";
  const infoEnabled5 = debugEnabled5 || loggingLevel === "info";
  const warnEnabled = infoEnabled5 || loggingLevel === "warn";
  const errorEnabled = warnEnabled || loggingLevel === "error";
  const info5 = infoEnabled5 ? (message) => console.info(\`[\${category}] \${message}\`) : NO_OP;
  const warn4 = warnEnabled ? (message) => console.warn(\`[\${category}] \${message}\`) : NO_OP;
  const debug5 = debugEnabled5 ? (message) => console.debug(\`[\${category}] \${message}\`) : NO_OP;
  const error4 = errorEnabled ? (message) => console.error(\`[\${category}] \${message}\`) : NO_OP;
  if (false) {
    return {
      errorEnabled,
      error: error4
    };
  } else {
    return {
      debugEnabled: debugEnabled5,
      infoEnabled: infoEnabled5,
      warnEnabled,
      errorEnabled,
      info: info5,
      warn: warn4,
      debug: debug5,
      error: error4
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
    this.range = { from: 0, to: 0 };
    this.timestamp = 0;
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
    const handler = (...args) => {
      this.removeListener(event, handler);
      listener(...args);
    };
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
        default:
          handler.call(null, ...args);
      }
    }
  }
};
_events = new WeakMap();

// ../vuu-utils/src/round-decimal.ts
var PUNCTUATION_STR = String.fromCharCode(8200);
var DIGIT_STR = String.fromCharCode(8199);
var Space = {
  DIGIT: DIGIT_STR,
  TWO_DIGITS: DIGIT_STR + DIGIT_STR,
  THREE_DIGITS: DIGIT_STR + DIGIT_STR + DIGIT_STR,
  FULL_PADDING: [
    null,
    PUNCTUATION_STR + DIGIT_STR,
    PUNCTUATION_STR + DIGIT_STR + DIGIT_STR,
    PUNCTUATION_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR,
    PUNCTUATION_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR
  ]
};
var LEADING_FILL = DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR;

// ../vuu-utils/src/json-utils.ts
var { COUNT } = metadataKeys;

// ../vuu-utils/src/keyset.ts
var KeySet = class {
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
      this.free.length = Math.max(0, size - this.keys.size);
    }
    for (let rowIndex = from; rowIndex < to; rowIndex++) {
      if (!this.keys.has(rowIndex)) {
        const nextKeyValue = this.next();
        this.keys.set(rowIndex, nextKeyValue);
      }
    }
    if (this.nextKeyValue > this.keys.size) {
      this.nextKeyValue = this.keys.size;
    }
  }
  keyFor(rowIndex) {
    const key = this.keys.get(rowIndex);
    if (key === void 0) {
      console.log(\`key not found
        keys: \${this.toDebugString()}
        free : \${this.free.join(",")}
      \`),Error(\`KeySet, no key found for rowIndex \${e}\`);return t}toDebugString(){return Array.from(this.keys.entries()).map((e,t)=>\`\${e}=>\${t}\`).join(",")}};var{IDX:Zn}=M;var{SELECTED:er}=M,x={False:0,True:1,First:2,Last:4};var yt=(s,e)=>e>=s[0]&&e<=s[1],St=x.True+x.First+x.Last,Tt=x.True+x.First,Rt=x.True+x.Last,Z=(s,e)=>{for(let t of s)if(typeof t=="number"){if(t===e)return St}else if(yt(t,e))return e===t[0]?Tt:e===t[1]?Rt:x.True;return x.False};var Se=s=>{if(s.every(t=>typeof t=="number"))return s;let e=[];for(let t of s)if(typeof t=="number")e.push(t);else for(let n=t[0];n<=t[1];n++)e.push(n);return e};var Et=(()=>{let s=0,e=()=>\`0000\${(Math.random()*36**4<<0).toString(36)}\`.slice(-4);return()=>(s+=1,\`u\${e()}\${s}\`)})();var{debug:ks,debugEnabled:As,error:Ee,info:w,infoEnabled:It,warn:_}=E("websocket-connection"),we="ws",vt=s=>s.startsWith(we+"://")||s.startsWith(we+"s://"),xe={},ee=Symbol("setWebsocket"),B=Symbol("connectionCallback");async function Ie(s,e,t,n=10,r=5){return xe[s]={status:"connecting",connect:{allowed:r,remaining:r},reconnect:{allowed:n,remaining:n}},ve(s,e,t)}async function Q(s){throw Error("connection broken")}async function ve(s,e,t,n){let{status:r,connect:o,reconnect:a}=xe[s],u=r==="connecting"?o:a;try{t({type:"connection-status",status:"connecting"});let c=typeof n<"u",g=await _t(s,e);console.info("%c\u26A1 %cconnected","font-size: 24px;color: green;font-weight: bold;","color:green; font-size: 14px;"),n!==void 0&&n[ee](g);let i=n!=null?n:new te(g,s,e,t),l=c?"reconnected":"connection-open-awaiting-session";return t({type:"connection-status",status:l}),i.status=l,u.remaining=u.allowed,i}catch{let g=--u.remaining>0;if(t({type:"connection-status",status:"disconnected",reason:"failed to connect",retry:g}),g)return Dt(s,e,t,n,2e3);throw Error("Failed to establish connection")}}var Dt=(s,e,t,n,r)=>new Promise(o=>{setTimeout(()=>{o(ve(s,e,t,n))},r)}),_t=(s,e)=>new Promise((t,n)=>{let r=vt(s)?s:\`wss://\${s}\`;It&&e!==void 0&&w(\`WebSocket Protocol \${e==null?void 0:e.toString()}\`);let o=new WebSocket(r,e);o.onopen=()=>t(o),o.onerror=a=>n(a)}),Ve=()=>{_==null||_("Connection cannot be closed, socket not yet opened")},Me=s=>{_==null||_(\`Message cannot be sent, socket closed \${s.body.type}\`)},Pt=s=>{try{return JSON.parse(s)}catch{throw Error(\`Error parsing JSON response from server \${s}\`)}},te=class{constructor(e,t,n,r){this.close=Ve;this.requiresLogin=!0;this.send=Me;this.status="ready";this.messagesCount=0;this.connectionMetricsInterval=null;this.handleWebsocketMessage=e=>{let t=Pt(e.data);this.messagesCount+=1,this[B](t)};this.url=t,this.protocol=n,this[B]=r,this[ee](e)}reconnect(){Q(this)}[(B,ee)](e){let t=this[B];e.onmessage=o=>{this.status="connected",e.onmessage=this.handleWebsocketMessage,this.handleWebsocketMessage(o)},this.connectionMetricsInterval=setInterval(()=>{t({type:"connection-metrics",messagesLength:this.messagesCount}),this.messagesCount=0},2e3),e.onerror=()=>{Ee("\u26A1 connection error"),t({type:"connection-status",status:"disconnected",reason:"error"}),this.connectionMetricsInterval&&(clearInterval(this.connectionMetricsInterval),this.connectionMetricsInterval=null),this.status==="connection-open-awaiting-session"?Ee("Websocket connection lost before Vuu session established, check websocket configuration"):this.status!=="closed"&&(Q(this),this.send=r)},e.onclose=()=>{w==null||w("\u26A1 connection close"),t({type:"connection-status",status:"disconnected",reason:"close"}),this.connectionMetricsInterval&&(clearInterval(this.connectionMetricsInterval),this.connectionMetricsInterval=null),this.status!=="closed"&&(Q(this),this.send=r)};let n=o=>{e.send(JSON.stringify(o))},r=o=>{w==null||w(\`TODO queue message until websocket reconnected \${o.body.type}\`)};this.send=n,this.close=()=>{this.status="closed",e.close(),this.close=Ve,this.send=Me,w==null||w("close websocket")}}};var Lt=["VIEW_PORT_MENUS_SELECT_RPC","VIEW_PORT_MENU_TABLE_RPC","VIEW_PORT_MENU_ROW_RPC","VIEW_PORT_MENU_CELL_RPC","VP_EDIT_CELL_RPC","VP_EDIT_ROW_RPC","VP_EDIT_ADD_ROW_RPC","VP_EDIT_DELETE_CELL_RPC","VP_EDIT_DELETE_ROW_RPC","VP_EDIT_SUBMIT_FORM_RPC"],De=s=>Lt.includes(s.type),ne=({requestId:s,...e})=>[s,e],_e=s=>{let e=s.at(0);if(e.updateType==="SIZE"){if(s.length===1)return s;e=s.at(1)}let t=s.at(-1);return[e,t]},Pe=s=>{let e={};for(let t of s)(e[t.viewPortId]||(e[t.viewPortId]=[])).push(t);return e};var re=({columns:s,dataTypes:e,key:t,table:n})=>({table:n,columns:s.map((r,o)=>({name:r,serverDataType:e[o]})),key:t});var Le=s=>s.type==="connection-status",Oe=s=>s.type==="connection-metrics";var ke=s=>"viewport"in s,Ae=s=>s.type==="VIEW_PORT_MENU_RESP"&&s.action!==null&&G(s.action.table),G=s=>s!==null&&typeof s=="object"&&"table"in s&&"module"in s?s.table.startsWith("session"):!1;var Ue="CHANGE_VP_SUCCESS",Fe="CHANGE_VP_RANGE_SUCCESS",Ne="CLOSE_TREE_NODE",We="CLOSE_TREE_SUCCESS";var \$e="CREATE_VP",qe="CREATE_VP_SUCCESS",Be="DISABLE_VP",Ge="DISABLE_VP_SUCCESS";var Ke="ENABLE_VP",He="ENABLE_VP_SUCCESS";var se="GET_VP_VISUAL_LINKS",je="GET_VIEW_PORT_MENUS";var ze="HB",Je="HB_RESP",Ye="LOGIN",Ze="LOGIN_SUCCESS",Xe="OPEN_TREE_NODE",Qe="OPEN_TREE_SUCCESS";var et="REMOVE_VP";var oe="RPC_RESP";var tt="SET_SELECTION_SUCCESS",ie="TABLE_META_RESP",ae="TABLE_LIST_RESP",nt="TABLE_ROW";var st=s=>{switch(s){case"TypeAheadRpcHandler":return"TYPEAHEAD";default:return"SIMUL"}};var ot=[],T=E("array-backed-moving-window");function Ot(s,e){if(!e||e.data.length!==s.data.length||e.sel!==s.sel)return!1;for(let t=0;t<e.data.length;t++)if(e.data[t]!==s.data[t])return!1;return!0}var h,K=class{constructor({from:e,to:t},{from:n,to:r},o){U(this,h,void 0);this.setRowCount=e=>{var t;if((t=T.info)==null||t.call(T,\`setRowCount \${e}\`),e<this.internalData.length&&(this.internalData.length=e),e<this.rowCount){this.rowsWithinRange=0;let n=Math.min(e,this.clientRange.to);for(let r=this.clientRange.from;r<n;r++){let o=r-p(this,h).from;this.internalData[o]!==void 0&&(this.rowsWithinRange+=1)}}this.rowCount=e};this.bufferBreakout=(e,t)=>{let n=this.bufferSize*.25;return p(this,h).to-t<n?!0:p(this,h).from>0&&e-p(this,h).from<n};this.bufferSize=o,this.clientRange=new v(e,t),me(this,h,new v(n,r)),this.internalData=new Array(o),this.rowsWithinRange=0,this.rowCount=0}get range(){return p(this,h)}get hasAllRowsWithinRange(){return this.rowsWithinRange===this.clientRange.to-this.clientRange.from||this.rowCount>0&&this.clientRange.from+this.rowsWithinRange===this.rowCount}outOfRange(e,t){let{from:n,to:r}=this.range;if(t<n||e>=r)return!0}setAtIndex(e){let{rowIndex:t}=e,n=t-p(this,h).from;if(Ot(e,this.internalData[n]))return!1;let r=this.isWithinClientRange(t);return(r||this.isWithinRange(t))&&(!this.internalData[n]&&r&&(this.rowsWithinRange+=1),this.internalData[n]=e),r}getAtIndex(e){return p(this,h).isWithin(e)&&this.internalData[e-p(this,h).from]!=null?this.internalData[e-p(this,h).from]:void 0}isWithinRange(e){return p(this,h).isWithin(e)}isWithinClientRange(e){return this.clientRange.isWithin(e)}setClientRange(e,t){var g;(g=T.debug)==null||g.call(T,\`setClientRange \${e} - \${t}\`);let n=this.clientRange.from,r=Math.min(this.clientRange.to,this.rowCount);if(e===n&&t===r)return[!1,ot];let o=this.clientRange.copy();this.clientRange.from=e,this.clientRange.to=t,this.rowsWithinRange=0;for(let i=e;i<t;i++){let l=i-p(this,h).from;this.internalData[l]&&(this.rowsWithinRange+=1)}let a=ot,u=p(this,h).from;if(this.hasAllRowsWithinRange)if(t>o.to){let i=Math.max(e,o.to);a=this.internalData.slice(i-u,t-u)}else{let i=Math.min(o.from,t);a=this.internalData.slice(e-u,i-u)}return[this.bufferBreakout(e,t),a]}setRange(e,t){var n,r;if(e!==p(this,h).from||t!==p(this,h).to){(n=T.debug)==null||n.call(T,\`setRange \${e} - \${t}\`);let[o,a]=p(this,h).overlap(e,t),u=new Array(t-e);this.rowsWithinRange=0;for(let c=o;c<a;c++){let g=this.getAtIndex(c);if(g){let i=c-e;u[i]=g,this.isWithinClientRange(c)&&(this.rowsWithinRange+=1)}}this.internalData=u,p(this,h).from=e,p(this,h).to=t}else(r=T.debug)==null||r.call(T,\`setRange \${e} - \${t} IGNORED because not changed\`)}get data(){return this.internalData}getData(){var u;let{from:e,to:t}=p(this,h),{from:n,to:r}=this.clientRange,o=Math.max(0,n-e),a=Math.min(t-e,t,r-e,(u=this.rowCount)!=null?u:t);return this.internalData.slice(o,a)}clear(){var e;(e=T.debug)==null||e.call(T,"clear"),this.internalData.length=0,this.rowsWithinRange=0,this.setRowCount(0)}getCurrentDataRange(){let e=this.internalData,t=e.length,[n]=this.internalData,r=this.internalData[t-1];if(n&&r)return[n.rowIndex,r.rowIndex];for(let o=0;o<t;o++)if(e[o]!==void 0){n=e[o];break}for(let o=t-1;o>=0;o--)if(e[o]!==void 0){r=e[o];break}return n&&r?[n.rowIndex,r.rowIndex]:[-1,-1]}};h=new WeakMap;var kt=[],{debug:b,debugEnabled:H,error:At,info:d,infoEnabled:Ut,warn:P}=E("viewport"),Ft=({rowKey:s,updateType:e})=>e==="U"&&!s.startsWith("\$root"),j=[void 0,void 0],Nt={count:0,mode:void 0,size:0,ts:0},z=class{constructor({aggregations:e,bufferSize:t=50,columns:n,filter:r,groupBy:o=[],table:a,range:u,sort:c,title:g,viewport:i,visualLink:l},f){this.batchMode=!0;this.hasUpdates=!1;this.pendingUpdates=[];this.pendingOperations=new Map;this.pendingRangeRequests=[];this.rowCountChanged=!1;this.selectedRows=[];this.tableSchema=null;this.useBatchMode=!0;this.lastUpdateStatus=Nt;this.updateThrottleTimer=void 0;this.rangeMonitor=new W("ViewPort");this.disabled=!1;this.isTree=!1;this.status="";this.suspended=!1;this.suspendTimer=null;this.setLastSizeOnlyUpdateSize=e=>{this.lastUpdateStatus.size=e};this.setLastUpdate=e=>{let{ts:t,mode:n}=this.lastUpdateStatus,r=0;if(n===e){let o=Date.now();this.lastUpdateStatus.count+=1,this.lastUpdateStatus.ts=o,r=t===0?0:o-t}else this.lastUpdateStatus.count=1,this.lastUpdateStatus.ts=0,r=0;return this.lastUpdateStatus.mode=e,r};this.rangeRequestAlreadyPending=e=>{let{bufferSize:t}=this,n=t*.25,{from:r}=e;for(let{from:o,to:a}of this.pendingRangeRequests)if(r>=o&&r<a){if(e.to+n<=a)return!0;r=a}return!1};this.sendThrottledSizeMessage=()=>{this.updateThrottleTimer=void 0,this.lastUpdateStatus.count=3,this.postMessageToClient({clientViewportId:this.clientViewportId,mode:"size-only",size:this.lastUpdateStatus.size,type:"viewport-update"})};this.shouldThrottleMessage=e=>{let t=this.setLastUpdate(e);return e==="size-only"&&t>0&&t<500&&this.lastUpdateStatus.count>3};this.throttleMessage=e=>this.shouldThrottleMessage(e)?(d==null||d("throttling updates setTimeout to 2000"),this.updateThrottleTimer===void 0&&(this.updateThrottleTimer=setTimeout(this.sendThrottledSizeMessage,2e3)),!0):(this.updateThrottleTimer!==void 0&&(clearTimeout(this.updateThrottleTimer),this.updateThrottleTimer=void 0),!1);this.getNewRowCount=()=>{if(this.rowCountChanged&&this.dataWindow)return this.rowCountChanged=!1,this.dataWindow.rowCount};this.aggregations=e,this.bufferSize=t,this.clientRange=u,this.clientViewportId=i,this.columns=n,this.filter=r,this.groupBy=o,this.keys=new q(u),this.pendingLinkedParent=l,this.table=a,this.sort=c,this.title=g,Ut&&(d==null||d(\`constructor #\${i} \${a.table} bufferSize=\${t}\`)),this.dataWindow=new K(this.clientRange,u,this.bufferSize),this.postMessageToClient=f}get hasUpdatesToProcess(){return this.suspended?!1:this.rowCountChanged||this.hasUpdates}get size(){var e;return(e=this.dataWindow.rowCount)!=null?e:0}subscribe(){let{filter:e}=this.filter;return this.status=this.status==="subscribed"?"resubscribing":"subscribing",{type:\$e,table:this.table,range:Y(this.clientRange,this.bufferSize),aggregations:this.aggregations,columns:this.columns,sort:this.sort,groupBy:this.groupBy,filterSpec:{filter:e}}}handleSubscribed({viewPortId:e,aggregations:t,columns:n,filterSpec:r,range:o,sort:a,groupBy:u}){return this.serverViewportId=e,this.status="subscribed",this.aggregations=t,this.columns=n,this.groupBy=u,this.isTree=u&&u.length>0,this.dataWindow.setRange(o.from,o.to),{aggregations:t,type:"subscribed",clientViewportId:this.clientViewportId,columns:n,filter:r,groupBy:u,range:o,sort:a,tableSchema:this.tableSchema}}awaitOperation(e,t){this.pendingOperations.set(e,t)}completeOperation(e,...t){var u;let{clientViewportId:n,pendingOperations:r}=this,o=r.get(e);if(!o){At("no matching operation found to complete");return}let{type:a}=o;if(d==null||d(\`completeOperation \${a}\`),r.delete(e),a==="CHANGE_VP_RANGE"){let[c,g]=t;(u=this.dataWindow)==null||u.setRange(c,g);for(let i=this.pendingRangeRequests.length-1;i>=0;i--){let l=this.pendingRangeRequests[i];if(l.requestId===e){l.acked=!0;break}else P==null||P("range requests sent faster than they are being ACKed")}}else if(a==="config"){let{aggregations:c,columns:g,filter:i,groupBy:l,sort:f}=o.data;return this.aggregations=c,this.columns=g,this.filter=i,this.groupBy=l,this.sort=f,l.length>0?this.isTree=!0:this.isTree&&(this.isTree=!1),b==null||b(\`config change confirmed, isTree : \${this.isTree}\`),{clientViewportId:n,type:a,config:o.data}}else{if(a==="groupBy")return this.isTree=o.data.length>0,this.groupBy=o.data,b==null||b(\`groupBy change confirmed, isTree : \${this.isTree}\`),{clientViewportId:n,type:a,groupBy:o.data};if(a==="columns")return this.columns=o.data,{clientViewportId:n,type:a,columns:o.data};if(a==="filter")return this.filter=o.data,{clientViewportId:n,type:a,filter:o.data};if(a==="aggregate")return this.aggregations=o.data,{clientViewportId:n,type:"aggregate",aggregations:this.aggregations};if(a==="sort")return this.sort=o.data,{clientViewportId:n,type:a,sort:this.sort};if(a!=="selection"){if(a==="disable")return this.disabled=!0,{type:"disabled",clientViewportId:n};if(a==="enable")return this.disabled=!1,{type:"enabled",clientViewportId:n};if(a==="CREATE_VISUAL_LINK"){let[c,g,i]=t;return this.linkedParent={colName:c,parentViewportId:g,parentColName:i},this.pendingLinkedParent=void 0,{type:"vuu-link-created",clientViewportId:n,colName:c,parentViewportId:g,parentColName:i}}else if(a==="REMOVE_VISUAL_LINK")return this.linkedParent=void 0,{type:"vuu-link-removed",clientViewportId:n}}}}rangeRequest(e,t){H&&this.rangeMonitor.set(t);let n="CHANGE_VP_RANGE";if(this.dataWindow){let[r,o]=this.dataWindow.setClientRange(t.from,t.to),a,u=this.dataWindow.rowCount||void 0,c=r&&!this.rangeRequestAlreadyPending(t)?{type:n,viewPortId:this.serverViewportId,...Y(t,this.bufferSize,u)}:null;if(c){H&&(b==null||b(\`create CHANGE_VP_RANGE: [\${c.from} - \${c.to}]\`)),this.awaitOperation(e,{type:n});let i=this.pendingRangeRequests.at(-1);if(i)if(i.acked)console.warn("Range Request before previous request is filled");else{let{from:l,to:f}=i;this.dataWindow.outOfRange(l,f)?a={clientViewportId:this.clientViewportId,type:"debounce-begin"}:P==null||P("Range Request before previous request is acked")}this.pendingRangeRequests.push({...c,requestId:e}),this.useBatchMode&&(this.batchMode=!0)}else o.length>0&&(this.batchMode=!1);this.keys.reset(this.dataWindow.clientRange);let g=this.isTree?le:ue;return o.length?[c,o.map(i=>g(i,this.keys,this.selectedRows))]:a?[c,void 0,a]:[c]}else return[null]}setLinks(e){return this.links=e,[{type:"vuu-links",links:e,clientViewportId:this.clientViewportId},this.pendingLinkedParent]}setMenu(e){return{type:"vuu-menu",menu:e,clientViewportId:this.clientViewportId}}setTableSchema(e){this.tableSchema=e}openTreeNode(e,t){return this.useBatchMode&&(this.batchMode=!0),{type:Xe,vpId:this.serverViewportId,treeKey:t.key}}closeTreeNode(e,t){return this.useBatchMode&&(this.batchMode=!0),{type:Ne,vpId:this.serverViewportId,treeKey:t.key}}createLink(e,t,n,r){let o={type:"CREATE_VISUAL_LINK",parentVpId:n,childVpId:this.serverViewportId,parentColumnName:r,childColumnName:t};return this.awaitOperation(e,o),this.useBatchMode&&(this.batchMode=!0),o}removeLink(e){let t={type:"REMOVE_VISUAL_LINK",childVpId:this.serverViewportId};return this.awaitOperation(e,t),t}suspend(){this.suspended=!0,d==null||d("suspend")}resume(){return this.suspended=!1,H&&(b==null||b(\`resume: \${this.currentData()}\`)),this.currentData()}currentData(){let e=[];if(this.dataWindow){let t=this.dataWindow.getData(),{keys:n}=this,r=this.isTree?le:ue;for(let o of t)o&&e.push(r(o,n,this.selectedRows))}return e}enable(e){return this.awaitOperation(e,{type:"enable"}),d==null||d(\`enable: \${this.serverViewportId}\`),{type:Ke,viewPortId:this.serverViewportId}}disable(e){return this.awaitOperation(e,{type:"disable"}),d==null||d(\`disable: \${this.serverViewportId}\`),this.suspended=!1,{type:Be,viewPortId:this.serverViewportId}}columnRequest(e,t){return this.awaitOperation(e,{type:"columns",data:t}),b==null||b(\`columnRequest: \${t}\`),this.createRequest({columns:t})}filterRequest(e,t){this.awaitOperation(e,{type:"filter",data:t}),this.useBatchMode&&(this.batchMode=!0);let{filter:n}=t;return d==null||d(\`filterRequest: \${n}\`),this.createRequest({filterSpec:{filter:n}})}setConfig(e,t){this.awaitOperation(e,{type:"config",data:t});let{filter:n,...r}=t;return this.useBatchMode&&(this.batchMode=!0),H?b==null||b(\`setConfig \${JSON.stringify(t)}\`):d==null||d("setConfig"),this.createRequest({...r,filterSpec:typeof(n==null?void 0:n.filter)=="string"?{filter:n.filter}:{filter:""}},!0)}aggregateRequest(e,t){return this.awaitOperation(e,{type:"aggregate",data:t}),d==null||d(\`aggregateRequest: \${t}\`),this.createRequest({aggregations:t})}sortRequest(e,t){return this.awaitOperation(e,{type:"sort",data:t}),d==null||d(\`sortRequest: \${JSON.stringify(t.sortDefs)}\`),this.createRequest({sort:t})}groupByRequest(e,t=kt){var n;return this.awaitOperation(e,{type:"groupBy",data:t}),this.useBatchMode&&(this.batchMode=!0),this.isTree||(n=this.dataWindow)==null||n.clear(),this.createRequest({groupBy:t})}selectRequest(e,t){return this.selectedRows=t,this.awaitOperation(e,{type:"selection",data:t}),d==null||d(\`selectRequest: \${t}\`),{type:"SET_SELECTION",vpId:this.serverViewportId,selection:Se(t)}}removePendingRangeRequest(e,t){for(let n=this.pendingRangeRequests.length-1;n>=0;n--){let{from:r,to:o}=this.pendingRangeRequests[n],a=!0;if(e>=r&&e<o||t>r&&t<o){a||console.warn("removePendingRangeRequest TABLE_ROWS are not for latest request"),this.pendingRangeRequests.splice(n,1);break}else a=!1}}updateRows(e){var r,o,a;let[t,n]=_e(e);if(t&&n&&this.removePendingRangeRequest(t.rowIndex,n.rowIndex),e.length===1)if(t.vpSize===0&&this.disabled){b==null||b(\`ignore a SIZE=0 message on disabled viewport (\${e.length} rows)\`);return}else t.updateType==="SIZE"&&this.setLastSizeOnlyUpdateSize(t.vpSize);for(let u of e)this.isTree&&Ft(u)||((u.updateType==="SIZE"||((r=this.dataWindow)==null?void 0:r.rowCount)!==u.vpSize)&&((o=this.dataWindow)==null||o.setRowCount(u.vpSize),this.rowCountChanged=!0),u.updateType==="U"&&(a=this.dataWindow)!=null&&a.setAtIndex(u)&&(this.hasUpdates=!0,this.batchMode||this.pendingUpdates.push(u)))}getClientRows(){let e,t="size-only";if(!this.hasUpdates&&!this.rowCountChanged)return j;if(this.hasUpdates){let{keys:n,selectedRows:r}=this,o=this.isTree?le:ue;if(this.updateThrottleTimer&&(self.clearTimeout(this.updateThrottleTimer),this.updateThrottleTimer=void 0),this.pendingUpdates.length>0){e=[],t="update";for(let a of this.pendingUpdates)e.push(o(a,n,r));this.pendingUpdates.length=0}else{let a=this.dataWindow.getData();if(this.dataWindow.hasAllRowsWithinRange){e=[],t="batch";for(let u of a)e.push(o(u,n,r));this.batchMode=!1}}this.hasUpdates=!1}return this.throttleMessage(t)?j:[e,t]}createRequest(e,t=!1){return t?{type:"CHANGE_VP",viewPortId:this.serverViewportId,...e}:{type:"CHANGE_VP",viewPortId:this.serverViewportId,aggregations:this.aggregations,columns:this.columns,sort:this.sort,groupBy:this.groupBy,filterSpec:{filter:this.filter.filter},...e}}},ue=({rowIndex:s,rowKey:e,sel:t,data:n},r,o)=>[s,r.keyFor(s),!0,!1,0,0,e,t?Z(o,s):0].concat(n),le=({rowIndex:s,rowKey:e,sel:t,data:n},r,o)=>{let[a,u,,c,,g,...i]=n;return[s,r.keyFor(s),c,u,a,g,e,t?Z(o,s):0].concat(i)};var it=1;var{debug:I,debugEnabled:L,error:O,info:S,infoEnabled:Wt,warn:k}=E("server-proxy"),C=()=>\`\${it++}\`,\$t={},qt=s=>s.disabled!==!0&&s.suspended!==!0,Bt={type:"NO_ACTION"},Gt=(s,e,t)=>s.map(n=>n.parentVpId===e?{...n,label:t}:n);function Kt(s,e){return s.map(t=>{let{parentVpId:n}=t,r=e.get(n);if(r)return{...t,parentClientVpId:r.clientViewportId,label:r.title};throw Error("addLabelsToLinks viewport not found")})}var J=class{constructor(e,t){this.authToken="";this.user="user";this.pendingTableMetaRequests=new Map;this.pendingRequests=new Map;this.queuedRequests=[];this.cachedTableSchemas=new Map;this.connection=e,this.postMessageToClient=t,this.viewports=new Map,this.mapClientToServerViewport=new Map}async reconnect(){await this.login(this.authToken);let[e,t]=he(Array.from(this.viewports.values()),qt);this.viewports.clear(),this.mapClientToServerViewport.clear();let n=r=>{r.forEach(o=>{let{clientViewportId:a}=o;this.viewports.set(a,o),this.sendMessageToServer(o.subscribe(),a)})};n(e),setTimeout(()=>{n(t)},2e3)}async login(e,t="user"){if(e)return this.authToken=e,this.user=t,new Promise((n,r)=>{this.sendMessageToServer({type:Ye,token:this.authToken,user:t},""),this.pendingLogin={resolve:n,reject:r}});this.authToken===""&&O("login, cannot login until auth token has been obtained")}subscribe(e){if(this.mapClientToServerViewport.has(e.viewport))O(\`spurious subscribe call \${e.viewport}\`);else{if(!this.hasSchemaForTable(e.table)&&!G(e.table)){S==null||S(\`subscribe to \${e.table.table}, no metadata yet, request metadata\`);let n=C();this.sendMessageToServer({type:"GET_TABLE_META",table:e.table},n),this.pendingTableMetaRequests.set(n,e.viewport)}let t=new z(e,this.postMessageToClient);this.viewports.set(e.viewport,t),this.sendIfReady(t.subscribe(),e.viewport,this.sessionId!=="")}}unsubscribe(e){let t=this.mapClientToServerViewport.get(e);t?(S==null||S(\`Unsubscribe Message (Client to Server):
        \${t}\`),this.sendMessageToServer({type:et,viewPortId:t})):O(\`failed to unsubscribe client viewport \${e}, viewport not found\`)}getViewportForClient(e,t=!0){let n=this.mapClientToServerViewport.get(e);if(n){let r=this.viewports.get(n);if(r)return r;if(t)throw Error(\`Viewport not found for client viewport \${e}\`);return null}else{if(this.viewports.has(e))return this.viewports.get(e);if(t)throw Error(\`Viewport server id not found for client viewport \${e}\`);return null}}setViewRange(e,t){let n=C(),[r,o,a]=e.rangeRequest(n,t.range);S==null||S(\`setViewRange \${t.range.from} - \${t.range.to}\`),r&&this.sendIfReady(r,n,e.status==="subscribed"),o?(S==null||S(\`setViewRange \${o.length} rows returned from cache\`),this.postMessageToClient({mode:"batch",type:"viewport-update",clientViewportId:e.clientViewportId,rows:o})):a&&this.postMessageToClient(a)}setConfig(e,t){let n=C(),r=e.setConfig(n,t.config);this.sendIfReady(r,n,e.status==="subscribed")}aggregate(e,t){let n=C(),r=e.aggregateRequest(n,t.aggregations);this.sendIfReady(r,n,e.status==="subscribed")}sort(e,t){let n=C(),r=e.sortRequest(n,t.sort);this.sendIfReady(r,n,e.status==="subscribed")}groupBy(e,t){let n=C(),r=e.groupByRequest(n,t.groupBy);this.sendIfReady(r,n,e.status==="subscribed")}filter(e,t){let n=C(),{filter:r}=t,o=e.filterRequest(n,r);this.sendIfReady(o,n,e.status==="subscribed")}setColumns(e,t){let n=C(),{columns:r}=t,o=e.columnRequest(n,r);this.sendIfReady(o,n,e.status==="subscribed")}setTitle(e,t){e&&(e.title=t.title,this.updateTitleOnVisualLinks(e))}select(e,t){let n=C(),{selected:r}=t,o=e.selectRequest(n,r);this.sendIfReady(o,n,e.status==="subscribed")}disableViewport(e){let t=C(),n=e.disable(t);this.sendIfReady(n,t,e.status==="subscribed")}enableViewport(e){if(e.disabled){let t=C(),n=e.enable(t);this.sendIfReady(n,t,e.status==="subscribed")}}suspendViewport(e){e.suspend(),e.suspendTimer=setTimeout(()=>{S==null||S("suspendTimer expired, escalate suspend to disable"),this.disableViewport(e)},3e3)}resumeViewport(e){e.suspendTimer&&(I==null||I("clear suspend timer"),clearTimeout(e.suspendTimer),e.suspendTimer=null);let t=e.resume();this.postMessageToClient({clientViewportId:e.clientViewportId,mode:"batch",rows:t,type:"viewport-update"})}openTreeNode(e,t){if(e.serverViewportId){let n=C();this.sendIfReady(e.openTreeNode(n,t),n,e.status==="subscribed")}}closeTreeNode(e,t){if(e.serverViewportId){let n=C();this.sendIfReady(e.closeTreeNode(n,t),n,e.status==="subscribed")}}createLink(e,t){let{parentClientVpId:n,parentColumnName:r,childColumnName:o}=t,a=C(),u=this.mapClientToServerViewport.get(n);if(u){let c=e.createLink(a,o,u,r);this.sendMessageToServer(c,a)}else O("ServerProxy unable to create link, viewport not found")}removeLink(e){let t=C(),n=e.removeLink(t);this.sendMessageToServer(n,t)}updateTitleOnVisualLinks(e){var r;let{serverViewportId:t,title:n}=e;for(let o of this.viewports.values())if(o!==e&&o.links&&t&&n&&(r=o.links)!=null&&r.some(a=>a.parentVpId===t)){let[a]=o.setLinks(Gt(o.links,t,n));this.postMessageToClient(a)}}removeViewportFromVisualLinks(e){var t;for(let n of this.viewports.values())if((t=n.links)!=null&&t.some(({parentVpId:r})=>r===e)){let[r]=n.setLinks(n.links.filter(({parentVpId:o})=>o!==e));this.postMessageToClient(r)}}menuRpcCall(e){let t=this.getViewportForClient(e.vpId,!1);if(t!=null&&t.serverViewportId){let[n,r]=ne(e);this.sendMessageToServer({...r,vpId:t.serverViewportId},n)}}rpcCall(e){let[t,n]=ne(e),r=st(n.service);this.sendMessageToServer(n,t,{module:r})}handleMessageFromClient(e){if(ke(e))if(e.type==="disable"){let t=this.getViewportForClient(e.viewport,!1);return t!==null?this.disableViewport(t):void 0}else{let t=this.getViewportForClient(e.viewport);switch(e.type){case"setViewRange":return this.setViewRange(t,e);case"config":return this.setConfig(t,e);case"aggregate":return this.aggregate(t,e);case"sort":return this.sort(t,e);case"groupBy":return this.groupBy(t,e);case"filter":return this.filter(t,e);case"select":return this.select(t,e);case"suspend":return this.suspendViewport(t);case"resume":return this.resumeViewport(t);case"enable":return this.enableViewport(t);case"openTreeNode":return this.openTreeNode(t,e);case"closeTreeNode":return this.closeTreeNode(t,e);case"createLink":return this.createLink(t,e);case"removeLink":return this.removeLink(t);case"setColumns":return this.setColumns(t,e);case"setTitle":return this.setTitle(t,e);default:}}else{if(De(e))return this.menuRpcCall(e);{let{type:t,requestId:n}=e;switch(t){case"GET_TABLE_LIST":return this.sendMessageToServer({type:t},n);case"GET_TABLE_META":return this.sendMessageToServer({type:t,table:e.table},n);case"RPC_CALL":return this.rpcCall(e);default:}}}O(\`Vuu ServerProxy Unexpected message from client \${JSON.stringify(e)}\`)}awaitResponseToMessage(e){return new Promise((t,n)=>{let r=C();this.sendMessageToServer(e,r),this.pendingRequests.set(r,{reject:n,resolve:t})})}sendIfReady(e,t,n=!0){return n?this.sendMessageToServer(e,t):this.queuedRequests.push(e),n}sendMessageToServer(e,t=\`\${it++}\`,n=\$t){let{module:r="CORE"}=n;this.authToken&&this.connection.send({requestId:t,sessionId:this.sessionId,token:this.authToken,user:this.user,module:r,body:e})}handleMessageFromServer(e){var u;let{body:t,requestId:n,sessionId:r}=e,o=this.pendingRequests.get(n);if(o){let{resolve:i}=o;this.pendingRequests.delete(n),i(t);return}let{viewports:a}=this;switch(t.type){case ze:this.sendMessageToServer({type:Je,ts:+new Date},"NA");break;case Ze:if(r)this.sessionId=r,(u=this.pendingLogin)==null||u.resolve(r),this.pendingLogin=void 0;else throw Error("LOGIN_SUCCESS did not provide sessionId");break;case qe:{let i=a.get(n);if(i){let{status:l}=i,{viewPortId:f}=t;n!==f&&(a.delete(n),a.set(f,i)),this.mapClientToServerViewport.set(n,f);let R=i.handleSubscribed(t);R&&(this.postMessageToClient(R),L&&I(\`post DataSourceSubscribedMessage to client: \${JSON.stringify(R)}\`)),i.disabled&&this.disableViewport(i),l==="subscribing"&&!G(i.table)&&(this.sendMessageToServer({type:se,vpId:f}),this.sendMessageToServer({type:je,vpId:f}),Array.from(a.entries()).filter(([V,{disabled:A}])=>V!==f&&!A).forEach(([V])=>{this.sendMessageToServer({type:se,vpId:V})}))}}break;case"REMOVE_VP_SUCCESS":{let i=a.get(t.viewPortId);i&&(this.mapClientToServerViewport.delete(i.clientViewportId),a.delete(t.viewPortId),this.removeViewportFromVisualLinks(t.viewPortId))}break;case tt:{let i=this.viewports.get(t.vpId);i&&i.completeOperation(n)}break;case Ue:case Ge:if(a.has(t.viewPortId)){let i=this.viewports.get(t.viewPortId);if(i){let l=i.completeOperation(n);l!==void 0&&(this.postMessageToClient(l),L&&I(\`postMessageToClient \${JSON.stringify(l)}\`))}}break;case He:{let i=this.viewports.get(t.viewPortId);if(i){let l=i.completeOperation(n);if(l){this.postMessageToClient(l);let f=i.currentData();L&&I(\`Enable Response (ServerProxy to Client):  \${JSON.stringify(l)}\`),i.size===0?L&&I("Viewport Enabled but size 0, resend  to server"):(this.postMessageToClient({clientViewportId:i.clientViewportId,mode:"batch",rows:f,size:i.size,type:"viewport-update"}),L&&I(\`Enable Response (ServerProxy to Client): send size \${i.size} \${f.length} rows from cache\`))}}}break;case nt:{let i=Pe(t.rows);for(let[l,f]of Object.entries(i)){let R=a.get(l);R?R.updateRows(f):k==null||k(\`TABLE_ROW message received for non registered viewport \${l}\`)}this.processUpdates()}break;case Fe:{let i=this.viewports.get(t.viewPortId);if(i){let{from:l,to:f}=t;i.completeOperation(n,l,f)}}break;case Qe:case We:break;case"CREATE_VISUAL_LINK_SUCCESS":{let i=this.viewports.get(t.childVpId),l=this.viewports.get(t.parentVpId);if(i&&l){let{childColumnName:f,parentColumnName:R}=t,V=i.completeOperation(n,f,l.clientViewportId,R);V&&this.postMessageToClient(V)}}break;case"REMOVE_VISUAL_LINK_SUCCESS":{let i=this.viewports.get(t.childVpId);if(i){let l=i.completeOperation(n);l&&this.postMessageToClient(l)}}break;case ae:this.postMessageToClient({type:ae,tables:t.tables,requestId:n});break;case ie:{let i=this.cacheTableMeta(t),l=this.pendingTableMetaRequests.get(n);if(l){this.pendingTableMetaRequests.delete(n);let f=this.viewports.get(l);f?f.setTableSchema(i):k==null||k("Message has come back AFTER CREATE_VP_SUCCESS, what do we do now")}else this.postMessageToClient({type:ie,tableSchema:i,requestId:n})}break;case"VP_VISUAL_LINKS_RESP":{let i=this.getActiveLinks(t.links),l=this.viewports.get(t.vpId);if(i.length&&l){let f=Kt(i,this.viewports),[R,V]=l.setLinks(f);if(this.postMessageToClient(R),V){let{link:A,parentClientVpId:at}=V,de=C(),ge=this.mapClientToServerViewport.get(at);if(ge){let ut=l.createLink(de,A.fromColumn,ge,A.toColumn);this.sendMessageToServer(ut,de)}}}}break;case"VIEW_PORT_MENUS_RESP":if(t.menu.name){let i=this.viewports.get(t.vpId);if(i){let l=i.setMenu(t.menu);this.postMessageToClient(l)}}break;case"VP_EDIT_RPC_RESPONSE":this.postMessageToClient({action:t.action,requestId:n,rpcName:t.rpcName,type:"VP_EDIT_RPC_RESPONSE"});break;case"VP_EDIT_RPC_REJECT":this.viewports.get(t.vpId)&&this.postMessageToClient({requestId:n,type:"VP_EDIT_RPC_REJECT",error:t.error});break;case"VIEW_PORT_MENU_REJ":{console.log("send menu error back to client");let{error:i,rpcName:l}=t;this.postMessageToClient({error:i,rpcName:l,type:"VIEW_PORT_MENU_REJ",requestId:n});break}case"VIEW_PORT_MENU_RESP":if(Ae(t)){let{action:i,rpcName:l}=t;this.awaitResponseToMessage({type:"GET_TABLE_META",table:i.table}).then(f=>{let R=re(f);this.postMessageToClient({rpcName:l,type:"VIEW_PORT_MENU_RESP",action:{...i,tableSchema:R},tableAlreadyOpen:this.isTableOpen(i.table),requestId:n})})}else{let{action:i}=t;this.postMessageToClient({type:"VIEW_PORT_MENU_RESP",action:i||Bt,tableAlreadyOpen:i!==null&&this.isTableOpen(i.table),requestId:n})}break;case oe:{let{method:i,result:l}=t;this.postMessageToClient({type:oe,method:i,result:l,requestId:n})}break;case"ERROR":O(t.msg);break;default:Wt&&S(\`handleMessageFromServer \${t.type}.\`)}}hasSchemaForTable(e){return this.cachedTableSchemas.has(\`\${e.module}:\${e.table}\`)}cacheTableMeta(e){let{module:t,table:n}=e.table,r=\`\${t}:\${n}\`,o=this.cachedTableSchemas.get(r);return o||(o=re(e),this.cachedTableSchemas.set(r,o)),o}isTableOpen(e){if(e){let t=e.table;for(let n of this.viewports.values())if(!n.suspended&&n.table.table===t)return!0}}getActiveLinks(e){return e.filter(t=>{let n=this.viewports.get(t.parentVpId);return n&&!n.suspended})}processUpdates(){this.viewports.forEach(e=>{var t;if(e.hasUpdatesToProcess){let n=e.getClientRows();if(n!==j){let[r,o]=n,a=e.getNewRowCount();(a!==void 0||r&&r.length>0)&&(L&&I(\`postMessageToClient #\${e.clientViewportId} viewport-update \${o}, \${(t=r==null?void 0:r.length)!=null?t:"no"} rows, size \${a}\`),o&&this.postMessageToClient({clientViewportId:e.clientViewportId,mode:o,rows:r,size:a,type:"viewport-update"}))}}})}};var D,{info:ce,infoEnabled:pe}=E("worker");async function Ht(s,e,t,n,r,o,a){let u=await Ie(s,e,c=>{Oe(c)?(console.log("post connection metrics"),postMessage({type:"connection-metrics",messages:c})):Le(c)?(r(c),c.status==="reconnected"&&D.reconnect()):D.handleMessageFromServer(c)},o,a);D=new J(u,c=>jt(c)),u.requiresLogin&&await D.login(t,n)}function jt(s){postMessage(s)}var zt=async({data:s})=>{switch(s.type){case"connect":await Ht(s.url,s.protocol,s.token,s.username,postMessage,s.retryLimitDisconnect,s.retryLimitStartup),postMessage({type:"connected"});break;case"subscribe":pe&&ce(\`client subscribe: \${JSON.stringify(s)}\`),D.subscribe(s);break;case"unsubscribe":pe&&ce(\`client unsubscribe: \${JSON.stringify(s)}\`),D.unsubscribe(s.viewport);break;default:pe&&ce(\`client message: \${JSON.stringify(s)}\`),D.handleMessageFromClient(s)}};self.addEventListener("message",zt);postMessage({type:"ready"});

`;
