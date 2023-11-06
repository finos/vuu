import {
  connect as connectWebsocket,
  WebSocketProtocol,
} from "./websocket-connection";
import { ServerProxy } from "./server-proxy/server-proxy";
import {
  ConnectionStatusMessage,
  isConnectionQualityMetrics,
  isConnectionStatusMessage,
  VuuUIMessageOut,
} from "./vuuUIMessageTypes";
import {
  ClientToServerMenuRPC,
  VuuRpcRequest,
} from "@finos/vuu-protocol-types";
import { WithRequestId } from "./message-utils";
import { logger } from "@finos/vuu-utils";

let server: ServerProxy;

const { info, infoEnabled } = logger("worker");

async function connectToServer(
  url: string,
  protocol: WebSocketProtocol,
  token: string,
  username: string | undefined,
  onConnectionStatusChange: (msg: ConnectionStatusMessage) => void,
  retryLimitDisconnect?: number,
  retryLimitStartup?: number
) {
  const connection = await connectWebsocket(
    url,
    protocol,
    // if this was called during connect, we would get a ReferenceError, but it will
    // never be called until subscriptions have been made, so this is safe.
    //TODO do we need to listen in to the connection messages here so we can lock back in, in the event of a reconnenct ?
    (msg) => {
      if (isConnectionQualityMetrics(msg)) {
        console.log("post connection metrics");
        postMessage({ type: "connection-metrics", messages: msg });
      } else if (isConnectionStatusMessage(msg)) {
        onConnectionStatusChange(msg);
        if (msg.status === "reconnected") {
          server.reconnect();
        }
      } else {
        server.handleMessageFromServer(msg);
      }
    },
    retryLimitDisconnect,
    retryLimitStartup
  );

  server = new ServerProxy(connection, (msg) => sendMessageToClient(msg));
  if (connection.requiresLogin) {
    // no handling for failed login
    await server.login(token, username);
  }
}

function sendMessageToClient(message: any) {
  postMessage(message);
}

const handleMessageFromClient = async ({
  data: message,
}: MessageEvent<
  | VuuUIMessageOut
  | WithRequestId<VuuRpcRequest>
  | WithRequestId<ClientToServerMenuRPC>
>) => {
  switch (message.type) {
    case "connect":
      await connectToServer(
        message.url,
        message.protocol,
        message.token,
        message.username,
        postMessage,
        message.retryLimitDisconnect,
        message.retryLimitStartup
      );
      postMessage({ type: "connected" });
      break;
    // If any of the messages below are received BEFORE we have connected and created
    // the server - handle accordingly

    case "subscribe":
      infoEnabled && info(`client subscribe: ${JSON.stringify(message)}`);
      server.subscribe(message);
      break;
    case "unsubscribe":
      infoEnabled && info(`client unsubscribe: ${JSON.stringify(message)}`);
      server.unsubscribe(message.viewport);
      break;
    default:
      infoEnabled && info(`client message: ${JSON.stringify(message)}`);
      server.handleMessageFromClient(message);
  }
};

/* eslint-disable-next-line no-restricted-globals */
self.addEventListener("message", handleMessageFromClient);

postMessage({ type: "ready" });
