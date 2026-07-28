import type {
  ConnectOptions,
  DataSourceCallbackMessage,
  ServerAPI,
  ServerProxySubscribeMessage,
  TableSchema,
  VuuUIMessageIn,
} from "@vuu-ui/vuu-data-types";
import type {
  SelectRequest,
  SelectResponse,
  VuuCreateVisualLink,
  VuuRemoveVisualLink,
  VuuRpcMenuRequest,
  VuuRpcServiceRequest,
  VuuTableList,
  VuuTableListRequest,
  VuuTableMetaRequest,
} from "@vuu-ui/vuu-protocol-types";
import {
  DeferredPromise,
  EventEmitter,
  isConnectionQualityMetrics,
  isRequestResponse,
  isTableSchemaMessage,
  messageHasResult,
  uuid,
} from "@vuu-ui/vuu-utils";
import type { ConnectionQualityMetrics } from "@vuu-ui/vuu-data-types";
import type {
  ConnectionStatus,
  WebSocketConnectionEvents,
} from "./WebSocketConnection";
import { isWebSocketConnectionStatus } from "./WebSocketConnection";
import { DedicatedWorker } from "./DedicatedWorker";
import { shouldMessageBeRoutedToDataSource } from "./data-source";

export const DEFAULT_CONNECTION_ID = "portal";

export type PostMessageToClientCallback = (
  msg: DataSourceCallbackMessage,
) => void;

export type ConnectionEvents = WebSocketConnectionEvents & {
  "connection-metrics": (message: ConnectionQualityMetrics) => void;
};

type RegisteredViewport = {
  postMessageToClientDataSource: PostMessageToClientCallback;
  request: ServerProxySubscribeMessage;
  status: "subscribing";
};

class ConnectionChannel {
  #connectionStatus: ConnectionStatus = "closed";
  #deferredServerAPI = new DeferredPromise<ServerAPI>();
  #pendingRequests = new Map<string, { resolve: (value: unknown) => void }>();
  #viewports = new Map<string, RegisteredViewport>();
  #worker: DedicatedWorker;
  readonly #serverAPI: ServerAPI;

  constructor(
    private readonly onConnectionStatus: (status: ConnectionStatus) => void,
    private readonly onConnectionMetrics: (
      message: ConnectionQualityMetrics,
    ) => void,
  ) {
    this.#worker = new DedicatedWorker(this.handleMessageFromWorker);
    this.#serverAPI = {
      subscribe: (message, callback) => {
        if (this.#viewports.get(message.viewport)) {
          throw Error(
            `ConnectionManager attempting to subscribe with an existing viewport id`,
          );
        }
        this.#viewports.set(message.viewport, {
          status: "subscribing",
          request: message,
          postMessageToClientDataSource: callback,
        });
        this.#worker.send({ type: "subscribe", ...message });
      },

      unsubscribe: (viewport) => {
        this.#worker.send({ type: "unsubscribe", viewport });
      },

      send: (message) => {
        this.#worker.send(message);
      },

      destroy: (viewportId?: string) => {
        if (viewportId && this.#viewports.has(viewportId)) {
          this.#viewports.delete(viewportId);
        }
      },

      rpcCall: async <T = unknown>(
        message:
          | VuuRpcServiceRequest
          | VuuRpcMenuRequest
          | VuuCreateVisualLink
          | VuuRemoveVisualLink,
      ) => this.asyncRequest<T>(message),

      select: async (selectRequest: SelectRequest) =>
        this.asyncRequest<SelectResponse>(selectRequest),

      getTableList: async () =>
        this.asyncRequest<VuuTableList>({ type: "GET_TABLE_LIST" }),

      getTableSchema: async (table) =>
        this.asyncRequest<TableSchema>({
          type: "GET_TABLE_META",
          table,
        }),
    };
  }

  get connectionStatus() {
    return this.#connectionStatus;
  }

  get connected() {
    return (
      this.#connectionStatus === "connected" ||
      this.#connectionStatus === "reconnected"
    );
  }

  get serverAPI() {
    return this.#deferredServerAPI.promise;
  }

  async connect(options: ConnectOptions, throwOnRejected = false) {
    try {
      const result = await this.#worker.connect(options);
      if (result === "connected") {
        this.#deferredServerAPI.resolve(this.#serverAPI);
      }
      return result;
    } catch (err: unknown) {
      if (throwOnRejected) {
        throw err;
      }
      return "connection-failed";
    }
  }

  disableActiveSubscriptions() {
    this.#worker.send({ type: "disable-all-active" });
  }

  enableActiveSubscriptions() {
    this.#worker.send({ type: "enable-all-active" });
  }

  async disconnect() {
    try {
      this.#worker.send({ type: "disconnect" });
      this.#deferredServerAPI = new DeferredPromise<ServerAPI>();
      return "disconnected";
    } catch {
      return "rejected";
    }
  }

  destroy() {
    this.#worker.terminate();
  }

  private handleMessageFromWorker = (
    message: VuuUIMessageIn | DataSourceCallbackMessage | ConnectionStatus,
  ) => {
    if (shouldMessageBeRoutedToDataSource(message)) {
      const viewport = this.#viewports.get(message.clientViewportId);
      if (viewport) {
        viewport.postMessageToClientDataSource(message);
      } else {
        console.error(
          `[ConnectionManager] ${message.type} message received, viewport not found`,
        );
      }
    } else if (isWebSocketConnectionStatus(message)) {
      this.#connectionStatus = message;
      this.onConnectionStatus(message);
    } else if (isConnectionQualityMetrics(message)) {
      this.onConnectionMetrics(message);
    } else if (isRequestResponse(message)) {
      const { requestId } = message;
      if (this.#pendingRequests.has(requestId)) {
        const { resolve } = this.#pendingRequests.get(requestId)!;
        this.#pendingRequests.delete(requestId);
        const { requestId: _, ...messageWithoutRequestId } = message;

        if (messageHasResult(message)) {
          resolve(message.result);
        } else if (isTableSchemaMessage(message)) {
          resolve(message.tableSchema);
        } else {
          resolve(messageWithoutRequestId);
        }
      } else {
        console.warn(
          "%cConnectionManager Unexpected message from the worker",
          "color:red;font-weight:bold;",
        );
      }
    }
  };

  private asyncRequest = <T = unknown>(
    msg:
      | VuuRpcServiceRequest
      | VuuRpcMenuRequest
      | VuuTableListRequest
      | VuuTableMetaRequest
      | VuuCreateVisualLink
      | VuuRemoveVisualLink
      | SelectRequest,
  ): Promise<T> => {
    const requestId = uuid();
    this.#worker.send({
      requestId,
      ...msg,
    });
    return new Promise((resolve) => {
      this.#pendingRequests.set(requestId, { resolve });
    }) as Promise<T>;
  };
}

