import { msgType } from "./constants";
import {
  VuuAggregation,
  VuuColumns,
  VuuFilter,
  VuuGroupBy,
  VuuLink,
  VuuMenu,
  VuuMenuContext,
  VuuRange,
  VuuRowDataItemType,
  VuuSort,
  VuuSortCol,
  VuuTable,
} from "@vuu-ui/data-types";
import { Filter } from "@vuu-ui/utils";

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

type RowIndex = number;
type RenderKey = string;
type IsLeaf = boolean;
type IsExpanded = boolean;
type Depth = number;
type ChildCount = number;
type RowKey = string;
type IsSelected = boolean;

export type VuuUIRow = [
  RowIndex,
  RenderKey,
  IsLeaf,
  IsExpanded,
  Depth,
  ChildCount,
  RowKey,
  IsSelected,
  ...VuuRowDataItemType[]
];

export type VuuUIRowPredicate = (row: VuuUIRow) => boolean;

export interface ServerProxySubscribeMessage {
  aggregations: any;
  bufferSize?: number;
  columns: VuuColumns;
  filter: any;
  filterQuery: any;
  groupBy: any;
  range: VuuRange;
  sort: any;
  table: VuuTable;
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

export interface VuuUIMessageInDisabled extends ViewportMessageIn {
  type: "disabled";
}
export interface VuuUIMessageInEnabled extends ViewportMessageIn {
  type: "enabled";
}

export interface VuuUIMessageInSubscribed extends ViewportMessageIn {
  aggregations: VuuAggregation[];
  columns: VuuColumns;
  filter?: Filter;
  filterSpec: VuuFilter;
  groupBy: VuuGroupBy;
  range: VuuRange;
  type: "subscribed";
}

export interface VuuUIMessageInFilter extends ViewportMessageIn {
  type: "filter";
  filter: any;
  filterQuery: any;
}

export interface VuuUIMessageInGroupBy extends ViewportMessageIn {
  type: "groupBy";
  groupBy: VuuGroupBy | null;
}
export interface VuuUIMessageInSort extends ViewportMessageIn {
  type: "sort";
  sort: VuuSort;
}

export type VuuUIMessageInViewportUpdates = {
  type: "viewport-updates";
  viewports: {
    [viewport: string]: {
      rows?: VuuUIRow[];
      size?: number;
    };
  };
};

export type VuuUIMessageInViewportUpdate = {
  type: "viewport-update";
  rows?: VuuUIRow[];
  size?: number;
};

export interface VuuUIMessageInRPC {
  method: string;
  result: any;
  requestId: string;
  type: "RPC_RESP";
}

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
export interface VuuUIMessageInViewPortVisualLinks {
  type: "VP_VISUAL_LINKS_RESP";
  links: VuuLink[];
  clientViewportId: string;
}
export interface VuuUIMessageInVisualLinkCreated {
  clientViewportId: string;
  colName: string;
  parentViewportId: string;
  parentColName: string;
  type: "visual-link-created";
}
export interface VuuUIMessageInVisualLinkRemoved {
  clientViewportId: string;
  type: "visual-link-removed";
}
export interface VuuUIMessageInMenus {
  type: "VIEW_PORT_MENUS_RESP";
  menu: VuuMenu;
  clientViewportId: string;
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
  | VuuUIMessageInDisabled
  | VuuUIMessageInEnabled
  | VuuUIMessageInConnected
  // | VuuUIMessageInConnectionStatus
  | VuuUIMessageInWorkerReady
  | VuuUIMessageInFilter
  | VuuUIMessageInGroupBy
  | VuuUIMessageInSubscribed
  | VuuUIMessageInViewportUpdate
  | VuuUIMessageInViewportUpdates
  | VuuUIMessageInRPC
  | VuuUIMessageInMenu
  | VuuUIMessageInMenus
  | VuuUIMessageInSort
  | VuuUIMessageInViewPortVisualLinks
  | VuuUIMessageInVisualLinkCreated
  | VuuUIMessageInVisualLinkRemoved
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
  filter: Filter;
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

export type RpcResponse = {};

export type TableMeta = {};
export type TableList = {};
