// prettier-ignore
export declare type VuuColumnDataType = "int" | "long" | "double" | "string" | "char";
export declare type VuuMenuContext = "cell" | "row" | "grid" | "selected-rows";
export interface VuuMenuItem {
  context: VuuMenuContext;
  filter: string;
  name: string;
  rpcName: string;
}
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
export interface VuuMenu {
  name: string;
  menus: VuuMenuItem[];
}

export type VuuRowDataItemType = string | number | boolean;

export type VuuDataRow = [number, number, ...data: VuuRowDataItemType[]];

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
export declare type VuuAggType =
  | AggTypeSum
  | AggTypeAverage
  | AggTypeCount
  | AggTypeHigh
  | AggTypeLow;
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

/**
 * LinkDescriptor with label is not strictly part of the Vuu Protocol
 *
 * The Label is added by client code, if user has assigned a custom
 * Title to component bound to viewport.
 */
export type LinkDescriptorWithLabel = VuuLinkDescriptor & {
  label?: string;
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
export interface ServerToClientTableList {
  type: "TABLE_LIST_RESP";
  tables: VuuTable[];
}

export type VuuTableList = Pick<ServerToClientTableList, "tables">;

export interface VuuTableMeta {
  columns: VuuColumns;
  dataTypes: VuuColumnDataType[];
}
export interface VuuTableMetaWithTable extends VuuTableMeta {
  table: VuuTable;
}

export interface ServerToClientTableMeta extends VuuTableMetaWithTable {
  type: "TABLE_META_RESP";
}

export type VuuTableMeta = Pick<
  ServerToClientTableMeta,
  "columns" | "dataTypes" | "table"
>;

export interface ServerToClientMenus {
  type: "VIEW_PORT_MENUS_RESP";
  menu: VuuMenu;
  vpId: string;
}
export interface ServerToClientMenu {
  rpcName: "ADD_ROWS_TO_ORDERS";
  type: "VIEW_PORT_MENU_RESP";
  action: {
    table: VuuTable;
    type: "OPEN_DIALOG_ACTION";
  };
  vpId: string;
}
export interface ServerToClientViewPortVisualLinks {
  type: "VP_VISUAL_LINKS_RESP";
  links: VuuLinkDescriptor[];
  vpId: string;
}
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
export interface ServerToClientRPC {
  type: "RPC_RESP";
  method: string;
  result: any;
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
  | ServerToClientMenu
  | ServerToClientRPC
  | ServerToClientViewPortVisualLinks
  | ServerToClientOpenTreeNodeSuccess
  | ServerToClientCloseTreeNodeSuccess
  | ServerToClientCreateLinkSuccess
  | ServerToClientRemoveLinkSuccess
  | ServerToClientError;
export interface ServerToClientMessage<
  TBody extends ServerToClientBody = ServerToClientBody
> {
  body: TBody;
  module: string;
  requestId: string;
  sessionId?: string;
  token: string;
  user: string;
}
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
export interface ClientToServerTableList {
  type: "GET_TABLE_LIST";
}
export interface ClientToServerTableMeta {
  type: "GET_TABLE_META";
  table: VuuTable;
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
  aggregations: any[];
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
export interface ClientToServerVisualLinks {
  type: "GET_VP_VISUAL_LINKS";
  vpId: string;
}
export interface ClientToServerMenus {
  type: "GET_VIEW_PORT_MENUS";
  vpId: string;
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
export interface ClientToServerGetUniqueValues {
  type: "RPC_CALL";
  method: "getUniqueFieldValues";
  service: "TypeAheadRpcHandler";
  params: [VuuTable, string];
}
export interface ClientToServerGetUniqueValuesStartingWith {
  type: "RPC_CALL";
  method: "getUniqueFieldValuesStartingWith";
  service: "TypeAheadRpcHandler";
  params: [VuuTable, string, string];
}

export declare type VuuRpcRequest =
  | ClientToServerGetUniqueValues
  | ClientToServerGetUniqueValuesStartingWith;
// add remaining Rpc calls here

export interface ClientToServerMenuSelectRPC {
  type: "VIEW_PORT_MENUS_SELECT_RPC";
  rpcName: string;
  vpId: string;
}
export interface ClientToServerMenuTableRPC {
  type: "VIEW_PORT_MENU_TABLE_RPC";
  rpcName: string;
  vpId: string;
}
export interface ClientToServerMenuRowRPC {
  type: "VIEW_PORT_MENU_ROW_RPC";
  rpcName: string;
  vpId: string;
}
export interface ClientToServerMenuCellRPC {
  type: "VIEW_PORT_MENU_CELL_RPC";
  rpcName: string;
  vpId: string;
}

export type ClientToServerMenuRPCType =
  | "VIEW_PORT_MENUS_SELECT_RPC"
  | "VIEW_PORT_MENU_TABLE_RPC"
  | "VIEW_PORT_MENU_ROW_RPC"
  | "VIEW_PORT_MENU_CELL_RPC";

export type ClientToServerMenuRPC =
  | ClientToServerMenuSelectRPC
  | ClientToServerMenuTableRPC
  | ClientToServerMenuRowRPC
  | ClientToServerMenuCellRPC;

export declare type VuuRpcMessagesOut = ClientToServerMenuSelectRPC;
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
  | VuuRpcRequest
  | VuuMenuRpcRequest;
export interface ClientToServerMessage<
  TBody extends ClientToServerBody = ClientToServerBody
> {
  body: TBody;
  module: string;
  requestId: string;
  sessionId: string;
  token: string;
  user: string;
}

/** Menu RPC services */
export interface OpenDialogAction {
  type: "OPEN_DIALOG_ACTION";
  table: VuuTable;
}
export interface NoAction {
  type: "NO_ACTION";
}

export declare type MenuRpcAction = OpenDialogAction | NoAction;
export interface VuuAddRowsToOrdersSelectMenuRpcRequest {
  type: "VIEW_PORT_MENU_RESP";
  rpcName: "ADD_ROWS_TO_ORDERS";
  vpId: string;
}

export interface VuuAddRowsToOrdersSelectMenuRpcResponse {
  action: OpenDialogAction;
  rpcName: "ADD_ROWS_TO_ORDERS";
  type: "VIEW_PORT_MENUS_SELECT_RPC";
  vpId: string;
}

export interface VuuTestTableMenuRpcRequest {
  type: "VIEW_PORT_MENU_TABLE_RPC";
  rpcName: "TEST_TABLE";
  vpId: string;
}

export interface VuuTestTableMenuRpcResponse {
  action: NoAction;
  rpcName: "TEST_TABLE";
  type: "VIEW_PORT_MENU_RESP";
  vpId: string;
}

export interface VuuTestSelectMenuRpcRequest {
  type: "VIEW_PORT_MENUS_SELECT_RPC";
  rpcName: "TEST_SELECT";
  vpId: string;
}

export interface VuuTestSelectMenuRpcResponse {
  action: OpenDialogAction;
  rpcName: "TEST_SELECT";
  type: "VIEW_PORT_MENU_RESP";
  vpId: string;
}

// Should really be a table option rather than select option
export interface VuuTickSpeedSelectMenuRpcRequest {
  type: "VIEW_PORT_MENUS_SELECT_RPC";
  rpcName: "SET_SPEED_MED" | "SET_SPEED_SLOW" | "SET_SPEED_FAST";
  vpId: string;
}

export interface VuuTickSpeedSelectMenuRpcResponse {
  action: NoAction;
  rpcName: "SET_SPEED_MED" | "SET_SPEED_SLOW" | "SET_SPEED_FAST";
  type: "VIEW_PORT_MENU_RESP";
  vpId: string;
}

export interface VuuTestRowMenuRpcRequest {
  type: "VIEW_PORT_MENU_ROW_RPC";
  rpcName: "TEST_ROW";
  vpId: string;
}

export interface VuuTestRowMenuRpcResponse {
  action: NoAction;
  rpcName: "TEST_ROW";
  type: "VIEW_PORT_MENU_RESP";
  vpId: string;
}
export interface VuuTestCellMenuRpcRequest {
  type: "VIEW_PORT_MENU_CELL_RPC";
  rpcName: "TEST_CELL";
  vpId: string;
}

export interface VuuTestCellMenuRpcResponse {
  action: NoAction;
  rpcName: "TEST_CELL";
  type: "VIEW_PORT_MENU_RESP";
  vpId: string;
}

export declare type VuuMenuRpcRequest =
  | VuuAddRowsToOrdersSelectMenuRpcRequest
  | VuuTestTableMenuRpcRequest
  | VuuTestSelectMenuRpcRequest
  | VuuTestRowMenuRpcRequest
  | VuuTestCellMenuRpcRequest
  | VuuTickSpeedSelectMenuRpcRequest;
