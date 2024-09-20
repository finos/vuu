import { VuuServerMessage, VuuClientMessage } from "@finos/vuu-protocol-types";
import { Connection } from "./connectionTypes";
import { logger } from "@finos/vuu-utils";
import {
  ConnectionQualityMetrics,
  ConnectionStatus,
  ConnectionStatusMessage,
  WebSocketProtocol,
} from "@finos/vuu-data-types";

export type ConnectionMessage =
  | VuuServerMessage
  | ConnectionStatusMessage
  | ConnectionQualityMetrics;
export type ConnectionCallback = (msg: ConnectionMessage) => void;

const { debug, debugEnabled, error, info, infoEnabled, warn } = logger(
  "websocket-connection",
);

type ConnectionTracking = {
  [key: string]: {
    connect: {
      allowed: number;
      remaining: number;
    };
    reconnect: {
      allowed: number;
      remaining: number;
    };
    status: ConnectionStatus;
  };
};

const connectionAttemptStatus: ConnectionTracking = {};

const setWebsocket = Symbol("setWebsocket");
const connectionCallback = Symbol("connectionCallback");

const WEBSOCKET_TIMEOUT = 10000;

/**
 * API call to establish connection with a WebSocket.
 * Returns a promise for a WebSocketConnection
 * A Connection has the following properties
 *  - connection-status
 *  - send (message)
 *  - requiresLogin
 */
export async function createWebSocketConnection(
  connectionString: string,
  protocol: WebSocketProtocol,
  callback: ConnectionCallback,
  retryLimitDisconnect = 10,
  retryLimitStartup = 5,
): Promise<Connection> {
  connectionAttemptStatus[connectionString] = {
    status: "connecting",
    connect: {
      allowed: retryLimitStartup,
      remaining: retryLimitStartup,
    },
    reconnect: {
      allowed: retryLimitDisconnect,
      remaining: retryLimitDisconnect,
    },
  };
  return makeConnection(connectionString, protocol, callback);
}

async function reconnect(_: WebsocketConnection) {
  //TODO it's not enough to reconnect with a new websocket, we have to log back in as well
  // Temp don't try to reconnect at all until better interop with a proxy is implemented
  // makeConnection(
  //   connection.url,
  //   connection.protocol,
  //   connection[connectionCallback],
  //   connection
  // );
  //throw Error("connection broken");
}

/**
 * First we create the low level WebSocket, then we create a WebSocketConnection
 * instance which manages messaging over that WebSocket. If the network connection
 * should be broken and we successfully reconnect, a new WebSocket will be created
 * but the WebSocketConnection will persist - the new WebSocket will be assigned as
 * a property and its onmessage, onclose etc event handlers will be assigned and
 * managed by the WebSocketConnection.
 *
 * @param url
 * @param protocol
 * @param callback
 * @param connection
 * @returns
 */
async function makeConnection(
  url: string,
  protocol: WebSocketProtocol,
  callback: ConnectionCallback,
  connection?: WebsocketConnection,
): Promise<Connection> {
  const {
    status: currentStatus,
    connect: connectStatus,
    reconnect: reconnectStatus,
  } = connectionAttemptStatus[url];

  const trackedStatus =
    currentStatus === "connecting" ? connectStatus : reconnectStatus;

  try {
    callback({ type: "connection-status", status: "connecting" });
    const reconnecting = typeof connection !== "undefined";

    const ws = await createWebsocket(url, protocol);

    // We now have an open websocket.
    console.info(
      "%c⚡ %cconnected",
      "font-size: 24px;color: green;font-weight: bold;",
      "color:green; font-size: 14px;",
    );

    // Our WebSocketConnection instance is preserved across network interruptions.
    // It is stateful and carries event listener subscriptions. When the low-level
    // WebSocket has been re-created, we update the WebSocketConnection instance
    // with the new WebSocket.
    if (connection !== undefined) {
      connection[setWebsocket](ws);
    }

    const websocketConnection =
      connection ?? new WebsocketConnection(ws, url, protocol, callback);

    const status = reconnecting
      ? "reconnected"
      : "connection-open-awaiting-session";
    callback({ type: "connection-status", status });
    websocketConnection.status = status;

    //TODO DO NOT DO THIS UNTIL WE KNOW the first message has been received
    // reset the retry attempts for subsequent disconnections
    trackedStatus.remaining = trackedStatus.allowed;

    //TODO we don't return it here, we return a Promise and only resolve it when
    // we get the first message back ???
    return websocketConnection as Connection;
  } catch (err) {
    const retry = --trackedStatus.remaining > 0;
    callback({
      type: "connection-status",
      status: "disconnected",
      reason: "failed to connect",
      retry,
    });
    if (retry) {
      return makeConnectionIn(url, protocol, callback, connection, 2000);
    } else {
      callback({
        type: "connection-status",
        status: "failed",
        reason: "unable to connect",
        retry,
      });
      throw Error("Failed to establish connection");
    }
  }
}

const makeConnectionIn = (
  url: string,
  protocol: WebSocketProtocol,
  callback: ConnectionCallback,
  connection?: WebsocketConnection,
  delay?: number,
): Promise<Connection> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(makeConnection(url, protocol, callback, connection));
    }, delay);
  });

