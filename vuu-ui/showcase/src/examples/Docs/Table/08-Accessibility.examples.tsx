import {
  Text,
  ToggleButton,
  ToggleButtonGroup,
  type ToggleButtonGroupProps,
} from "@salt-ds/core";
import {
  Table,
  type TableNavigationStyle,
  type TableProps,
} from "@vuu-ui/vuu-table";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { useMemo, useState } from "react";
import { stockColumns, useStockDataSource } from "./sample-data";

import "./08-Accessibility.css";

const columns = stockColumns.slice(0, 7);

export const NavigationStyle = () => {
  const [navigationStyle, setNavigationStyle] =
    useState<TableNavigationStyle>("cell");
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource();

  const handleChange: ToggleButtonGroupProps["onChange"] = (e) =>
    setNavigationStyle(e.currentTarget.value as TableNavigationStyle);

  return (
    <>
      <ToggleButtonGroup onChange={handleChange} value={navigationStyle}>
        <ToggleButton value="cell">Cell</ToggleButton>
        <ToggleButton value="row">Row</ToggleButton>
        <ToggleButton value="none">None</ToggleButton>
      </ToggleButtonGroup>
      <Table
        config={config}
        dataSource={dataSource}
        height={300}
        navigationStyle={navigationStyle}
        selectionModel="single"
        width={700}
      />
    </>
  );
};

export const RowActivation = () => {
  const [opened, setOpened] = useState("none");
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource();

  const handleRowClick: TableProps["onRowClick"] = (_evt, row) =>
    setOpened(String(row.name));

  return (
    <>
      <Text>Last opened: {opened}</Text>
      <Table
        config={config}
        dataSource={dataSource}
        height={300}
        navigationStyle="row"
        onRowClick={handleRowClick}
        selectionModel="none"
        width={700}
      />
    </>
  );
};

export const LabelledTable = () => {
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource();

  return (
    <section aria-labelledby="docs-watchlist-heading">
      <h3 className="docs-table-heading" id="docs-watchlist-heading">
        European watchlist
      </h3>
      <Table config={config} dataSource={dataSource} height={250} width={700} />
    </section>
  );
};
