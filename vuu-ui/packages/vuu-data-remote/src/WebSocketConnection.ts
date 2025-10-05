import { WebSocketProtocol } from "@vuu-ui/vuu-data-types";
import { VuuClientMessage, VuuServerMessage } from "@vuu-ui/vuu-protocol-types";
import { DeferredPromise, EventEmitter, logger } from "@vuu-ui/vuu-utils";

export type ConnectingStatus = "connecting" | "reconnecting";
export type ConnectedStatus = "connected" | "reconnected";
export type ConnectionStatus =
  | ConnectedStatus
  | "closed"
  | "connection-open-awaiting-session"
  | "disconnected"
  | "failed"
  | "inactive";

type InternalConnectionStatus = ConnectionStatus | ConnectingStatus;

type ReconnectAttempts = {
  retryAttemptsTotal: number;
  retryAttemptsRemaining: number;
  secondsToNextRetry: number;
};

export interface WebSocketConnectionState<
  T extends InternalConnectionStatus = ConnectionStatus,
> extends ReconnectAttempts {
  connectionPhase: ConnectingStatus;
  connectionStatus: T;
}

const { debug, debugEnabled, info } = logger("WebSocketConnection");

const isNotConnecting = (
  connectionState: WebSocketConnectionState<InternalConnectionStatus>,
): connectionState is WebSocketConnectionState<ConnectionStatus> =>
  connectionState.connectionStatus !== "connecting" &&
  connectionState.connectionStatus !== "reconnecting";

export const isWebSocketConnectionMessage = (
  msg: object | WebSocketConnectionState,
): msg is WebSocketConnectionState => {
  if ("connectionStatus" in msg) {
    return [
      "connecting",
      "connected",
      "connection-open-awaiting-session",
      "reconnecting",
      "reconnected",
      "disconnected",
      "closed",
      "failed",
    ].includes(msg.connectionStatus);
  } else {
    return false;
  }
};

export const isConnected = (
  status: ConnectionStatus,
): status is ConnectedStatus =>
  status === "connected" || status === "reconnected";

export type VuuServerMessageCallback = (msg: VuuServerMessage) => void;

export type RetryLimits = {
  connect: number;
  reconnect: number;
};

export type WebSocketConnectionConfig = {
  url: string;
  protocols: WebSocketProtocol;
  callback: VuuServerMessageCallback;
  connectionTimeout?: number;
  retryLimits?: RetryLimits;
};

const DEFAULT_RETRY_LIMITS: RetryLimits = {
  connect: 5,
  reconnect: 8,
};

const DEFAULT_CONNECTION_TIMEOUT = 10000;

const ConnectingEndState: Record<ConnectingStatus, ConnectedStatus> = {
  connecting: "connected",
  reconnecting: "reconnected",
} as const;

const parseWebSocketMessage = (message: string): VuuServerMessage => {
  try {
    return JSON.parse(message) as VuuServerMessage;
  } catch (e) {
    throw Error(`Error parsing JSON response from server ${message}`);
  }
};

