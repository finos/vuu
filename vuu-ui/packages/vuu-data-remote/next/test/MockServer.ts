import {
  ServerAPI,
  ServerProxySubscribeMessage,
  TableSchema,
  VuuUIMessageOut,
} from "@vuu-ui/vuu-data-types";
import { ViewportNext, isRangeRequest } from "../ViewportNext";
import type {
  IWebSocket,
  MessageHandler,
  WebSocketConstructorProps,
} from "./IWebsocket";
import { ServerConstructorProps, ViewportProps } from "./IServerProxy";
import {
  VuuRange,
  VuuServerMessage,
  VuuTableList,
} from "@vuu-ui/vuu-protocol-types";
import { logUnhandledMessage } from "../logging-utils";
import { IViewport } from "../IViewport";
import { PostMessageToClientCallback } from "../../src";
import { Range } from "@vuu-ui/vuu-utils";

class MockServerImpl implements ServerAPI {
  #sendMessageToClient?: PostMessageToClientCallback;
  #viewport: IViewport | undefined;
  #webSocket: IWebSocket;
  #ViewportProps: ViewportProps;
  constructor(
    { ViewportProps, WebSocketProps }: ServerConstructorProps,
    onReady: (serverProxy: ServerAPI) => void,
  ) {
    const { WebSocketClass, ...props } = WebSocketProps;
    this.#webSocket = new WebSocketClass(props, () => {
      onReady(this);
    });
    this.#ViewportProps = ViewportProps;
    this.#webSocket.on(this.handleMessageFromWebsocket);
  }

  subscribe(
    { columns, range, table }: ServerProxySubscribeMessage,
    callback: PostMessageToClientCallback,
  ) {
    // console.log(`[MockServer] subscribe `, {
    //   columns,
    //   range,
    //   table,
    // });
    this.#sendMessageToClient = callback;
    const { Viewport = ViewportNext, ...props } = this.#ViewportProps;
    // eventually we will manage multiple viewports
    this.#viewport = new Viewport(props);
    const serverMessage = this.#viewport.subscribe({
      columns,
      range: Range(range.from, range.to),
      table,
    });
    this.#webSocket.send(serverMessage);
  }

  send(message: VuuUIMessageOut) {
    switch (message.type) {
      case "config":
        {
          const serverRequest = this.#viewport?.setConfig(
            "requestid ?",
            message.config,
          );
          if (serverRequest) {
            this.#webSocket.send(serverRequest);
          }
        }

        break;
      case "setViewRange":
        return this.setRange(message.range);
      default:
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore until we implement handlers for all message types
        logUnhandledMessage(message, "MockServer");
    }
  }

  destroy() {
    throw new Error("Function not implemented.");
  }
  getTableSchema(): Promise<TableSchema> {
    throw new Error("getTableSchema not implemented.");
  }
  getTableList(): Promise<VuuTableList> {
    throw new Error("getTableList not implemented.");
  }
  rpcCall = async <T = unknown>(): Promise<T> => {
    throw new Error("rpcCall not implemented.");
  };

  unsubscribe() {
    throw new Error("unsubscribe not implemented.");
  }

  setRange(range: VuuRange) {
    // console.log(`[MockServer] setRange (${range.from}:${range.to}) `);
    if (this.#viewport) {
      const [clientRows, serverRequest] = this.#viewport.setClientRange(range);
      if (clientRows) {
        // console.log(`[MockServer] ${clientRows.length} rows returned from cache`);
        this.#sendMessageToClient?.({
          clientViewportId: "",
          type: "viewport-update",
          rows: clientRows,
          mode: "update",
        });
      }
      if (isRangeRequest(serverRequest)) {
        // console.log(
        //   `[MockServer] server request ${JSON.stringify(serverRequest)}`,
        // );
        this.#webSocket.sendRangeRequest(serverRequest);
      }
    }
  }

  handleMessageFromWebsocket: MessageHandler<VuuServerMessage> = (
    vuuServerMessage,
  ) => {
    switch (vuuServerMessage.body.type) {
      case "CREATE_VP_SUCCESS":
        {
          const { viewPortId } = vuuServerMessage.body;
          if (this.#viewport) {
            this.#viewport.serverViewportId = viewPortId;
          }
        }
        break;
      case "TABLE_ROW":
        if (this.#viewport) {
          const [size, clientRows] = this.#viewport.receiveRowsFromServer(
            vuuServerMessage.body.rows,
          );

          if (size) {
            this.#sendMessageToClient?.({
              clientViewportId: "",
              type: "viewport-update",
              mode: "size-only",
              size,
            });
          }
          if (clientRows) {
            this.#sendMessageToClient?.({
              clientViewportId: "",
              type: "viewport-update",
              rows: clientRows,
              mode: "update",
            });
          }
        }
        break;
      case "HB":
      case "LOGIN_SUCCESS":
      case "CHANGE_VP_SUCCESS":
      case "CHANGE_VP_RANGE_SUCCESS":
      case "DISABLE_VP_SUCCESS":
      case "ENABLE_VP_SUCCESS":
      case "REMOVE_VP_SUCCESS":
      case "SELECT_ROW_SUCCESS":
        // ignore
        break;
      default:
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        logUnhandledMessage(vuuServerMessage.body, "[MockServer]");
    }
  };
}

export function MockServer({
  ViewportProps,
  WebSocketProps,
}: {
  ViewportProps: ViewportProps;
  WebSocketProps: WebSocketConstructorProps;
}): Promise<ServerAPI> {
  return new Promise((resolve) => {
    new MockServerImpl(
      {
        ViewportProps,
        WebSocketProps,
      },
      (serverProxy) => {
        resolve(serverProxy);
      },
    );
  });
}
