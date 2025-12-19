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
// import { createWebSocketConnection } from "./websocket-connection";
import {
  type RetryLimits,
  WebSocketConnection,
  isWebSocketConnectionMessage,
} from "./WebSocketConnection";

let server: ServerProxy;

const { info, infoEnabled } = logger("worker");

const getRetryLimits = (
  retryLimitDisconnect?: number,
  retryLimitStartup?: number,
): RetryLimits | undefined => {
  if (retryLimitDisconnect !== undefined && retryLimitStartup !== undefined) {
    return {
      connect: retryLimitStartup,
      reconnect: retryLimitDisconnect,
    };
  } else if (retryLimitDisconnect !== undefined) {
    return {
      connect: retryLimitDisconnect,
      reconnect: retryLimitDisconnect,
    };
  } else if (retryLimitStartup !== undefined) {
    return {
      connect: retryLimitStartup,
      reconnect: retryLimitStartup,
    };
  }
};

let ws: WebSocketConnection;

const sendMessageToClient = (
  message: DataSourceCallbackMessage | VuuUIMessageIn,
) => {
  postMessage(message);
};

async function connectToServer(
  url: string,
  protocols: WebSocketProtocol,
  token: string,
  retryLimitDisconnect?: number,
  retryLimitStartup?: number,
): Promise<string | undefined> {
  const websocketConnection = (ws = new WebSocketConnection({
    callback: (msg) => {
      if (isConnectionQualityMetrics(msg)) {
        // console.log("post connection metrics");
        postMessage({ type: "connection-metrics", messages: msg });
      } else if (isWebSocketConnectionMessage(msg)) {
        postMessage(msg);
      } else {
        server.handleMessageFromServer(msg);
      }
    },
    protocols,
    retryLimits: getRetryLimits(retryLimitStartup, retryLimitDisconnect),
    url,
  }));

  websocketConnection.on("connection-status", postMessage);
  websocketConnection.on("closed", postMessage);

  // This will not resolve until the websocket has been successfully opened,
  // i.e. we get an open event...
  await websocketConnection.connect();
  // ... at which point we will attempt to LOGIN, this will send the
  // first message over the WebSocket connection.
  server = new ServerProxy(websocketConnection, sendMessageToClient);
  if (websocketConnection.requiresLogin) {
    // no handling for failed login
    return await server.login(token);
  }
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
          message.retryLimitDisconnect,
          message.retryLimitStartup,
        );
        postMessage({ type: "connected", sessionId });
      } catch (err: unknown) {
        postMessage({ type: "connection-failed", reason: String(err) });
      }
      break;
    // If any of the messages below are received BEFORE we have connected and created
    // the server - handle accordingly
    case "disconnect":
      server.disconnect();
      ws?.close();
      break;
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
