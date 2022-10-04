import { connect as connectWebsocket } from "@vuu-ui/data-remote/src/websocket-connection";
import { ServerProxy } from "@vuu-ui/data-remote/src/server-proxy/server-proxy";
import {
  ConnectionStatusMessage,
  isConnectionStatusMessage,
  VuuUIMessageOut,
} from "@vuu-ui/data-remote/src/vuuUIMessageTypes";

let server: ServerProxy;

async function connectToServer(
  url: string,
  token: string,
  onConnectionStatusChange: (msg: ConnectionStatusMessage) => void
) {
  const connection = await connectWebsocket(
    url,
    // if this was called during connect, we would get a ReferenceError, but it will
    // never be called until subscriptions have been made, so this is safe.
    //TODO do we need to listen in to the connection messages here so we can lock back in, in the event of a reconnenct ?
    (msg) =>
      isConnectionStatusMessage(msg)
        ? onConnectionStatusChange(msg)
        : server.handleMessageFromServer(msg)
  );

  server = new ServerProxy(connection, (msg) => sendMessageToClient(msg));
  if (connection.requiresLogin) {
    // no handling for failed login
    await server.login(token);
  }
}

let lastTime = 0;
const timings = [];

function sendMessageToClient(message: any) {
  const now = Math.round(performance.now());
  if (lastTime) {
    timings.push(now - lastTime);

    // if (timings.length % 100 === 0){
    //   console.log(timings.join(', : '))
    //   timings.length = 0;
    // }
  }
  postMessage(message);
  lastTime = now;
}

const handleMessageFromClient = async ({
  data: message,
}: MessageEvent<VuuUIMessageOut>) => {
  switch (message.type) {
    case "connect":
      await connectToServer(message.url, message.token, postMessage);
      postMessage({ type: "connected" });
      break;
    // If any of the messages below are received BEFORE we have connected and created
    // the server - handle accordingly

    case "subscribe":
      server.subscribe(message);
      break;
    case "unsubscribe":
      server.unsubscribe(message.viewport);
      break;
    // TEST DATA COLLECTION
    // case 'send-websocket-data':
    //   postMessage({ type: 'websocket-data', data: getTestMessages() });
    //   break;
    default:
      server.handleMessageFromClient(message);
  }
};

/* eslint-disable-next-line no-restricted-globals */
self.addEventListener("message", handleMessageFromClient);

postMessage({ type: "ready" });
