import {
  ClientToServerTableList,
  ClientToServerTableMeta,
  LinkDescriptorWithLabel,
  ServerToClientBody,
  ServerToClientMenuSessionTableAction,
  TypeAheadMethod,
  VuuAggregation,
  VuuColumnDataType,
  VuuColumns,
  VuuGroupBy,
  VuuRange,
  VuuSort,
  VuuTable,
} from "@finos/vuu-protocol-types";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { TableSchema, WithRequestId } from "./message-utils";
import { WithFullConfig } from "./data-source";
import { Selection } from "@finos/vuu-datagrid-types";
import { WebSocketProtocol } from "./websocket-connection";

export interface OpenDialogAction {
  columns: VuuColumns;
  dataTypes: VuuColumnDataType[];
  key: string;
  type: "OPEN_DIALOG_ACTION";
  table: VuuTable;
}
export interface NoAction {
  type: "NO_ACTION";
}

export declare type MenuRpcAction = OpenDialogAction | NoAction;

export type ConnectionStatus =
  | "connecting"
  | "connection-open-awaiting-session"
  | "connected"
  | "disconnected"
  | "reconnected";

export interface ConnectionStatusMessage {
  type: "connection-status";
  reason?: string;
  retry?: boolean;
  status: ConnectionStatus;
}

export const isConnectionStatusMessage = (
  msg: object | ConnectionStatusMessage
): msg is ConnectionStatusMessage =>
  (msg as ConnectionStatusMessage).type === "connection-status";

export interface ConnectionQualityMetrics {
  type: "connection-metrics";
  messagesLength: number;
}

export const isConnectionQualityMetrics = (
  msg: object
): msg is ConnectionQualityMetrics =>
  (msg as ConnectionQualityMetrics).type === "connection-metrics";

export interface ServerProxySubscribeMessage {
  aggregations: VuuAggregation[];
  bufferSize?: number;
  columns: VuuColumns;
  filter: DataSourceFilter;
  groupBy: VuuGroupBy;
  range: VuuRange;
  sort: VuuSort;
  table: VuuTable;
  title?: string;
  viewport: string;
  visualLink?: LinkDescriptorWithLabel;
}

// export type VuuUIMessageInConnectionStatus = {
//   type: 'connection-status';
// };

export type VuuUIMessageInConnected = {
  type: "connected";
};

export type VuuUIMessageInWorkerReady = {
  type: "ready";
};

export interface ViewportMessageIn {
  clientViewportId: string;
}

// TODO use generic to type result
export interface VuuUIMessageInRPC {
  method: string;
  result: unknown;
  requestId: string;
  type: "RPC_RESP";
}

export interface VuuUIMessageInRPCEditReject {
  error: string;
  requestId?: string;
  type: "VP_EDIT_RPC_REJECT";
}

export interface VuuUIMessageInRPCEditSuccess {
  requestId: string;
  type: "VP_EDIT_RPC_RESPONSE";
}

export const messageHasResult = (msg: object): msg is VuuUIMessageInRPC =>
  typeof (msg as VuuUIMessageInRPC).result !== "undefined";

export const isTableSchema = (
  message: VuuUIMessageIn
): message is VuuUIMessageInTableMeta => message.type === "TABLE_META_RESP";

export interface VuuUIMessageInTableList {
  requestId: string;
  type: "TABLE_LIST_RESP";
  tables: VuuTable[];
}
export interface VuuUIMessageInTableMeta {
  requestId: string;
  tableSchema: TableSchema;
  type: "TABLE_META_RESP";
}
export interface MenuRpcResponse {
  action: MenuRpcAction;
  error?: string;
  requestId: string;
  rpcName?: string;
  tableAlreadyOpen?: boolean;
  type: "VIEW_PORT_MENU_RESP";
}

export type VuuUIMessageIn =
  | VuuUIMessageInConnected
  | VuuUIMessageInWorkerReady
  | VuuUIMessageInRPC
  | MenuRpcResponse
  | VuuUIMessageInTableList
  | VuuUIMessageInTableMeta
  | VuuUIMessageInRPCEditReject
  | VuuUIMessageInRPCEditSuccess;

export const isErrorResponse = (
  response?:
    | MenuRpcResponse
    | VuuUIMessageInRPCEditReject
    | VuuUIMessageInRPCEditSuccess
): response is VuuUIMessageInRPCEditReject =>
  response !== undefined && "error" in response;

export interface VuuUIMessageOutConnect {
  protocol: WebSocketProtocol;
  type: "connect";
  token: string;
  url: string;
  username?: string;
}

export interface VuuUIMessageOutSubscribe extends ServerProxySubscribeMessage {
  type: "subscribe";
}

