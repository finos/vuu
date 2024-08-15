/**
 * Vuu Protocol Message Envelope.
 *
 * All messages, in both directions (client to server and server to client) carry
 * a set of common properties. All variation is found within the message.body.
 */
export interface VuuClientToServerMessage<
  TBody extends ClientToServerBody = ClientToServerBody
> {
  body: TBody;
  module: string;
  requestId: string;
  sessionId: string;
  token: string;
  user: string;
}

export interface VuuServerToClientMessage<
  TBody extends ServerToClientBody = ServerToClientBody
> {
  body: TBody;
  module: string;
  requestId: string;
  sessionId?: string;
  token: string;
  user: string;
}

/**
 * Metadata messages
 *
 * There are four metadata requests
 * - retrieve a list of all available tables.
 * - retrieve schema information for a given table.
 * - retrieve any menu defined on a given table
 * - retrieve any available Visual Links for a specific viewport
 *
 * Visual Links differ in one impoortant regard from the other three
 * forms of metadata in that they are not static. The take into
 * account existing active subscriptions within the users session
 * and can therefore change from one call to another.
 */
export interface ClientToServerTableList {
  type: "GET_TABLE_LIST";
}

export interface ServerToClientTableList {
  type: "TABLE_LIST_RESP";
  tables: VuuTable[];
}

export interface ClientToServerTableMeta {
  type: "GET_TABLE_META";
  table: VuuTable;
}

export interface ServerToClientTableMeta {
  columns: VuuColumns;
  dataTypes: VuuColumnDataType[];
  key: string;
  table: VuuTable;
  type: "TABLE_META_RESP";
}
export interface ClientToServerMenus {
  type: "GET_VIEW_PORT_MENUS";
  vpId: string;
}

export interface ServerToClientMenus {
  type: "VIEW_PORT_MENUS_RESP";
  menu: VuuMenu;
  vpId: string;
}

export interface ClientToServerVisualLinks {
  type: "GET_VP_VISUAL_LINKS";
  vpId: string;
}

export interface ServerToClientViewPortVisualLinks {
  type: "VP_VISUAL_LINKS_RESP";
  links: VuuLinkDescriptor[];
  vpId: string;
}

/**
 * Viewport manipulation messages
 *
 */
export interface ServerToClientCreateViewPortSuccess {
  aggregations: VuuAggregation[];
  columns: VuuColumns;
  filterSpec: VuuFilter;
  groupBy: VuuGroupBy;
  range: VuuRange;
  sort: VuuSort;
  type: "CREATE_VP_SUCCESS";
  table: string;
  viewPortId: string;
}
export interface ServerToClientChangeViewPortSuccess {
  aggregations: VuuAggregation[];
  columns: VuuColumns;
  filterSpec: VuuFilter;
  groupBy: VuuGroupBy;
  sort: VuuSort;
  type: "CHANGE_VP_SUCCESS";
  viewPortId: string;
}

export interface ServerToClientChangeViewPortRangeSuccess {
  type: "CHANGE_VP_RANGE_SUCCESS";
  viewPortId: string;
  from: number;
  to: number;
}
export interface ServerToClientDisableViewPortSuccess {
  type: "DISABLE_VP_SUCCESS";
  viewPortId: string;
}
export interface ServerToClientEnableViewPortSuccess {
  type: "ENABLE_VP_SUCCESS";
  viewPortId: string;
}
export interface ServerToClientRemoveViewPortSuccess {
  type: "REMOVE_VP_SUCCESS";
  viewPortId: string;
}
export interface ServerToClientSelectSuccess {
  type: "SET_SELECTION_SUCCESS";
  vpId: string;
}

