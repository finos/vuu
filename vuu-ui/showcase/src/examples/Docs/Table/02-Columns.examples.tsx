import { Table } from "@vuu-ui/vuu-table";
import type { ColumnDescriptor, TableConfig } from "@vuu-ui/vuu-table-types";
import { useMemo } from "react";
import { stockColumns, useStockDataSource } from "./sample-data";

export const ColumnDefinitions = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: [
        { name: "ric", label: "RIC", width: 90 },
        { name: "name", label: "Company", width: 180 },
        { name: "currency", label: "Currency", align: "right", width: 80 },
        { name: "price", label: "Price", minWidth: 80 },
        { name: "volume", label: "Volume", width: 120 },
        { name: "sector", hidden: true },
      ],
      columnDefaultWidth: 90,
      rowSeparators: true,
    }),
    [],
  );

  const dataSource = useStockDataSource();

  return (
    <Table config={config} dataSource={dataSource} height={300} width={620} />
  );
};

export const FitColumnLayout = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columnLayout: "fit",
      columns: [
        { name: "ric", label: "RIC", width: 90, maxWidth: 100 },
        { name: "name", label: "Name", width: 160, maxWidth: 400, flex: 1 },
        { name: "sector", label: "Sector", width: 110 },
        { name: "price", label: "Price", width: 90, maxWidth: 120 },
        { name: "change", label: "Change", width: 90, maxWidth: 120 },
      ],
      rowSeparators: true,
    }),
    [],
  );

  const dataSource = useStockDataSource();

  return (
    <Table config={config} dataSource={dataSource} height={300} width={700} />
  );
};

export const PinnedColumns = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: stockColumns.map<ColumnDescriptor>((column) => {
        if (column.name === "ric") {
          return { ...column, pin: "left" };
        } else if (column.name === "esg") {
          return { ...column, pin: "right" };
        } else {
          return column;
        }
      }),
      columnSeparators: true,
      rowSeparators: true,
    }),
    [],
  );

  const dataSource = useStockDataSource();

  return (
    <Table config={config} dataSource={dataSource} height={300} width={600} />
  );
};

export const GroupedHeadings = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: [
        { name: "ric", label: "RIC", width: 90, heading: ["Instrument"] },
        { name: "name", label: "Name", width: 170, heading: ["Instrument"] },
        { name: "exchange", label: "Exchange", heading: ["Instrument"] },
        {
          name: "price",
          label: "Price",
          heading: ["Pricing", "Last"],
        },
        {
          name: "change",
          label: "Change",
          heading: ["Pricing", "Last"],
        },
        {
          name: "volume",
          label: "Volume",
          width: 110,
          heading: ["Pricing", "Session"],
        },
      ],
      columnSeparators: true,
      rowSeparators: true,
    }),
    [],
  );

  const dataSource = useStockDataSource();

  return (
    <Table config={config} dataSource={dataSource} height={320} width={680} />
  );
};

export const HeaderOptions = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: [
        { name: "ric", label: "ric", width: 90, sortable: false },
        { name: "name", label: "company name", width: 170 },
        { name: "price", label: "price", resizeable: false },
        { name: "change", label: "change", allowColumnHeaderMenu: false },
        { name: "volume", label: "volume", width: 110, selected: true },
      ],
      columnFormatHeader: "uppercase",
      rowSeparators: true,
    }),
    [],
  );

  const dataSource = useStockDataSource();

  return (
    <Table
      allowDragColumnHeader={false}
      config={config}
      dataSource={dataSource}
      height={300}
      showColumnHeaderMenus={{
        allowSort: true,
        allowHide: true,
        allowGroup: false,
        allowAggregation: false,
        allowRemove: false,
        allowPin: false,
      }}
      width={560}
    />
  );
};
