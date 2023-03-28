import {
  ColumnDescriptor,
  SelectionChangeHandler,
} from "@finos/vuu-datagrid-types";
import { EventEmitter } from "@finos/vuu-utils";
import {
  ClientToServerMenuRPC,
  LinkDescriptorWithLabel,
  VuuAggregation,
  VuuColumnDataType,
  VuuColumns,
  VuuGroupBy,
  VuuLinkDescriptor,
  VuuMenu,
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

export type DataUpdateMode = "batch" | "update" | "size-only";
export interface DataSourceDataMessage extends MessageWithClientViewportId {
  mode?: DataUpdateMode;
  rows?: DataSourceRow[];
  size?: number;
  type: "viewport-update";
}

export interface DataSourceDebounceRequest extends MessageWithClientViewportId {
  type: "debounce-begin";
}

export const isSizeOnly = (
  message: DataSourceCallbackMessage
): message is DataSourceDataMessage =>
  message.type === "viewport-update" && message.mode === "size-only";

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
export interface DataSourceSetConfigMessage
  extends MessageWithClientViewportId {
  type: "config";
  config: DataSourceConfig;
}

export interface DataSourceMenusMessage extends MessageWithClientViewportId {
  type: "vuu-menu";
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
  | DataSourceSortMessage
  | DataSourceSetConfigMessage;

export const toDataSourceConfig = (
  message: DataSourceConfigMessage
): DataSourceConfig => {
  switch (message.type) {
    case "aggregate":
      return { aggregations: message.aggregations };
    case "columns":
      return { columns: message.columns };
    case "filter":
      return { filter: message.filter };
    case "groupBy":
      return { groupBy: message.groupBy };
    case "sort":
      return { sort: message.sort };
    case "config":
      return message.config;
  }
};

const exactlyTheSame = (a: unknown, b: unknown) => {
  if (a === b) {
    return true;
  } else if (a === undefined && b === undefined) {
    return true;
  } else {
    return false;
  }
};

type DataConfigPredicate = (
  config: DataSourceConfig,
  newConfig: DataSourceConfig
) => boolean;

const filterChanged: DataConfigPredicate = (c1, c2) => {
  return c1.filter?.filter !== c2.filter?.filter;
};

const sortChanged: DataConfigPredicate = ({ sort: s1 }, { sort: s2 }) => {
  if (exactlyTheSame(s1, s2)) {
    return false;
  } else if (s1 === undefined || s2 === undefined) {
    return true;
  } else if (s1?.sortDefs.length !== s2?.sortDefs.length) {
    return true;
  }
  return s1.sortDefs.some(
    ({ column, sortType }, i) =>
      column !== s2.sortDefs[i].column || sortType !== s2.sortDefs[i].sortType
  );
};
const groupByChanged: DataConfigPredicate = (
  { groupBy: g1 },
  { groupBy: g2 }
) => {
  if (exactlyTheSame(g1, g2)) {
    return false;
  } else if (g1 === undefined || g2 === undefined) {
    return true;
  } else if (g1?.length !== g2?.length) {
    return true;
  }
  return g1.some((column, i) => column !== g2?.[i]);
};
const columnsChanged: DataConfigPredicate = (
  { columns: cols1 },
  { columns: cols2 }
) => {
  if (exactlyTheSame(cols1, cols2)) {
    return false;
  } else if (cols1 === undefined || cols2 === undefined) {
    return true;
  } else if (cols1?.length !== cols2?.length) {
    return true;
  }
  return cols1.some((column, i) => column !== cols2?.[i]);
};
const aggregationsChanged: DataConfigPredicate = (
  { aggregations: agg1 },
  { aggregations: agg2 }
) => {
  if (exactlyTheSame(agg1, agg2)) {
    return false;
  } else if (agg1 === undefined || agg2 === undefined) {
    return true;
  } else if (agg1.length !== agg2.length) {
    return true;
  }
  return agg1.some(
    ({ column, aggType }, i) =>
      column !== agg2[i].column || aggType !== agg2[i].aggType
  );
};
const visualLinkChanged: DataConfigPredicate = () => {
  // TODO
  return false;
};

export const configChanged = (
  config: DataSourceConfig | undefined,
  newConfig: DataSourceConfig | undefined
) => {
  if (exactlyTheSame(config, newConfig)) {
    return false;
  }

  if (config === undefined || newConfig === undefined) {
    return true;
  }

  return (
    columnsChanged(config, newConfig) ||
    filterChanged(config, newConfig) ||
    sortChanged(config, newConfig) ||
    groupByChanged(config, newConfig) ||
    aggregationsChanged(config, newConfig) ||
    visualLinkChanged(config, newConfig)
  );
};

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

export type VuuFeatureMessage =
  | DataSourceMenusMessage
  | DataSourceVisualLinksMessage;

export type VuuFeatureInvocationMessage =
  | DataSourceVisualLinkCreatedMessage
  | DataSourceVisualLinkRemovedMessage;

export type DataSourceCallbackMessage =
  | DataSourceConfigMessage
  | DataSourceColumnsMessage
  | DataSourceDataMessage
  | DataSourceDebounceRequest
  | DataSourceDisabledMessage
  | DataSourceEnabledMessage
  | DataSourceMenusMessage
  | DataSourceSubscribedMessage
  | DataSourceVisualLinkCreatedMessage
  | DataSourceVisualLinkRemovedMessage
  | DataSourceVisualLinksMessage;

const datasourceMessages = [
  "config",
  "aggregate",
  "viewport-update",
  "columns",
  "debounce-begin",
  "disabled",
  "enabled",
  "filter",
  "groupBy",
  "vuu-link-created",
  "vuu-link-removed",
  "vuu-links",
  "vuu-menu",
  "sort",
  "subscribed",
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

export const isDataSourceConfigMessage = (
  message: DataSourceCallbackMessage
): message is DataSourceConfigMessage =>
  ["config", "aggregate", "columns", "filter", "groupBy", "sort"].includes(
    message.type
  );

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
  visualLink?: LinkDescriptorWithLabel;
}

export interface DataSourceConstructorProps extends DataSourceConfig {
  bufferSize?: number;
  table: VuuTable;
  title?: string;
  viewport?: string;
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
export type OptimizeStrategy = "none" | "throttle" | "debounce";

export type DataSourceEvents = {
  config: (config: DataSourceConfig | undefined, confirmed?: boolean) => void;
  optimize: (optimize: OptimizeStrategy) => void;
  range: (range: VuuRange) => void;
  resize: (size: number) => void;
};

export interface DataSource extends EventEmitter<DataSourceEvents> {
  aggregations: VuuAggregation[];
  closeTreeNode: (key: string) => void;
  columns: string[];
  config: DataSourceConfig | undefined;
  enable?: () => void;
  disable?: () => void;
  filter: DataSourceFilter;
  groupBy: VuuGroupBy;
  menuRpcCall: (
    rpcRequest: Omit<ClientToServerMenuRPC, "vpId">
  ) => Promise<MenuRpcResponse | undefined>;
  openTreeNode: (key: string) => void;
  range: VuuRange;
  select: SelectionChangeHandler;
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
  visualLink?: LinkDescriptorWithLabel;
}
