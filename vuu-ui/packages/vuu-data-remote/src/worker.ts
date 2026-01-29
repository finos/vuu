import {
  DataSourceCallbackMessage,
  VuuUIMessageIn,
  VuuUIMessageOut,
  WebSocketProtocol,
  WithRequestId,
} from "@vuu-ui/vuu-data-types";
import {
  VuuRpcMenuRequest,
  VuuRpcServiceRequest,
} from "@vuu-ui/vuu-protocol-types";
import { isConnectionQualityMetrics, logger } from "@vuu-ui/vuu-utils";
import { ServerProxy } from "./server-proxy/server-proxy";
import { WebSocketConnection } from "./WebSocketConnection";

let serverProxy: ServerProxy;
let webSocketConnection: WebSocketConnection;

const { info, infoEnabled } = logger("worker");

const sendMessageToClient = (
  message: DataSourceCallbackMessage | VuuUIMessageIn,
) => {
  postMessage(message);
};

async function connectToServer(
  url: string,
  protocols: WebSocketProtocol,
  token: string,
): Promise<string | undefined> {
  if (webSocketConnection === undefined && serverProxy === undefined) {
    webSocketConnection = new WebSocketConnection({
      callback: (msg) => {
        if (isConnectionQualityMetrics(msg)) {
          postMessage({ type: "connection-metrics", messages: msg });
        } else {
          serverProxy.handleMessageFromServer(msg);
        }
      },
      protocols,
      url,
    });

    webSocketConnection.on("connection-status", postMessage);

    serverProxy = new ServerProxy(webSocketConnection, sendMessageToClient);
  }

  // This will not resolve until the websocket has been successfully opened,
  // i.e. we get an open event...
  await webSocketConnection.openWebSocket();
  // ... at which point we will attempt to LOGIN, this will send the
  // first message over the WebSocket connection.
  return serverProxy.login(token);
}

const handleMessageFromClient = async ({
  data: message,
}: MessageEvent<
  | VuuUIMessageOut
  | WithRequestId<VuuRpcServiceRequest>
  | WithRequestId<VuuRpcMenuRequest>
>) => {
  switch (message.type) {
    case "connect":
      try {
        const sessionId = await connectToServer(
          message.url,
          message.protocol,
          message.token,
        );
        postMessage({ type: "connected", sessionId });
      } catch (err: unknown) {
        postMessage({ type: "connection-failed", reason: String(err) });
      }
      break;
    // If any of the messages below are received BEFORE we have connected and created
    // the server - handle accordingly
    case "disconnect":
      serverProxy.disconnect();
      webSocketConnection?.close();
      break;
    case "subscribe":
      infoEnabled && info(`client subscribe: ${JSON.stringify(message)}`);
      serverProxy.subscribe(message);
      break;
    case "unsubscribe":
      infoEnabled && info(`client unsubscribe: ${JSON.stringify(message)}`);
      serverProxy.unsubscribe(message.viewport);
      break;
    default:
      infoEnabled && info(`client message: ${JSON.stringify(message)}`);
      serverProxy.handleMessageFromClient(message);
  }
};

/* eslint-disable-next-line no-restricted-globals */
self.addEventListener("message", handleMessageFromClient);

postMessage({ type: "ready" });
