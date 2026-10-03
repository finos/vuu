import {
  Button,
  ToggleButton,
  ToggleButtonGroup,
  type ToggleButtonGroupProps,
} from "@salt-ds/core";
import { Table, type TableProps } from "@vuu-ui/vuu-table";
import type {
  DataRow,
  SelectionChangeHandler,
  TableConfig,
  TableRowSelectHandler,
  TableSelectionModel,
} from "@vuu-ui/vuu-table-types";
import { useEffect, useMemo, useState } from "react";
import { stockColumns, useStockDataSource } from "./sample-data";

const columns = stockColumns.slice(0, 6);

export const SelectionModels = () => {
  const [selectionModel, setSelectionModel] =
    useState<TableSelectionModel>("extended");
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource();

  const handleChange: ToggleButtonGroupProps["onChange"] = (e) => {
    dataSource.select?.({ type: "DESELECT_ALL" });
    setSelectionModel(e.currentTarget.value as TableSelectionModel);
  };

  return (
    <>
      <ToggleButtonGroup onChange={handleChange} value={selectionModel}>
        <ToggleButton value="none">none</ToggleButton>
        <ToggleButton value="single">single</ToggleButton>
        <ToggleButton value="single-no-deselect">single-no-deselect</ToggleButton>
        <ToggleButton value="extended">extended</ToggleButton>
        <ToggleButton value="checkbox">checkbox</ToggleButton>
      </ToggleButtonGroup>
      <Table
        config={config}
        dataSource={dataSource}
        height={300}
        key={selectionModel}
        selectionModel={selectionModel}
        width={640}
      />
    </>
  );
};

export const CheckboxSelection = () => {
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource();

  return (
    <Table
      allowSelectAll
      allowSelectCheckboxRow
      config={config}
      dataSource={dataSource}
      height={300}
      selectionModel="checkbox"
      width={660}
    />
  );
};

export const SelectionEvents = () => {
  const [lastSelected, setLastSelected] = useState<string>("none");
  const [lastRequest, setLastRequest] = useState<string>("none");
  const [selectedCount, setSelectedCount] = useState(0);
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource();

  useEffect(() => {
    const handleRowSelection = (count: number) => setSelectedCount(count);
    dataSource.on("row-selection", handleRowSelection);
    return () => {
      dataSource.removeListener("row-selection", handleRowSelection);
    };
  }, [dataSource]);

  const handleSelect: TableRowSelectHandler = (dataRow) => {
    setLastSelected(dataRow ? `${dataRow.ric} (${dataRow.name})` : "null");
  };

  const handleSelectionChange: SelectionChangeHandler = (selectionChange) => {
    setLastRequest(JSON.stringify(selectionChange));
  };

  const clearSelection = () => dataSource.select?.({ type: "DESELECT_ALL" });

  return (
    <>
      <Table
        config={config}
        dataSource={dataSource}
        height={260}
        onSelect={handleSelect}
        onSelectionChange={handleSelectionChange}
        width={640}
      />
      <div>
        <Button onClick={clearSelection}>Clear selection</Button>
      </div>
      <code>Selected rows: {selectedCount}</code>
      <code>onSelect: {lastSelected}</code>
      <code>onSelectionChange: {lastRequest}</code>
    </>
  );
};

export const NonSelectableRows = () => {
  const config = useMemo<TableConfig>(
    () => ({ columns: stockColumns, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource();

  const isRowSelectable = (dataRow: DataRow) => dataRow.esg === true;

  return (
    <Table
      config={config}
      dataSource={dataSource}
      height={300}
      isRowSelectable={isRowSelectable}
      selectionModel="checkbox"
      allowSelectCheckboxRow
      width={760}
    />
  );
};

export const InitialSelection = () => {
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource();

  return (
    <Table
      autoSelectRowKey="VOD.L"
      config={config}
      dataSource={dataSource}
      height={300}
      selectionModel="single"
      width={640}
    />
  );
};

export const SelectionBorder = () => {
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true, selectionBookendWidth: 0 }),
    [],
  );
  const dataSource = useStockDataSource();

  return (
    <Table
      config={config}
      dataSource={dataSource}
      height={300}
      rowSelectionBorder
      width={640}
    />
  );
};

export const CellBlockSelection = () => {
  const [cellBlock, setCellBlock] = useState("none");
  const config = useMemo<TableConfig>(
    () => ({ columns, columnSeparators: true, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource();

  const handleSelectCellBlock: TableProps["onSelectCellBlock"] = (block) => {
    setCellBlock(JSON.stringify(block));
  };

  return (
    <>
      <Table
        allowCellBlockSelection
        config={config}
        dataSource={dataSource}
        height={300}
        onSelectCellBlock={handleSelectCellBlock}
        selectionModel="none"
        width={640}
      />
      <code>onSelectCellBlock: {cellBlock}</code>
    </>
  );
};
