import {
  ConnectionStatusMessage,
  DataSourceCallbackMessage,
  ServerProxySubscribeMessage,
  TableSchema,
  VuuUIMessageIn,
  VuuUIMessageOut,
  WebSocketProtocol,
} from "@finos/vuu-data-types";
import {
  VuuRpcMenuRequest,
  VuuTableListRequest,
  VuuTableMetaRequest,
  VuuRpcViewportRequest,
  VuuRpcServiceRequest,
  VuuTable,
  VuuTableList,
  VuuCreateVisualLink,
  VuuRemoveVisualLink, NewVuuRpcServiceRequest,
} from "@finos/vuu-protocol-types";
import {
  EventEmitter,
  getLoggingConfigForWorker,
  isConnectionQualityMetrics,
  isConnectionStatusMessage,
  isRequestResponse,
  isTableSchemaMessage,
  messageHasResult,
  uuid,
} from "@finos/vuu-utils";
import { shouldMessageBeRoutedToDataSource as messageShouldBeRoutedToDataSource } from "./data-source";
import * as Message from "./server-proxy/messages";

// Note: inlined-worker is a generated file, it must be built
import { ConnectionQualityMetrics } from "@finos/vuu-data-types";
import { workerSourceCode } from "./inlined-worker";

const workerBlob = new Blob([getLoggingConfigForWorker() + workerSourceCode], {
  type: "text/javascript",
});
const workerBlobUrl = URL.createObjectURL(workerBlob);

type WorkerResolver = {
  reject: (message: string | PromiseLike<string>) => void;
  resolve: (value: Worker | PromiseLike<Worker>) => void;
};

let worker: Worker;
let pendingWorker: Promise<Worker>;
const pendingWorkerNoToken: WorkerResolver[] = [];

let resolveServer: (server: ServerAPI) => void;
let rejectServer: (err: unknown) => void;

const serverAPI = new Promise<ServerAPI>((resolve, reject) => {
  resolveServer = resolve;
  rejectServer = reject;
});

/**
 * returns a promise for serverApi. This will be resolved when the
 * connectToServer call succeeds. If client never calls connectToServer
 * serverAPI will never be resolved.
 */
export const getServerAPI = () => serverAPI;

export type PostMessageToClientCallback = (
  msg: DataSourceCallbackMessage,
) => void;

const viewports = new Map<
  string,
  {
    postMessageToClientDataSource: PostMessageToClientCallback;
    request: ServerProxySubscribeMessage;
    status: "subscribing";
  }
>();
const pendingRequests = new Map();

type WorkerOptions = {
  protocol: WebSocketProtocol;
  retryLimitDisconnect?: number;
  retryLimitStartup?: number;
  url: string;
  token?: string;
  username: string | undefined;
  handleConnectionStatusChange: (msg: {
    data: ConnectionStatusMessage;
  }) => void;
};

// We do not resolve the worker until we have a connection, but we will get
// connection status messages before that, so we forward them to caller
// while they wait for worker.
const getWorker = async ({
  handleConnectionStatusChange,
  protocol,
  retryLimitDisconnect,
  retryLimitStartup,
  token = "",
  username,
  url,
}: WorkerOptions) => {
  if (token === "" && pendingWorker === undefined) {
    return new Promise<Worker>((resolve, reject) => {
      pendingWorkerNoToken.push({ resolve, reject });
    });
  }
  //FIXME If we have a pending request already and a new request arrives with a DIFFERENT
  // token, this would cause us to ignore the new request and ultimately resolve it with
  // the original request.
  return (
    pendingWorker ||
    // we get this far when we receive the first request with auth token
    (pendingWorker = new Promise((resolve, reject) => {
      const worker = new Worker(workerBlobUrl);

      const timer: number | null = window.setTimeout(() => {
        reject(Error("timed out waiting for worker to load"));
      }, 1000);

      // This is the inial message handler only, it processes messages whilst we are
      // establishing a connection. When we resolve the worker, a runtime message
      // handler will replace this (see below)
      worker.onmessage = (msg: MessageEvent<VuuUIMessageIn>) => {
        const { data: message } = msg;
        if (message.type === "ready") {
          window.clearTimeout(timer);
          worker.postMessage({
            protocol,
            retryLimitDisconnect,
            retryLimitStartup,
            token,
            type: "connect",
            url,
            username,
          });
        } else if (message.type === "connected") {
          worker.onmessage = handleMessageFromWorker;
          resolve(worker);
          for (const pendingWorkerRequest of pendingWorkerNoToken) {
            pendingWorkerRequest.resolve(worker);
          }
          pendingWorkerNoToken.length = 0;
        } else if (isConnectionStatusMessage(message)) {
          handleConnectionStatusChange({ data: message });
        } else if (message.type === "connection-failed") {
          reject(message.reason);
          for (const pendingWorkerRequest of pendingWorkerNoToken) {
            pendingWorkerRequest.reject(message.reason);
          }
          pendingWorkerNoToken.length = 0;
        } else {
          console.warn("ConnectionManager: Unexpected message from the worker");
        }
      };
      // TODO handle error
    }))
  );
};

