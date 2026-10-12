import { Checkbox, CheckboxGroup } from "@salt-ds/core";
import { Table } from "@vuu-ui/vuu-table";
import type { DataRow, TableConfig } from "@vuu-ui/vuu-table-types";
import { registerComponent, type RowClassGenerator } from "@vuu-ui/vuu-utils";
import { type ChangeEvent, useMemo, useState } from "react";
import { stockColumns, useStockDataSource } from "./sample-data";

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
