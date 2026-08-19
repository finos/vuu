import type {
  DataSourceCallbackMessage,
  VuuUIMessageIn,
  VuuUIMessageOut,
  WebSocketProtocol,
  WithRequestId,
} from "@vuu-ui/vuu-data-types";
import type {
  VuuLoginSuccessResponse,
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
): Promise<(VuuLoginSuccessResponse & { sessionId: string }) | undefined> {
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
        const loginResponse = await connectToServer(
          message.url,
          message.protocol,
          message.token,
        );
        if (!loginResponse) {
          throw Error("VUU server did not return a LOGIN_SUCCESS response");
        }
        postMessage({ type: "connected", loginResponse });
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
      infoEnabled && info(`===> ${JSON.stringify(message)}`);
      serverProxy.subscribe(message);
      break;
    case "unsubscribe":
      infoEnabled && info(`===> ${JSON.stringify(message)}`);
      serverProxy.unsubscribe(message.viewport);
      break;
    default:
      infoEnabled && info(`===> ${JSON.stringify(message)}`);
      serverProxy.handleMessageFromClient(message);
  }
};

/* eslint-disable-next-line no-restricted-globals */
self.addEventListener("message", handleMessageFromClient);

postMessage({ type: "ready" });
