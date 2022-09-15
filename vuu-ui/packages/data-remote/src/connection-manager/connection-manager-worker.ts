import { createLogger, logColor, EventEmitter, uuid } from '@vuu-ui/utils';
import * as Message from '../server-proxy/messages';
import {
  ClientViewportMessage,
  isConnectionStatusMessage,
  RpcRequest,
  RpcResponse,
  ServerProxySubscribeMessage,
  TableMeta,
  TableList,
  ViewportMessage,
  VuuUIMessageIn,
  VuuUIMessageInRPC,
  VuuUIMessageOut
} from '../vuuUIMessageTypes';
import { VuuTable } from '@vuu-ui/data-types';

const logger = createLogger('ConnectionManager', logColor.green);

let worker: Worker;
let pendingWorker: Promise<Worker>;

export type PostMessageToClientCallback = (msg: ClientViewportMessage) => void;

const viewports = new Map<
  string,
  {
    postMessageToClient: PostMessageToClientCallback;
    request: ServerProxySubscribeMessage;
    status: 'subscribing';
  }
>();
const pendingRequests = new Map();

// We do not resolve the worker until we have a connection, but we will get
// connection status messages before that, so we forward them to caller
// while they wait for worker.
const getWorker = async (
  url: string,
  server: string,
  token: string = '',
  handleConnectionStatusChange: (msg: any) => void
) => {
  const workerUrl = 'worker.js?debug=all-messages';

  if (token === '' && pendingWorker === undefined) {
    //create a new promises, store the resolve/reject pair and return it
  }

  return (
    pendingWorker ||
    // we get this far when we receive the first request with auth token
    (pendingWorker = new Promise((resolve) => {
      const worker = new Worker(workerUrl, { type: 'module' });

      // This is the inial message handler only, it processes messages whilst we are
      // establishing a connection. When we resolve the worker, a runtime message
      // handler will replace this (see below)
      worker.onmessage = (msg: MessageEvent<VuuUIMessageIn>) => {
        const { data: message } = msg;
        if (message.type === 'ready') {
          worker.postMessage({ type: 'connect', url, useWebsocket: !!server, token });
        } else if (message.type === 'connected') {
          resolve(worker);
          // if we have stored promises above, resolve all wuth same worker
        } else if (isConnectionStatusMessage(message)) {
          handleConnectionStatusChange(msg);
        } else {
          logger.log(`Unexpected message from the worker ${message.type}`);
        }
      };
      // TODO handle error
    }))
  );
};

const messagesToRelayToClient = {
  'table-row': true,
  'visual-link-created': true,
  [Message.VIEW_PORT_MENUS_RESP]: true,
  [Message.VIEW_PORT_MENU_RESP]: true,
  [Message.VP_VISUAL_LINKS_RESP]: true,
  [Message.RPC_RESP]: true,
  enabled: true,
  disabled: true,
  subscribed: true,
  sort: true,
  groupBy: true,
  filter: true,
  aggregate: true
};

function handleMessageFromWorker({ data: message }: MessageEvent<VuuUIMessageIn>) {
  if (message.type === 'viewport-updates') {
    for (const [clientViewport, { size, rows }] of Object.entries(message.viewports)) {
      const viewport = viewports.get(clientViewport);
      if (viewport) {
        const { postMessageToClient } = viewport;
        postMessageToClient({ type: 'viewport-update', size, rows });
      }
    }
  } else if (isConnectionStatusMessage(message)) {
    connectionManager.emit('connection-status', message);
  } else {
    const clientViewportId = (message as ViewportMessage).clientViewportId;
    const requestId = (message as VuuUIMessageInRPC).requestId;
    const viewport = viewports.get(clientViewportId);
    if (viewport) {
      const { postMessageToClient } = viewport;
      if (message.type in messagesToRelayToClient) {
        postMessageToClient(message);
      } else {
        logger.log(`message from the worker to viewport ${clientViewportId} ${message.type}`);
      }
    } else if (pendingRequests.has(requestId)) {
      const { resolve } = pendingRequests.get(requestId);
      pendingRequests.delete(requestId);
      const { type: _1, requestId: _2, ...rest } = message as VuuUIMessageInRPC;
      resolve(rest);
      // TEST DATA COLLECTION
      // } else if (message.type === 'websocket-data') {
      //   // storeData(message.data);
    } else {
      logger.log(
        `Unexpected message from the worker ${message.type} requestId ${requestId}`,
        pendingRequests
      );
    }
  }
}

// Can be a straight protocol message body
const asyncRequest = (msg: any): Promise<VuuUIMessageInRPC> => {
  const requestId = uuid();
  worker.postMessage({
    requestId,
    ...msg
  });
  return new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });
  });
};

export interface ServerAPI {
  destroy: () => void;
  getTableMeta: (table: VuuTable) => Promise<TableMeta>;
  getTableList: () => Promise<TableList>;
  rpcCall: (msg: RpcRequest) => Promise<RpcResponse>;
  send: (message: VuuUIMessageOut) => void;
  subscribe: (message: ServerProxySubscribeMessage, callback: PostMessageToClientCallback) => void;
  unsubscribe: (viewport: string) => void;
}

class ConnectionManager extends EventEmitter {
  // The first request must have the token. We can change this to block others until
  // the request with token is received.
  async connect(url: string, server: string, token?: string): Promise<ServerAPI> {
    // By passing handleMessageFromWorker here, we can get connection status
    //messages while we wait for worker to resolve.
    worker = await getWorker(url, server, token, handleMessageFromWorker);

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
          status: 'subscribing',
          request: message,
          postMessageToClient: callback
        });
        worker.postMessage({ type: 'subscribe', ...message });
      },

      unsubscribe: (viewport) => {
        console.log(`ConnectionManagerWorker, unsubscribe from vp ${viewport}`);
        worker.postMessage({ type: 'unsubscribe', viewport });
      },

      send: (message) => {
        worker.postMessage(message);
      },

      destroy: () => {
        console.log('destroy');
        // TODO kill all subscriptions
      },

      rpcCall: async (message) => asyncRequest(message),

      getTableList: async () => asyncRequest({ type: Message.GET_TABLE_LIST }),

      getTableMeta: async (table) => asyncRequest({ type: Message.GET_TABLE_META, table })
    };
  }

  destroy() {
    worker.terminate();
  }
}

const connectionManager = new ConnectionManager();

export default connectionManager;
