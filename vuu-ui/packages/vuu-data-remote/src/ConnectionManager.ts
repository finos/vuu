import {
  ConnectOptions,
  DataSourceCallbackMessage,
  ServerAPI,
  ServerProxySubscribeMessage,
  TableSchema,
  VuuUIMessageIn,
} from "@finos/vuu-data-types";
import {
  VuuCreateVisualLink,
  VuuRemoveVisualLink,
  VuuRpcMenuRequest,
  VuuRpcServiceRequest,
  VuuRpcViewportRequest,
  VuuTableList,
  VuuTableListRequest,
  VuuTableMetaRequest,
} from "@finos/vuu-protocol-types";
import {
  DeferredPromise,
  EventEmitter,
  isConnectionQualityMetrics,
  isRequestResponse,
  isTableSchemaMessage,
  messageHasResult,
  uuid,
} from "@finos/vuu-utils";
import {
  WebSocketConnectionEvents,
  WebSocketConnectionState,
  isWebSocketConnectionMessage,
} from "./WebSocketConnection";
import { DedicatedWorker } from "./DedicatedWorker";
import { shouldMessageBeRoutedToDataSource } from "./data-source";

import { ConnectionQualityMetrics } from "@finos/vuu-data-types";

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

class ConnectionManager extends EventEmitter<ConnectionEvents> {
  #connectionState: WebSocketConnectionState = {
    connectionPhase: "connecting",
    connectionStatus: "closed",
    retryAttemptsTotal: -1,
    retryAttemptsRemaining: -1,
    secondsToNextRetry: -1,
  };
  static #instance: ConnectionManager;
  #deferredServerAPI = new DeferredPromise<ServerAPI>();
  #pendingRequests = new Map();
  #viewports = new Map<string, RegisteredViewport>();
  // #worker?: Worker;
  #worker: DedicatedWorker;

  private constructor() {
    super();
    this.#worker = new DedicatedWorker(this.handleMessageFromWorker);
  }

  public static get instance(): ConnectionManager {
    if (!ConnectionManager.#instance) {
      ConnectionManager.#instance = new ConnectionManager();
    }
    return ConnectionManager.#instance;
  }

  /**
   * Open a connection to the VuuServer. This method opens the websocket connection
   * and logs in. It can be called from whichever client code has access to the auth
   * token (eg. the login page, or just a hardcoded login script in a sample).
   * This will unblock any DataSources which may have already tried to subscribe to data,
   * but lacked access to the auth token.
   *
   * @param serverUrl
   * @param token
   */
  async connect(options: ConnectOptions) {
    const result = await this.#worker.connect(options);
    if (result === "connected") {
      this.#deferredServerAPI.resolve(this.connectedServerAPI);
    }
    return result;
  }

  private handleMessageFromWorker = (
    message: VuuUIMessageIn | DataSourceCallbackMessage,
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
    } else if (isWebSocketConnectionMessage(message)) {
      this.#connectionState = message;
      this.emit("connection-status", message);
    } else if (isConnectionQualityMetrics(message)) {
      this.emit("connection-metrics", message);
    } else if (isRequestResponse(message)) {
      const { requestId } = message;
      if (this.#pendingRequests.has(requestId)) {
        const { resolve } = this.#pendingRequests.get(requestId);
        this.#pendingRequests.delete(requestId);
        const { requestId: _, ...messageWithoutRequestId } = message;

        if (messageHasResult(message)) {
          resolve(message.result);
        } else if (
          message.type === "VP_EDIT_RPC_RESPONSE" ||
          message.type === "VP_EDIT_RPC_REJECT"
        ) {
          resolve(message);
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

  get connectionStatus() {
    return this.#connectionState.connectionStatus;
  }

  get serverAPI() {
    return this.#deferredServerAPI.promise;
  }

  private connectedServerAPI: ServerAPI = {
    subscribe: (message, callback) => {
      if (this.#viewports.get(message.viewport)) {
        throw Error(
          `ConnectionManager attempting to subscribe with an existing viewport id`,
        );
      }
      // TODO we never use this status
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
        | VuuRpcViewportRequest
        | VuuCreateVisualLink
        | VuuRemoveVisualLink,
    ) => this.asyncRequest<T>(message),

    getTableList: async () =>
      this.asyncRequest<VuuTableList>({ type: "GET_TABLE_LIST" }),

    getTableSchema: async (table) =>
      this.asyncRequest<TableSchema>({
        type: "GET_TABLE_META",
        table,
      }),
  };

  private asyncRequest = <T = unknown>(
    msg:
      | VuuRpcServiceRequest
      | VuuRpcMenuRequest
      | VuuTableListRequest
      | VuuTableMetaRequest
      | VuuRpcViewportRequest
      | VuuCreateVisualLink
      | VuuRemoveVisualLink,
  ): Promise<T> => {
    const requestId = uuid();
    this.#worker.send({
      requestId,
      ...msg,
    });
    return new Promise((resolve, reject) => {
      this.#pendingRequests.set(requestId, { resolve, reject });
    });
  };

  async disconnect() {
    try {
      // should we await this ?
      this.#worker.send({ type: "disconnect" });
      // how do we disable the serverAPI
      return "disconnected";
    } catch (err: unknown) {
      return "rejected";
    }
  }

  destroy() {
    this.#worker.terminate();
  }

  async makeRpcCall<T = unknown>(rpcRequest: VuuRpcServiceRequest) {
    try {
      return this.asyncRequest<T>(rpcRequest);
    } catch (err) {
      throw Error("Error accessing server api");
    }
  }
}

export default ConnectionManager.instance;
