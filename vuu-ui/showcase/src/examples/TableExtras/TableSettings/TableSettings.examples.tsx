import { getSchema } from "@finos/vuu-data-test";
import { DataSourceConfig, SchemaColumn } from "@finos/vuu-data-types";
import {
  ColumnItem,
  ColumnList,
  TableSettingsPanel,
} from "@finos/vuu-table-extras";
import { TableConfig } from "@finos/vuu-table-types";
import { MoveItemHandler } from "@finos/vuu-ui-controls";
import { moveItem } from "@finos/vuu-utils";
import { useCallback, useMemo, useState } from "react";

let displaySequence = 1;

export const DefaultColumnList = () => {
  const initialColumns = useMemo<ColumnItem[]>(
    () => [
      {
        subscribed: true,
        name: "bbg",
        serverDataType: "string",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        name: "description",
        serverDataType: "string",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        name: "currency",
        serverDataType: "string",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        name: "exchange",
        serverDataType: "string",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        name: "price",
        serverDataType: "double",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        name: "quantity",
        serverDataType: "int",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        name: "filledQty",
        serverDataType: "int",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        name: "lotSize",
        serverDataType: "int",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        name: "exchangeRate",
        serverDataType: "double",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        name: "isin",
        serverDataType: "string",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        name: "ric",
        serverDataType: "string",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        name: "ask",
        serverDataType: "double",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        name: "bid",
        serverDataType: "double",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        name: "i1",
        serverDataType: "int",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        name: "i2",
        serverDataType: "int",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        name: "i3",
        serverDataType: "int",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        name: "orderId",
        serverDataType: "string",
        isCalculated: false,
      } as const,
    ],
    []
  );

  const [columns, setColumns] = useState(initialColumns);

  const handleChange = () => {
    console.log("handleChange");
  };
  const handleMoveListItem: MoveItemHandler = (fromIndex, toIndex) => {
    setColumns((cols) => moveItem(cols, fromIndex, toIndex));
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

export const ManyColumnList = () => {
  const initialColumns = useMemo<ColumnItem[]>(() => {
    const schema = getSchema("TwoHundredColumns");
    return schema.columns.map((col) => ({
      ...col,
      subscribed: true,
      isCalculated: false,
    }));
  }, []);

  const [columns, setColumns] = useState<ColumnItem[]>(initialColumns);

  const handleMoveListItem = useCallback((fromIndex, toIndex) => {
    setColumns((cols) => moveItem(cols, fromIndex, toIndex));
  }, []);

  const handleChange = () => {
    console.log("handleChange");
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
ManyColumnList.displaySequence = displaySequence++;

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
  const handleConfigChange = (config: TableConfig) => {
    console.log("handleConfigChange", {
      config,
    });
  };

  const handleDataSourceConfigChange = (config: DataSourceConfig) => {
    console.log("handleDataSourceConfigChange", {
      config,
    });
  };

  return (
    <TableSettingsPanel
      availableColumns={availableColumns}
      onAddCalculatedColumn={() => console.log("add calculated column")}
      onConfigChange={handleConfigChange}
      onDataSourceConfigChange={handleDataSourceConfigChange}
      tableConfig={tableConfig}
    />
  );
};
DefaultSettingsPanel.displaySequence = displaySequence++;
