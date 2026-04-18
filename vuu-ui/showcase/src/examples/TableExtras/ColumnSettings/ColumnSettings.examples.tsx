import { getSchema } from "@vuu-ui/vuu-data-test";
import {
  ColumnDescriptor,
  ColumnTypeFormatting,
  TableConfig,
} from "@vuu-ui/vuu-table-types";
import {
  ColumnFormattingPanel,
  ColumnModel,
  ColumnSettingsPanel,
} from "@vuu-ui/vuu-table-extras";
import {
  CellRendererDescriptor,
  ColumnRenderPropsChangeHandler,
  updateColumnFormatting,
  updateColumnType,
} from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useState } from "react";
import { DataValueTypeSimple, SchemaColumn } from "@vuu-ui/vuu-data-types";

export const ColumnFormattingPanelDouble = () => {
  const [column, setColumn] = useState<ColumnDescriptor>({
    name: "price",
    label: "Price",
    serverDataType: "double",
  });

  const availableRenderers = useMemo<CellRendererDescriptor[]>(
    () => [
      { name: "Default renderer (data type double)" },
      { name: "Background renderer" },
      {
        label: "Price Ticker",
        name: "vuu.price-move-background",
      },
    ],
    [],
  );

  const handleChangeRendering = useCallback<ColumnRenderPropsChangeHandler>(
    (renderer) => {
      console.log(`handleChangeRendering`, { renderer });
      setColumn((col) => ({
        ...col,
        type: {
          ...(typeof col.type === "object" ? col.type : { name: col.type }),
          renderer,
        },
      }));
    },
    [],
  );

  return (
    <ColumnFormattingPanel
      availableRenderers={availableRenderers}
      column={column}
      onChangeFormatting={() => console.log("onChangeFormatting")}
      onChangeColumnType={() => console.log("onChangeType")}
      onChangeRendering={handleChangeRendering}
      style={{
        border: "solid 1px lightgray",
        margin: 20,
        padding: 12,
        width: 300,
      }}
    />
  );
};

export const ColumnFormattingPanelDateTime = () => {
  const [column, setColumn] = useState<ColumnDescriptor>({
    name: "lastUpdated",
    label: "Last updated",
    serverDataType: "long",
    type: {
      name: "date/time",
      formatting: {
        pattern: { date: "MMMM dd, yyyy", time: "hh:mm:ss" },
      },
    },
  });

  const availableRenderers = useMemo<CellRendererDescriptor[]>(
    () => [{ name: "Default renderer (data type long)" }],
    [],
  );

  const handleChangeRendering = useCallback<ColumnRenderPropsChangeHandler>(
    (renderer) => console.log(`handleChangeRendering`, { renderer }),
    [],
  );

  const onChangeFormatting = useCallback((formatting: ColumnTypeFormatting) => {
    setColumn((col) => updateColumnFormatting(col, formatting));
  }, []);

  const onChangeType = useCallback((t: DataValueTypeSimple) => {
    setColumn((col) => updateColumnType(col, t));
  }, []);

  return (
    <ColumnFormattingPanel
      availableRenderers={availableRenderers}
      column={column}
      onChangeFormatting={onChangeFormatting}
      onChangeRendering={handleChangeRendering}
      onChangeColumnType={onChangeType}
      style={{
        border: "solid 1px lightgray",
        margin: 20,
        padding: 12,
        width: 300,
      }}
    />
  );
};

export const CalculatedColumnSettingsPanel = () => {
  const [calculatedColumn, columnModel] = useMemo(() => {
    const calc: SchemaColumn = {
      name: "ccyExchange:string:concatenate(currency,exchange)",
      serverDataType: "string",
    };
    const columns = getSchema("parentOrders").columns.concat(calc);
    return [calc, new ColumnModel(columns, columns.slice(0, 10).concat(calc))];
  }, []);

  const schema = getSchema("parentOrders");
  const [column] = useState<ColumnDescriptor>(calculatedColumn);
  const onConfigChange = (config: TableConfig) => {
    console.log(`config change ${JSON.stringify(config, null, 2)}`);
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
        columnModel={columnModel}
        onConfigChange={onConfigChange}
        vuuTable={schema.table}
      />
    </div>
  );
};
