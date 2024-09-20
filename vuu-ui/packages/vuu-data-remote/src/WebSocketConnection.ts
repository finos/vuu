import {
  ConnectionQualityMetrics,
  ConnectionStatus,
  ConnectionStatusMessage,
  WebSocketProtocol,
} from "@finos/vuu-data-types";
import {
  ClientMessageBody,
  VuuClientMessage,
  VuuServerMessage,
} from "@finos/vuu-protocol-types";
import { Connection } from "./connectionTypes";

type ConnectionMessage =
  | VuuServerMessage
  | ConnectionStatusMessage
  | ConnectionQualityMetrics;

export type ConnectionCallback = (msg: ConnectionMessage) => void;

type RetryLimits = {
  connect: number;
  reconnect: number;
};

type WebSocketConnectionConfig = {
  url: string;
  protocols: WebSocketProtocol;
  callback: ConnectionCallback;
  connectionTimeout: number;
  retryLimits: RetryLimits;
};

type ConnectionTracking = {
  connect: {
    allowed: number;
    remaining: number;
  };
  reconnect: {
    allowed: number;
    remaining: number;
  };
};

const DEFAULT_RETRY_LIMITS: RetryLimits = {
  connect: 5,
  reconnect: 10,
};

const DEFAULT_CONNECTION_TIMEOUT = 10000;

export const createWebSocketConnection = ({
  url,
  protocols,
  callback,
  connectionTimeout = DEFAULT_CONNECTION_TIMEOUT,
  retryLimits = DEFAULT_RETRY_LIMITS,
}: Omit<WebSocketConnectionConfig, "connectionTimeout" | "retryLimits"> & {
  connectionTimeout?: number;
  retryLimits?: RetryLimits;
}) =>
  new Promise((resolve, reject) => {
    const connection = new WebSocketConnection({
      connectionTimeout,
      url,
      protocols,
      callback,
      retryLimits,
    });
    try {
      connection.connect().then(() => {
        resolve(connection);
      });
    } catch (err) {
      reject(err);
    }
  });

class WebSocketConnection implements Connection<VuuClientMessage> {
  #connectionTimeout;
  #status: ConnectionStatus = "closed";
  #url;
  #protocols;
  #callback;
  #connectionAttemptStatus: ConnectionTracking;
  #ws?: WebSocket;

  constructor({
    callback,
    connectionTimeout,
    protocols,
    retryLimits,
    url,
  }: WebSocketConnectionConfig) {
    this.#callback = callback;
    this.#connectionTimeout = connectionTimeout;
    this.#url = url;
    this.#protocols = protocols;

    this.#connectionAttemptStatus = {
      connect: {
        allowed: retryLimits.connect,
        remaining: retryLimits.connect,
      },
      reconnect: {
        allowed: retryLimits.reconnect,
        remaining: retryLimits.reconnect,
      },
    };
  }
  /*
    requiresLogin?: boolean | undefined;
    send: (message: VuuClientMessage<ClientMessageBody>) => void;
    status: "connection-open-awaiting-session" | "connected" | "reconnected" | "closed" | "ready";
*/

  get connectionTimeout() {
    return this.#connectionTimeout;
  }

  get protocols() {
    return this.#protocols;
  }

  get status() {
    return this.#status;
  }

  get url() {
    return this.#url;
  }

  async connect() {
    const { connectionTimeout, protocols, url } = this;
    this.#status = "connecting";
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          Error(
            `Failed to open WebSocket connection to ${url}, timed out after ${connectionTimeout}ms`,
          ),
        );
      }, connectionTimeout);

      const ws = new WebSocket(url, protocols);

      ws.onopen = () => {
        this.#status = "connected";
        clearTimeout(timer);
        resolve(ws);
      };
      ws.onerror = (evt) => {
        this.#status = "failed";
        clearTimeout(timer);
        reject(evt);
      };
    });
  }
}
