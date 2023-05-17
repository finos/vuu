import {
  ClientToServerMenuRPC,
  ClientToServerTableList,
  ClientToServerTableMeta,
  VuuRpcRequest,
  VuuTable,
  VuuTableList,
} from "@finos/vuu-protocol-types";
import { EventEmitter, getLoggingConfig, uuid } from "@finos/vuu-utils";
import {
  DataSourceCallbackMessage,
  shouldMessageBeRoutedToDataSource as messageShouldBeRoutedToDataSource,
} from "./data-source";
import * as Message from "./server-proxy/messages";
import {
  ConnectionStatusMessage,
  isConnectionQualityMetrics,
  isConnectionStatusMessage,
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
import { VuuTableMetaWithTable } from "./hooks";
import { ConnectionQualityMetrics } from "./vuuUIMessageTypes";

const workerBlob = new Blob([getLoggingConfig() + workerSourceCode], {
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

// We do not resolve the worker until we have a connection, but we will get
// connection status messages before that, so we forward them to caller
// while they wait for worker.
const getWorker = async (
  url: string,
  token = "",
  username: string | undefined,
  handleConnectionStatusChange: (msg: any) => void
) => {
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
          worker.postMessage({ type: "connect", url, token, username });
        } else if (message.type === "connected") {
          worker.onmessage = handleMessageFromWorker;
          resolve(worker);
          for (const pendingWorkerRequest of pendingWorkerNoToken) {
            pendingWorkerRequest.resolve(worker);
          }
          pendingWorkerNoToken.length = 0;
        } else if (isConnectionStatusMessage(message)) {
          handleConnectionStatusChange(msg);
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
  if (isConnectionQualityMetrics(message))
    ConnectionManager.emit("connection-metrics", message);
  else if (isConnectionStatusMessage(message))
    ConnectionManager.emit("connection-status", message);
  else if (messageShouldBeRoutedToDataSource(message)) {
    const viewport = viewports.get(message.clientViewportId);
    if (viewport) {
      viewport.postMessageToClientDataSource(message);
    } else {
      console.error(
        `[ConnectionManager] ${message.type} message received, viewport not found`
      );
    }
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
  getTableMeta: (table: VuuTable) => Promise<VuuTableMetaWithTable>;
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
    asyncRequest<VuuTableList>({ type: Message.GET_TABLE_LIST }),

  getTableMeta: async (table) =>
    asyncRequest<VuuTableMetaWithTable>({
      type: Message.GET_TABLE_META,
      table,
    }),
};

export type ConnectionEvents = {
  "connection-status": (message: ConnectionStatusMessage) => void;
  "connection-metrics": (message: ConnectionQualityMetrics) => void;
};

class _ConnectionManager extends EventEmitter<ConnectionEvents> {
  // The first request must have the token. We can change this to block others until
  // the request with token is received.
  async connect(
    url: string,
    authToken?: string,
    username?: string
  ): Promise<ServerAPI> {
    // By passing handleMessageFromWorker here, we can get connection status
    //messages while we wait for worker to resolve.
    worker = await getWorker(url, authToken, username, handleMessageFromWorker);
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
export const connectToServer = async (
  serverUrl: string,
  token?: string,
  username?: string
) => {
  try {
    const serverAPI = await ConnectionManager.connect(
      serverUrl,
      token,
      username
    );
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