/**
 * Create a new Websocket, returning a promise for the websocket.
 *
 * The promise is resolved only when the websocket is open.
 * The promise is rejected if opening the WebSocket errors.
 *
 *
 * @param websocketUrl
 * @param protocol
 * @returns
 */
const createWebsocket = (
  websocketUrl: string,
  protocol: WebSocketProtocol,
): Promise<WebSocket> =>
  new Promise((resolve, reject) => {
    if (infoEnabled && protocol !== undefined) {
      info(`WebSocket Protocol ${protocol?.toString()}`);
    }
    const timer = setTimeout(() => {
      reject(Error("Fail to open WebSocket connection, timed out"));
    }, WEBSOCKET_TIMEOUT);

    const ws = new WebSocket(websocketUrl, protocol);

    ws.onopen = () => {
      clearTimeout(timer);
      resolve(ws);
    };
    ws.onerror = (evt) => {
      clearTimeout(timer);
      reject(evt);
    };
  });

const closeWarn = () => {
  warn?.(`Connection cannot be closed, socket not yet opened`);
};

const sendWarn = (msg: VuuClientMessage) => {
  warn?.(`Message cannot be sent, socket closed ${msg.body.type}`);
};

const parseMessage = (message: string): VuuServerMessage => {
  try {
    return JSON.parse(message) as VuuServerMessage;
  } catch (e) {
    throw Error(`Error parsing JSON response from server ${message}`);
  }
};

export class WebsocketConnection implements Connection<VuuClientMessage> {
  [connectionCallback]: ConnectionCallback;
  close: () => void = closeWarn;
  requiresLogin = true;
  send: (msg: VuuClientMessage) => void = sendWarn;
  status:
    | "closed"
    | "ready"
    | "connection-open-awaiting-session"
    | "connected"
    | "reconnected" = "ready";

  public protocol: WebSocketProtocol;
  public url: string;
  public messagesCount = 0;

  private connectionMetricsInterval: ReturnType<typeof setInterval> | null =
    null;

  constructor(
    ws: WebSocket,
    url: string,
    protocol: WebSocketProtocol,
    callback: ConnectionCallback,
  ) {
    this.url = url;
    this.protocol = protocol;
    this[connectionCallback] = callback;
    this[setWebsocket](ws);
  }

  reconnect() {
    reconnect(this);
  }

  [setWebsocket](ws: WebSocket) {
    const callback = this[connectionCallback];
    // TODO we need a special first time message handler, that will signal a
    // definitive socket open status. This will be used to resolve.
    ws.onmessage = (evt) => {
      this.status = "connected";
      ws.onmessage = this.handleWebsocketMessage;
      this.handleWebsocketMessage(evt);
    };

    this.connectionMetricsInterval = setInterval(() => {
      callback({
        type: "connection-metrics",
        messagesLength: this.messagesCount,
      });
      this.messagesCount = 0;
    }, 2000);

    ws.onerror = () => {
      error(`⚡ connection error`);
      callback({
        type: "connection-status",
        status: "disconnected",
        reason: "error",
      });

      if (this.connectionMetricsInterval) {
        clearInterval(this.connectionMetricsInterval);
        this.connectionMetricsInterval = null;
      }

      if (this.status === "connection-open-awaiting-session") {
        // our connection has errored before first server message has been received. This
        // is not a normal reconnect, more likely a websocket configuration issue
        error(
          `Websocket connection lost before Vuu session established, check websocket configuration`,
        );
      } else if (this.status !== "closed") {
        reconnect(this);
        this.send = queue;
      }
    };

    ws.onclose = () => {
      info?.(`⚡ connection close`);
      callback({
        type: "connection-status",
        status: "disconnected",
        reason: "close",
      });

      if (this.connectionMetricsInterval) {
        clearInterval(this.connectionMetricsInterval);
        this.connectionMetricsInterval = null;
      }

      if (this.status !== "closed") {
        reconnect(this);
        this.send = queue;
      }
    };

    const send = (msg: VuuClientMessage) => {
      if (process.env.NODE_ENV === "development") {
        if (debugEnabled && msg.body.type !== "HB_RESP") {
          debug?.(`>>> ${msg.body.type}`);
        }
      }
      ws.send(JSON.stringify(msg));
    };

    const queue = (msg: VuuClientMessage) => {
      info?.(`TODO queue message until websocket reconnected ${msg.body.type}`);
    };

    this.send = send;

    this.close = () => {
      this.status = "closed";
      ws.close();
      this.close = closeWarn;
      this.send = sendWarn;
      info?.("close websocket");
    };
  }

  handleWebsocketMessage = (evt: MessageEvent) => {
    const vuuMessageFromServer = parseMessage(evt.data);
    this.messagesCount += 1;
    if (process.env.NODE_ENV === "development") {
      if (debugEnabled && vuuMessageFromServer.body.type !== "HB") {
        debug?.(`<<< ${vuuMessageFromServer.body.type}`);
      }
    }
    this[connectionCallback](vuuMessageFromServer);
  };
}
