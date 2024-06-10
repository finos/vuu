import {
  ConnectionQualityMetrics,
  ConnectionStatusMessage,
  DataSourceConfig,
  MenuRpcResponse,
  RpcResponse,
  TypeaheadSuggestionProvider,
  VuuUIMessageIn,
  VuuUIMessageInRPC,
  VuuUIMessageInRPCEditReject,
  VuuUIMessageInRPCEditResponse,
  VuuUIMessageInTableMeta,
  VuuUIMessageOutViewport,
  WithFilter,
  WithFullConfig,
  WithGroupBy,
  WithSort,
} from "@finos/vuu-data-types";
import {
  LinkDescriptorWithLabel,
  VuuFilter,
  VuuSort,
} from "@finos/vuu-protocol-types";

export const NoFilter: VuuFilter = { filter: "" };
export const NoSort: VuuSort = { sortDefs: [] };

export const vanillaConfig: WithFullConfig = {
  aggregations: [],
  columns: [],
  filter: NoFilter,
  groupBy: [],
  sort: NoSort,
};

export type DataSourceConfigChanges = {
  aggregationsChanged: boolean;
  columnsChanged: boolean;
  filterChanged: boolean;
  groupByChanged: boolean;
  sortChanged: boolean;
  visualLinkChanged: boolean;
};

export type MaybeDataSourceConfigChanges = DataSourceConfigChanges & {
  noChanges: boolean;
};

type DataConfigPredicate = (
  config: DataSourceConfig,
  newConfig: DataSourceConfig
) => boolean;

const equivalentAggregations: DataConfigPredicate = (
  { aggregations: agg1 },
  { aggregations: agg2 }
) =>
  (agg1 === undefined && agg2?.length === 0) ||
  (agg2 === undefined && agg1?.length === 0);

const equivalentColumns: DataConfigPredicate = (
  { columns: cols1 },
  { columns: cols2 }
) =>
  (cols1 === undefined && cols2?.length === 0) ||
  (cols2 === undefined && cols1?.length === 0);

const equivalentFilter: DataConfigPredicate = (
  { filter: f1 },
  { filter: f2 }
) =>
  (f1 === undefined && f2?.filter === "") ||
  (f2 === undefined && f1?.filter === "");

const equivalentGroupBy: DataConfigPredicate = (
  { groupBy: val1 },
  { groupBy: val2 }
) =>
  (val1 === undefined && val2?.length === 0) ||
  (val2 === undefined && val1?.length === 0);

const equivalentSort: DataConfigPredicate = ({ sort: s1 }, { sort: s2 }) =>
  (s1 === undefined && s2?.sortDefs.length === 0) ||
  (s2 === undefined && s1?.sortDefs.length === 0);

const exactlyTheSame = (a: unknown, b: unknown) => {
  if (a === b) {
    return true;
  } else if (a === undefined && b === undefined) {
    return true;
  } else {
    return false;
  }
};

