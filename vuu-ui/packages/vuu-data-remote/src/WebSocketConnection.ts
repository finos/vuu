import { WebSocketProtocol } from "@vuu-ui/vuu-data-types";
import {
  InvalidSessionReason,
  InvalidTokenReason,
  LoginErrorMessage,
  VuuClientMessage,
  VuuServerMessage,
} from "@vuu-ui/vuu-protocol-types";
import {
  DeferredPromise,
  EventEmitter,
  isLoginErrorMessage,
  logger,
} from "@vuu-ui/vuu-utils";

export type ConnectionPhase =
  | "initial-connection"
  | "post-disconnect-reconnection";
export type ConnectingStatus = "connecting" | "reconnecting";
export type ConnectedStatus = "connected" | "reconnected";
export type ConnectionStatus =
  | ConnectingStatus
  | ConnectedStatus
  | "closed"
  | "websocket-open"
  | "disconnected"
  | "failed"
  | "inactive";

export const isInvalidTokenReason = (
  text: string,
): text is InvalidTokenReason =>
  text === "Invalid token" || text === "Token has expired";

export const isInvalidSessionReason = (
  text: string,
): text is InvalidSessionReason =>
  text === "Invalid session" || text === "User session limit exceeded";

const { debug, debugEnabled, info } = logger("WebSocketConnection");

export const isWebSocketConnectionStatus = (
  msg: unknown,
): msg is ConnectionStatus =>
  typeof msg === "string" &&
  [
    "connecting",
    "websocket-open",
    "connected",
    "reconnecting",
    "reconnected",
    "disconnected",
    "closed",
    "failed",
  ].includes(msg);

export const isConnected = (
  status: ConnectionStatus,
): status is ConnectedStatus =>
  status === "connected" || status === "reconnected";

export type LoginRejectedMessage = {
  type: "LOGIN_REJECTED";
  reason: LoginErrorMessage;
};

export const isLoginRejectedMessage = (
  message: object,
): message is LoginRejectedMessage =>
  message !== null && "type" in message && message.type === "LOGIN_REJECTED";

export type VuuServerMessageCallback = (
  msg: VuuServerMessage | LoginRejectedMessage,
) => void;

export type WebSocketConnectionConfig = {
  url: string;
  protocols: WebSocketProtocol;
  callback: VuuServerMessageCallback;
  connectionTimeout?: number;
};

const DEFAULT_CONNECTION_TIMEOUT = 10000;

const parseWebSocketMessage = (message: string): VuuServerMessage => {
  try {
    return JSON.parse(message) as VuuServerMessage;
  } catch (e) {
    throw Error(`Error parsing JSON response from server ${message}`);
  }
};

export type WebSocketConnectionCloseReason =
  | LoginErrorMessage
  | "failure"
  | "shutdown";

export type WebSocketConnectionEvents = {
  "connection-status": (status: ConnectionStatus) => void;
};

export class WebSocketConnection extends EventEmitter<WebSocketConnectionEvents> {
  #callback;
  /**
   We are not confirmedOpen until we receive the first message from the
   server. If we get an unexpected close event before that, we consider
   the reconnect attempts as still within the connection phase, not true
   reconnection. This can happen e.g. when connecting to remote host via
   a proxy.
  */
  #confirmedOpen = false;
  #connectionPhase: ConnectionPhase = "initial-connection";
  #connectionStatus: ConnectionStatus = "closed";

  #connectionTimeout;
  #deferredOpen?: DeferredPromise;
  #protocols;
  #url;
  #ws?: WebSocket;

  constructor({
    callback,
    connectionTimeout = DEFAULT_CONNECTION_TIMEOUT,
    protocols,
    url,
  }: WebSocketConnectionConfig) {
    super();

    this.#callback = callback;
    this.#connectionTimeout = connectionTimeout;
    this.#url = url;
    this.#protocols = protocols;
  }

  get connectionTimeout() {
    return this.#connectionTimeout;
  }

  get protocols() {
    return this.#protocols;
  }

  get isClosed() {
    return this.#connectionStatus === "closed";
  }
  get isDisconnected() {
    return this.#connectionStatus === "disconnected";
  }

