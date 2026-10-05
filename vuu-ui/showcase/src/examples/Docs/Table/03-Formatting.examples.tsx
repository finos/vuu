import { Input } from "@salt-ds/core";
import { Table } from "@vuu-ui/vuu-table";
// Importing vuu-table-extras registers its cell renderers
import "@vuu-ui/vuu-table-extras";
import type {
  ColumnDescriptor,
  HeaderCellProps,
  TableCellRendererProps,
  TableConfig,
} from "@vuu-ui/vuu-table-types";
import { registerComponent, useData } from "@vuu-ui/vuu-utils";
import { type ChangeEvent, useMemo, useState } from "react";
import { stockColumns, useStockDataSource } from "./sample-data";

import "./03-Formatting.css";

export const NumberFormatting = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: [
        { name: "ric", label: "RIC", width: 90 },
        {
          name: "price",
          label: "Price",
          serverDataType: "double",
          type: { name: "number", formatting: { decimals: 2, zeroPad: true } },
        },
        {
          name: "change",
          label: "Change",
          serverDataType: "double",
          type: {
            name: "number",
            formatting: { decimals: 3, roundingRule: "truncate" },
          },
        },
        {
          name: "volume",
          label: "Volume",
          serverDataType: "long",
          type: {
            name: "number",
            formatting: { decimals: 0, useLocaleString: true },
          },
          width: 120,
        },
      ],
      rowSeparators: true,
    }),
    [],
  );

  const dataSource = useStockDataSource();

  return (
    <Table config={config} dataSource={dataSource} height={300} width={460} />
  );
};

const T = Date.UTC(2026, 8, 30, 14, 5, 9, 250);
const day = 86_400_000;
const tradeColumns: ColumnDescriptor[] = [
  { name: "id", label: "ID", serverDataType: "string", width: 60 },
  { name: "tradeDate", serverDataType: "long" },
  { name: "settleDate", serverDataType: "long" },
  { name: "tradeTime", serverDataType: "long" },
  { name: "execTime", serverDataType: "long" },
];
const tradeData = [
  ["T1", T, T + 2 * day, T, T],
  ["T2", T - day, T + day, T - 3_600_000, T - 3_600_000],
  ["T3", T - 2 * day, T, T - 7_250_500, T - 7_250_500],
];

export const DateFormatting = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: [
        { name: "id", label: "ID", width: 60 },
        {
          name: "tradeDate",
          label: "Trade date",
          type: "date/time",
          width: 160,
        },
        {
          name: "settleDate",
          label: "Settle date",
          type: {
            name: "date/time",
            formatting: { pattern: { date: "dd MMM yyyy" } },
          },
          width: 120,
        },
        {
          name: "tradeTime",
          label: "Trade time",
          type: {
            name: "date/time",
            formatting: { pattern: { time: "hh:mm:ss a" } },
          },
          width: 120,
        },
        {
          name: "execTime",
          label: "Execution time",
          type: {
            name: "date/time",
            formatting: {
              pattern: { date: "yyyy-mm-dd", time: "hh:mm:ss.ms" },
            },
          },
          width: 200,
        },
      ],
      rowSeparators: true,
    }),
    [],
  );

  const dataSource = useStockDataSource({
    columnDescriptors: tradeColumns,
    data: tradeData,
    keyColumn: "id",
  });

  return (
    <Table config={config} dataSource={dataSource} height={160} width={680} />
  );
};

export const MappedValues = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: [
        { name: "ric", label: "RIC", width: 90 },
        { name: "name", label: "Name", width: 170 },
        {
          name: "currency",
          label: "Currency",
          type: {
            name: "string",
            renderer: {
              map: {
                USD: "US Dollar",
                GBP: "Pound Sterling",
                EUR: "Euro",
                CHF: "Swiss Franc",
                JPY: "Japanese Yen",
              },
            },
          },
          width: 140,
        },
      ],
      rowSeparators: true,
    }),
    [],
  );

  const dataSource = useStockDataSource();

  return (
    <Table config={config} dataSource={dataSource} height={240} width={420} />
  );
};

const orderColumns: ColumnDescriptor[] = [
  { name: "orderId", serverDataType: "string" },
  { name: "ric", serverDataType: "string" },
  { name: "quantity", serverDataType: "long" },
  { name: "filledQty", serverDataType: "long" },
  { name: "pctComplete", serverDataType: "double" },
];
const orderData = [
  ["ORD-001", "AAPL.OQ", 10_000, 10_000, 1],
  ["ORD-002", "MSFT.OQ", 5_000, 3_250, 0.65],
  ["ORD-003", "VOD.L", 250_000, 40_000, 0.16],
  ["ORD-004", "BP.L", 80_000, 0, 0],
  ["ORD-005", "SAP.DE", 12_000, 9_600, 0.8],
];

