import {
  ClientToServerTableList,
  ClientToServerTableMeta,
  MenuRpcAction,
  TypeAheadMethod,
  VuuAggregation,
  VuuColumns,
  VuuGroupBy,
  VuuRange,
  VuuSortCol,
  VuuTable,
} from "@finos/vuu-protocol-types";
import { Filter } from "@finos/vuu-filter-types";
import { WithRequestId } from "./message-utils";

export type ConnectionStatus =
  | "connecting"
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
  msg: object
): msg is ConnectionStatusMessage =>
  (msg as ConnectionStatusMessage).type === "connection-status";

export interface ServerProxySubscribeMessage {
  aggregations: VuuAggregation[];
  bufferSize?: number;
  columns: VuuColumns;
  filter?: Filter;
  filterQuery?: string;
  groupBy?: VuuGroupBy;
  range: VuuRange;
  sort?: VuuSortCol[];
  table: VuuTable;
  title?: string;
  viewport: string;
  visualLink: any;
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

export const messageHasResult = (msg: object): msg is VuuUIMessageInRPC =>
  typeof (msg as VuuUIMessageInRPC).result !== "undefined";

export interface VuuUIMessageInTableList {
  requestId: string;
  type: "TABLE_LIST_RESP";
  tables: VuuTable[];
}
export interface VuuUIMessageInTableMeta {
  columns: string[];
  dataTypes: string[];
  requestId: string;
  table: VuuTable;
  type: "TABLE_META_RESP";
}
export interface MenuRpcResponse {
  action: MenuRpcAction;
  requestId: string;
  tableAlreadyOpen?: boolean;
  type: "VIEW_PORT_MENU_RESP";
}

export type VuuUIMessageIn =
  | VuuUIMessageInConnected
  | VuuUIMessageInWorkerReady
  | VuuUIMessageInRPC
  | MenuRpcResponse
  | VuuUIMessageInTableList
  | VuuUIMessageInTableMeta;

export interface VuuUIMessageOutConnect {
  type: "connect";
  token: string;
  url: string;
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
  parentVpId: string;
  type: "createLink";
}
export interface VuuUIMessageOutRemoveLink extends ViewportMessageOut {
  type: "removeLink";
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
  selected: number[];
  type: "select";
}
export interface VuuUIMessageOutSelectAll extends ViewportMessageOut {
  type: "selectAll";
}
export interface VuuUIMessageOutSelectNone extends ViewportMessageOut {
  type: "selectNone";
}

export interface VuuUIMessageOutSort extends ViewportMessageOut {
  sortDefs: VuuSortCol[];
  type: "sort";
}
export interface VuuUIMessageOutSuspend extends ViewportMessageOut {
  type: "suspend";
}

export interface VuuUIMessageOutFilterQuery extends ViewportMessageOut {
  filter: Filter | undefined;
  filterQuery: string;
  type: "filterQuery";
}
export interface VuuUIMessageOutGroupby extends ViewportMessageOut {
  groupBy: VuuGroupBy;
  type: "groupBy";
}

export type VuuUIMessageOutViewport =
  | VuuUIMessageOutAggregate
  | VuuUIMessageOutCloseTreeNode
  | VuuUIMessageOutColumns
  | VuuUIMessageOutCreateLink
  | VuuUIMessageOutFilterQuery
  | VuuUIMessageOutDisable
  | VuuUIMessageOutEnable
  | VuuUIMessageOutGroupby
  | VuuUIMessageOutOpenTreeNode
  | VuuUIMessageOutRemoveLink
  | VuuUIMessageOutResume
  | VuuUIMessageOutSelect
  | VuuUIMessageOutSelectAll
  | VuuUIMessageOutSelectNone
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
