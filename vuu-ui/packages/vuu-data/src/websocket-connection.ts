import {
  ServerToClientMessage,
  ClientToServerMessage,
} from "@finos/vuu-protocol-types";
import { logger } from "@finos/vuu-utils";
import { Connection } from "./connectionTypes";

import { ConnectionStatus, ConnectionStatusMessage } from "./vuuUIMessageTypes";

export type ConnectionMessage = ServerToClientMessage | ConnectionStatusMessage;
export type ConnectionCallback = (msg: ConnectionMessage) => void;

const WS = "ws"; // to stop semGrep complaining
const isWebsocketUrl = (url: string) =>
  url.startsWith(WS + "://") || url.startsWith(WS + "s://");

const connectionAttempts: {
  [key: string]: { attemptsRemaining: number; status: ConnectionStatus };
} = {};

const setWebsocket = Symbol("setWebsocket");
const connectionCallback = Symbol("connectionCallback");

export async function connect(
  connectionString: string,
  callback: ConnectionCallback
): Promise<Connection> {
  return makeConnection(connectionString, callback);
}

async function reconnect(connection: WebsocketConnection) {
  //TODO it's not enough to reconnect with a new websocket, we have to log back in as well
  makeConnection(connection.url, connection[connectionCallback], connection);
}

async function makeConnection(
  url: string,
  callback: ConnectionCallback,
  connection?: WebsocketConnection
): Promise<Connection> {
  const connectionStatus =
    connectionAttempts[url] ||
    (connectionAttempts[url] = {
      attemptsRemaining: 5,
      status: "disconnected",
    });

  try {
    callback({ type: "connection-status", status: "connecting" });
    const reconnecting = typeof connection !== "undefined";
    const ws = await createWebsocket(url);

    logger.log(
      "%c⚡ %cconnected",
      "font-size: 24px;color: green;font-weight: bold;",
      "color:green; font-size: 14px;"
    );

    if (connection !== undefined) {
      connection[setWebsocket](ws);
    }

    const websocketConnection =
      connection ?? new WebsocketConnection(ws, url, callback);

    const status = reconnecting ? "reconnected" : "connected";
    callback({ type: "connection-status", status });
    websocketConnection.status = status;

    return websocketConnection as Connection;
  } catch (evt) {
    const retry = --connectionStatus.attemptsRemaining > 0;
    callback({
      type: "connection-status",
      status: "disconnected",
      reason: "failed to connect",
      retry,
    });
    if (retry) {
      return makeConnectionIn(url, callback, connection, 10000);
    } else {
      throw Error("Failed to establish connection");
    }
  }
}

const makeConnectionIn = (
  url: string,
  callback: ConnectionCallback,
  connection?: WebsocketConnection,
  delay?: number
): Promise<Connection> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(makeConnection(url, callback, connection));
    }, delay);
  });

const createWebsocket = (connectionString: string): Promise<WebSocket> =>
  new Promise((resolve, reject) => {
    //TODO add timeout
    // const websocketUrl = WS_PATTERN.test(connectionString)
    const websocketUrl = isWebsocketUrl(connectionString)
      ? connectionString
      : `wss://${connectionString}`;
    const ws = new WebSocket(websocketUrl);
    ws.onopen = () => resolve(ws);
    ws.onerror = (evt) => reject(evt);
  });

const closeWarn = () => {
  logger.warn(`Connection cannot be closed, socket not yet opened`);
};

const sendWarn = (msg: ClientToServerMessage) => {
  logger.warn(`Message cannot be sent, socket closed`, msg);
};

const parseMessage = (message: string): ServerToClientMessage => {
  try {
    return JSON.parse(message) as ServerToClientMessage;
  } catch (e) {
    throw Error(`Error parsing JSON response from server ${message}`);
  }
};

export class WebsocketConnection implements Connection<ClientToServerMessage> {
  [connectionCallback]: ConnectionCallback;
  close: () => void = closeWarn;
  requiresLogin = true;
  send: (msg: ClientToServerMessage) => void = sendWarn;
  status: "closed" | "ready" | "connected" | "reconnected" = "ready";

  public url: string;

  constructor(ws: WebSocket, url: string, callback: ConnectionCallback) {
    this.url = url;
    this[connectionCallback] = callback;
    this[setWebsocket](ws);
  }

  reconnect() {
    reconnect(this);
  }

  [setWebsocket](ws: WebSocket) {
    const callback = this[connectionCallback];
    ws.onmessage = (evt) => {
      const vuuMessageFromServer = parseMessage(evt.data);
      console.log(`%c<<< ${vuuMessageFromServer.body.type}`, "color: brown");
      callback(vuuMessageFromServer);
    };

    ws.onerror = () => {
      logger.error(
        `%c⚡ connection error`,
        "font-size: 24px;color: red;font-weight: bold;",
        "color:red; font-size: 14px;"
      );
      callback({
        type: "connection-status",
        status: "disconnected",
        reason: "error",
      });
      if (this.status !== "closed") {
        reconnect(this);
        this.send = queue;
      }
    };

    ws.onclose = () => {
      logger.log(
        `%c⚡ connection close`,
        "font-size: 24px;color: orange;font-weight: bold;",
        "color:orange; font-size: 14px;"
      );
      callback({
        type: "connection-status",
        status: "disconnected",
        reason: "close",
      });
      if (this.status !== "closed") {
        reconnect(this);
        this.send = queue;
      }
    };

    const send = (msg: ClientToServerMessage) => {
      // console.log(
      //   `%c>>>  (WebSocket) ${JSON.stringify(msg)}`,
      //   "color:blue;font-weight:bold;"
      // );
      console.log(`%c>>> ${msg.body.type}`, "color: green; font-weight: bold;");

      ws.send(JSON.stringify(msg));
    };

    const queue = (_msg: ClientToServerMessage) => {
      console.log(`TODO queue message until websocket reconnected`, {
        _msg,
      });
    };

    this.send = send;

    this.close = () => {
      logger.log("[Connection] close websocket");
      this.status = "closed";
      ws.close();
      this.close = closeWarn;
      this.send = sendWarn;
    };
  }
}