export interface ServerToClientEditRPC {
  action: unknown;
  type: "VP_EDIT_RPC_RESPONSE";
  rpcName: string;
  vpId: string;
}
export interface ServerToClientEditRPCRejected {
  error: string;
  rpcName: string;
  type: "VP_EDIT_RPC_REJECT";
  vpId: string;
}
export interface ServerToClientOpenTreeNodeSuccess {
  type: "OPEN_TREE_SUCCESS";
}
export interface ServerToClientCloseTreeNodeSuccess {
  type: "CLOSE_TREE_SUCCESS";
}
export interface ServerToClientError {
  msg: string;
  type: "ERROR";
}
export interface ServerToClientCreateLinkSuccess {
  childVpId: string;
  childColumnName: string;
  parentVpId: string;
  parentColumnName: string;
  type: "CREATE_VISUAL_LINK_SUCCESS";
}
export interface ServerToClientRemoveLinkSuccess {
  childVpId: string;
  type: "REMOVE_VISUAL_LINK_SUCCESS";
}
export interface ServerToClientTableRows {
  batch: string;
  isLast: boolean;
  rows: VuuRow[];
  timeStamp: number;
  type: "TABLE_ROW";
}
export declare type ServerToClientBody =
  | ServerToClientHeartBeat
  | ServerToClientLoginSuccess
  | ServerToClientCreateViewPortSuccess
  | ServerToClientChangeViewPortSuccess
  | ServerToClientChangeViewPortRangeSuccess
  | ServerToClientDisableViewPortSuccess
  | ServerToClientEnableViewPortSuccess
  | ServerToClientRemoveViewPortSuccess
  | ServerToClientSelectSuccess
  | ServerToClientTableMeta
  | ServerToClientTableList
  | ServerToClientTableRows
  | ServerToClientMenus
  | ServerToClientMenuResponse
  | ServerToClientMenuReject
  | ServerToClientMenuSessionTableAction
  | ServerToClientRPC
  | ServerToClientViewportRpcResponse
  | ServerToClientViewPortVisualLinks
  | ServerToClientOpenTreeNodeSuccess
  | ServerToClientCloseTreeNodeSuccess
  | ServerToClientCreateLinkSuccess
  | ServerToClientRemoveLinkSuccess
  | ServerToClientError
  | ServerToClientEditRPC
  | ServerToClientEditRPC
  | ServerToClientEditRPCRejected;
export interface ClientToServerAuth {
  type: "AUTH";
  username: string;
  password: string;
}
export interface ClientToServerLogin {
  token: string;
  type: "LOGIN";
  user: string;
}
export interface ClientToServerHeartBeat {
  type: "HB_RESP";
  ts: number;
}
export interface ClientToServerDisable {
  type: "DISABLE_VP";
  viewPortId: string;
}
export interface ClientToServerEnable {
  type: "ENABLE_VP";
  viewPortId: string;
}
export interface ClientToServerCreateViewPort {
  columns: VuuColumns;
  filterSpec: VuuFilter;
  groupBy: string[];
  type: "CREATE_VP";
  range: VuuRange;
  sort: VuuSort;
  table: VuuTable;
}
export interface ClientToServerChangeViewPort {
  aggregations: VuuAggregation[];
  columns: VuuColumns;
  filterSpec: VuuFilter;
  groupBy: string[];
  sort: VuuSort;
  type: "CHANGE_VP";
  viewPortId: string;
}
export interface ClientToServerRemoveViewPort {
  type: "REMOVE_VP";
  viewPortId: string;
}
export interface ClientToServerSelection {
  type: "SET_SELECTION";
  selection: number[];
  vpId: string;
}
export interface ClientToServerViewPortRange {
  from: number;
  to: number;
  type: "CHANGE_VP_RANGE";
  viewPortId: string;
}
export interface ClientToServerOpenTreeNode {
  type: "OPEN_TREE_NODE";
  vpId: string;
  treeKey: string;
}
export interface ClientToServerCloseTreeNode {
  type: "CLOSE_TREE_NODE";
  vpId: string;
  treeKey: string;
}
export interface ClientToServerCreateLink {
  childVpId: string;
  parentColumnName: string;
  parentVpId: string;
  type: "CREATE_VISUAL_LINK";
}
export interface ClientToServerRemoveLink {
  childVpId: string;
  type: "REMOVE_VISUAL_LINK";
}

export declare type RpcService = "TypeAheadRpcHandler" | "OrderEntryRpcHandler";

export declare type TypeaheadParams =
  | [VuuTable, string]
  | [VuuTable, string, string];

export declare type TypeAheadMethod =
  | "getUniqueFieldValues"
  | "getUniqueFieldValuesStartingWith";

export declare type RpcMethod = TypeAheadMethod | "addRowsFromInstruments";

export interface ClientToServerEditCellRpc {
  rowKey: string;
  type: "VP_EDIT_CELL_RPC";
  field: string;
  value: VuuRowDataItemType;
}
export interface ClientToServerEditRowRpc {
  rowKey: string;
  type: "VP_EDIT_ROW_RPC";
  row: VuuDataRow;
}

