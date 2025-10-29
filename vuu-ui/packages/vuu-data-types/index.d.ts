import type {
  DataSourceFilter,
  MenuRpcResponse,
  Selection,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import type { Filter } from "@vuu-ui/vuu-filter-types";
import type {
  LinkDescriptorWithLabel,
  NoAction,
  OpenDialogAction,
  VuuAggregation,
  VuuColumnDataType,
  VuuColumns,
  VuuDataRowDto,
  VuuFilter,
  VuuGroupBy,
  VuuLinkDescriptor,
  VuuMenu,
  VuuRange,
  VuuRowDataItemType,
  VuuRpcViewportResponse,
  VuuSort,
  VuuTable,
  VuuRpcServiceRequest,
  VuuRpcMenuRequest,
  VuuRpcViewportRequest,
  VuuCreateVisualLink,
  VuuRemoveVisualLink,
  VuuTableList,
  VuuRpcEditRequest,
  VuuRpcEditResponse,
  VuuLoginSuccessResponse,
  VuuLoginFailResponse,
  SelectRequest,
  SelectResponse,
  SelectSuccessWithRowCount,
} from "@vuu-ui/vuu-protocol-types";
import type {
  DataSourceConfigChanges,
  IEventEmitter,
  Range,
} from "@vuu-ui/vuu-utils";
import type {
  DataSourceFilter,
  MenuRpcResponse,
  Selection,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import type {
  VuuTableListRequest,
  VuuTableMetaRequest,
} from "@vuu-ui/vuu-protocol-types";
import {
  ColumnDescriptor,
  DataValueTypeDescriptor,
} from "@vuu-ui/vuu-table-types";
import { PostMessageToClientCallback } from "@vuu-ui/vuu-data-remote";
import type { DataSourceConfigChanges, IEventEmitter } from "@vuu-ui/vuu-utils";

export declare type DataValueValidationSuccessResult = {
  ok: true;
};
export declare type DataValueValidationFailResult = {
  ok: false;
  messages: string[];
};
export declare type DataValueValidationResult =
  | DataValueValidationSuccessResult
  | DataValueValidationFailResult;

export declare type DataValueValidationChecker = (
  value?: VuuRowDataItemType,
  phase: EditPhase | "*",
) => DataValueValidationResult;

export declare type EditRuleValidationSuccessResult = {
  ok: true;
};

export declare type EditRuleValidationFailResult = {
  ok: false;
  message: string;
};

export declare type EditRuleValidationResult =
  | EditRuleValidationSuccessResult
  | EditRuleValidationFailResult;

/**
 * EditRuleValidator is a function registered with component registry. It can then
 * be referenced in editRules applied to table columns or form fields.
 *
 * @returns value to indicate whether validation rule passed:
 * - true value passes validation
 * - false value fails validation
 * - string value fails validation, this message described failure
 */
export declare type EditRuleValidator = (
  editRule: EditValidationRule,
  value?: VuuRowDataItemType,
) => EditRuleValidationResult;

export declare type EditPhase = "commit" | "change";

/**
 * Edit validation functions (EditRuleValidator) must be registered with the component registry.
 * They can then be referenced by name from EditValidationRule(s)
 */
export interface EditValidationRule {
  /**
   * when is the rule applied
   * - 'commit' - when user commits change, e.g. by pressent ENTER (on an input), or TAB
   * - 'change' - for a text input, on every keystroke
   * */
  phase?: EditPhase;
  name: string;
  message?: string;
  value?: string;
}

export declare type DataValueTypeSimple =
  | "string"
  | "number"
  | "boolean"
  | "json"
  | DateTimeDataValueTypeSimple
  | TimeDataValueTypeSimple
  | "checkbox";

export declare type DataValueType =
  | DataValueTypeSimple
  | DataValueTypeDescriptor;

export declare type TimeDataValueTypeSimple = "time";
export declare type DateTimeDataValueTypeSimple = "date/time";

export declare type DateTimeDataValueType =
  | DateTimeColumnTypeSimple
  | (Omit<DataValueTypeDescriptor, "name"> & {
      name: DateTimeColumnTypeSimple;
    });

export declare type BulkEdit = "bulk" | false | "read-only";

export interface DataValueDescriptor {
  editable?: boolean;
  /**
   There are three values for editableBulk. 
    - false user will not see these values when applying a bulk edit. 
    - "bulk" user can edit these values when applying a bulk edit. 
    - "read-only" user will see these values when applying a bulk edit, but not be allowed to edit them.
  */
  editableBulk?: BulkEdit;
  /** Display label for form fields, table column headings etc.  */
  label?: string;
  /** unique name for this data value */
  name: string;
  /** The type defined on server for this data value */
  serverDataType?: VuuColumnDataType;
  /** Type hints for the UI that supplement the serverDataType */
  type?: DataValueType;
}

export declare type DateTimeDataValueDescriptor = Omit<
  DataValueDescriptor,
  "type"
> & {
  type: DateTimeDataValueType;
};

export declare type TimeDataValueDescriptor = Omit<
  DataValueDescriptor,
  "type"
> & {
  type: TimeDataValueType;
};

export interface DataSourceFilter extends VuuFilter {
  filterStruct?: Filter;
}

export interface NamedDataSourceFilter extends DataSourceFilter {
  id?: string;
  name?: string;
}

type RowIndex = number;
type RenderKey = number;
type IsLeaf = boolean;
type IsExpanded = boolean;
type Depth = number;
type ChildCount = number;
type RowKey = string;
export declare type IsSelected = number;
type Timestamp = number;
type IsNew = boolean;

export declare type DataSourceRow = [
  RowIndex,
  RenderKey,
  IsLeaf,
  IsExpanded,
  Depth,
  ChildCount,
  RowKey,
  IsSelected,
  Timestamp,
  IsNew,
  ...VuuRowDataItemType[],
];

export declare type DataSourceRowObject = {
  index: number;
  key: string;
  isGroupRow: boolean;
  isSelected: boolean;
  data: VuuDataRowDto;
};

export declare type DataSourceRowPredicate = (row: DataSourceRow) => boolean;

export interface MessageWithClientViewportId {
  clientViewportId: string;
}

export interface DataSourceAggregateMessage
  extends MessageWithClientViewportId {
  aggregations: VuuAggregation[];
  type: "aggregate";
}

export declare type DataUpdateMode = "batch" | "update" | "size-only";

export interface DataSourceClearMessage extends MessageWithClientViewportId {
  type: "viewport-clear";
}
export interface DataSourceDataMessage extends MessageWithClientViewportId {
  mode: DataUpdateMode;
  /**
   * this is needed by the ArrayDataSource, biut not currently used by VuuDataSource.
   * Suspect it will be valuable in any DtaSOurce and should eventually be made a
   * required field.
   */
  range?: VuuRange;
  rows?: DataSourceRow[];
  size?: number;
  type: "viewport-update";
}

export interface DataSourceDataSizeMessage extends MessageWithClientViewportId {
  mode: "size-only";
  size: number;
  type: "viewport-update";
}

export interface DataSourceDisabledMessage extends MessageWithClientViewportId {
  type: "disabled";
}

export interface DataSourceEnabledMessage extends MessageWithClientViewportId {
  type: "enabled";
}
export interface DataSourceFrozenMessage extends MessageWithClientViewportId {
  type: "frozen";
}

export interface DataSourceUnfrozenMessage extends MessageWithClientViewportId {
  type: "unfrozen";
}

export interface DataSourceColumnsMessage extends MessageWithClientViewportId {
  type: "columns";
  columns: VuuColumns;
}
export interface DataSourceFilterMessage extends MessageWithClientViewportId {
  type: "filter";
  filter: DataSourceFilter;
}
export interface DataSourceGroupByMessage extends MessageWithClientViewportId {
  type: "groupBy";
  groupBy: VuuGroupBy | undefined;
}

export interface DataSourceSetConfigMessage
  extends MessageWithClientViewportId {
  type: "config";
  config: WithFullConfig;
}

export interface DataSourceDebounceRequest extends MessageWithClientViewportId {
  type: "debounce-begin";
}

export interface DataSourceMenusMessage extends MessageWithClientViewportId {
  type: "vuu-menu";
  menu: VuuMenu;
}

export interface DataSourceSortMessage extends MessageWithClientViewportId {
  type: "sort";
  sort: VuuSort;
}

export interface DataSourceSubscribedMessage
  extends MessageWithClientViewportId {
  aggregations: VuuAggregation[];
  columns: VuuColumns;
  filterSpec: DataSourceFilter;
  groupBy: VuuGroupBy;
  range: VuuRange;
  sort: VuuSort;
  tableSchema: Readonly<TableSchema>;
  type: "subscribed";
}

export interface DataSourceVisualLinkCreatedMessage
  extends MessageWithClientViewportId {
  colName: string;
  parentViewportId: string;
  parentColName: string;
  type: "vuu-link-created";
}

export interface DataSourceVisualLinkRemovedMessage
  extends MessageWithClientViewportId {
  type: "vuu-link-removed";
}

export interface DataSourceVisualLinksMessage
  extends MessageWithClientViewportId {
  type: "vuu-links";
  links: VuuLinkDescriptor[];
}

export declare type VuuFeatureMessage =
  | DataSourceMenusMessage
  | DataSourceVisualLinksMessage;

export declare type DataSourceConfigMessage =
  | DataSourceAggregateMessage
  | DataSourceColumnsMessage
  | DataSourceFilterMessage
  | DataSourceGroupByMessage
  | DataSourceSortMessage
  | DataSourceSetConfigMessage;

/**
 * Messages which are routed back to the DataSource
 */
export declare type DataSourceCallbackMessage =
  | DataSourceConfigMessage
  | DataSourceColumnsMessage
  | DataSourceDataMessage
  | DataSourceClearMessage
  | DataSourceDebounceRequest
  | DataSourceDisabledMessage
  | DataSourceEnabledMessage
  | DataSourceFrozenMessage
  | DataSourceUnfrozenMessage
  | DataSourceMenusMessage
  | DataSourceSubscribedMessage
  | DataSourceVisualLinkCreatedMessage
  | DataSourceVisualLinkRemovedMessage
  | DataSourceVisualLinksMessage
  | WithRequestId<SelectSuccessWithRowCount>;

export declare type ConfigChangeColumnsMessage = {
  type: "columns";
  columns?: ColumnDescriptor[];
};

export declare type ConfigChangeMessage =
  | ConfigChangeColumnsMessage
  | DataSourceAggregateMessage
  | DataSourceFilterMessage
  | DataSourceGroupByMessage
  | DataSourceSortMessage
  | DataSourceVisualLinkCreatedMessage
  | DataSourceVisualLinkRemovedMessage;

export declare type ConfigChangeHandler = (msg: ConfigChangeMessage) => void;

export declare type SchemaColumn = {
  name: string;
  serverDataType: VuuColumnDataType;
};

/**
 * session will be present for session tables only, in which case the table
 * name represents the 'archetype' table name.
 */
export declare type TableSchemaTable = VuuTable & {
  session?: string;
};

export declare type TableSchema = {
  columns: SchemaColumn[];
  key: string;
  table: TableSchemaTable;
};

/**
 * Described the configuration values that should typically be
 * persisted across sessions.
 */
export interface WithFullConfig {
  readonly aggregations: VuuAggregation[];
  readonly columns: VuuColumns;
  readonly filterSpec: DataSourceFilter;
  readonly groupBy: VuuGroupBy;
  readonly sort: VuuSort;
}

export interface DataSourceConfig extends Partial<WithFullConfig> {
  visualLink?: LinkDescriptorWithLabel;
}

export interface WithGroupBy extends DataSourceConfig {
  groupBy: VuuGroupBy;
}
export interface WithFilter extends DataSourceConfig {
  filterSpec: DataSourceFilter;
}
export interface WithSort extends DataSourceConfig {
  sort: VuuSort;
}

export interface DataSourceConstructorProps
  extends WithBaseFilter<DataSourceConfig> {
  /**
   * If provided, these column names will always be included in subscription, even
   * if not directly requested, via columns property. Useful where columns may not
   * be required/wanted in table, but are required for other purposes, e.g to support
   * filters on columns not in rendered table.
   */
  autosubscribeColumns?: string[];
  bufferSize?: number;
  table: VuuTable;
  title?: string;
  url?: string;
  viewport?: string;
}

export interface DataSourceSubscribeProps
  extends Partial<WithBaseFilter<WithFullConfig>> {
  viewport?: string;
  range?: Range;
  revealSelected?: boolean;
  selectedKeyValues?: string[];
  title?: string;
}

export declare type DataSourceSubscribeCallback = (
  message: DataSourceCallbackMessage,
) => void;
export declare type OptimizeStrategy = "none" | "throttle" | "debounce";

export declare type DataSourceEventHandler = (viewportId: string) => void;
export declare type RowSelectionEventHandler = (
  selectedRowCount: number,
) => void;

export type DataSourceConfigChangeHandler = (
  config: WithBaseFilter<WithFullConfig>,
  range: Range,
  confirmed?: boolean,
  configChanges?: DataSourceConfigChanges,
) => void;

export declare type DataSourceEvents = {
  config: DataSourceConfigChangeHandler;
  freeze: (isFrozen: boolean, freezeTimeStamp: number) => void;
  optimize: (optimize: OptimizeStrategy) => void;
  "page-count": (pageCount: number) => void;
  range: (range: Range) => void;
  resize: (size: number) => void;
  "row-selection": RowSelectionEventHandler;
  subscribed: (subscription: DataSourceSubscribedMessage) => void;
  unsubscribed: DataSourceEventHandler;
  suspended: DataSourceEventHandler;
  resumed: DataSourceEventHandler;
  disabled: DataSourceEventHandler;
  enabled: DataSourceEventHandler;
  "title-changed": (id: string, title: string) => void;
  "visual-link-created": (message: DataSourceVisualLinkCreatedMessage) => void;
  "visual-link-removed": () => void;
};

/**
 * return Promise<true> indicates success
 * return Promise<errorMessage> indicates failure
 */
export declare type DataSourceEditHandler = (
  rowKey: string,
  columnName: string,
  value: VuuRowDataItemType,
) => Promise<true | string>;

export declare type DataSourceDeleteHandler = (
  key: string,
) => Promise<true | string>;
export declare type DataSourceInsertHandler = (
  key: string,
  data: VuuDataRowDto,
) => Promise<true | string>;

export declare type RpcResponse =
  | MenuRpcResponse
  | VuuUIMessageInRPCEditReject
  | VuuUIMessageInRPCEditResponse
  | ViewportRpcResponse;

export declare type RpcResponseHandler = (
  response: Omit<VuuRpcResponse, "vpId">,
) => boolean;

export declare type RowSearchPredicate = (row: DataSourceRow) => boolean;

export declare type DataSourceStatus =
  | "disabled"
  | "disabling"
  | "enabled"
  | "enabling"
  | "initialising"
  | "subscribing"
  | "subscribed"
  | "suspended"
  | "unsubscribed";

/**
 * Given a Vuu Table and column, returns a list of sorted distinct values
 * for that column. Only first 10 values will ever be returned. User must
 * type additional text to narrow down values.
 */
export declare type SuggestionFetcher = (
  params: TypeaheadParams,
) => Promise<string[] | false>;
export type SuggestionProvider = () => SuggestionFetcher;

export interface TypeaheadSuggestionProvider {
  getTypeaheadSuggestions: (
    columnName: string,
    pattern?: string,
  ) => Promise<string[]>;
}

export declare type WithBaseFilter<T> = T & {
  baseFilterSpec?: DataSourceFilter;
};

export interface DataSource
  extends IEventEmitter<DataSourceEvents>,
    Partial<TypeaheadSuggestionProvider> {
  aggregations: VuuAggregation[];
  applyEdit: DataSourceEditHandler;
  closeTreeNode: (keyOrIndex: string | number, cascade?: boolean) => void;
  columns: string[];
  config: WithBaseFilter<WithFullConfig>;
  /**
   * Applies a time filter to the viewport such that no new records created after the
   * freeze are sent to client. This makes client's view stable, even when large numbers
   * of new records are being created. The price is that view becomes stale. DataSource
   * implementation is not required to support this functionality.
   */
  freeze?: () => void;
  /**
   * Removes the 'freeze' filter. See 'freeze' above.
   */
  unfreeze?: () => void;
  /**
   * see 'freeze' above. true if 'freeze' has previoulsy been called.
   */
  isFrozen?: boolean;
  /**
   * see 'freeze' above. If frozen, the time at which freeze was applied.
   */
  freezeTimestamp?: number | undefined;
  select?: (selectRequest: Omit<SelectRequest, "vpId">) => void;

  status: DataSourceStatus;
  /**
   *
   * Similar to disable but intended for pauses of very short duration (default is 3 seconds). Although
   * the dataSource will stop sending messages until resumed, it will not disconnect from a  remote server.
   * It will preserve subscription to the remote server and continue to apply updates to cached data. It
   * just won't send updates through to the UI thread (until resumed). Useful in edge cases such as where a
   * component is dragged to a new location. When dropped, the component will be unmounted and very quickly
   * remounted by React. For the duration of this operation, we suspend updates . Updating an unmounted
   * React component would cause a React error.
   * If an suspend is requested and not resumed within 3 seconds, it will automatically be promoted to a disable.,
   */
  suspend?: () => void;
  resume?: (callback?: DataSourceSubscribeCallback) => void;

  deleteRow?: DataSourceDeleteHandler;
  /**
   * create a DataSource on a session table. The concrete DataSource implementation that
   * implements this method will always return a session table datasource of the same concrete type.
   * @param table the sessionTable  (module and table name)
   * @returns
   */
  createSessionDataSource?: (table: VuuTable) => DataSource;
  /**
   * For a dataSource that has been previously disabled and is currently in disabled state , this will restore
   * the subscription to active status. Fresh data will be dispatched to client. The enable call optionally
   * accepts the same subscribe callback as subscribe. This allows a completely new instance of a component to
   * assume ownership of a subscription and receive all messages.
   * Should emit an enabled event
   */
  enable?: (callback?: DataSourceSubscribeCallback) => void;
  /**
   * Disables this subscription. A datasource will send no further messages until re-enabled. Example usage
   * might be for a component displayed within a set of Tabs. If user switches to another tab, the dataSource
   * of the component that is no longer visible can be disabled until it is made visible again.
   * Should emit a disabled event
   */
  disable?: () => void;
  baseFilter?: DataSourceFilter;
  filter: DataSourceFilter;

  /**
   * Only implemented on JSON DataSource
   * @param depth
   * @param visibleOnly
   * @returns
   */
  getChildRows?: (rowKey: string) => DataSourceRow[];

  getRowAtIndex?: (rowIndex: number) => DataSourceRow | undefined;
  /**
   * Only implemented on JSON DataSource
   * @param depth
   * @param visibleOnly
   * @returns
   */
  getRowsAtDepth?: (depth: number, visibleOnly?: boolean) => DataSourceRow[];
  groupBy?: VuuGroupBy;
  insertRow?: DataSourceInsertHandler;
  links?: LinkDescriptorWithLabel[];
  menu?: VuuMenu;
  editRpcCall: (
    rpcRequest: Omit<VuuRpcEditRequest, "vpId">,
  ) => Promise<VuuRpcEditResponse>;
  menuRpcCall: (
    rpcRequest: Omit<VuuRpcMenuRequest, "vpId">,
  ) => Promise<VuuRpcMenuResponse>;
  rpcRequest?: (
    request: Omit<VuuRpcServiceRequest, "context">,
  ) => Promise<RpcResultSuccess | RpcResultError>;
  openTreeNode: (keyOrIndex: string | number) => void;
  range: Range;
  readonly selectedRowsCount: number;
  sendBroadcastMessage?: (message: DataSourceBroadcastMessage) => void;
  readonly size: number;
  sort: VuuSort;
  subscribe: (
    props: DataSourceSubscribeProps,
    callback: DataSourceSubscribeCallback,
  ) => Promise<void>;
  table?: VuuTable;
  readonly tableSchema?: TableSchema;
  /**
   * We allow a title because a context menu action can reference a target table, e.g. as a Visual Link target.
   * Users can edit titles on components. If so, and this is a table component, we will display this title in
   * the context menu rather than the underlying table name (which may not be unique within the layout)
   */
  title: string;
  unsubscribe: () => void;
  viewport?: string;
  visualLink?: LinkDescriptorWithLabel;
}

export interface MenuRpcResponse<
  TAction extends MenuRpcAction = MenuRpcAction,
> {
  action: TAction;
  error?: string;
  requestId: string;
  rpcName: string;
  tableAlreadyOpen?: boolean;
  type: "VIEW_PORT_MENU_RESP";
}

export interface OpenDialogActionWithSchema extends OpenDialogAction {
  tableSchema?: TableSchema;
}

export declare type MenuRpcAction =
  | OpenDialogActionWithSchema
  | NoAction
  | ShowToastAction;

export interface ConnectionQualityMetrics {
  type: "connection-metrics";
  messagesLength: number;
}

export interface ServerProxySubscribeMessage extends WithFullConfig {
  bufferSize?: number;
  range: VuuRange;
  selectedIndexValues?: Selection;
  table: VuuTable;
  title?: string;
  viewport: string;
  visualLink?: LinkDescriptorWithLabel;
}

// export declare type VuuUIMessageInConnectionStatus = {
//   type: 'connection-status';
// };

export declare type VuuUIMessageInConnected = {
  type: "connected";
};

export declare type VuuUIMessageInConnectionFailed = {
  type: "connection-failed";
  reason: string;
};

export declare type VuuUIMessageInWorkerReady = {
  type: "ready";
};

export interface ViewportMessageIn {
  clientViewportId: string;
}

// TODO use generic to type result
export interface VuuUIMessageInRPC {
  action: unknown;
  error?: null | unknown;
  result: unknown;
  requestId: string;
  type: "RPC_RESPONSE";
}

export interface VuuUIMessageInRPCEditReject {
  error: string;
  requestId?: string;
  type: "VP_EDIT_RPC_REJECT";
}

export interface VuuUIMessageInRPCEditResponse {
  action: unknown;
  requestId: string;
  rpcName: string;
  type: "VP_EDIT_RPC_RESPONSE";
}

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
export interface ViewportRpcResponse {
  action: VuuRpcViewportResponse["action"] & {
    // for SessionTable editing, we inject the schema after receiving server message
    // and before forwarding to UI
    tableSchema?: TableSchema;
  };
  requestId: string;
  rpcName?: string;
  type: "VIEW_PORT_RPC_RESPONSE";
}
export interface MenuRpcReject extends ViewportMessageIn {
  error?: string;
  requestId: string;
  rpcName?: string;
  type: "VIEW_PORT_MENU_REJ";
}

export interface VuuUIMessageInMenuRej {
  error: string;
  requestId: string;
  rpcName: string;
  type: "VIEW_PORT_MENU_REJ";
}

export declare type VuuUiMessageInRequestResponse =
  | VuuUIMessageInMenuRej
  | MenuRpcResponse
  | MenuRpcReject
  | VuuUIMessageInRPC
  | VuuUIMessageInRPCEditReject
  | VuuUIMessageInRPCEditResponse
  | ViewportRpcResponse
  | VuuUIMessageInTableList
  | VuuUIMessageInTableMeta;

export declare type VuuUIMessageIn =
  | VuuLoginSuccessResponse
  | VuuLoginFailResponse
  | VuuUiMessageInRequestResponse
  | VuuUIMessageInConnected
  | VuuUIMessageInConnectionFailed
  | VuuUIMessageInWorkerReady;

export declare type WebSocketProtocol = string | string[] | undefined;

export interface VuuUIMessageOutConnect {
  protocol?: WebSocketProtocol;
  type: "connect";
  token: string;
  url: string;
  username?: string;
  retryLimitDisconnect?: number;
  retryLimitStartup?: number;
}

export interface VuuUIMessageOutDisconnect {
  type: "disconnect";
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
export interface VuuUIMessageOutCloseTreeNode extends ViewportMessageOut {
  index?: number;
  key?: string;
  type: "closeTreeNode";
}
export interface VuuUIMessageOutRemoveLink extends ViewportMessageOut {
  type: "removeLink";
}
export interface VuuUIMessageOutSetTitle extends ViewportMessageOut {
  title: string;
  type: "setTitle";
}

export interface VuuUIMessageOutFreeze extends ViewportMessageOut {
  type: "FREEZE_VP";
}
export interface VuuUIMessageOutUnfreeze extends ViewportMessageOut {
  type: "UNFREEZE_VP";
}
export interface VuuUIMessageOutDisable extends ViewportMessageOut {
  type: "disable";
}
export interface VuuUIMessageOutEnable extends ViewportMessageOut {
  type: "enable";
}
export interface VuuUIMessageOutOpenTreeNode extends ViewportMessageOut {
  index?: number;
  key?: string;
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

export interface VuuUIMessageOutSuspend extends ViewportMessageOut {
  type: "suspend";
}

export interface VuuUIMessageOutConfig extends ViewportMessageOut {
  config: WithFullConfig;
  type: "config";
}

export declare type VuuUIMessageOutViewport =
  | VuuUIMessageOutCloseTreeNode
  | VuuUIMessageOutConfig
  | VuuUIMessageOutFreeze
  | VuuUIMessageOutUnfreeze
  | VuuUIMessageOutDisable
  | VuuUIMessageOutEnable
  | VuuUIMessageOutOpenTreeNode
  | VuuUIMessageOutRemoveLink
  | VuuUIMessageOutResume
  | VuuUIMessageOutSetTitle
  | VuuUIMessageOutSuspend
  | VuuUIMessageOutViewRange;

export declare type WithRequestId<T> = T & { requestId: string };

export declare type VuuUIMessageOut =
  | VuuUIMessageOutConnect
  | VuuUIMessageOutDisconnect
  | VuuUIMessageOutSubscribe
  | VuuUIMessageOutUnsubscribe
  | VuuUIMessageOutViewport
  | WithRequestId<VuuTableListRequest | VuuTableMetaRequest>
  | SelectRequest;

export type ConnectOptions = {
  url: string;
  token: string;
  username: string;
  protocol?: WebSocketProtocol;
  /** Max number of reconnect attempts in the event of unsuccessful websocket connection at startup */
  retryLimitStartup?: number;
  /** Max number of reconnect attempts in the event of a disconnected websocket connection */
  retryLimitDisconnect?: number;
};

export interface ServerAPI {
  destroy: (viewportId?: string) => void;
  getTableSchema: (table: VuuTable) => Promise<TableSchema>;
  getTableList: (module?: string) => Promise<VuuTableList>;
  // TODO its not really unknown
  rpcCall: <T = unknown>(
    msg:
      | VuuRpcServiceRequest
      | VuuRpcMenuRequest
      | VuuRpcViewportRequest
      | VuuCreateVisualLink
      | VuuRemoveVisualLink,
  ) => Promise<T>;
  select: (selectRequest: SelectRequest) => Promise<SelectResponse>;
  send: (message: VuuUIMessageOut) => void;
  subscribe: (
    message: ServerProxySubscribeMessage,
    callback: PostMessageToClientCallback,
  ) => void;
  unsubscribe: (viewport: string) => void;
}
