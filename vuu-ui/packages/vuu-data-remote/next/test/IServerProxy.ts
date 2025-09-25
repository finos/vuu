import { WebSocketConstructorProps } from "./IWebsocket";
import { SelectResponse, VuuTableList } from "@vuu-ui/vuu-protocol-types";
import { IKeySet } from "@vuu-ui/vuu-utils";
import { IViewport } from "../IViewport";
import { ServerAPI, TableSchema } from "@vuu-ui/vuu-data-types";

export type ViewportProps = {
  Viewport?: new () => IViewport;
  bufferSize?: number;
  keys?: IKeySet;
};

export type ServerConstructorProps = {
  ViewportProps: ViewportProps;
  WebSocketProps: WebSocketConstructorProps;
};

export const NullServer: ServerAPI = {
  select: function (): Promise<SelectResponse> {
    throw new Error("Function not implemented.");
  },
  send: function (): void {
    throw new Error("Function not implemented.");
  },
  subscribe: function (): void {
    throw new Error("Function not implemented.");
  },
  destroy: function (): void {
    throw new Error("Function not implemented.");
  },
  getTableSchema: function (): Promise<TableSchema> {
    throw new Error("Function not implemented.");
  },
  getTableList: function (): Promise<VuuTableList> {
    throw new Error("Function not implemented.");
  },
  rpcCall: function <T = unknown>(): Promise<T> {
    throw new Error("Function not implemented.");
  },
  unsubscribe: function (): void {
    throw new Error("Function not implemented.");
  },
};