export type VuuDataRowDto = { [key: string]: VuuRowDataItemType };
export interface ClientToServerAddRowRpc {
  rowKey: string;
  type: "VP_EDIT_ADD_ROW_RPC";
  data: VuuDataRowDto;
}
export interface ClientToServerDeleteRowRpc {
  rowKey: string;
  type: "VP_EDIT_DELETE_ROW_RPC";
}
export interface ClientToServerSubmitFormRpc {
  type: "VP_EDIT_SUBMIT_FORM_RPC";
}

export type ClientToServerEditRpc =
  | ClientToServerEditCellRpc
  | ClientToServerAddRowRpc
  | ClientToServerDeleteRowRpc
  | ClientToServerEditRowRpc
  | ClientToServerSubmitFormRpc;

export type ClientToServerMenuRPCType =
  | "VIEW_PORT_MENUS_SELECT_RPC"
  | "VIEW_PORT_MENU_TABLE_RPC"
  | "VIEW_PORT_MENU_ROW_RPC"
  | "VIEW_PORT_MENU_CELL_RPC";

export declare type VuuRpcMessagesOut =
  | ClientToServerMenuSelectRPC
  | ClientToServerEditCellRpc;

export declare type ClientToServerBody =
  | ClientToServerAuth
  | ClientToServerLogin
  | ClientToServerHeartBeat
  | ClientToServerDisable
  | ClientToServerEnable
  | ClientToServerTableList
  | ClientToServerTableMeta
  | ClientToServerCreateViewPort
  | ClientToServerChangeViewPort
  | ClientToServerRemoveViewPort
  | ClientToServerSelection
  | ClientToServerViewPortRange
  | ClientToServerVisualLinks
  | ClientToServerMenus
  | ClientToServerOpenTreeNode
  | ClientToServerCloseTreeNode
  | ClientToServerCreateLink
  | ClientToServerRemoveLink
  | ClientToServerMenuRPC
  | ClientToServerViewportRpcCall
  | ClientToServerRpcRequest;

/**
 * RPC type messages
 *
 * Vuu supports three distinct class of RPC message
 *
 * 1) RPC
 *    This is a 'standalone' RPC call unrelated to any particular viewport. The only example
 *    right now is the typeahead service
 *
 * 2) Viewport RPC
 *
 *    There are no generic messages in this category, they will tend to be specific to a
 *    business module. Examples found in the Vuu project include rpcNames "createBasket",
 *    "addConstituent", "sendToMarket" etc in the BASKET module.
 *
 *    There is a new proposed set of generic rpc calls, related to bulk edit operations
 *      - "VP_BULK_EDIT_SUBMIT_RPC"
 *      - "VP_BULK_EDIT_COLUMN_CELLS_RPC"
 *    These are not yet impelmented in the Vuu server and liable to change
 *
 * 3) Menu RPC
 *
 *    These are RPC calls submitted when user clicks a menu item from the menu structure
 *    defined on the server (see VIEW_PORT_MENUS_RESP above). There are 4 categories of
 *    Menu RPC calls, corresponding to the four values of the menu 'context' property
 *      - grid
 *      - row
 *      - cell
 *      - selected-rows
 *
 */

// RPC
export declare type ClientToServerRpcRequest = {
  type: "RPC_CALL";
  service: "TypeAheadRpcHandler";
} & (
  | {
      method: "getUniqueFieldValues";
      params: [VuuTable, string];
    }
  | {
      method: "getUniqueFieldValuesStartingWith";
      params: [VuuTable, string, string];
    }
);

export interface ServerToClientRPC {
  error: null | unknown;
  type: "RPC_RESP";
  method: "getUniqueFieldValues" | "getUniqueFieldValuesStartingWith";
  result: string[];
}

// ViewportRPC
export interface ClientToServerViewportRpcCall {
  type: "VIEW_PORT_RPC_CALL";
  rpcName: string;
  namedParams: { [key: string]: VuuRowDataItemType | VuuTable };
  params: string[];
  vpId: string;
}

export interface ServerToClientViewportRpcResponse {
  action: {
    key?: string;
    msg?: string;
    type: "VP_RPC_FAILURE" | "VP_RPC_SUCCESS" | "VP_CREATE_SUCCESS";
  };
  type: "VIEW_PORT_RPC_REPONSE";
  method: string;
  namedParams: { [key: string]: VuuRowDataItemType | VuuTable };
  params: string[];
  vpId: string;
}

// MenuRPC
export type ClientToServerMenuRPC =
  | ClientToServerMenuRowRPC
  | ClientToServerMenuCellRPC
  | ClientToServerMenuSelectRPC
  | ClientToServerMenuGridRPC;

