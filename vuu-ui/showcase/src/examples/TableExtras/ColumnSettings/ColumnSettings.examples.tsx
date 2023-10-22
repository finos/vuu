import { getSchema } from "@finos/vuu-data-test";
import { ColumnDescriptor, TableConfig } from "@finos/vuu-datagrid-types";
import {
  ColumnFormattingPanel,
  ColumnSettingsPanel,
} from "@finos/vuu-table-extras";
import { CellRendererDescriptor } from "@finos/vuu-utils";
import { useMemo, useState } from "react";

let displaySequence = 1;

export const ColumnFormattingPanelDouble = () => {
  const column = useMemo<ColumnDescriptor>(
    () => ({
      name: "price",
      label: "Price",
      serverDataType: "double",
    }),
    []
  );

  const availableRenderers = useMemo<CellRendererDescriptor[]>(
    () => [
      { name: "Default renderer (data type double)" },
      { name: "Background renderer" },
      { name: "Price Ticker" },
    ],

    []
  );

  return (
    <ColumnFormattingPanel
      availableRenderers={availableRenderers}
      column={column}
      onChangeFormatting={() => console.log("onChangeFormatting")}
      onChangeRenderer={() => console.log("onChangeRenderer")}
      selectedCellRenderer={availableRenderers[0]}
      style={{
        border: "solid 1px lightgray",
        margin: 20,
        padding: 12,
        width: 300,
      }}
    />
  );
};

ColumnFormattingPanelDouble.displaySequence = displaySequence++;

export const NewCalculatedColumnSettingsPanel = () => {
  const schema = getSchema("parentOrders");
  const [{ column, tableConfig }, setState] = useState<{
    column: ColumnDescriptor;
    tableConfig: TableConfig;
  }>({
    column: {
      name: "::",
      serverDataType: "string",
    },
    tableConfig: {
      columns: schema.columns,
    },
  });
  const onConfigChange = (config: TableConfig) => {
    console.log(`config change ${JSON.stringify(config, null, 2)}`);
  };
  const onCreateCalculatedColumn = (column: ColumnDescriptor) => {
    console.log(`create calculated column ${JSON.stringify(column, null, 2)}`);
    setState((s) => ({
      tableConfig: {
        ...s.tableConfig,
        columns: s.tableConfig.columns.concat(column),
      },
      column,
    }));
  };

  return (
    <div
      style={{
        border: "solid 1px #ccc",
        margin: 20,
        padding: 16,
        width: 270,
      }}
    >
      <ColumnSettingsPanel
        column={column}
        onConfigChange={onConfigChange}
        onCreateCalculatedColumn={onCreateCalculatedColumn}
        tableConfig={tableConfig}
        vuuTable={schema.table}
      />
    </div>
  );
};

NewCalculatedColumnSettingsPanel.displaySequence = displaySequence++;

export const CalculatedColumnSettingsPanel = () => {
  const calculatedColumn = useMemo<ColumnDescriptor>(
    () => ({
      name: "ccyExchange:concatenate(currency,exchange):string",
      serverDataType: "string",
    }),
    []
  );
  const schema = getSchema("parentOrders");
  const [{ column, tableConfig }, setState] = useState<{
    column: ColumnDescriptor;
    tableConfig: TableConfig;
  }>({
    column: calculatedColumn,
    tableConfig: {
      columns: schema.columns.concat(calculatedColumn),
    },
  });
  const onConfigChange = (config: TableConfig) => {
    console.log(`config change ${JSON.stringify(config, null, 2)}`);
  };
  const onCreateCalculatedColumn = (column: ColumnDescriptor) => {
    console.log(`create calculated column ${JSON.stringify(column, null, 2)}`);
    setState((s) => ({
      tableConfig: {
        ...s.tableConfig,
        columns: s.tableConfig.columns.concat(column),
      },
      column,
    }));
  };

  return (
    <div
      style={{
        border: "solid 1px #ccc",
        margin: 20,
        padding: 16,
        width: 270,
      }}
    >
      <ColumnSettingsPanel
        column={column}
        onConfigChange={onConfigChange}
        onCreateCalculatedColumn={onCreateCalculatedColumn}
        tableConfig={tableConfig}
        vuuTable={schema.table}
      />
    </div>
  );
};
CalculatedColumnSettingsPanel.displaySequence = displaySequence++;
