import {
  ClientToServerTableList,
  ClientToServerTableMeta,
  VuuMenuRpcRequest,
  VuuRpcRequest,
  VuuTable,
  VuuTableList,
  VuuTableMeta,
} from "@finos/vuu-protocol-types";
import { EventEmitter, uuid } from "@finos/vuu-utils";
import {
  DataSourceCallbackMessage,
  shouldMessageBeRoutedToDataSource as messageShouldBeRoutedToDataSource,
} from "./data-source";
import * as Message from "./server-proxy/messages";
import {
  isConnectionStatusMessage,
  messageHasResult,
  ServerProxySubscribeMessage,
  VuuUIMessageIn,
  VuuUIMessageInRPC,
  VuuUIMessageInTableList,
  VuuUIMessageInTableMeta,
  VuuUIMessageOut,
} from "./vuuUIMessageTypes";
// Note: the InlinedWorker is a generated file, it must be built
import { InlinedWorker } from "./inlined-worker";

const workerSource = InlinedWorker.toString().replace(
  /(?:^function\s+[^(]*\(\)\s*\{)|(?:\}$)/g,
  ""
);
const workerBlob = new Blob([workerSource], { type: "text/javascript" });
const workerBlobUrl = URL.createObjectURL(workerBlob);

type WorkerResolver = {
  resolve: (value: Worker | PromiseLike<Worker>) => void;
};

let worker: Worker;
let pendingWorker: Promise<Worker>;
const pendingWorkerNoToken: WorkerResolver[] = [];

let resolveServer: (server: ServerAPI) => void;
let rejectServer: (err: unknown) => void;

export const serverAPI = new Promise<ServerAPI>((resolve, reject) => {
  resolveServer = resolve;
  rejectServer = reject;
});

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
          worker.postMessage({ type: "connect", url, token });
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
          console.log(`ConnectionManager: Unexpected message from the worker`);
        }
      };
      // TODO handle error
    }))
  );
};

function handleMessageFromWorker({
  data: message,
}: MessageEvent<VuuUIMessageIn | DataSourceCallbackMessage>) {
  if (isConnectionStatusMessage(message)) {
    ConnectionManager.emit("connection-status", message);
  } else if (messageShouldBeRoutedToDataSource(message)) {
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
      console.log(
        `%cConnectionManager Unexpected message from the worker`,
        "color:red;font-weight:bold;"
      );
    }
  }
}

const asyncRequest = <T = unknown>(
  msg:
    | VuuRpcRequest
    | VuuMenuRpcRequest
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
  getTableMeta: (table: VuuTable) => Promise<VuuTableMeta>;
  getTableList: () => Promise<VuuTableList>;
  rpcCall: <T = unknown>(msg: VuuRpcRequest | VuuMenuRpcRequest) => Promise<T>;
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

  rpcCall: async <T = unknown>(message: VuuRpcRequest | VuuMenuRpcRequest) =>
    asyncRequest<T>(message),

  getTableList: async () =>
    asyncRequest<VuuTableList>({ type: Message.GET_TABLE_LIST }),

  getTableMeta: async (table) =>
    asyncRequest<VuuTableMeta>({ type: Message.GET_TABLE_META, table }),
};

class _ConnectionManager extends EventEmitter {
  // The first request must have the token. We can change this to block others until
  // the request with token is received.
  async connect(url: string, authToken?: string): Promise<ServerAPI> {
    // By passing handleMessageFromWorker here, we can get connection status
    //messages while we wait for worker to resolve.
    worker = await getWorker(url, authToken, handleMessageFromWorker);
    return connectedServerAPI;
  }

  destroy() {
    console.log(`MEGA DESTROY`);
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
export const connectToServer = async (serverUrl: string, token?: string) => {
  try {
    const serverAPI = await ConnectionManager.connect(serverUrl, token);
    resolveServer(serverAPI);
  } catch (err: unknown) {
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