export interface VuuUIMessageOutUnsubscribe {
  type: "unsubscribe";
  viewport: string;
}
export interface VuuUIMessageOutSuspend {
  type: "suspend";
  viewport: string;
}
export interface VuuUIMessageOutResume {
  type: "resume";
  viewport: string;
}

export interface ViewportMessageOut {
  viewport: string;
}

export interface RequestMessage {
  requestId: string;
}

export interface VuuUIMessageOutColumns extends ViewportMessageOut {
  type: "setColumns";
  columns: string[];
}
export interface VuuUIMessageOutViewRange extends ViewportMessageOut {
  type: "setViewRange";
  range: {
    from: number;
    to: number;
  };
}
export interface VuuUIMessageOutAggregate extends ViewportMessageOut {
  aggregations: VuuAggregation[];
  type: "aggregate";
}
export interface VuuUIMessageOutCloseTreeNode extends ViewportMessageOut {
  key: string;
  type: "closeTreeNode";
}
export interface VuuUIMessageOutCreateLink extends ViewportMessageOut {
  childColumnName: string;
  parentColumnName: string;
  parentClientVpId: string;
  type: "createLink";
}
export interface VuuUIMessageOutRemoveLink extends ViewportMessageOut {
  type: "removeLink";
}
export interface VuuUIMessageOutSetTitle extends ViewportMessageOut {
  title: string;
  type: "setTitle";
}

export interface VuuUIMessageOutDisable extends ViewportMessageOut {
  type: "disable";
}
export interface VuuUIMessageOutEnable extends ViewportMessageOut {
  type: "enable";
}
export interface VuuUIMessageOutOpenTreeNode extends ViewportMessageOut {
  key: string;
  type: "openTreeNode";
}
export interface VuuUIMessageOutResume extends ViewportMessageOut {
  type: "resume";
}

export interface VuuUIMessageOutSelect extends ViewportMessageOut {
  selected: Selection;
  type: "select";
}
export interface VuuUIMessageOutSelectAll extends ViewportMessageOut {
  type: "selectAll";
}
export interface VuuUIMessageOutSelectNone extends ViewportMessageOut {
  type: "selectNone";
}

export interface VuuUIMessageOutSort extends ViewportMessageOut {
  sort: VuuSort;
  type: "sort";
}
export interface VuuUIMessageOutSuspend extends ViewportMessageOut {
  type: "suspend";
}

export interface VuuUIMessageOutFilter extends ViewportMessageOut {
  filter: DataSourceFilter;
  type: "filter";
}
export interface VuuUIMessageOutGroupby extends ViewportMessageOut {
  groupBy: VuuGroupBy;
  type: "groupBy";
}

export interface VuuUIMessageOutConfig extends ViewportMessageOut {
  config: WithFullConfig;
  type: "config";
}

export type VuuUIMessageOutViewport =
  | VuuUIMessageOutAggregate
  | VuuUIMessageOutCloseTreeNode
  | VuuUIMessageOutColumns
  | VuuUIMessageOutConfig
  | VuuUIMessageOutCreateLink
  | VuuUIMessageOutFilter
  | VuuUIMessageOutDisable
  | VuuUIMessageOutEnable
  | VuuUIMessageOutGroupby
  | VuuUIMessageOutOpenTreeNode
  | VuuUIMessageOutRemoveLink
  | VuuUIMessageOutResume
  | VuuUIMessageOutSelect
  | VuuUIMessageOutSelectAll
  | VuuUIMessageOutSelectNone
  | VuuUIMessageOutSetTitle
  | VuuUIMessageOutSuspend
  | VuuUIMessageOutSort
  | VuuUIMessageOutViewRange;

export const isViewporttMessage = (
  msg: object
): msg is VuuUIMessageOutViewport => "viewport" in msg;

export interface TypeAheadRpcRequest {
  method: TypeAheadMethod;
  params: [VuuTable, ...string[]];
  type: "RPC_CALL";
}

export type VuuUIMessageOut =
  | VuuUIMessageOutConnect
  | VuuUIMessageOutSubscribe
  | VuuUIMessageOutUnsubscribe
  | VuuUIMessageOutViewport
  | WithRequestId<ClientToServerTableList>
  | WithRequestId<ClientToServerTableMeta>;

export const isSessionTableActionMessage = (
  messageBody: ServerToClientBody
): messageBody is ServerToClientMenuSessionTableAction =>
  messageBody.type === "VIEW_PORT_MENU_RESP" &&
  messageBody.action !== null &&
  isSessionTable(messageBody.action.table);

export const isSessionTable = (table?: unknown) => {
  if (
    table !== null &&
    typeof table === "object" &&
    "table" in table &&
    "module" in table
  ) {
    return (table as VuuTable).table.startsWith("session");
  }
  return false;
};
