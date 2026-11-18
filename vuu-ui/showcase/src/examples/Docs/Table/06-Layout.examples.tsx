import {
  SaltProvider,
  ToggleButton,
  ToggleButtonGroup,
  type ToggleButtonGroupProps,
} from "@salt-ds/core";
import { useData } from "@vuu-ui/core";
import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import { getSchema } from "@vuu-ui/vuu-data-test";
import { Table } from "@vuu-ui/vuu-table";
import type { BaseRowProps, TableConfig } from "@vuu-ui/vuu-table-types";
import { useMemo, useState } from "react";
import {
  generateStockData,
  stockColumns,
  useStockDataSource,
} from "./sample-data";

import "./06-Layout.css";

const columns = stockColumns.slice(0, 8);

export const ExplicitSize = () => {
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource();

  return (
    <Table config={config} dataSource={dataSource} height={250} width={600} />
  );
};

export const FillContainer = () => {
  const config = useMemo<TableConfig>(
    () => ({ columns, columnLayout: "fit", rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource();

  return (
    // Drag the bottom right corner of the container to resize it
    <div className="docs-resizable-container">
      <Table config={config} dataSource={dataSource} />
    </div>
  );
};

export const ViewportRowLimit = () => {
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource();

  return (
    <Table
      config={config}
      dataSource={dataSource}
      viewportRowLimit={5}
      width={800}
    />
  );
};

export const MaxViewportRowLimit = () => {
  const [filter, setFilter] = useState("");
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource();

  const handleChange: ToggleButtonGroupProps["onChange"] = (e) => {
    const { value } = e.currentTarget;
    setFilter(value);
    dataSource.filter = { filter: value };
  };

  return (
    <>
      <ToggleButtonGroup onChange={handleChange} value={filter}>
        <ToggleButton value="">All</ToggleButton>
        <ToggleButton value='exchange = "LSE"'>LSE</ToggleButton>
        <ToggleButton value='exchange = "SIX"'>SIX</ToggleButton>
      </ToggleButtonGroup>
      <Table
        config={config}
        dataSource={dataSource}
        maxViewportRowLimit={10}
        width={800}
      />
    </>
  );
};

export const Density = () => {
  const [density, setDensity] = useState<"high" | "medium" | "low">("high");
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource();

  const handleChange: ToggleButtonGroupProps["onChange"] = (e) =>
    setDensity(e.currentTarget.value as "high" | "medium" | "low");

  return (
    <>
      <ToggleButtonGroup onChange={handleChange} value={density}>
        <ToggleButton value="high">High</ToggleButton>
        <ToggleButton value="medium">Medium</ToggleButton>
        <ToggleButton value="low">Low</ToggleButton>
      </ToggleButtonGroup>
      <SaltProvider density={density}>
        <Table
          config={config}
          dataSource={dataSource}
          height={250}
          width={800}
        />
      </SaltProvider>
    </>
  );
};

export const RowHeight = () => {
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource();

  return (
    <Table
      colHeaderRowHeight={36}
      config={config}
      dataSource={dataSource}
      height={250}
      rowHeight={32}
      width={800}
    />
  );
};

const NoMatchingRows = () => (
  <div className="docs-empty-display">No stocks match the current filter</div>
);

export const EmptyState = () => {
  const [filter, setFilter] = useState('currency = "JPY"');
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource({
    filterSpec: { filter: 'currency = "JPY"' },
  });

  const handleChange: ToggleButtonGroupProps["onChange"] = (e) => {
    const { value } = e.currentTarget;
    setFilter(value);
    dataSource.filter = { filter: value };
  };

  return (
    <>
      <ToggleButtonGroup onChange={handleChange} value={filter}>
        <ToggleButton value='currency = "JPY"'>JPY</ToggleButton>
        <ToggleButton value='currency = "GBP"'>GBP</ToggleButton>
      </ToggleButtonGroup>
      <Table
        EmptyDisplay={NoMatchingRows}
        config={config}
        dataSource={dataSource}
        height={250}
        width={800}
      />
    </>
  );
};

export const NoColumnHeaders = () => {
  const config = useMemo<TableConfig>(
    () => ({ columns: stockColumns.slice(0, 3), columnLayout: "fit" }),
    [],
  );
  const dataSource = useStockDataSource();

  return (
    <Table
      config={config}
      dataSource={dataSource}
      height={200}
      showColumnHeaders={false}
      width={400}
    />
  );
};

const ColumnTypeHeader = ({
  ariaRole,
  ariaRowIndex,
  columns,
  virtualColSpan = 0,
}: BaseRowProps) => (
  <div
    aria-rowindex={ariaRowIndex}
    className="docs-type-header"
    role={ariaRole}
  >
    <div style={{ width: virtualColSpan }} />
    {columns
      .filter((column) => !column.hidden)
      .map((column) => (
        <div
          className="docs-type-header-cell"
          key={column.name}
          role="cell"
          style={{ width: column.width }}
        >
          {column.serverDataType}
        </div>
      ))}
  </div>
);

export const CustomHeader = () => {
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource();

  return (
    <Table
      config={config}
      customHeader={ColumnTypeHeader}
      dataSource={dataSource}
      height={300}
      width={800}
    />
  );
};

export const LargeDataset = () => {
  const config = useMemo<TableConfig>(
    () => ({ columns: stockColumns, rowSeparators: true, zebraStripes: true }),
    [],
  );
  const dataSource = useMemo(
    () =>
      new ArrayDataSource({
        columnDescriptors: stockColumns,
        data: generateStockData(100_000),
        keyColumn: "ric",
      }),
    [],
  );

  return (
    <Table config={config} dataSource={dataSource} height={350} width={700} />
  );
};

const pinnedRowsSchema = getSchema("instrumentPrices");

export const PinnedRows = () => {
  const { VuuDataSource } = useData();
  const [pinnedKeys, setPinnedKeys] = useState(["AAOP.N", "AAOT.PA"]);

  const config = useMemo<TableConfig>(
    () => ({
      columns: [
        { name: "ric", pin: "left", width: 100 },
        { name: "description", width: 180 },
        { name: "currency", width: 80 },
        { name: "bid", type: "number" },
        { name: "ask", type: "number" },
        { name: "last", type: "number" },
      ],
      rowSeparators: true,
    }),
    [],
  );

  const dataSource = useMemo(
    () => new VuuDataSource({ table: pinnedRowsSchema.table }),
    [VuuDataSource],
  );

  const handleChange: ToggleButtonGroupProps["onChange"] = (e) =>
    setPinnedKeys(
      e.currentTarget.value === "none" ? [] : e.currentTarget.value.split(","),
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <ToggleButtonGroup onChange={handleChange} value={pinnedKeys.join(",")}>
        <ToggleButton value="AAOP.N,AAOT.PA">Pin two</ToggleButton>
        <ToggleButton value="AAOQ.OQ,AAOU.MI,AAOV.FR">Pin three</ToggleButton>
        <ToggleButton value="none">None</ToggleButton>
      </ToggleButtonGroup>
      <Table
        config={config}
        dataSource={dataSource}
        height={300}
        pinnedRows={{ keys: pinnedKeys }}
        width="100%"
      />
    </div>
  );
};
