import * as Message from './messages.js';
import { ServerApiMessageTypes as API } from '../../messages.js';

const logger = console;

function partition(array, test, pass = [], fail = []) {
  for (let i = 0, len = array.length; i < len; i++) {
    (test(array[i], i) ? pass : fail).push(array[i]);
  }

  return [pass, fail];
}

const NOT_DATA = {};
/*
    query: (type, params = null) => new Promise((resolve, reject) => {
      const requestId = uuid.v1();
      postMessage({ requestId, type, params });
      const timeoutHandle = setTimeout(() => {
        delete pendingPromises[requestId];
        reject(Error('query timed out waiting for server response'));
      }, 5000);
      pendingPromises[requestId] = { resolve, reject, timeoutHandle };
    })

    */
export class ServerProxy {
  constructor(connection) {
    this.connection = connection;
    this.queuedRequests = [];
    this.viewportStatus = {};
  }

  destroy() {
    for (let { postMessageToClient } of Object.values(this.viewportStatus)) {
      postMessageToClient({
        rows: [],
        size: 0,
        range: { lo: 0, hi: 0 }
      });
    }
    this.connection.close();
    this.viewportStatus = {};
  }

  reconnect() {
    this.connection.reconnect();
  }

  handleMessageFromClient(message) {
    const viewport = this.viewportStatus[message.viewport];
    if (message.range) {
      viewport.range = message.range;
    }
    this.sendIfReady(message, viewport.status === 'subscribed');
  }

  sendIfReady(message, isReady) {
    // TODO implement the message queuing in remote data view
    if (isReady) {
      this.sendMessageToServer(message);
    } else {
      this.queuedRequests.push(message);
    }

    return isReady;
  }

  disconnected() {
    logger.log(`disconnected`);
    for (let [, { postMessageToClient }] of Object.entries(this.viewportStatus)) {
      if (this.connection.status !== 'closed') {
        postMessageToClient({
          rows: [],
          size: 0,
          range: { lo: 0, hi: 0 }
        });
      }
    }
  }

  resubscribeAll() {
    logger.log(`resubscribe all`);
    for (let [, { request }] of Object.entries(this.viewportStatus)) {
      this.sendMessageToServer({
        type: API.addSubscription,
        ...request
      });
    }
  }

  subscribe(message, callback) {
    logger.log(`subscribed with range ${JSON.stringify(message.range)}`);
    const isReady = this.connection !== null;
    const { viewport } = message;
    this.viewportStatus[viewport] = {
      status: 'subscribing',
      request: message,
      range: message.range,
      postMessageToClient: callback
    };
    this.sendIfReady(
      {
        type: API.addSubscription,
        ...message
      },
      isReady
    );
  }

  subscribed(/* server message */ message) {
    const viewportStatus = this.viewportStatus[message.viewport];
    const { viewport, postMessageToClient } = viewportStatus;
    const { columns, availableColumns } = message;

    if (viewportStatus) {
      viewportStatus.status = 'subscribed';
      postMessageToClient({
        type: API.subscribed,
        columns,
        availableColumns
      });

      const byViewport = (vp) => (item) => item.viewport === vp;
      const byMessageType = (msg) => msg.type === Message.SET_VIEWPORT_RANGE;
      const [messagesForThisViewport, messagesForOtherViewports] = partition(
        this.queuedRequests,
        byViewport(viewport)
      );
      const [rangeMessages, otherMessages] = partition(messagesForThisViewport, byMessageType);

      this.queuedRequests = messagesForOtherViewports;
      rangeMessages.forEach((msg) => {
        console.log({ msg });
        // range = msg.range;
      });

      if (otherMessages.length) {
        console.log(`we have ${otherMessages.length} messages still to process`);
      }
    }
  }

  unsubscribe(viewport) {
    this.sendMessageToServer({ viewport, type: API.unsubscribe });
    this.viewportStatus[viewport].status = 'unsubscribed';
  }

  sendMessageToServer(message) {
    const { clientId } = this.connection;
    this.connection.send({ clientId, message });
  }

  handleMessageFromServer(message) {
    const { data: { range } = NOT_DATA, type, viewport: viewportId } = message;
    const viewport = this.viewportStatus[viewportId];
    if (viewport) {
      const {
        postMessageToClient,
        range: { lo, hi }
      } = viewport;
      if (range) {
        // logger.log(`message from server ${type} for range [${range.lo},${range.hi}] (current range [${lo},${hi}])`)
        if (range.hi < lo || range.lo >= hi) {
          logger.log(`>>>>>>>>>>>>>   discard entire message`);
          return;
        } else if (
          (range.lo < lo && range.hi >= lo && range.hi < hi) ||
          (range.lo >= lo && range.lo < hi && range.hi > hi)
        ) {
          logger.log(`!!!!!!!!!!!   partially irrelevant message`);
        }
      }

      switch (type) {
        case Message.SUBSCRIBED:
          this.subscribed(message);
          break;

        case 'rowset':
        case 'selected':
        case Message.FILTER_DATA:
        case Message.SNAPSHOT:
          {
            postMessageToClient(message.data);
          }
          break;
        case 'update':
        case 'size':
          postMessageToClient(message);
          break;
        default:
          if (type !== 'update') {
            console.log(`[ServerProxy] message received ${JSON.stringify(message)}`);
          }
        // postMessageToClient(message);
      }
    } else {
      console.log(`message with no viewport ${JSON.stringify(message)}`);
    }
  }
}
