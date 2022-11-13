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
  VuuTable,
} from "../../vuu-protocol-types";
import { Filter } from "@finos/vuu-utils";

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

export interface DataSourceAggregateMessage
  extends MessageWithClientViewportId {
  aggregations: VuuAggregation[];
  type: "aggregate";
}
export interface VuuUIMessageInDisabled extends MessageWithClientViewportId {
  type: "disabled";
}
export interface VuuUIMessageInEnabled extends MessageWithClientViewportId {
  type: "enabled";
}

export interface DataSourceFilterMessage extends MessageWithClientViewportId {
  type: "filter";
  filter: any;
  filterQuery: any;
}

export interface DataSourceGroupByMessage extends MessageWithClientViewportId {
  type: "groupBy";
  groupBy: VuuGroupBy | null;
}

export interface DataSourceSortMessage extends MessageWithClientViewportId {
  type: "sort";
  sort: VuuSort;
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
  | VuuUIMessageInDisabled
  | VuuUIMessageInEnabled
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
  "CREATE_VISUAL_LINK_SUCCESS",
  "disabled",
  "enabled",
  "filter",
  "groupBy",
  "REMOVE_VISUAL_LINK_SUCCESS",
  "sort",
  "subscribed",
  "viewport-update",
  "VIEW_PORT_MENUS_RESP",
  "VP_VISUAL_LINKS_RESP",
];

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
  aggregations?: any;
  range?: any;
  sort?: any;
  groupBy?: any;
  filter?: Filter;
  filterQuery?: string;
}

export type SubscribeCallback = (message: DataSourceCallbackMessage) => void;

export interface DataSource {
  setRange: (from: number, to: number) => void;
  subscribe: (
    props: SubscribeProps,
    callback: SubscribeCallback
  ) => Promise<void>;
  unsubscribe: () => void;
}
