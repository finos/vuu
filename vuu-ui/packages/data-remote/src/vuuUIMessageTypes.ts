import { msgType } from './constants';
import {
  VuuAggregation,
  VuuColumns,
  VuuFilter,
  VuuGroupBy,
  VuuLink,
  VuuMenu,
  VuuMenuContext,
  VuuRange,
  VuuSort,
  VuuSortCol,
  VuuTable
} from '@vuu-ui/data-types';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnected';

export interface ConnectionStatusMessage {
  type: 'connection-status';
  reason?: string;
  retry?: boolean;
  status: ConnectionStatus;
}

export const isConnectionStatusMessage = (msg: object): msg is ConnectionStatusMessage =>
  (msg as ConnectionStatusMessage).type === 'connection-status';

export type VuuUIRow = [number, string, boolean, any, any, number, string, boolean, ...any[]];

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
  tablename: VuuTable;
  viewport: string;
  visualLink: any;
}

// export type VuuUIMessageInConnectionStatus = {
//   type: 'connection-status';
// };

export type VuuUIMessageInConnected = {
  type: 'connected';
};

export type VuuUIMessageInWorkerReady = {
  type: 'ready';
};

export interface ViewportMessage {
  clientViewportId: string;
}

export interface VuuUIMessageInDisabled extends ViewportMessage {
  type: 'disabled';
}
export interface VuuUIMessageInEnabled extends ViewportMessage {
  type: 'enabled';
}

export interface VuuUIMessageInSubscribed extends ViewportMessage {
  aggregations: VuuAggregation[];
  columns: VuuColumns;
  filter: any;
  filterSpec: VuuFilter;
  groupBy: VuuGroupBy;
  range: VuuRange;
  type: 'subscribed';
}

export interface VuuUIMessageInFilter extends ViewportMessage {
  type: 'filter';
  filter: any;
  filterQuery: any;
}

export interface VuuUIMessageInGroupBy extends ViewportMessage {
  type: 'groupBy';
  groupBy: VuuGroupBy | null;
}
export interface VuuUIMessageInSort extends ViewportMessage {
  type: 'sort';
  sort: VuuSort;
}

export type VuuUIMessageInViewportUpdates = {
  type: 'viewport-updates';
  viewports: {
    [viewport: string]: {
      rows?: VuuUIRow[];
      size?: number;
    };
  };
};

export type VuuUIMessageInViewportUpdate = {
  type: 'viewport-update';
  rows: VuuUIRow[];
  size: number;
};

export interface VuuUIMessageInRPC {
  method: string;
  result: any;
  requestId: string;
  type: 'RPC_RESP';
}