export type WebSocketConnectionCloseReason = "failure" | "shutdown";
export type WebSocketConnectionEvents = {
  closed: (reason: WebSocketConnectionCloseReason) => void;
  connected: () => void;
  "connection-status": (message: WebSocketConnectionState) => void;
  reconnected: () => void;
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
  #connectionState: WebSocketConnectionState<InternalConnectionStatus>;
  #connectionTimeout;
  #deferredConnection?: DeferredPromise;
  #protocols;
  #reconnectAttempts: ReconnectAttempts;
  #requiresLogin = true;
  #url;
  #ws?: WebSocket;

  constructor({
    callback,
    connectionTimeout = DEFAULT_CONNECTION_TIMEOUT,
    protocols,
    retryLimits = DEFAULT_RETRY_LIMITS,
    url,
  }: WebSocketConnectionConfig) {
    super();

    this.#callback = callback;
    this.#connectionTimeout = connectionTimeout;
    this.#url = url;
    this.#protocols = protocols;

    this.#reconnectAttempts = {
      retryAttemptsTotal: retryLimits.reconnect,
      retryAttemptsRemaining: retryLimits.reconnect,
      secondsToNextRetry: 1,
    };

    /**
     * Initial retryAttempts are for the 'connecting' phase. These will
     * be replaced with 'reconnecting' phase retry attempts only once
     * initial connection succeeds.
     */
    this.#connectionState = {
      connectionPhase: "connecting",
      connectionStatus: "closed",
      retryAttemptsTotal: retryLimits.connect,
      retryAttemptsRemaining: retryLimits.connect,
      secondsToNextRetry: 1,
    };
  }

  get connectionTimeout() {
    return this.#connectionTimeout;
  }

  get protocols() {
    return this.#protocols;
  }

  get requiresLogin() {
    return this.#requiresLogin;
  }

  get isClosed() {
    return this.status === "closed";
  }
  get isDisconnected() {
    return this.status === "disconnected";
  }

  get isConnecting() {
    return this.#connectionState.connectionPhase === "connecting";
  }

  get status() {
    return this.#connectionState.connectionStatus;
  }

  private set status(connectionStatus: InternalConnectionStatus) {
    this.#connectionState = {
      ...this.#connectionState,
      connectionStatus,
    };
    // we don't publish the connecting states. They have little meaning for clients
    // and are will generally be very short-lived.
    if (isNotConnecting(this.#connectionState)) {
      this.emit("connection-status", this.#connectionState);
    }
  }

  get connectionState() {
    return this.#connectionState;
  }

  private get hasConnectionAttemptsRemaining() {
    return this.#connectionState.retryAttemptsRemaining > 0;
  }

  private get confirmedOpen() {
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

    if (confirmedOpen && this.isConnecting) {
      this.#connectionState = {
        ...this.#connectionState,
        connectionPhase: "reconnecting",
        ...this.#reconnectAttempts,
      };
    } else if (confirmedOpen) {
      // we have successfully reconnected after a failure.
      // Reset the retry attempts, ready for next failure
      // Note: this retry is shared with 'disconnected' status
      this.#connectionState = {
        ...this.#connectionState,
        ...this.#reconnectAttempts,
      };
    }
  }

  get url() {
    return this.#url;
  }

  async connect(clientCall = true) {
    const state = this.#connectionState;
    if (this.isConnecting && this.#deferredConnection === undefined) {
      // We block on the first connecting call, this will be the
      // initial connect call from app. Any other calls will be
      // reconnect attempts. The initial connecting call returns a promise.
      // This promise is resolved either on that initial call or on a
      // subsequent successful retry attempt within nthat same initial
      // connecting phase.
      this.#deferredConnection = new DeferredPromise();
    }
    const { connectionTimeout, protocols, url } = this;
    this.status = state.connectionPhase;
    const timer = setTimeout(() => {
      throw Error(
        `Failed to open WebSocket connection to ${url}, timed out after ${connectionTimeout}ms`,
      );
    }, connectionTimeout);

    const ws = (this.#ws = new WebSocket(url, protocols));

    ws.onopen = () => {
      const connectedStatus = ConnectingEndState[state.connectionPhase];
      this.status = connectedStatus;
      clearTimeout(timer);
      if (this.#deferredConnection) {
        this.#deferredConnection.resolve(undefined);
        this.#deferredConnection = undefined;
      }
      if (this.isConnecting) {
        this.emit("connected");
      } else {
        this.emit("reconnected");
      }
    };
    ws.onerror = () => {
      clearTimeout(timer);
    };

    ws.onclose = () => {
      if (!this.isClosed) {
        this.confirmedOpen = false;
        this.status = "disconnected";
        if (this.hasConnectionAttemptsRemaining) {
          this.reconnect();
        } else {
          this.close("failure");
        }
      }
    };

    ws.onmessage = (evt) => {
      if (!this.confirmedOpen) {
        // Now that we are confirmedOpen any subsequent close events
        // will be treated as part of a reconnection phase.
        this.confirmedOpen = true;
      }
      this.receive(evt);
    };

    if (clientCall) {
      return this.#deferredConnection?.promise;
    }
  }

  private reconnect() {
    const { retryAttemptsRemaining, secondsToNextRetry } =
      this.#connectionState;
    setTimeout(() => {
      this.#connectionState = {
        ...this.#connectionState,
        retryAttemptsRemaining: retryAttemptsRemaining - 1,
        secondsToNextRetry: secondsToNextRetry * 2,
      };
      this.connect(false);
    }, secondsToNextRetry * 1000);
  }

  private receive = (evt: MessageEvent) => {
    const vuuMessageFromServer = parseWebSocketMessage(evt.data);
    if (vuuMessageFromServer.body.type === "CHANGE_VP_RANGE_SUCCESS") {
      info?.(`CHANGE_VP_RANGE_SUCCESS<#${vuuMessageFromServer.requestId}>`);
    }
    if (debugEnabled) {
      if (vuuMessageFromServer.body.type !== "HB") {
        debug(`${vuuMessageFromServer.body.type}`);
        if (vuuMessageFromServer.body.type === "CHANGE_VP_SUCCESS") {
          debug(JSON.stringify(vuuMessageFromServer.body));
        }
      }
    }
    this.#callback(vuuMessageFromServer);
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
    this.status = "closed";
    if (reason === "failure") {
      if (this.#deferredConnection) {
        this.#deferredConnection.reject(Error("connection failed"));
        this.#deferredConnection = undefined;
      }
    } else {
      this.#ws?.close();
    }
    this.emit("closed", reason);
    this.#ws = undefined;
  }
}
