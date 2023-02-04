import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { IEventEmitter } from "@finos/vuu-utils";
import {
  LinkDescriptorWithLabel,
  VuuAggregation,
  VuuColumnDataType,
  VuuColumns,
  VuuGroupBy,
  VuuLinkDescriptor,
  VuuMenu,
  VuuMenuRpcRequest,
  VuuRange,
  VuuRowDataItemType,
  VuuSort,
  VuuTable,
} from "@finos/vuu-protocol-types";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { MenuRpcResponse } from "./vuuUIMessageTypes";

type RowIndex = number;
type RenderKey = number;
type IsLeaf = boolean;
type IsExpanded = boolean;
type Depth = number;
type ChildCount = number;
type RowKey = string;
type IsSelected = 0 | 1 | 2;

export type DataSourceRow = [
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

export type DataSourceRowPredicate = (row: DataSourceRow) => boolean;

export interface MessageWithClientViewportId {
  clientViewportId: string;
}
// GridModelActions
export interface DataSourceAggregateMessage
  extends MessageWithClientViewportId {
  aggregations: VuuAggregation[];
  type: "aggregate";
}

export interface DataSourceDataMessage extends MessageWithClientViewportId {
  rows?: DataSourceRow[];
  size?: number;
  type: "viewport-update";
}

export interface DataSourceDisabledMessage extends MessageWithClientViewportId {
  type: "disabled";
}

export interface DataSourceEnabledMessage extends MessageWithClientViewportId {
  type: "enabled";
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

export interface DataSourceMenusMessage extends MessageWithClientViewportId {
  type: "VIEW_PORT_MENUS_RESP";
  menu: VuuMenu;
}

export interface DataSourceSortMessage extends MessageWithClientViewportId {
  type: "sort";
  sort: VuuSort;
}

export type DataSourceConfigMessage =
  | DataSourceAggregateMessage
  | DataSourceColumnsMessage
  | DataSourceFilterMessage
  | DataSourceGroupByMessage
  | DataSourceSortMessage;

export interface DataSourceSubscribedMessage
  extends MessageWithClientViewportId,
    MessageWithClientViewportId {
  aggregations: VuuAggregation[];
  columns: VuuColumns;
  filter: DataSourceFilter;
  groupBy: VuuGroupBy;
  range: VuuRange;
  sort: VuuSort;
  tableMeta: { columns: string[]; dataTypes: VuuColumnDataType[] } | null;
  type: "subscribed";
}

export interface DataSourceVisualLinkCreatedMessage
  extends MessageWithClientViewportId {
  colName: string;
  parentViewportId: string;
  parentColName: string;
  type: "CREATE_VISUAL_LINK_SUCCESS";
}

export interface DataSourceVisualLinkRemovedMessage
  extends MessageWithClientViewportId {
  type: "REMOVE_VISUAL_LINK_SUCCESS";
}

export interface DataSourceVisualLinksMessage
  extends MessageWithClientViewportId {
  type: "VP_VISUAL_LINKS_RESP";
  links: VuuLinkDescriptor[];
}

export type DataSourceCallbackMessage =
  | DataSourceConfigMessage
  | DataSourceColumnsMessage
  | DataSourceDataMessage
  | DataSourceDisabledMessage
  | DataSourceEnabledMessage
  | DataSourceMenusMessage
  | DataSourceSubscribedMessage
  | DataSourceVisualLinkCreatedMessage
  | DataSourceVisualLinkRemovedMessage
  | DataSourceVisualLinksMessage;

const datasourceMessages = [
  "aggregate",
  "viewport-update",
  "columns",
  "disabled",
  "enabled",
  "filter",
  "groupBy",
  "VIEW_PORT_MENUS_RESP",
  "sort",
  "subscribed",
  "CREATE_VISUAL_LINK_SUCCESS",
  "REMOVE_VISUAL_LINK_SUCCESS",
  "VP_VISUAL_LINKS_RESP",
];

export type ConfigChangeColumnsMessage = {
  type: "columns";
  columns?: ColumnDescriptor[];
};

export type ConfigChangeMessage =
  | ConfigChangeColumnsMessage
  | DataSourceAggregateMessage
  | DataSourceFilterMessage
  | DataSourceGroupByMessage
  | DataSourceSortMessage
  | DataSourceVisualLinkCreatedMessage
  | DataSourceVisualLinkRemovedMessage;

export type ConfigChangeHandler = (msg: ConfigChangeMessage) => void;

export const shouldMessageBeRoutedToDataSource = (
  message: unknown
): message is DataSourceCallbackMessage => {
  const type = (message as DataSourceCallbackMessage).type;
  return datasourceMessages.includes(type);
};

/**
 * Described the configuration values that should typically be
 * persisted across sessions.
 */
export interface DataSourceConfig {
  aggregations?: VuuAggregation[];
  columns?: string[];
  filter?: DataSourceFilter;
  groupBy?: VuuGroupBy;
  sort?: VuuSort;
}

export interface DataSourceConstructorProps {
  bufferSize?: number;
  table: VuuTable;
  aggregations?: VuuAggregation[];
  columns?: string[];
  filter?: DataSourceFilter;
  groupBy?: VuuGroupBy;
  onConfigChange?: (config: DataSourceConfig) => void;
  sort?: VuuSort;
  title?: string;
  viewport?: string;
  "visual-link"?: DataSourceVisualLinkCreatedMessage;
}

export interface SubscribeProps {
  viewport?: string;
  columns?: string[];
  aggregations?: VuuAggregation[];
  range?: VuuRange;
  sort?: VuuSort;
  groupBy?: VuuGroupBy;
  filter?: DataSourceFilter;
  title?: string;
}

export type SubscribeCallback = (message: DataSourceCallbackMessage) => void;

export interface DataSource extends IEventEmitter {
  aggregations: VuuAggregation[];
  closeTreeNode: (key: string) => void;
  columns: string[];
  readonly config: DataSourceConfig | undefined;
  createLink: ({
    parentVpId,
    link: { fromColumn, toColumn },
  }: LinkDescriptorWithLabel) => void;
  filter: DataSourceFilter;
  groupBy: VuuGroupBy;
  menuRpcCall: (
    rpcRequest: Omit<VuuMenuRpcRequest, "vpId">
  ) => Promise<MenuRpcResponse | undefined>;
  openTreeNode: (key: string) => void;
  range: VuuRange;
  removeLink: () => void;
  rowCount: number | undefined;
  select: (selected: number[]) => void;
  readonly selectedRowsCount: number;
  readonly size: number;
  sort: VuuSort;
  subscribe: (
    props: SubscribeProps,
    callback: SubscribeCallback
  ) => Promise<void>;
  title?: string;
  unsubscribe: () => void;
  viewport?: string;
}
