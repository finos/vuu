import { EventEmitter, uuid } from "@vuu-ui/vuu-utils";
import * as Message from "./server-proxy/messages";
import {
  isConnectionStatusMessage,
  ServerProxySubscribeMessage,
  TableMeta,
  TableList,
  VuuUIMessageIn,
  VuuUIMessageInRPC,
  VuuUIMessageOut,
} from "./vuuUIMessageTypes";
import {
  ClientToServerRpcCall,
  ClientToServerTableList,
  ClientToServerTableMeta,
  VuuTable,
} from "../../vuu-protocol-types";
import { shouldMessageBeRoutedToDataSource as messageShouldBeRoutedToDataSource } from "./data-source";
// Note: the InlinedWorker is a generated file, it must be built
import { InlinedWorker } from "./inlined-worker";
import { DataSourceCallbackMessage } from "./data-source";
const workerSource = InlinedWorker.toString().replace(
  /(?:^function\s+[a-zA-Z]+\(\)\s*\{)|(?:\}$)/g,
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
          resolve(worker);
          for (const pendingWorkerRequest of pendingWorkerNoToken) {
            pendingWorkerRequest.resolve(worker);
          }
          pendingWorkerNoToken.length = 0;
        } else if (isConnectionStatusMessage(message)) {
          handleConnectionStatusChange(msg);
        } else {
          console.log(`Unexpected message from the worker`);
        }
      };
      // TODO handle error
    }))
  );
};

function handleMessageFromWorker({
  data: message,
}: MessageEvent<VuuUIMessageIn>) {
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
      const { type: _1, requestId: _2, ...rest } = message as VuuUIMessageInRPC;
      resolve(rest);
    } else {
      console.log(
        `%cUnexpected message from the worker requestId`,
        "color:red;font-weight:bold;"
      );
    }
  }
}

// Can be a straight protocol message body
const asyncRequest = <T = VuuUIMessageInRPC>(
  msg: ClientToServerRpcCall | ClientToServerTableList | ClientToServerTableMeta
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
  getTableMeta: (table: VuuTable) => Promise<TableMeta>;
  getTableList: () => Promise<TableList>;
  rpcCall: (msg: ClientToServerRpcCall) => Promise<VuuUIMessageInRPC>;
  send: (message: VuuUIMessageOut) => void;
  subscribe: (
    message: ServerProxySubscribeMessage,
    callback: PostMessageToClientCallback
  ) => void;
  unsubscribe: (viewport: string) => void;
}

class _ConnectionManager extends EventEmitter {
  // The first request must have the token. We can change this to block others until
  // the request with token is received.
  async connect(url: string, authToken?: string): Promise<ServerAPI> {
    // By passing handleMessageFromWorker here, we can get connection status
    //messages while we wait for worker to resolve.

    worker = await getWorker(url, authToken, handleMessageFromWorker);

    worker.onmessage = handleMessageFromWorker;

    // TEST DATA COLLECTION
    // setDataCollectionMethod(() => {
    //   console.log(`sending 'send-websocket-data' message to worker`)
    //   worker.postMessage({type: "send-websocket-data"})
    // })

    // This is a serverConnection, referred to in calling code as a 'server'
    return {
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

      rpcCall: async (message) => asyncRequest(message),

      getTableList: async () =>
        asyncRequest<TableList>({ type: Message.GET_TABLE_LIST }),

      getTableMeta: async (table) =>
        asyncRequest<TableMeta>({ type: Message.GET_TABLE_META, table }),
    };
  }

  destroy() {
    console.log(`MEGA DESYTRO`);
    worker.terminate();
  }
}

export const ConnectionManager = new _ConnectionManager();
