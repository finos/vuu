import {
  ClientMessageBody,
  VuuDataRow,
  VuuServerMessage,
  VuuViewportRangeRequest,
} from "@vuu-ui/vuu-protocol-types";
import {
  IWebSocket,
  MessageHandler,
  WebSocketConstructorProps,
} from "./IWebsocket";

let messageCountPerSecond = 0;

export function makeRows(from: number, to: number): VuuDataRow[] {
  const rows: VuuDataRow[] = [];
  for (let i = from; i < to; i++) {
    rows.push([i, `key=${i}`]);
  }

  return rows;
}

const parseServerMessage = (evt: MessageEvent): VuuServerMessage => {
  return JSON.parse(evt.data);
};

export class VuuWebSocket implements IWebSocket {
  #sendMessageToClient?: MessageHandler<VuuServerMessage>;
  #authToken = "token";
  #readyCallback?: () => void;
  #sessionId = "";
  #websocket: WebSocket;

  constructor(
    {
      url = "ws://localhost:8091/websocket",
    }: Omit<WebSocketConstructorProps, "WebSocketClass">,
    onReady?: () => void,
  ) {
    this.#readyCallback = onReady;
    try {
      this.#websocket = new WebSocket(url);
      this.#websocket.onopen = () => {
        this.login();
      };
      this.#websocket.onerror = () => console.log("[VuuWebSocket] error");
      this.#websocket.onmessage = this.messageHandler;
    } catch (err) {
      throw Error("[VuuWebSocket] error opening connection");
    }
  }

  login() {
    this.send({ type: "LOGIN", token: this.#authToken });
  }

  messageHandler = (evt: MessageEvent) => {
    const message = parseServerMessage(evt);

    if (message.body.type === "HB") {
      return this.sendHeartbeatResponse();
    }
    console.groupCollapsed("[WEBSOCKET] message received");
    console.log(JSON.stringify(message.body, null, 2));
    console.groupEnd();

    messageCountPerSecond += 1;

    switch (message.body.type) {
      case "TABLE_ROW":
        this.#sendMessageToClient?.(message);
        break;

      case "LOGIN_SUCCESS":
        if (message.sessionId) {
          this.#sessionId = message.sessionId;
          this.#readyCallback?.();
        } else {
          throw Error(`[VuuWebSocket] LOGIN_SUCCESS message missing sessionId`);
        }
        break;

      case "CREATE_VP_SUCCESS":
        this.#sendMessageToClient?.(message);
        break;

      case "CHANGE_VP_RANGE_SUCCESS":
        console.log("CHANGE_VP_RANGE_SUCCESS");
        break;

      default:
        console.log(
          `message from the server sessionId ${message.sessionId} ${JSON.stringify(message.body, null, 2)}`,
        );
    }
  };

  on(messageHandler: MessageHandler<VuuServerMessage>) {
    this.#sendMessageToClient = messageHandler;
  }
  sendRangeRequest(serverRequest: VuuViewportRangeRequest) {
    console.log(`==> [WebSocket] send ${JSON.stringify(serverRequest)}`);
    // if (serverRequest.type === "CHANGE_VP_RANGE") {
    //   const { from, to } = serverRequest;
    // }
    this.send(serverRequest);
  }

  send<T extends ClientMessageBody = ClientMessageBody>(body: T) {
    this.#websocket.send(
      JSON.stringify({
        body,
        module: "CORE",
        requestId: "",
        sessionId: this.#sessionId,
        token: this.#authToken,
      }),
    );
  }

  private sendHeartbeatResponse() {
    this.send({ type: "HB_RESP", ts: +new Date() });
  }
}

export const accurateTimer = (fn: () => void, time = 1000) => {
  // nextAt is the value for the next time the timer should fire.
  // timeout holds the timeoutID so the timer can be stopped.
  let nextAt: number;
  let timeout: unknown;
  // Initialzes nextAt as now + the time in milliseconds you pass
  // to accurateTimer.
  nextAt = new Date().getTime() + time;

  // This function schedules the next function call.
  const wrapper = () => {
    // The next function call is always calculated from when the
    // timer started.
    nextAt += time;
    // this is where the next setTimeout is adjusted to keep the
    //time accurate.
    timeout = setTimeout(wrapper, nextAt - new Date().getTime());
    // the function passed to accurateTimer is called.
    fn();
  };

  // this function stops the timer.
  const cancel = () => clearTimeout(timeout as number);

  // the first function call is scheduled.
  timeout = setTimeout(wrapper, nextAt - new Date().getTime());

  // the cancel function is returned so it can be called outside
  // accurateTimer.
  return { cancel };
};

accurateTimer(() => {
  console.log(
    `[VUU:mock:WebSocket] messages sent per second ${messageCountPerSecond}`,
  );
  messageCountPerSecond = 0;
}, 1000);