const isAggregationsChanged: DataConfigPredicate = (config, newConfig) => {
  const { aggregations: agg1 } = config;
  const { aggregations: agg2 } = newConfig;
  if (exactlyTheSame(agg1, agg2) || equivalentAggregations(config, newConfig)) {
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

const isColumnsChanged: DataConfigPredicate = (config, newConfig) => {
  const { columns: cols1 } = config;
  const { columns: cols2 } = newConfig;

  if (exactlyTheSame(cols1, cols2) || equivalentColumns(config, newConfig)) {
    return false;
  } else if (cols1 === undefined || cols2 === undefined) {
    return true;
  } else if (cols1?.length !== cols2?.length) {
    return true;
  }
  return cols1.some((column, i) => column !== cols2?.[i]);
};

export const isFilterChanged: DataConfigPredicate = (c1, c2) => {
  if (equivalentFilter(c1, c2)) {
    return false;
  } else {
    return c1.filter?.filter !== c2.filter?.filter;
  }
};

export const isGroupByChanged: DataConfigPredicate = (config, newConfig) => {
  const { groupBy: g1 } = config;
  const { groupBy: g2 } = newConfig;
  if (exactlyTheSame(g1, g2) || equivalentGroupBy(config, newConfig)) {
    return false;
  } else if (g1 === undefined || g2 === undefined) {
    return true;
  } else if (g1?.length !== g2?.length) {
    return true;
  }
  return g1.some((column, i) => column !== g2?.[i]);
};

const isSortChanged: DataConfigPredicate = (config, newConfig) => {
  const { sort: s1 } = config;
  const { sort: s2 } = newConfig;
  if (exactlyTheSame(s1, s2) || equivalentSort(config, newConfig)) {
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

const isVisualLinkChanged: DataConfigPredicate = () => {
  // TODO
  return false;
};

export const NO_CONFIG_CHANGES: MaybeDataSourceConfigChanges = {
  aggregationsChanged: false,
  columnsChanged: false,
  filterChanged: false,
  groupByChanged: false,
  noChanges: true,
  sortChanged: false,
  visualLinkChanged: false,
};

export const isConfigChanged = (
  config: DataSourceConfig | undefined,
  newConfig: DataSourceConfig | undefined
): MaybeDataSourceConfigChanges => {
  if (exactlyTheSame(config, newConfig)) {
    return NO_CONFIG_CHANGES;
  }

  if (config === undefined && newConfig == undefined) {
    return NO_CONFIG_CHANGES;
  } else if (config === undefined) {
    return isConfigChanged({}, newConfig);
  } else if (newConfig === undefined) {
    return isConfigChanged(config, {});
  }

  const aggregationsChanged = isAggregationsChanged(config, newConfig);
  const columnsChanged = isColumnsChanged(config, newConfig);
  const filterChanged = isFilterChanged(config, newConfig);
  const groupByChanged = isGroupByChanged(config, newConfig);
  const sortChanged = isSortChanged(config, newConfig);
  const visualLinkChanged = isVisualLinkChanged(config, newConfig);

  const noChanges = !(
    aggregationsChanged ||
    columnsChanged ||
    filterChanged ||
    groupByChanged ||
    sortChanged ||
    visualLinkChanged
  );

  return {
    aggregationsChanged,
    columnsChanged,
    filterChanged,
    groupByChanged,
    noChanges,
    sortChanged,
    visualLinkChanged,
  };
};

export const hasGroupBy = (config?: DataSourceConfig): config is WithGroupBy =>
  config !== undefined &&
  config.groupBy !== undefined &&
  config.groupBy.length > 0;

export const hasFilter = (config?: DataSourceConfig): config is WithFilter =>
  config?.filter !== undefined && config.filter.filter.length > 0;

export const hasSort = (config?: DataSourceConfig): config is WithSort =>
  config?.sort !== undefined &&
  Array.isArray(config.sort?.sortDefs) &&
  config.sort.sortDefs.length > 0;

export const isTypeaheadSuggestionProvider = (
  source: unknown
): source is TypeaheadSuggestionProvider =>
  typeof (source as TypeaheadSuggestionProvider)["getTypeaheadSuggestions"] ===
  "function";

export const isTableSchemaMessage = (
  message: VuuUIMessageIn
): message is VuuUIMessageInTableMeta => message.type === "TABLE_META_RESP";

export const isConnectionStatusMessage = (
  msg: object | ConnectionStatusMessage
): msg is ConnectionStatusMessage =>
  (msg as ConnectionStatusMessage).type === "connection-status";

export const isConnectionQualityMetrics = (
  msg: object
): msg is ConnectionQualityMetrics =>
  (msg as ConnectionQualityMetrics).type === "connection-metrics";

export const messageHasResult = (msg: object): msg is VuuUIMessageInRPC =>
  typeof (msg as VuuUIMessageInRPC).result !== "undefined";

export const isErrorResponse = (
  response?: RpcResponse
): response is VuuUIMessageInRPCEditReject =>
  response !== undefined && "error" in response;

export const hasAction = (
  response?: RpcResponse
): response is MenuRpcResponse | VuuUIMessageInRPCEditResponse =>
  response != undefined && "action" in response;

export const isViewportMessage = (
  msg: object
): msg is VuuUIMessageOutViewport => "viewport" in msg;

export const withConfigDefaults = (
  config: DataSourceConfig
): WithFullConfig & { visualLink?: LinkDescriptorWithLabel } => {
  if (
    config.aggregations &&
    config.columns &&
    config.filter &&
    config.groupBy &&
    config.sort
  ) {
    return config as WithFullConfig;
  } else {
    const {
      aggregations = [],
      columns = [],
      filter = { filter: "" },
      groupBy = [],
      sort = { sortDefs: [] },
      visualLink,
    } = config;

    return {
      aggregations,
      columns,
      filter,
      groupBy,
      sort,
      visualLink,
    };
  }
};