class ConnectionManager extends EventEmitter<ConnectionEvents> {
  static #instance: ConnectionManager;
  #connections = new Map<string, ConnectionChannel>();

  private constructor() {
    super();
  }

  public static get instance(): ConnectionManager {
    if (!ConnectionManager.#instance) {
      ConnectionManager.#instance = new ConnectionManager();
    }
    return ConnectionManager.#instance;
  }

  private getConnection(connectionId = DEFAULT_CONNECTION_ID) {
    const existing = this.#connections.get(connectionId);
    if (existing) {
      return existing;
    }

    const connection = new ConnectionChannel(
      (status) => {
        if (connectionId === DEFAULT_CONNECTION_ID) {
          this.emit("connection-status", status);
        }
      },
      (metrics) => {
        if (connectionId === DEFAULT_CONNECTION_ID) {
          this.emit("connection-metrics", metrics);
        }
      },
    );

    this.#connections.set(connectionId, connection);
    return connection;
  }

  get connectionStatus() {
    return this.connectionStatusFor(DEFAULT_CONNECTION_ID);
  }

  get connected() {
    return this.connectedFor(DEFAULT_CONNECTION_ID);
  }

  connectionStatusFor(connectionId: string) {
    return this.getConnection(connectionId).connectionStatus;
  }

  connectedFor(connectionId: string) {
    return this.getConnection(connectionId).connected;
  }

  async connect(options: ConnectOptions, throwOnRejected = false) {
    return this.connectTo(DEFAULT_CONNECTION_ID, options, throwOnRejected);
  }

  async connectTo(
    connectionId: string,
    options: ConnectOptions,
    throwOnRejected = false,
  ) {
    return this.getConnection(connectionId).connect(options, throwOnRejected);
  }

  disableActiveSubscriptions() {
    for (const connection of this.#connections.values()) {
      connection.disableActiveSubscriptions();
    }
  }

  enableActiveSubscriptions() {
    for (const connection of this.#connections.values()) {
      connection.enableActiveSubscriptions();
    }
  }

  disableActiveSubscriptionsFor(connectionId: string) {
    this.getConnection(connectionId).disableActiveSubscriptions();
  }

  enableActiveSubscriptionsFor(connectionId: string) {
    this.getConnection(connectionId).enableActiveSubscriptions();
  }

  get serverAPI() {
    return this.serverAPIFor(DEFAULT_CONNECTION_ID);
  }

  serverAPIFor(connectionId: string) {
    return this.getConnection(connectionId).serverAPI;
  }

  async disconnect() {
    return this.disconnectFrom(DEFAULT_CONNECTION_ID);
  }

  async disconnectFrom(connectionId: string) {
    return this.getConnection(connectionId).disconnect();
  }

  destroy() {
    for (const connection of this.#connections.values()) {
      connection.destroy();
    }
    this.#connections.clear();
  }
}

export default ConnectionManager.instance;