export interface ClientToServerMenuSelectRPC {
  rpcName: string;
  type: "VIEW_PORT_MENUS_SELECT_RPC";
  vpId: string;
}
export interface ClientToServerMenuGridRPC {
  rpcName: string;
  type: "VIEW_PORT_MENU_TABLE_RPC";
  vpId: string;
}

export interface ClientToServerMenuRowRPC {
  row: VuuRowRecord;
  rowKey: string;
  rpcName: string;
  type: "VIEW_PORT_MENU_ROW_RPC";
  vpId: string;
}
export interface ClientToServerMenuCellRPC {
  field: string;
  rpcName: string;
  rowKey: string;
  type: "VIEW_PORT_MENU_CELL_RPC";
  value: VuuColumnDataType;
  vpId: string;
}

export interface ServerToClientMenuResponse {
  action: OpenDialogAction | NoAction | ShowNotificationAction;
  rpcName: string;
  type: "VIEW_PORT_MENU_RESP";
  vpId: string;
}

export interface ServerToClientMenuReject {
  error: string;
  rpcName: string;
  type: "VIEW_PORT_MENU_REJ";
  vpId: string;
}

// prettier-ignore
export declare type VuuColumnDataType = "int" | "long" | "double" | "string" | "char" | "boolean";
export declare type VuuMenuContext = "cell" | "row" | "grid" | "selected-rows";
export declare type VuuTable = {
  table: string;
  module: string;
};
export declare type VuuRange = {
  from: number;
  to: number;
};

export declare type VuuSortType = "A" | "D";

export declare type VuuSortCol = {
  column: string;
  sortType: VuuSortType;
};
export declare type VuuSort = {
  sortDefs: VuuSortCol[];
};
export declare type VuuFilter = {
  filter: string;
};
export interface VuuMenuItem {
  context: VuuMenuContext;
  filter: string;
  name: string;
  rpcName: string;
}

export interface VuuMenu {
  name: string;
  menus: (VuuMenuItem | VuuMenu)[];
}

export type VuuRowDataItemType = string | number | boolean;

export type VuuDataRow = VuuRowDataItemType[];

export declare type VuuRow = {
  data: VuuDataRow;
  rowIndex: number;
  rowKey: string;
  sel: 0 | 1;
  ts: number;
  updateType: "U" | "D" | "SIZE";
  viewPortId: string;
  vpSize: number;
  vpVersion: string;
};
export declare type AggTypeSum = 1;
export declare type AggTypeAverage = 2;
export declare type AggTypeCount = 3;
export declare type AggTypeHigh = 4;
export declare type AggTypeLow = 5;
export declare type AggTypeDistinct = 6;
export declare type VuuAggType =
  | AggTypeSum
  | AggTypeAverage
  | AggTypeCount
  | AggTypeHigh
  | AggTypeLow
  | AggTypeDistinct;
export declare type VuuAggregation = {
  column: string;
  aggType: VuuAggType;
};

export interface VuuLink {
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

export declare type VuuLinkDescriptor = {
  parentVpId: string;
  link: VuuLink;
};

// used in MenuRPC row message
export type VuuRowRecord = { [key: string]: VuuRowDataItemType };

/**
 * LinkDescriptor with label is not strictly part of the Vuu Protocol
 *
 * The Label is added by client code, if user has assigned a custom
 * Title to component bound to viewport.
 * The parentClientVpId is also added by client. This is needed as the
 * client vpId persists across sessions, whereas the server vpId does
 * not.
 */
export type LinkDescriptorWithLabel = VuuLinkDescriptor & {
  label?: string;
  parentClientVpId: string;
};

export declare type VuuColumns = string[];
export declare type VuuGroupBy = string[];
export interface ServerToClientHeartBeat {
  type: "HB";
  ts: number;
}
export interface ServerToClientLoginSuccess {
  type: "LOGIN_SUCCESS";
  token: string;
}

export type VuuTableList = Pick<ServerToClientTableList, "tables">;

// Menu Response Actions
export interface ShowNotificationAction {
  type: "SHOW_NOTIFICATION_ACTION";
  message: string;
  title?: string;
}

export interface OpenDialogAction {
  renderComponent?: string;
  type: "OPEN_DIALOG_ACTION";
  table: VuuTable;
}
export interface NoAction {
  type: "NO_ACTION";
}
