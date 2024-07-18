import type {
  DataSourceCallbackMessage,
  DataSourceConfig,
  DataSourceConfigMessage,
  DataSourceDataSizeMessage,
} from "@finos/vuu-data-types";
import type {
  OpenDialogAction,
  ServerToClientBody,
  ServerToClientMenuResponse,
  VuuTable,
} from "@finos/vuu-protocol-types";
import { isOpenDialogAction } from "@finos/vuu-utils";

export const isSizeOnly = (
  message: DataSourceCallbackMessage
): message is DataSourceDataSizeMessage =>
  message.type === "viewport-update" && message.mode === "size-only";

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

export const isSessionTableActionMessage = (
  messageBody: ServerToClientBody
): messageBody is ServerToClientMenuResponse & {
  action: OpenDialogAction;
} =>
  messageBody.type === "VIEW_PORT_MENU_RESP" &&
  isOpenDialogAction(messageBody.action) &&
  isSessionTable(messageBody.action.table) &&
  messageBody.action?.renderComponent === "inline-form";

export const isSessionTable = (table?: unknown) => {
  if (
    table !== null &&
    typeof table === "object" &&
    "table" in table &&
    "module" in table
  ) {
    return (table as VuuTable).table.startsWith("session");
  }
  return false;
};