export interface VuuUIMessageInTableList {
  requestId: string;
  type: 'TABLE_LIST_RESP';
  tables: VuuTable[];
}
export interface VuuUIMessageInTableMeta {
  columns: string[];
  dataTypes: string[];
  requestId: string;
  table: VuuTable;
  type: 'TABLE_META_RESP';
}
export interface VuuUIMessageInViewPortVisualLinks {
  type: 'VP_VISUAL_LINKS_RESP';
  links: VuuLink[];
  clientViewportId: string;
}
export interface VuuUIMessageInVisualLinkCreated {
  clientViewportId: string;
  colName: string;
  parentViewportId: string;
  parentColName: string;
  type: 'visual-link-created';
}
export interface VuuUIMessageInMenus {
  type: 'VIEW_PORT_MENUS_RESP';
  menu: VuuMenu;
  clientViewportId: string;
}
export interface VuuUIMessageInMenu {
  action: {
    table: VuuTable;
  };
  requestId: string;
  tableAlreadyOpen?: boolean;
  type: 'VIEW_PORT_MENU_RESP';
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
  | VuuUIMessageInTableList
  | VuuUIMessageInTableMeta;

export interface VuuUIMessageOutConnect {
  type: 'connect';
  token: string;
  url: string;
  useWebsocket: boolean;
}

export interface VuuUIMessageOutSubscribe extends ServerProxySubscribeMessage {
  type: 'subscribe';
}

export interface VuuUIMessageOutUnsubscribe {
  type: 'unsubscribe';
  viewport: string;
}

export interface ViewportMessage {
  viewport: string;
}

export interface RequestMessage {
  requestId: string;
}

export interface VuuUIMessageOutViewRange extends ViewportMessage {
  type: 'setViewRange';
  range: {
    from: number;
    to: number;
  };
}
export interface VuuUIMessageOutAggregate extends ViewportMessage {
  aggregations: VuuAggregation[];
  type: 'aggregate';
}
export interface VuuUIMessageOutCloseTreeNode extends ViewportMessage {
  key: string;
  type: 'closeTreeNode';
}
export interface VuuUIMessageOutCreateLink extends ViewportMessage {
  childColumnName: string;
  parentColumnName: string;
  parentVpId: string;
  type: 'createLink';
}

export interface VuuUIMessageOutDisable extends ViewportMessage {
  type: 'disable';
}
export interface VuuUIMessageOutEnable extends ViewportMessage {
  type: 'enable';
}
export interface VuuUIMessageOutOpenTreeNode extends ViewportMessage {
  key: string;
  type: 'openTreeNode';
}
export interface VuuUIMessageOutResume extends ViewportMessage {
  type: 'resume';
}

export interface VuuUIMessageOutSelect extends ViewportMessage {
  selected: number[];
  type: 'select';
}

export interface VuuUIMessageOutSort extends ViewportMessage {
  sortCriteria: VuuSortCol[];
  type: 'sort';
}
export interface VuuUIMessageOutSuspend extends ViewportMessage {
  type: 'suspend';
}

export interface VuuUIMessageOutFilterQuery extends ViewportMessage {
  filter: any;
  filterQuery: string;
  type: 'filterQuery';
}
export interface VuuUIMessageOutGroupby extends ViewportMessage {
  groupBy: any[];
  type: 'groupBy';
}

export interface VuuUIMessageOutMenuRPC extends RequestMessage, ViewportMessage {
  context: VuuMenuContext;
  rpcName: string;
  type: 'MENU_RPC_CALL';
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
  | VuuUIMessageOutResume
  | VuuUIMessageOutSelect
  | VuuUIMessageOutSuspend
  | VuuUIMessageOutSort
  | VuuUIMessageOutViewRange
  | VuuUIMessageOutMenuRPC;

export const isViewporttMessage = (msg: object): msg is VuuUIMessageOutViewport =>
  'viewport' in msg;

export interface VuuUIMessageOutRPC extends RequestMessage {
  method: string;
  params: any[];
  type: 'RPC_CALL';
}

export type VuuUIMessageOutRpcCall = VuuUIMessageOutRPC | VuuUIMessageOutMenuRPC;

export interface VuuUIMessageOutTableList extends RequestMessage {
  type: 'GET_TABLE_LIST';
}

export interface VuuUIMessageOutTableMeta extends RequestMessage {
  type: 'GET_TABLE_META';
  table: VuuTable;
}

export type VuuUIMessageOutAsyncRequest = VuuUIMessageOutTableList | VuuUIMessageOutTableMeta;

export const isAsyncRequestMessage = (msg: object): msg is VuuUIMessageOutAsyncRequest =>
  'requestId' in msgType;

export type VuuUIMessageOut =
  | VuuUIMessageOutConnect
  | VuuUIMessageOutSubscribe
  | VuuUIMessageOutUnsubscribe
  | VuuUIMessageOutAsyncRequest
  | VuuUIMessageOutViewport
  | VuuUIMessageOutRpcCall;

export type RpcRequest = {};
export type RpcResponse = {};

export type TableMeta = {};
export type TableList = {};

// These are the messages sent to the client data source
export type ClientViewportMessage = {};