function handleMessageFromWorker({
  data: message,
}: MessageEvent<VuuUIMessageIn | DataSourceCallbackMessage>) {
  if (messageShouldBeRoutedToDataSource(message)) {
    const viewport = viewports.get(message.clientViewportId);
    if (viewport) {
      viewport.postMessageToClientDataSource(message);
    } else {
      console.error(
        `[ConnectionManager] ${message.type} message received, viewport not found`,
      );
    }
  } else if (isConnectionStatusMessage(message)) {
    ConnectionManager.emit("connection-status", message);
  } else if (isConnectionQualityMetrics(message)) {
    ConnectionManager.emit("connection-metrics", message);
  } else if (isRequestResponse(message)) {
    const { requestId } = message;
    if (pendingRequests.has(requestId)) {
      const { resolve } = pendingRequests.get(requestId);
      pendingRequests.delete(requestId);
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
}

const asyncRequest = <T = unknown>(
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
  worker.postMessage({
    requestId,
    ...msg,
  });
  return new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });
  });
};

export interface ServerAPI {
  destroy: (viewportId?: string) => void;
  getTableSchema: (table: VuuTable) => Promise<TableSchema>;
  getTableList: (module?: string) => Promise<VuuTableList>;
  // TODO its not really unknown
  rpcCall: <T = unknown>(
    msg:
      | VuuRpcServiceRequest
      | NewVuuRpcServiceRequest
      | VuuRpcMenuRequest
      | VuuRpcViewportRequest
      | VuuCreateVisualLink
      | VuuRemoveVisualLink,
  ) => Promise<T>;
  send: (message: VuuUIMessageOut) => void;
  subscribe: (
    message: ServerProxySubscribeMessage,
    callback: PostMessageToClientCallback,
  ) => void;
  unsubscribe: (viewport: string) => void;
}

const connectedServerAPI: ServerAPI = {
  subscribe: (message, callback) => {
    if (viewports.get(message.viewport)) {
      throw Error(
        `ConnectionManager attempting to subscribe with an existing viewport id`,
      );
    }
    // TODO we never use this status
    viewports.set(message.viewport, {
      status: "subscribing",
      request: message,
      postMessageToClientDataSource: callback,
    });
    worker.postMessage({ type: "subscribe", ...message });
  },

  unsubscribe: (viewport) => {
    worker.postMessage({ type: "unsubscribe", viewport });
  },

  send: (message) => {
    worker.postMessage(message);
  },

  destroy: (viewportId?: string) => {
    if (viewportId && viewports.has(viewportId)) {
      viewports.delete(viewportId);
    }
  },

  rpcCall: async <T = unknown>(
    message:
      | VuuRpcServiceRequest
      | VuuRpcMenuRequest
      | VuuRpcViewportRequest
      | VuuCreateVisualLink
      | VuuRemoveVisualLink,
  ) => asyncRequest<T>(message),

  getTableList: async () =>
    asyncRequest<VuuTableList>({ type: "GET_TABLE_LIST" }),

  getTableSchema: async (table) =>
    asyncRequest<TableSchema>({
      type: Message.GET_TABLE_META,
      table,
    }),
};

export type ConnectionEvents = {
  "connection-status": (message: ConnectionStatusMessage) => void;
  "connection-metrics": (message: ConnectionQualityMetrics) => void;
};

export type ConnectOptions = {
  url: string;
  authToken?: string;
  username?: string;
  protocol?: WebSocketProtocol;
  /** Max number of reconnect attempts in the event of unsuccessful websocket connection at startup */
  retryLimitStartup?: number;
  /** Max number of reconnect attempts in the event of a disconnected websocket connection */
  retryLimitDisconnect?: number;
};

class _ConnectionManager extends EventEmitter<ConnectionEvents> {
  // The first request must have the token. We can change this to block others until
  // the request with token is received.
  async connect({
    url,
    authToken,
    username,
    protocol,
    retryLimitDisconnect,
    retryLimitStartup,
  }: ConnectOptions): Promise<ServerAPI> {
    // By passing handleMessageFromWorker here, we can get connection status
    //messages while we wait for worker to resolve.
    worker = await getWorker({
      protocol,
      url,
      token: authToken,
      username,
      retryLimitDisconnect,
      retryLimitStartup,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      handleConnectionStatusChange: handleMessageFromWorker,
    });
    return connectedServerAPI;
  }

  destroy() {
    worker.terminate();
  }
}

export const ConnectionManager = new _ConnectionManager();

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
export const connectToServer = async ({
  url,
  protocol = undefined,
  authToken,
  username,
  retryLimitDisconnect,
  retryLimitStartup,
}: ConnectOptions): Promise<"connected" | "rejected"> => {
  try {
    const serverAPI = await ConnectionManager.connect({
      protocol,
      url,
      authToken,
      username,
      retryLimitDisconnect,
      retryLimitStartup,
    });
    resolveServer(serverAPI);
    return "connected";
  } catch (err: unknown) {
    rejectServer(err);
    return "rejected";
  }
};

export const makeRpcCall = async <T = unknown>(
  rpcRequest: VuuRpcServiceRequest,
) => {
  try {
    return (await serverAPI).rpcCall<T>(rpcRequest);
  } catch (err) {
    throw Error("Error accessing server api");
  }
};

export const newMakeRpcCall = async <T = unknown>(
  rpcRequest: NewVuuRpcServiceRequest,
) => {
  try {
    return (await serverAPI).rpcCall<T>(rpcRequest);
  } catch (err) {
    throw Error("Error accessing server api");
  }
};
