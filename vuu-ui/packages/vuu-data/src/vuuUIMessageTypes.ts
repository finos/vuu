import { msgType } from "./constants";
import {
  VuuAggregation,
  VuuColumns,
  VuuMenuContext,
  VuuRange,
  VuuRowDataItemType,
  VuuSortCol,
  VuuTable,
} from "../../vuu-protocol-types";
import { Filter } from "@vuu-ui/vuu-filters";

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
  filter: any;
  filterQuery: any;
  groupBy: any;
  range: VuuRange;
  sort: any;
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

export interface VuuUIMessageInRPC {
  method: string;
  result: any;
  requestId: string;
  type: "RPC_RESP";
}

export type RpcResponse = {
  action: {
    type: "OPEN_DIALOG_ACTION";
    table: VuuTable;
  };
};

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
export interface VuuUIMessageInMenu {
  action: {
    table: VuuTable;
  };
  requestId: string;
  tableAlreadyOpen?: boolean;
  type: "VIEW_PORT_MENU_RESP";
}

export type VuuUIMessageIn =
  | VuuUIMessageInConnected
  | VuuUIMessageInWorkerReady
  | VuuUIMessageInRPC
  | VuuUIMessageInMenu
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
  filter?: Filter;
  filterQuery: string;
  type: "filterQuery";
}
export interface VuuUIMessageOutGroupby extends ViewportMessageOut {
  groupBy: any[];
  type: "groupBy";
}

export interface VuuUIMessageOutMenuRPC
  extends RequestMessage,
    ViewportMessageOut {
  context: VuuMenuContext;
  rpcName: string;
  type: "MENU_RPC_CALL";
}

export type VuuUIMessageOutViewport =
  | VuuUIMessageOutAggregate
  | VuuUIMessageOutCloseTreeNode
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
  | VuuUIMessageOutViewRange
  | VuuUIMessageOutMenuRPC;

export const isViewporttMessage = (
  msg: object
): msg is VuuUIMessageOutViewport => "viewport" in msg;

export interface VuuUIMessageOutRPC extends RequestMessage {
  method: string;
  params: any[];
  type: "RPC_CALL";
}

export type VuuUIMessageOutRpcCall =
  | VuuUIMessageOutRPC
  | VuuUIMessageOutMenuRPC;

export interface VuuUIMessageOutTableList extends RequestMessage {
  type: "GET_TABLE_LIST";
}

export interface VuuUIMessageOutTableMeta extends RequestMessage {
  type: "GET_TABLE_META";
  table: VuuTable;
}

export type VuuUIMessageOutAsyncRequest =
  | VuuUIMessageOutTableList
  | VuuUIMessageOutTableMeta;

export const isAsyncRequestMessage = (
  msg: object
): msg is VuuUIMessageOutAsyncRequest => "requestId" in msgType;

export type VuuUIMessageOut =
  | VuuUIMessageOutConnect
  | VuuUIMessageOutSubscribe
  | VuuUIMessageOutUnsubscribe
  | VuuUIMessageOutAsyncRequest
  | VuuUIMessageOutViewport
  | VuuUIMessageOutRpcCall;

export type TableMeta = {
  columns: string[];
  dataTypes: VuuRowDataItemType[];
  table: VuuTable;
};

export type TableList = {
  tables: VuuTable[];
};
