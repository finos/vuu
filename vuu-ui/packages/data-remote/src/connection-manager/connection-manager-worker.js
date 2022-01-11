import { createLogger, logColor, EventEmitter, uuid } from '@vuu-ui/utils';
import * as Message from '../servers/vuu/messages';

const logger = createLogger('ConnectionManager', logColor.green);

let worker;
let pendingWorker;

const viewports = new Map();
const pendingRequests = new Map();

// We do not resolve the worker until we have a connection, but we will get
// connection status messages before that, so we forward them to caller
// while they wait for worker.
const getWorker = async (url, server, handleConnectionStatusChange) => {
  const workerUrl = 'worker.js?debug=all-messages';

  return (
    pendingWorker ||
    (pendingWorker = new Promise((resolve) => {
      const worker = new Worker(workerUrl, { type: 'module' });

      // This is the inial message handler only, it processes messages whilst we are
      // establishing a connection. When we resolve the worker, a runtime message
      // handler will replace this (see below)
      worker.onmessage = (msg) => {
        const { data: message } = msg;
        if (message.type === 'ready') {
          worker.postMessage({ type: 'connect', url, useWebsocket: !!server });
        } else if (message.type === 'connected') {
          resolve(worker);
        } else if (message.type === 'connection-status') {
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

function handleMessageFromWorker({ data: message }) {
  if (message.type === 'viewport-updates') {
    for (const [clientViewport, { size, rows }] of Object.entries(message.viewports)) {
      if (viewports.has(clientViewport)) {
        const { postMessageToClient } = viewports.get(clientViewport);
        postMessageToClient({ type: 'viewport-update', size, rows });
      }
    }
  } else if (message.type === 'connection-status') {
    connectionManager.emit('connection-status', message);
  } else if (viewports.has(message.clientViewportId)) {
    const viewport = viewports.get(message.clientViewportId);
    const { postMessageToClient } = viewport;
    if (messagesToRelayToClient[message.type]) {
      postMessageToClient(message);
    } else {
      logger.log(`message from the worker to viewport ${message.clientViewportId} ${message.type}`);
    }
  } else if (pendingRequests.has(message.requestId)) {
    const { resolve } = pendingRequests.get(message.requestId);
    pendingRequests.delete(message.requestId);
    const { type: _1, requestId: _2, ...rest } = message;
    resolve(rest);
    // TEST DATA COLLECTION
  } else if (message.type === 'websocket-data') {
    // storeData(message.data);
  } else {
    logger.log(
      `Unexpected message from the worker ${message.type} requestId ${message.requestId}`,
      pendingRequests
    );
  }
}

const asyncRequest = (msg) => {
  const requestId = uuid();
  worker.postMessage({
    requestId,
    ...msg
  });
  return new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });
  });
};

class ConnectionManager extends EventEmitter {
  async connect(url, serverName) {
    // By passing handleMessageFromWorker here, we can get connection status
    //messages while we wait for worker to resolve.
    worker = await getWorker(url, serverName, handleMessageFromWorker);

    worker.onmessage = handleMessageFromWorker;

    // TEST DATA COLLECTION
    // setDataCollectionMethod(() => {
    //   console.log(`sending 'send-websocket-data' message to worker`)
    //   worker.postMessage({type: "send-websocket-data"})
    // })

    // THis is a serverConnection, referred to in calling code as a 'server'
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

      getTableMeta: async (tableDescriptor) =>
        asyncRequest({ type: Message.GET_TABLE_META, table: tableDescriptor })
    };
  }

  destroy() {
    worker.teminate();
  }
}

console.log(`CREATE THE CONNECTION MANAGER`);
const connectionManager = new ConnectionManager();

export default connectionManager;
