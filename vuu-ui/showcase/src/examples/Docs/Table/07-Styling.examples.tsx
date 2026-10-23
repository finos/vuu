import { Checkbox, CheckboxGroup } from "@salt-ds/core";
import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import { Table } from "@vuu-ui/vuu-table";
import type { DataRow, TableConfig } from "@vuu-ui/vuu-table-types";
import {
  registerComponent,
  type RowClassGenerator,
  type RowClassNameGenerator,
} from "@vuu-ui/vuu-utils";
import { type ChangeEvent, useMemo, useState } from "react";
import {
  orderColumns,
  orderData,
  stockColumns,
  tradeColumns,
  tradeData,
  useStockDataSource,
} from "./sample-data";

import "./07-Styling.css";

const columns = stockColumns.slice(0, 8);

type DisplayAttribute = "zebraStripes" | "rowSeparators" | "columnSeparators";

export const DisplayAttributes = () => {
  const [attributes, setAttributes] = useState<DisplayAttribute[]>([
    "zebraStripes",
  ]);
  const config = useMemo<TableConfig>(
    () => ({
      columns,
      zebraStripes: attributes.includes("zebraStripes"),
      rowSeparators: attributes.includes("rowSeparators"),
      columnSeparators: attributes.includes("columnSeparators"),
    }),
    [attributes],
  );
  const dataSource = useStockDataSource();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as DisplayAttribute;
    setAttributes((current) =>
      current.includes(value)
        ? current.filter((attribute) => attribute !== value)
        : current.concat(value),
    );
  };

  return (
    <>
      <CheckboxGroup
        checkedValues={attributes}
        direction="horizontal"
        onChange={handleChange}
      >
        <Checkbox label="zebraStripes" value="zebraStripes" />
        <Checkbox label="rowSeparators" value="rowSeparators" />
        <Checkbox label="columnSeparators" value="columnSeparators" />
      </CheckboxGroup>
      <Table config={config} dataSource={dataSource} height={250} width={800} />
    </>
  );
};

const bigMovers: RowClassGenerator = {
  id: "docs-big-movers",
  fn: (dataRow: DataRow) => {
    const change = dataRow.change as number;
    if (change >= 0.015) {
      return "docs-big-mover-up";
    } else if (change <= -0.015) {
      return "docs-big-mover-down";
    }
  },
};

registerComponent("docs-big-movers", bigMovers, "row-class-generator");

export const RowClassNames = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns,
      rowClassNameGenerators: ["docs-big-movers"],
      rowSeparators: true,
    }),
    [],
  );
  const dataSource = useStockDataSource();

  return (
    <Table config={config} dataSource={dataSource} height={300} width={800} />
  );
};

/**
 * Returns a generator that adds "docs-group-end" to the last row of each run
 * of adjacent rows with the same, non-empty, value in groupColumn.
 */
const groupEnd =
  (groupColumn: string): RowClassNameGenerator =>
  (dataRow, _previousDataRow, nextDataRow) => {
    if (nextDataRow !== undefined) {
      const value = dataRow[groupColumn];
      const sameGroup = value !== "" && value === nextDataRow[groupColumn];
      if (!sameGroup) {
        return "docs-group-end";
      }
    }
  };

registerComponent(
  "docs-trade-pairs",
  { id: "docs-trade-pairs", fn: groupEnd("tradeId") },
  "row-class-generator",
);

registerComponent(
  "docs-mass-orders",
  { id: "docs-mass-orders", fn: groupEnd("massOrderId") },
  "row-class-generator",
);

export const TradePairs = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: tradeColumns,
      rowClassNameGenerators: ["docs-trade-pairs"],
    }),
    [],
  );
  const dataSource = useMemo(
    () =>
      new ArrayDataSource({
        columnDescriptors: tradeColumns,
        data: tradeData,
        keyColumn: "execId",
      }),
    [],
  );

  return (
    <Table config={config} dataSource={dataSource} height={300} width={680} />
  );
};

export const MassOrders = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: orderColumns,
      rowClassNameGenerators: ["docs-mass-orders"],
    }),
    [],
  );
  const dataSource = useMemo(
    () =>
      new ArrayDataSource({
        columnDescriptors: orderColumns,
        data: orderData,
        keyColumn: "orderId",
      }),
    [],
  );

  return (
    <Table config={config} dataSource={dataSource} height={300} width={600} />
  );
};

export const ColumnClassName = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: columns.map((column) =>
        column.name === "price"
          ? { ...column, className: "docs-key-column" }
          : column,
      ),
      rowSeparators: true,
    }),
    [],
  );
  const dataSource = useStockDataSource();

  return (
    <Table config={config} dataSource={dataSource} height={250} width={800} />
  );
};

export const CustomProperties = () => {
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true, zebraStripes: true }),
    [],
  );
  const dataSource = useStockDataSource();

  return (
    <Table
      autoSelectRowKey="MSFT.OQ"
      className="docs-custom-table"
      config={config}
      dataSource={dataSource}
      height={250}
      width={800}
    />
  );
};
