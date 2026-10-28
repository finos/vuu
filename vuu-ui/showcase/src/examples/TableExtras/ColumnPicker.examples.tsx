import { Button } from "@salt-ds/core";
import { getSchema } from "@vuu-ui/vuu-data-test";
import { Table, useTableConfig } from "@vuu-ui/vuu-table";
import {
  ColumnModel,
  ColumnPicker,
  ColumnPickerAction,
  type ColumnPickerProps,
  DataSourceStats,
  TableFooter,
  TableFooterTray,
} from "@vuu-ui/vuu-table-extras";
import { ColumnDescriptor, TableConfig } from "@vuu-ui/vuu-table-types";
import { toColumnName, useData } from "@vuu-ui/vuu-utils";
import { MouseEventHandler, useCallback, useMemo } from "react";
import { DemoTableContainer } from "../Table/DemoTableContainer";

const ColumnPickerTemplate = ({
  columnModel,
}: Pick<ColumnPickerProps, "columnModel">) => {
  return (
    <ColumnPicker
      columnModel={columnModel}
      style={{ width: 300, height: 800 }}
    />
  );
};

export const EmptyColumnPicker = () => {
  const columnModel = useMemo(() => new ColumnModel([], []), []);
  return <ColumnPickerTemplate columnModel={columnModel} />;
};

export const DefaultColumnPicker = () => {
  const columns: ColumnDescriptor[] = useMemo(
    () => [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      {
        name: "averagePrice",
        serverDataType: "double",
        label: "Average price",
      },
      { name: "ccy", serverDataType: "string" },
      { name: "childCount", serverDataType: "int", label: "Child count" },
      { name: "exchange", serverDataType: "string" },
      { name: "filledQty", serverDataType: "double" },
      { name: "id", serverDataType: "string" },
      { name: "idAsInt", serverDataType: "int" },
      { name: "openQty", serverDataType: "double" },
      { name: "price", serverDataType: "double" },
      { name: "quantity", serverDataType: "double" },
      { name: "ric", serverDataType: "string" },
      { name: "side", serverDataType: "string" },
      { name: "status", serverDataType: "string" },
      { name: "volLimit", serverDataType: "int" },
      { name: "vuuCreatedTimestamp", serverDataType: "long" },
      { name: "vuuUpdatedTimestamp", serverDataType: "long" },
    ],
    [],
  );

  const columnModel = useMemo(
    () => new ColumnModel(columns, columns.slice(0, 10)),
    [columns],
  );

  return <ColumnPickerTemplate columnModel={columnModel} />;
};

export const ManyColumnColumnPicker = () => {
  const columnModel = useMemo(() => {
    const schema = getSchema("TwoHundredColumns");
    return new ColumnModel(schema.columns, schema.columns.slice(0, 10));
  }, []);

  return <ColumnPickerTemplate columnModel={columnModel} />;
};

export const CalculatedColumnPickerAlongsideAddButton = () => {
  const allColumns: ColumnDescriptor[] = useMemo(
    () => [
      {
        name: "regularcolumn1",
        serverDataType: "string",
        label: "Regular column 1",
      },
      {
        name: "regularcolumn2",
        serverDataType: "string",
        label: "Regular column 2",
      },
      {
        name: "regularcolumn3",
        serverDataType: "string",
        label: "Regular column 3",
      },
      {
        name: "regularcolumn4",
        serverDataType: "string",
        label: "Regular column 4",
      },
      {
        name: "calculated:col:1",
        serverDataType: "string",
        label: "Calculated column 1",
        icon: "check-check",
      },
      {
        name: "calculated:col:2",
        serverDataType: "string",
        label: "Calculated column 2",
        icon: "check-check",
      },
    ],
    [],
  );

  const selectedColumns = useMemo(() => allColumns.slice(0, 3), [allColumns]);

  const handleClickCreateCustomItem = useCallback<
    MouseEventHandler<HTMLButtonElement>
  >(() => {
    console.log("handleClickCreateCustomItem() called");
  }, []);

  const columnModel = useMemo(
    () => new ColumnModel(allColumns, selectedColumns),
    [allColumns, selectedColumns],
  );

  return (
    <>
      <ColumnPickerTemplate columnModel={columnModel} />
      <Button onClick={handleClickCreateCustomItem}>
        Create calculated column
      </Button>
    </>
  );
};

const instrumentsSchema = getSchema("instruments");

const TableWithColumnPickerTemplate = () => {
  const { VuuDataSource } = useData();

  const initialConfig = useMemo<TableConfig>(
    () => ({
      columns: instrumentsSchema.columns.filter(({ name }) =>
        ["bbg", "currency", "description", "exchange"].includes(name),
      ),
      rowSeparators: true,
      zebraStripes: true,
    }),
    [],
  );

  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: initialConfig.columns.map(toColumnName),
        table: instrumentsSchema.table,
      }),
    [VuuDataSource, initialConfig],
  );

  const { columnModel, onTableConfigChange, tableConfig } = useTableConfig({
    availableColumns: instrumentsSchema.columns,
    config: initialConfig,
    dataSource,
  });

  return (
    <>
      <div style={{ flex: "1 1 auto" }}>
        <Table
          config={tableConfig}
          dataSource={dataSource}
          onConfigChange={onTableConfigChange}
        />
      </div>
      <TableFooter>
        <DataSourceStats dataSource={dataSource} />
        <TableFooterTray>
          <ColumnPickerAction columnModel={columnModel} />
        </TableFooterTray>
      </TableFooter>
    </>
  );
};

/**
 * A Table with a TableFooter. The footer action opens a ColumnPicker in the
 * ContextPanel. Columns added or removed in the picker are added to or removed
 * from the Table, columns removed with the Table column menu are removed from
 * the picker.
 */
export const TableWithColumnPicker = () => (
  <DemoTableContainer>
    <TableWithColumnPickerTemplate />
  </DemoTableContainer>
);
