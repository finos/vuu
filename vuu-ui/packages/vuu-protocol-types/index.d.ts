/**
 * Vuu Protocol Message Envelope.
 *
 * All messages, in both directions (client to server and server to client) carry
 * a set of common properties. All variation is found within the message.body.
 */
export interface VuuClientMessage<
  TBody extends ClientMessageBody = ClientMessageBody,
> {
  body: TBody;
  module: string;
  requestId: string;
  sessionId: string;
  token: string;
  user: string;
}

export interface VuuServerMessage<
  TBody extends ServerMessageBody = ServerMessageBody,
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

export interface VuuLoginRequest {
  token: string;
  type: "LOGIN";
}

export declare type VuuLoginResponse =
  | VuuLoginSuccessResponse
  | VuuLoginFailResponse;
export interface VuuLoginSuccessResponse {
  type: "LOGIN_SUCCESS";
  vuuServerId: string;
}
export interface VuuLoginFailResponse {
  errorMsg: string;
  type: "LOGIN_FAIL";
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
 * Visual Links differ in one important regard from the other three
 * forms of metadata in that they are not static. The take into
 * account existing active subscriptions within the users session
 * and can therefore change from one call to another.
 */
export interface VuuTableListRequest {
  type: "GET_TABLE_LIST";
}

export interface VuuTableListResponse {
  type: "TABLE_LIST_RESP";
  tables: VuuTable[];
}

export interface VuuTableMetaRequest {
  type: "GET_TABLE_META";
  table: VuuTable;
}

export interface VuuTableMetaResponse {
  columns: VuuColumns;
  dataTypes: VuuColumnDataType[];
  key: string;
  table: VuuTable;
  type: "TABLE_META_RESP";
}
export interface VuuViewportMenusRequest {
  type: "GET_VIEW_PORT_MENUS";
  vpId: string;
}

export interface VuuViewportMenusResponse {
  type: "VIEW_PORT_MENUS_RESP";
  menu: VuuMenu;
  vpId: string;
}

export interface VuuViewportVisualLinksRequest {
  type: "GET_VP_VISUAL_LINKS";
  vpId: string;
}

export interface VuuViewportVisualLinksResponse {
  type: "VP_VISUAL_LINKS_RESP";
  links: VuuLinkDescriptor[];
  vpId: string;
}

export interface VuuCreateVisualLink {
  childColumnName: string;
  childVpId: string;
  parentColumnName: string;
  parentVpId: string;
  type: "CREATE_VISUAL_LINK";
}

export interface VuuCreateVisualLinkResponse {
  childVpId: string;
  childColumnName: string;
  parentVpId: string;
  parentColumnName: string;
  type: "CREATE_VISUAL_LINK_SUCCESS";
}

export interface VuuRemoveVisualLink {
  childVpId: string;
  type: "REMOVE_VISUAL_LINK";
}

export interface VuuRemoveVisualLinkResponse {
  childVpId: string;
  type: "REMOVE_VISUAL_LINK_SUCCESS";
}

/**
 * Viewport manipulation messages
 *
 */

export interface VuuViewportCreateRequest {
  aggregations: VuuAggregation[];
  columns: VuuColumns;
  filterSpec: VuuFilter;
  groupBy: string[];
  type: "CREATE_VP";
  range: VuuRange;
  sort: VuuSort;
  table: VuuTable;
}

export declare type VuuViewportCreateResponse =
  | VuuViewportCreateSuccessResponse
  | VuuViewportCreateFailResponse;
export interface VuuViewportCreateSuccessResponse {
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
export interface VuuViewportCreateFailResponse {
  aggregations: VuuAggregation[];
  columns: VuuColumns;
  filterSpec: VuuFilter;
  groupBy: VuuGroupBy;
  range: VuuRange;
  sort: VuuSort;
  type: "CREATE_VP_REJECT";
  table: string;
  viewPortId: string;
}
export interface VuuViewportChangeRequest {
  aggregations: VuuAggregation[];
  columns: VuuColumns;
  filterSpec: VuuFilter;
  groupBy: string[];
  sort: VuuSort;
  type: "CHANGE_VP";
  viewPortId: string;
}

export interface VuuViewportChangeResponse {
  aggregations: VuuAggregation[];
  columns: VuuColumns;
  filterSpec: VuuFilter;
  groupBy: VuuGroupBy;
  sort: VuuSort;
  type: "CHANGE_VP_SUCCESS";
  viewPortId: string;
}

export interface VuuViewportRangeRequest {
  from: number;
  to: number;
  type: "CHANGE_VP_RANGE";
  viewPortId: string;
}

export interface VuuViewportRangeResponse {
  from: number;
  to: number;
  type: "CHANGE_VP_RANGE_SUCCESS";
  viewPortId: string;
}

export interface VuuViewportDisableRequest {
  type: "DISABLE_VP";
  viewPortId: string;
}
export interface VuuViewportDisableResponse {
  type: "DISABLE_VP_SUCCESS";
  viewPortId: string;
}

export interface VuuViewportEnableRequest {
  type: "ENABLE_VP";
  viewPortId: string;
}

export interface VuuViewportEnableResponse {
  type: "ENABLE_VP_SUCCESS";
  viewPortId: string;
}

export interface VuuViewportRemoveRequest {
  type: "REMOVE_VP";
  viewPortId: string;
}

export interface VuuViewportRemoveResponse {
  type: "REMOVE_VP_SUCCESS";
  viewPortId: string;
}

export interface FreezeViewportRequest {
  type: "FREEZE_VP";
  viewPortId: string;
}

export interface FreezeViewportSuccess {
  type: "FREEZE_VP_SUCCESS";
  viewPortId: string;
}
export interface FreezeViewportReject {
  type: "FREEZE_VP_REJECT";
  viewPortId: string;
}
export interface UnfreezeViewportRequest {
  type: "UNFREEZE_VP";
  viewPortId: string;
}

export interface UnfreezeViewportSuccess {
  type: "UNFREEZE_VP_SUCCESS";
  viewPortId: string;
}
export interface UnfreezeViewportReject {
  type: "UNFREEZE_VP_REJECT";
  viewPortId: string;
}

export declare type SelectRequest =
  | SelectRowRequest
  | DeselectRowRequest
  | SelectRowRangeRequest
  | SelectAllRequest
  | DeselectAllRequest;

export declare type SelectResponse =
  | SelectRowResponse
  | DeselectRowResponse
  | SelectRowRangeResponse
  | SelectAllResponse
  | DeselectAllResponse;

export declare type SuccessfulSelectResponse =
  | SelectRowSuccess
  | DeselectRowSuccess
  | SelectRowRangeSuccess
  | SelectAllSuccess
  | DeselectAllSuccess;
export interface SelectRowRequest {
  preserveExistingSelection: boolean;
  rowKey: string;
  type: "SELECT_ROW";
  vpId: string;
}

export declare type SelectRowResponse = SelectRowSuccess | SelectRowReject;

export declare interface SelectSuccessWithRowCount {
  selectedRowCount: number;
  type:
    | "SELECT_ROW_SUCCESS"
    | "DESELECT_ROW_SUCCESS"
    | "SELECT_ROW_RANGE_SUCCESS"
    | "SELECT_ALL_SUCCESS"
    | "DESELECT_ALL_SUCCESS";
}

export interface SelectRowSuccess extends SelectSuccessWithRowCount {
  type: "SELECT_ROW_SUCCESS";
  vpId: string;
}
export interface SelectRowReject {
  errorMsg: string;
  type: "SELECT_ROW_REJECT";
  vpId: string;
}

export interface DeselectRowRequest {
  preserveExistingSelection: boolean;
  rowKey: string;
  type: "DESELECT_ROW";
  vpId: string;
}

export declare type DeselectRowResponse =
  | DeselectRowSuccess
  | DeselectRowReject;
export interface DeselectRowSuccess extends SelectSuccessWithRowCount {
  type: "DESELECT_ROW_SUCCESS";
  vpId: string;
}
export interface DeselectRowReject {
  errorMsg: string;
  type: "DESELECT_ROW_REJECT";
  vpId: string;
}

export interface SelectRowRangeRequest {
  preserveExistingSelection: boolean;
  fromRowKey: string;
  toRowKey: string;
  type: "SELECT_ROW_RANGE";
  vpId: string;
}
export declare type SelectRowRangeResponse =
  | SelectRowRangeSuccess
  | SelectRowRangeReject;
export interface SelectRowRangeSuccess extends SelectSuccessWithRowCount {
  type: "SELECT_ROW_RANGE_SUCCESS";
  vpId: string;
}
export interface SelectRowRangeReject {
  errorMsg: string;
  type: "SELECT_ROW_RANGE_REJECT";
  vpId: string;
}

export interface SelectAllRequest {
  type: "SELECT_ALL";
  vpId: string;
}
export declare type SelectAllResponse = SelectAllSuccess | SelectAllReject;
export interface SelectAllSuccess extends SelectSuccessWithRowCount {
  type: "SELECT_ALL_SUCCESS";
  vpId: string;
}
export interface SelectAllReject {
  errorMsg: string;
  type: "SELECT_ALL_REJECT";
  vpId: string;
}

export interface DeselectAllRequest {
  type: "DESELECT_ALL";
  vpId: string;
}

export declare type DeselectAllResponse =
  | DeselectAllSuccess
  | DeselectAllReject;
export interface DeselectAllSuccess {
  type: "DESELECT_ALL_SUCCESS";
  vpId: string;
}
export interface DeselectAllReject {
  errorMsg: string;
  type: "DESELECT_ALL_REJECT";
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
export interface ServerToClientTableRows {
  batch: string;
  isLast: boolean;
  rows: VuuRow[];
  timeStamp: number;
  type: "TABLE_ROW";
}
export declare type ServerMessageBody =
  | ServerToClientHeartBeat
  | VuuLoginResponse
  | VuuViewportCreateResponse
  | VuuViewportChangeResponse
  | VuuViewportRangeResponse
  | VuuViewportDisableResponse
  | VuuViewportEnableResponse
  | VuuViewportRemoveResponse
  | VuuTableMetaResponse
  | VuuTableListResponse
  | ServerToClientTableRows
  | VuuViewportMenusResponse
  | VuuRpcMenuSuccess
  | VuuRpcMenuError
  | VuuRpcServiceResponse
  | SelectResponse
  | VuuViewportVisualLinksResponse
  | ServerToClientOpenTreeNodeSuccess
  | ServerToClientCloseTreeNodeSuccess
  | VuuCreateVisualLinkResponse
  | VuuRemoveVisualLinkResponse
  | ServerToClientError
  | VuuRpcEditSuccess
  | VuuRpcEditSuccess
  | VuuRpcEditError;
export interface ClientToServerHeartBeat {
  type: "HB_RESP";
  ts: number;
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

export declare type RpcService = "TypeAheadRpcHandler" | "OrderEntryRpcHandler";

export declare type TypeaheadParams =
  | [VuuTable, string]
  | [VuuTable, string, string];

export declare type TypeAheadMethod =
  | "getUniqueFieldValues"
  | "getUniqueFieldValuesStartingWith";

export declare type RpcMethod = TypeAheadMethod | "addRowsFromInstruments";

export declare type ClientToServerMenuRPCType =
  | "VIEW_PORT_MENUS_SELECT_RPC"
  | "VIEW_PORT_MENU_TABLE_RPC"
  | "VIEW_PORT_MENU_ROW_RPC"
  | "VIEW_PORT_MENU_CELL_RPC";

export declare type VuuRpcMessagesOut =
  | ClientToServerMenuSelectRPC
  | VuuRpcEditCellRequest;

export declare type ClientMessageBody =
  | ClientToServerAuth
  | VuuLoginRequest
  | ClientToServerHeartBeat
  | VuuViewportDisableRequest
  | VuuViewportEnableRequest
  | VuuTableListRequest
  | VuuTableMetaRequest
  | VuuViewportCreateRequest
  | VuuViewportChangeRequest
  | VuuViewportRemoveRequest
  | VuuViewportRangeRequest
  | VuuViewportVisualLinksRequest
  | VuuViewportMenusRequest
  | SelectRequest
  | ClientToServerOpenTreeNode
  | ClientToServerCloseTreeNode
  | VuuCreateVisualLink
  | VuuRemoveVisualLink
  | VuuRpcMenuRequest
  | VuuRpcRequest
  | FreezeViewportRequest
  | UnfreezeViewportRequest;

/**
 * RPC type messages
 *
 * Vuu supports two types of RPC message
 *
 * 2) VuuRpcServiceRequest
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
 * 3) VuuRpcMenuRequest
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

export declare type GlobalRpcContext = {
  type: "GLOBAL_CONTEXT";
};
export declare type ViewportRpcContext = {
  type: "VIEWPORT_CONTEXT";
  viewPortId: string;
};
export declare type ViewportRowRpcContext = {
  type: "VIEWPORT_ROW_CONTEXT";
  viewPortId: string;
  rowKey: string;
};

export declare type RpcContext =
  | GlobalRpcContext
  | ViewportRpcContext
  | ViewportRowRpcContext;

export declare type VuuRpcRequest =
  | VuuRpcServiceRequest
  | VuuRpcMenuRequest
  | VuuRpcEditRequest;

export declare type VuuRpcResponse =
  | VuuRpcServiceResponse
  | VuuRpcMenuResponse
  | VuuRpcEditResponse;

export declare type VuuRpcServiceRequest<T extends RpcContext = RpcContext> = {
  context: T;
  type: "RPC_REQUEST";
  params: Record<string, string>;
  rpcName: TypeAheadMethod | string;
};

export declare type RpcResultSuccess = {
  type: "SUCCESS_RESULT";
  data: unknown;
};
export declare type RpcResultError = {
  type: "ERROR_RESULT";
  errorMessage: string;
};
export interface VuuRpcServiceResponse {
  action: unknown;
  error: null | unknown;
  rpcName: TypeAheadMethod;
  type: "RPC_RESPONSE";
  result: RpcResultSuccess | RpcResultError;
}

export interface VuuViewportRpcTypeaheadRequest extends VuuRpcServiceRequest {
  rpcName: TypeAheadMethod;
  params: {
    column: string;
    module: string;
    starts?: string;
    table: string;
  };
}

// MenuRPC
export declare type VuuRpcMenuRequest =
  | ClientToServerMenuRowRPC
  | ClientToServerMenuCellRPC
  | ClientToServerMenuSelectRPC
  | ClientToServerMenuGridRPC;

export declare type VuuRpcMenuResponse = VuuRpcMenuSuccess | VuuRpcMenuError;

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
  row: VuuDataRowDto;
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

export interface VuuRpcMenuSuccess<
  T extends VuuRpcMenuAction | VuuRpcEditAction = VuuRpcMenuAction,
> {
  action: T;
  rpcName: string;
  type: "VIEW_PORT_MENU_RESP";
  vpId: string;
}

export interface VuuRpcMenuError {
  error: string;
  rpcName: string;
  type: "VIEW_PORT_MENU_REJ";
  vpId: string;
}

/**
 * Note VuuRpcEditCellRequest gets success response of type  VuuRpcMenuSuccess, with
 * rpcName "VP_EDIT_CELL_RPC"
 * with action of type "VP_EDIT_SUCCESS"
 *
 * VuuRpcEditCommitRequest gets response of type VuuRpcEditSuccess or VuuRpcEditError
 */
// Edit RPC
export declare type VuuRpcEditRequest =
  | VuuRpcEditCellRequest
  | VuuRpcEditAddRowRequest
  | VuuRpcEditDeleteRowRequest
  | VuuRpcEditUpdateRowRequest
  | VuuRpcEditCommitRequest;

export declare type VuuRpcEditResponse = VuuRpcEditSuccess | VuuRpcEditError;
export interface VuuRpcEditSuccess {
  action: unknown;
  type: "VP_EDIT_RPC_RESPONSE";
  rpcName: "VP_EDIT_SUBMIT_FORM_RPC";
  vpId: string;
}
export interface VuuRpcEditError {
  error: string;
  rpcName: string;
  type: "VP_EDIT_RPC_REJECT";
  vpId: string;
}

export interface VuuRpcEditCellRequest {
  rowKey: string;
  type: "VP_EDIT_CELL_RPC";
  field: string;
  value: VuuRowDataItemType;
  vpId: string;
}
export interface VuuRpcEditUpdateRowRequest {
  rowKey: string;
  type: "VP_EDIT_ROW_RPC";
  row: VuuDataRow;
  vpId: string;
}

export declare type VuuDataRowDto = { [key: string]: VuuRowDataItemType };
export interface VuuRpcEditAddRowRequest {
  rowKey: string;
  type: "VP_EDIT_ADD_ROW_RPC";
  data: VuuDataRowDto;
  vpId: string;
}
export interface VuuRpcEditDeleteRowRequest {
  rowKey: string;
  type: "VP_EDIT_DELETE_ROW_RPC";
  vpId: string;
}
export interface VuuRpcEditCommitRequest {
  type: "VP_EDIT_SUBMIT_FORM_RPC";
  vpId: string;
}

export declare type VuuRpcEditAction = {
  error?: string;
  type: "VP_EDIT_SUCCESS";
};

export declare type VuuRpcAction =
  | VuuRpcViewportAction
  | VuuRpcMenuAction
  | VuuRpcEditAction;

export declare type VuuRpcViewportAction = {
  key?: string;
  msg?: string;
  type: "VP_RPC_FAILURE" | "VP_RPC_SUCCESS" | "VP_CREATE_SUCCESS";
};

export declare type VuuRpcMenuAction =
  | OpenDialogAction
  | CloseDialogAction
  | NoAction
  | ShowNotificationAction
  | VuuRpcEditAction;

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

export declare type VuuRowDataItemType = string | number | boolean;

export declare type VuuGroupDepth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export declare type VuuGroupExpanded = true | false;
export declare type VuuGroupPath = string;
export declare type VuuGroupLeaf = true | false;
export declare type VuuGroupLabel = string;
export declare type VuuGroupCount = number;

export declare type VuuGroupDataRow = [
  VuuGroupDepth,
  VuuGroupExpanded,
  VuuGroupPath,
  VuuGroupLeaf,
  VuuGroupLabel,
  VuuGroupCount,
  ...data: VuuRowDataItemType[],
];

export declare type VuuDataRow = VuuRowDataItemType[];

export declare type VuuRow<
  T extends VuuDataRow | VuuGroupDataRow = VuuDataRow | VuuGroupDataRow,
> = {
  data: T;
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

/**
 * LinkDescriptor with label is not strictly part of the Vuu Protocol
 *
 * The Label is added by client code, if user has assigned a custom
 * Title to component bound to viewport.
 * The parentClientVpId is also added by client. This is needed as the
 * client vpId persists across sessions, whereas the server vpId does
 * not.
 */
export declare type LinkDescriptorWithLabel = VuuLinkDescriptor & {
  label?: string;
  parentClientVpId: string;
};

export declare type VuuColumns = string[];
export declare type VuuGroupBy = string[];
export interface ServerToClientHeartBeat {
  type: "HB";
  ts: number;
}

export declare type VuuTableList = Pick<VuuTableListResponse, "tables">;

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

export interface OpenComponentInDialogAction extends OpenDialogAction {
  renderComponent: string;
}

export interface NoAction {
  type: "NO_ACTION";
}
export interface CloseDialogAction {
  type: "CLOSE_DIALOG_ACTION";
}
