import {
  ClientToServerMenuRPC,
  ClientToServerTableList,
  ClientToServerTableMeta,
  VuuRpcRequest,
  VuuTable,
  VuuTableList,
} from "@finos/vuu-protocol-types";
import {
  EventEmitter,
  getLoggingConfigForWorker,
  uuid,
} from "@finos/vuu-utils";
import {
  DataSourceCallbackMessage,
  shouldMessageBeRoutedToDataSource as messageShouldBeRoutedToDataSource,
} from "./data-source";
import * as Message from "./server-proxy/messages";
import {
  ConnectionStatusMessage,
  isConnectionQualityMetrics,
  isConnectionStatusMessage,
  isTableSchema,
  messageHasResult,
  ServerProxySubscribeMessage,
  VuuUIMessageIn,
  VuuUIMessageInRPC,
  VuuUIMessageInTableList,
  VuuUIMessageInTableMeta,
  VuuUIMessageOut,
} from "./vuuUIMessageTypes";

// Note: inlined-worker is a generated file, it must be built
import { workerSourceCode } from "./inlined-worker";
import { ConnectionQualityMetrics } from "./vuuUIMessageTypes";
import { WebSocketProtocol } from "./websocket-connection";
import { TableSchema } from "./message-utils";

const workerBlob = new Blob([getLoggingConfigForWorker() + workerSourceCode], {
  type: "text/javascript",
});
const workerBlobUrl = URL.createObjectURL(workerBlob);

type WorkerResolver = {
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

export const getServerAPI = () => serverAPI;

export type PostMessageToClientCallback = (
  msg: DataSourceCallbackMessage
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
    return new Promise<Worker>((resolve) => {
      pendingWorkerNoToken.push({ resolve });
    });
  }
  //FIXME If we have a pending request already and a new request arrives with a DIFFERENT
  // token, this would cause us to ignore the new request and ultimately resolve it with
  // the original request.
  return (
    pendingWorker ||
    // we get this far when we receive the first request with auth token
    (pendingWorker = new Promise((resolve) => {
      const worker = new Worker(workerBlobUrl);

      const timer: number | null = window.setTimeout(() => {
        console.error("timed out waiting for worker to load");
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
        `[ConnectionManager] ${message.type} message received, viewport not found`
      );
    }
  } else if (isConnectionStatusMessage(message)) {
    ConnectionManager.emit("connection-status", message);
  } else if (isConnectionQualityMetrics(message)) {
    console.log({ message });
    ConnectionManager.emit("connection-metrics", message);
  } else {
    const requestId = (message as VuuUIMessageInRPC).requestId;
    if (pendingRequests.has(requestId)) {
      const { resolve } = pendingRequests.get(requestId);
      pendingRequests.delete(requestId);
      const {
        type: _1,
        requestId: _2,
        ...rest
      } = message as
        | VuuUIMessageInRPC
        | VuuUIMessageInTableList
        | VuuUIMessageInTableMeta;

      if (messageHasResult(message)) {
        resolve(message.result);
      } else if (
        message.type === "VP_EDIT_RPC_RESPONSE" ||
        message.type === "VP_EDIT_RPC_REJECT"
      ) {
        resolve(message);
      } else if (isTableSchema(message)) {
        resolve(message.tableSchema);
      } else {
        resolve(rest);
      }
    } else {
      console.warn(
        "%cConnectionManager Unexpected message from the worker",
        "color:red;font-weight:bold;"
      );
    }
  }
}

const asyncRequest = <T = unknown>(
  msg:
    | VuuRpcRequest
    | ClientToServerMenuRPC
    | ClientToServerTableList
    | ClientToServerTableMeta
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
  getTableList: () => Promise<VuuTableList>;
  rpcCall: <T = unknown>(
    msg: VuuRpcRequest | ClientToServerMenuRPC
  ) => Promise<T>;
  send: (message: VuuUIMessageOut) => void;
  subscribe: (
    message: ServerProxySubscribeMessage,
    callback: PostMessageToClientCallback
  ) => void;
  unsubscribe: (viewport: string) => void;
}

const connectedServerAPI: ServerAPI = {
  subscribe: (message, callback) => {
    if (viewports.get(message.viewport)) {
      throw Error(
        `ConnectionManager attempting to subscribe with an existing viewport id`
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
    message: VuuRpcRequest | ClientToServerMenuRPC
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
}: ConnectOptions) => {
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
  } catch (err: unknown) {
    console.error("Connection Error", err);
    rejectServer(err);
  }
};

export const makeRpcCall = async <T = unknown>(rpcRequest: VuuRpcRequest) => {
  try {
    return (await serverAPI).rpcCall<T>(rpcRequest);
  } catch (err) {
    throw Error("Error accessing server api");
  }
};