  get connectionPhase() {
    return this.#connectionPhase;
  }

  get connectionStatus() {
    return this.#connectionStatus;
  }

  private set connectionStatus(connectionStatus: ConnectionStatus) {
    if (
      connectionStatus !== "connecting" &&
      connectionStatus !== "reconnecting"
    ) {
      this.#connectionStatus = connectionStatus;
      this.emit("connection-status", this.#connectionStatus);
    }
  }

  get confirmedOpen() {
    return this.#confirmedOpen;
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
  private set confirmedOpen(confirmedOpen: boolean) {
    this.#confirmedOpen = confirmedOpen;
    if (confirmedOpen && this.#connectionPhase === "initial-connection") {
      this.#connectionPhase = "post-disconnect-reconnection";
    }
  }

  get url() {
    return this.#url;
  }

  async openWebSocket() {
    const initialConnect = this.#connectionPhase === "initial-connection";
    if (this.#deferredOpen === undefined) {
      this.#deferredOpen = new DeferredPromise();
    }
    const { connectionTimeout, protocols, url } = this;
    this.#connectionStatus = initialConnect ? "connecting" : "reconnecting";

    const timer = setTimeout(() => {
      throw Error(
        `Failed to open WebSocket connection to ${url}, timed out after ${connectionTimeout}ms`,
      );
    }, connectionTimeout);

    const ws = (this.#ws = new WebSocket(url, protocols));

    ws.onopen = () => {
      this.connectionStatus = "websocket-open";

      clearTimeout(timer);

      // Do we do this here or after login
      if (this.#deferredOpen) {
        this.#deferredOpen.resolve(undefined);
        this.#deferredOpen = undefined;
      }
    };

    ws.onerror = () => {
      clearTimeout(timer);
    };

    ws.onclose = () => {
      if (!this.isClosed) {
        this.confirmedOpen = false;
        // Do we emit disconnected even if not confirmed open ?
        // this will emit disconnected
        this.connectionStatus = "disconnected";
        // this will emit closed
        this.close("failure");
      }
    };

    ws.onmessage = (evt) => {
      this.receive(evt);
    };

    return this.#deferredOpen?.promise;
  }

  private receive = (evt: MessageEvent) => {
    if (isLoginErrorMessage(evt.data)) {
      console.log(`[WebSocketConnection] closed because of login issue`);
      if (this.#deferredOpen) {
        console.log(`... and qwe have a deferred connection`);
      }

      this.#callback({
        type: "LOGIN_REJECTED",
        reason: evt.data,
      });
      this.close(evt.data);
    } else {
      const vuuMessageFromServer = parseWebSocketMessage(evt.data);

      if (debugEnabled) {
        if (vuuMessageFromServer.body.type !== "HB") {
          debug(`${vuuMessageFromServer.body.type}`);
          if (vuuMessageFromServer.body.type === "CHANGE_VP_SUCCESS") {
            debug(JSON.stringify(vuuMessageFromServer.body));
          }
        }
      }
      this.#callback(vuuMessageFromServer);

      if (!this.confirmedOpen) {
        if (vuuMessageFromServer.body.type === "LOGIN_SUCCESS") {
          // Now that we are confirmedOpen any subsequent close events
          // will be treated as part of a reconnection phase.
          this.connectionStatus =
            this.#connectionPhase === "initial-connection"
              ? "connected"
              : "reconnected";
          this.confirmedOpen = true;
        }
      }
    }
  };

  send = (msg: VuuClientMessage) => {
    if (msg.body.type === "CHANGE_VP_RANGE") {
      info?.(
        `CHANGE_VP_RANGE<#${msg.requestId}> ${msg.body.from}-${msg.body.to}`,
      );
    }
    this.#ws?.send(JSON.stringify(msg));
  };

  close(reason: WebSocketConnectionCloseReason = "shutdown") {
    this.connectionStatus = "closed";
    if (reason === "failure") {
      if (this.#deferredOpen) {
        this.#deferredOpen.reject(Error("connection failed"));
        this.#deferredOpen = undefined;
      }
    } else {
      this.#ws?.close();
    }
    this.#ws = undefined;
  }
}
