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

export const DefaultColumnList = () => {
  const initialColumns = useMemo<ColumnItem[]>(
    () => [
      {
        subscribed: true,
        label: "bbg",
        name: "bbg",
        serverDataType: "string",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "description",
        name: "description",
        serverDataType: "string",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "currency",
        name: "currency",
        serverDataType: "string",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "exchange",
        name: "exchange",
        serverDataType: "string",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "price",
        name: "price",
        serverDataType: "double",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "quantity",
        name: "quantity",
        serverDataType: "int",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "filledQty",
        name: "filledQty",
        serverDataType: "int",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "lotSize",
        name: "lotSize",
        serverDataType: "int",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "exchangeRate",
        name: "exchangeRate",
        serverDataType: "double",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "isin",
        name: "isin",
        serverDataType: "string",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "ric",
        name: "ric",
        serverDataType: "string",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "ask",
        name: "ask",
        serverDataType: "double",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "bid",
        name: "bid",
        serverDataType: "double",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "i1",
        name: "i1",
        serverDataType: "int",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "i2",
        name: "i2",
        serverDataType: "int",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "i3",
        name: "i3",
        serverDataType: "int",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "orderId",
        name: "orderId",
        serverDataType: "string",
        isCalculated: false,
      } as const,
    ],
    [],
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
    [],
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
