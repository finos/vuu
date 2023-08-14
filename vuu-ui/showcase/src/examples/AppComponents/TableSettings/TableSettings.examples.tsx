import {
  ColumnItem,
  ColumnList,
  TableSettingsPanel,
} from "@finos/vuu-table-extras";
import { SchemaColumn } from "@finos/vuu-data";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { useMemo } from "react";

let displaySequence = 1;

export const DefaultColumnList = () => {
  const columns = useMemo<ColumnItem[]>(
    () => [
      { subscribed: true, name: "bbg", serverDataType: "string" } as const,
      {
        subscribed: true,
        name: "description",
        serverDataType: "string",
      } as const,
      { subscribed: true, name: "currency", serverDataType: "string" } as const,
      { subscribed: true, name: "exchange", serverDataType: "string" } as const,
      { subscribed: true, name: "price", serverDataType: "double" } as const,
      { subscribed: true, name: "quantity", serverDataType: "int" } as const,
      { subscribed: true, name: "filledQty", serverDataType: "int" } as const,
      { subscribed: true, name: "lotSize", serverDataType: "int" } as const,
      {
        subscribed: true,
        name: "exchangeRate",
        serverDataType: "double",
      } as const,
      { subscribed: true, name: "isin", serverDataType: "string" } as const,
      { subscribed: true, name: "ric", serverDataType: "string" } as const,
      { subscribed: true, name: "ask", serverDataType: "double" } as const,
      { subscribed: true, name: "bid", serverDataType: "double" } as const,
      { subscribed: true, name: "i1", serverDataType: "int" } as const,
      { subscribed: true, name: "i2", serverDataType: "int" } as const,
      { subscribed: true, name: "i3", serverDataType: "int" } as const,
      { subscribed: true, name: "orderId", serverDataType: "string" } as const,
    ],
    []
  );

  const handleChange = () => {
    console.log("handleChange");
  };
  const handleMoveListItem = () => {
    console.log("handleMoveListItem");
  };

  return (
    <ColumnList
      columnItems={columns}
      style={{ width: 300, height: 600 }}
      onChange={handleChange}
      onMoveListItem={handleMoveListItem}
    />
  );
};
DefaultColumnList.displaySequence = displaySequence++;

export const DefaultSettingsPanel = () => {
  const [availableColumns, tableConfig] = useMemo<
    [SchemaColumn[], TableConfig]
  >(
    () => [
      [
        { name: "ric", serverDataType: "string" },
        { name: "bbg", serverDataType: "string" },
        { name: "bid", serverDataType: "double" },
        { name: "ask", serverDataType: "double" },
      ],
      {
        columns: [],
      },
    ],
    []
  );
  const handleConfigChange = () => {
    console.log("handleConfigChange");
  };
  return (
    <TableSettingsPanel
      availableColumns={availableColumns}
      onConfigChange={handleConfigChange}
      style={{ width: 252 }}
      tableConfig={tableConfig}
    />
  );
};
DefaultSettingsPanel.displaySequence = displaySequence++;
