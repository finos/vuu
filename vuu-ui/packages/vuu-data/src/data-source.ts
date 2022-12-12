import {
  VuuAggregation,
  VuuColumns,
  VuuFilter,
  VuuGroupBy,
  VuuLink,
  VuuMenu,
  VuuRange,
  VuuRowDataItemType,
  VuuSort,
  VuuSortCol,
  VuuTable,
} from "../../vuu-protocol-types";
import { Filter } from "@vuu-ui/vuu-filters";
import { IEventEmitter } from "@vuu-ui/vuu-utils/src/event-emitter";
import {
  ColumnDescriptor,
  KeyedColumnDescriptor,
} from "@vuu-ui/vuu-datagrid/src/grid-model";

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
export interface DataSourceDataMessage extends MessageWithClientViewportId {
  rows?: DataSourceRow[];
  size?: number;
  type: "viewport-update";
}

// GridModelActions
export interface DataSourceAggregateMessage
  extends MessageWithClientViewportId {
  aggregations: VuuAggregation[];
  type: "aggregate";
}

export interface DataSourceSortMessage extends MessageWithClientViewportId {
  type: "sort";
  sort: VuuSort;
}
export interface DataSourceGroupByMessage extends MessageWithClientViewportId {
  type: "groupBy";
  groupBy: VuuGroupBy | undefined;
}

export interface DataSourceFilterMessage extends MessageWithClientViewportId {
  type: "filter";
  filter: Filter;
  filterQuery: string;
}

export interface DataSourceDisabledMessage extends MessageWithClientViewportId {
  type: "disabled";
}
export interface DataSourceEnabledMessage extends MessageWithClientViewportId {
  type: "enabled";
}

export interface DataSourceFilterMessage extends MessageWithClientViewportId {
  type: "filter";
  filter: Filter;
  filterQuery: string;
}

export interface DataSourceSubscribedMessage
  extends MessageWithClientViewportId,
    MessageWithClientViewportId {
  aggregations: VuuAggregation[];
  columns: VuuColumns;
  filter?: Filter;
  filterSpec: VuuFilter;
  groupBy: VuuGroupBy;
  range: VuuRange;
  type: "subscribed";
}

export interface DataSourceMenusMessage extends MessageWithClientViewportId {
  type: "VIEW_PORT_MENUS_RESP";
  menu: VuuMenu;
}

export interface DataSourceVisualLinksMessage
  extends MessageWithClientViewportId {
  type: "VP_VISUAL_LINKS_RESP";
  links: VuuLink[];
}

export interface DataSourceVisualLinkCreatedMessage
  extends MessageWithClientViewportId {
  colName: string;
  parentViewportId: string;
  parentColName: string;
  type: "CREATE_VISUAL_LINK_SUCCESS";
}

export interface DataSourceVisualLinkRemovedMessage {
  clientViewportId: string;
  type: "REMOVE_VISUAL_LINK_SUCCESS";
}

export type DataSourceCallbackMessage =
  | DataSourceAggregateMessage
  | DataSourceDataMessage
  | DataSourceDisabledMessage
  | DataSourceEnabledMessage
  | DataSourceFilterMessage
  | DataSourceGroupByMessage
  | DataSourceMenusMessage
  | DataSourceSortMessage
  | DataSourceSubscribedMessage
  | DataSourceVisualLinkCreatedMessage
  | DataSourceVisualLinkRemovedMessage
  | DataSourceVisualLinksMessage;

const datasourceMessages = [
  "aggregate",
  "disabled",
  "enabled",
  "filter",
  "groupBy",
  "sort",
  "subscribed",
  "viewport-update",
  "CREATE_VISUAL_LINK_SUCCESS",
  "REMOVE_VISUAL_LINK_SUCCESS",
  "VIEW_PORT_MENUS_RESP",
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

export interface DataSourceProps {
  bufferSize?: number;
  table: VuuTable;
  aggregations?: VuuAggregation[];
  columns: string[];
  filter?: Filter;
  filterQuery?: string;
  group?: VuuGroupBy;
  sort?: VuuSort;
  configUrl?: any;
  serverUrl?: string;
  viewport?: string;
  "visual-link"?: any;
}

export interface SubscribeProps {
  viewport?: string;
  table?: VuuTable;
  columns?: string[];
  aggregations?: VuuAggregation[];
  range?: VuuRange;
  sort?: VuuSortCol[];
  groupBy?: VuuGroupBy;
  filter?: Filter;
  filterQuery?: string;
  title?: string;
}

export type SubscribeCallback = (message: DataSourceCallbackMessage) => void;

export interface DataSource extends IEventEmitter {
  aggregate: (aggregations: VuuAggregation[]) => void;
  closeTreeNode: (key: string) => void;
  filter: (filter: Filter | undefined, filterQuery: string) => void;
  group: (groupBy: VuuGroupBy) => void;
  openTreeNode: (key: string) => void;
  rowCount: number | undefined;
  select: (selected: number[]) => void;
  setRange: (from: number, to: number) => void;
  sort: (sort: VuuSort) => void;
  subscribe: (
    props: SubscribeProps,
    callback: SubscribeCallback
  ) => Promise<void>;
  unsubscribe: () => void;
  viewport?: string;
}
