import { getSchema } from "@vuu-ui/vuu-data-test";
import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import { Table } from "@vuu-ui/vuu-table";
import type {
  TableConfig,
  TableConfigChangeHandler,
} from "@vuu-ui/vuu-table-types";
import { useData } from "@vuu-ui/vuu-utils";
import { useMemo, useState } from "react";
import { stockColumns, stockData } from "./sample-data";

export const BasicTable = () => {
  const config = useMemo<TableConfig>(() => ({ columns: stockColumns }), []);

  const dataSource = useMemo(
    () =>
      new ArrayDataSource({
        columnDescriptors: stockColumns,
        data: stockData,
        keyColumn: "ric",
      }),
    [],
  );

  return (
    <Table config={config} dataSource={dataSource} height={360} width={800} />
  );
};

export const FillContainer = () => {
  const config = useMemo<TableConfig>(
    () => ({ columns: stockColumns, rowSeparators: true, zebraStripes: true }),
    [],
  );

  const dataSource = useMemo(
    () =>
      new ArrayDataSource({
        columnDescriptors: stockColumns,
        data: stockData,
        keyColumn: "ric",
      }),
    [],
  );

  return (
    <div style={{ height: 300, width: "100%" }}>
      <Table config={config} dataSource={dataSource} />
    </div>
  );
};

export const ServerData = () => {
  const { VuuDataSource } = useData();
  const schema = getSchema("instruments");

  const config = useMemo<TableConfig>(
    () => ({
      columns: schema.columns,
      rowSeparators: true,
      zebraStripes: true,
    }),
    [schema],
  );

  const dataSource = useMemo(
    () => new VuuDataSource({ table: schema.table }),
    [VuuDataSource, schema],
  );

  return (
    <Table
      config={config}
      dataSource={dataSource}
      height={360}
      renderBufferSize={20}
      width="100%"
    />
  );
};

export const PersistConfig = () => {
  const [config, setConfig] = useState<TableConfig>({
    columns: stockColumns.slice(0, 6),
    rowSeparators: true,
  });
  const [lastChange, setLastChange] = useState("none");

  const dataSource = useMemo(
    () =>
      new ArrayDataSource({
        columnDescriptors: stockColumns,
        data: stockData,
        keyColumn: "ric",
      }),
    [],
  );

  const handleConfigChange: TableConfigChangeHandler = (
    newConfig,
    changeType,
  ) => {
    // persist newConfig, e.g. to localStorage or a user-settings service
    setConfig(newConfig);
    setLastChange(changeType.type);
  };

  return (
    <>
      <Table
        config={config}
        dataSource={dataSource}
        height={240}
        onConfigChange={handleConfigChange}
        width={700}
      />
      <code>Last config change: {lastChange}</code>
    </>
  );
};
