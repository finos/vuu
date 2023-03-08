import { connect as connectWebsocket } from "./websocket-connection";
import { ServerProxy } from "./server-proxy/server-proxy";
import {
  ConnectionStatusMessage,
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

const loggingLevel = () => {
  return loggingSettings.loggingLevel;
}

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
    (msg) => {
      if (isConnectionStatusMessage(msg)) {
        onConnectionStatusChange(msg);
        if (msg.status === "reconnected") {
          server.reconnect();
        }
      } else {
        server.handleMessageFromServer(msg);
      }
    }
  );

  server = new ServerProxy(connection, (msg) => sendMessageToClient(msg));
  if (connection.requiresLogin) {
    // no handling for failed login
    await server.login(token);
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
      await connectToServer(message.url, message.token, postMessage);
      postMessage({ type: "connected" });
      break;
    // If any of the messages below are received BEFORE we have connected and created
    // the server - handle accordingly

    case "subscribe":
      logger.info("Subscribe Message From Client: ", message);
      server.subscribe(message);
      if (
        loggingLevel() === "high" ||
        loggingLevel() === "medium"
        ) {
        logger.info("Subscribe Message From Client: ", message);
      }
      break;
    case "unsubscribe":
      logger.info("Unsubscribe Message From Client: ", message);
      server.unsubscribe(message.viewport);
      if (
        loggingLevel() === "high" ||
        loggingLevel() === "medium"
        ) {
        logger.info("Unsubscribe Message From Client: ", message);
      }
      break;
    default:
      server.handleMessageFromClient(message);
      if (loggingLevel() === "high") {
        logger.info("Message From Client: ", message);
      }
  }
};

/* eslint-disable-next-line no-restricted-globals */
self.addEventListener("message", handleMessageFromClient);

postMessage({ type: "ready" });
