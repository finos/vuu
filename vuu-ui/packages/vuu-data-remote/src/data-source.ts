import type {
  DataSourceCallbackMessage,
  DataSourceConfig,
  DataSourceConfigMessage,
  DataSourceDataSizeMessage,
} from "@finos/vuu-data-types";
import type {} from "@finos/vuu-protocol-types";

export const isSizeOnly = (
  message: DataSourceCallbackMessage,
): message is DataSourceDataSizeMessage =>
  message.type === "viewport-update" && message.mode === "size-only";

export const toDataSourceConfig = (
  message: DataSourceConfigMessage,
): DataSourceConfig => {
  switch (message.type) {
    case "aggregate":
      return { aggregations: message.aggregations };
    case "columns":
      return { columns: message.columns };
    case "filter":
      return { filterSpec: message.filter };
    case "groupBy":
      return { groupBy: message.groupBy };
    case "sort":
      return { sort: message.sort };
    case "config":
      return message.config;
  }
};

const datasourceMessages = [
  "config",
  "aggregate",
  "viewport-clear",
  "viewport-update",
  "columns",
  "debounce-begin",
  "disabled",
  "enabled",
  "filter",
  "groupBy",
  "vuu-links",
  "vuu-menu",
  "sort",
  "subscribed",
];

export const shouldMessageBeRoutedToDataSource = (
  message: unknown,
): message is DataSourceCallbackMessage => {
  const type = (message as DataSourceCallbackMessage).type;
  return datasourceMessages.includes(type);
};

export const isDataSourceConfigMessage = (
  message: DataSourceCallbackMessage,
): message is DataSourceConfigMessage =>
  ["config", "aggregate", "columns", "filter", "groupBy", "sort"].includes(
    message.type,
  );
