import {
  VuuAggregation,
  VuuFilter,
  VuuGroupBy,
  VuuRowDataItemType,
  VuuSort,
  VuuTable,
} from "@vuu-ui/data-types";

type RowIndex = number;
type RenderKey = string;
type IsLeaf = boolean;
type IsExpanded = boolean;
type Depth = number;
type ChildCount = number;
type RowKey = string;
type IsSelected = boolean;

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

export type DataSourceDataMessage = {
  rows?: DataSourceRow[];
  size?: number;
  type: "viewport-update";
};

export type DataSourceSubscribedMessage = {
  type: "subscribed";
};

export type DataSourceMenusMessage = {
  type: "menus";
};

export type DataSourceCallbackMessage =
  | DataSourceDataMessage
  | DataSourceSubscribedMessage;

export interface DataSourceProps {
  bufferSize?: number;
  table: VuuTable;
  aggregations?: VuuAggregation[];
  columns: string[];
  filter?: VuuFilter;
  filterQuery?: any;
  group?: VuuGroupBy;
  sort?: VuuSort;
  configUrl?: any;
  serverUrl: string;
  viewport?: string;
  "visual-link"?: any;
}

export interface SubscribeProps {
  viewport?: string;
  table?: VuuTable;
  columns?: any;
  aggregations?: any;
  range?: any;
  sort?: any;
  groupBy?: any;
  filter?: any;
  filterQuery?: any;
}

export type SubscribeCallback = (message: DataSourceCallbackMessage) => void;

export interface DataSource {
  setRange: (from: number, to: number) => void;
  subscribe: (
    props: SubscribeProps,
    callback: SubscribeCallback
  ) => Promise<any>;
}
