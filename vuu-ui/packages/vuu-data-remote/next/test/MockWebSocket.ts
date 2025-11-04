import { isRangeRequest, ServerRequest } from "../ViewportNext";
import {
  IWebSocket,
  MessageHandler,
  WebSocketConstructorProps,
} from "./IWebsocket";
import { rangeDiff } from "../range-utils";
import dataService from "./MockDataService";
import {
  ClientMessageBody,
  ServerMessageBody,
  VuuRange,
  VuuServerMessage,
} from "@vuu-ui/vuu-protocol-types";
import { uuid } from "@vuu-ui/vuu-utils";

// TODO create data in advance in singleton

const defaultProps: { latency?: number } = {};
export class MockWebSocket implements IWebSocket {
  #lastRange?: VuuRange;
  #latency: number;
  #sendMessageToClient?: MessageHandler<VuuServerMessage>;

  constructor(
    {
      latency = 0,
    }: Omit<WebSocketConstructorProps, "WebSocketClass"> = defaultProps,
    onReady?: () => void,
  ) {
    this.#latency = latency;
    setTimeout(() => {
      onReady?.();
    }, 0);
  }

  on(messageHandler: MessageHandler<VuuServerMessage>) {
    this.#sendMessageToClient = messageHandler;
  }
  sendRangeRequest(serverRequest: ServerRequest) {
    // console.log(`[WebSocket] send ${JSON.stringify(serverRequest)}`);
    if (isRangeRequest(serverRequest)) {
      const { from, to } = serverRequest;
      this.sendDataToClient({ from, to });
    }
  }

  send(body: ClientMessageBody) {
    if (body.type === "CREATE_VP") {
      setTimeout(() => {
        const { table, ...rest } = body;
        this.sendMessageToClient({
          ...rest,
          table: table.table,
          type: "CREATE_VP_SUCCESS",
          viewPortId: uuid(),
        });
        this.sendDataToClient(body.range);
      }, 0);
    } else if (body.type === "CHANGE_VP_RANGE") {
      console.log("CHANGE_VP_RANGE");
    } else {
      console.log(`MockWebSocket message ${body.type}`);
    }
  }

  private sendDataToClient(range: VuuRange) {
    // console.log(`[WebSocket] will return response in ${this.#latency}ms`);
    setTimeout(() => {
      const lastRange = this.#lastRange;
      const diffRange = rangeDiff(lastRange, range);
      const rows = dataService.getRows(diffRange);
      this.#lastRange = range;

      const timeStamp = Date.now();
      this.sendMessageToClient({
        batch: "",
        isLast: true,
        rows,
        timeStamp,
        type: "TABLE_ROW",
      });
    }, this.#latency);
  }

  private sendMessageToClient(body: ServerMessageBody, requestId = "") {
    this.#sendMessageToClient?.({
      body,
      module: "CORE",
      requestId,
    });
  }
}