export const ProgressRenderers = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: [
        { name: "orderId", label: "Order", width: 90 },
        { name: "ric", label: "RIC", width: 90 },
        { name: "quantity", label: "Quantity" },
        {
          name: "filledQty",
          label: "Filled",
          type: {
            name: "number",
            renderer: { name: "vuu.progress", associatedField: "quantity" },
          },
          width: 140,
        },
        {
          name: "pctComplete",
          label: "Complete",
          type: { name: "number", renderer: { name: "vuu.pct-progress" } },
          width: 140,
        },
      ],
      rowSeparators: true,
    }),
    [],
  );

  const dataSource = useStockDataSource({
    columnDescriptors: orderColumns,
    data: orderData,
    keyColumn: "orderId",
  });

  return (
    <Table config={config} dataSource={dataSource} height={200} width={580} />
  );
};

const priceType = (
  flashStyle: "bg-only" | "arrow-bg" | "arrow",
  decimals: number,
) => ({
  name: "number" as const,
  formatting: { decimals, zeroPad: decimals > 0 },
  renderer: { name: "vuu.price-move-background", flashStyle },
});

// prettier-ignore
const priceColumns: ColumnDescriptor[] = [
  { name: "ric", label: "RIC", serverDataType: "string", width: 90 },
  { name: "bid", label: "Bid", serverDataType: "double", type: priceType("arrow-bg", 2) },
  { name: "ask", label: "Ask", serverDataType: "double", type: priceType("arrow-bg", 2) },
  { name: "bidSize", label: "Bid size", serverDataType: "double", type: priceType("bg-only", 0) },
  { name: "askSize", label: "Ask size", serverDataType: "double", type: priceType("arrow", 0) },
];

export const FlashingPrices = () => {
  const { VuuDataSource } = useData();
  const config = useMemo<TableConfig>(
    () => ({ columns: priceColumns, rowSeparators: true }),
    [],
  );
  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: ["ric", "bid", "ask", "bidSize", "askSize"],
        table: { module: "SIMUL", table: "prices" },
      }),
    [VuuDataSource],
  );
  return (
    <Table config={config} dataSource={dataSource} height={300} width={520} />
  );
};

const ChangeCell = ({ column, dataRow }: TableCellRendererProps) => {
  const value = dataRow[column.name] as number;
  const direction = value > 0 ? "up" : value < 0 ? "down" : "flat";
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "";
  return (
    <span className={`vuuDocsChangeCell vuuDocsChangeCell-${direction}`}>
      <span aria-hidden>{arrow}</span>
      {(value * 100).toFixed(2)}%
    </span>
  );
};

registerComponent("docs-change-cell", ChangeCell, "cell-renderer", {
  serverDataType: "double",
});

const InfoHeader = ({ column }: Omit<HeaderCellProps, "id" | "index">) => (
  <span
    className="vuuDocsInfoHeader"
    title={`${column.label} is the change since the previous close`}
  >
    ⓘ
  </span>
);

registerComponent("docs-info-header", InfoHeader, "column-header-content-renderer");

export const CustomCellRenderer = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: [
        { name: "ric", label: "RIC", width: 90 },
        { name: "name", label: "Name", width: 170 },
        { name: "price", label: "Price", serverDataType: "double" },
        {
          name: "change",
          label: "Change",
          colHeaderContentRenderer: "docs-info-header",
          serverDataType: "double",
          type: { name: "number", renderer: { name: "docs-change-cell" } },
          width: 110,
        },
      ],
      rowSeparators: true,
    }),
    [],
  );

  const dataSource = useStockDataSource();

  return (
    <Table config={config} dataSource={dataSource} height={300} width={500} />
  );
};

export const SearchHighlighting = () => {
  const [searchPattern, setSearchPattern] = useState("");
  const config = useMemo<TableConfig>(
    () => ({ columns: stockColumns.slice(0, 5), rowSeparators: true }),
    [],
  );

  const dataSource = useStockDataSource();

  return (
    <>
      <Input
        className="vuuDocsSearchInput"
        inputProps={{ "aria-label": "Highlight text" }}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setSearchPattern(e.target.value)
        }
        placeholder="Type to highlight, e.g. 'tech'"
        value={searchPattern}
      />
      <Table
        config={config}
        dataSource={dataSource}
        height={300}
        searchPattern={searchPattern}
        width={540}
      />
    </>
  );
};
