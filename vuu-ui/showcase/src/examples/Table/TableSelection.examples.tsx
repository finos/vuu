import {
  getSchema,
  LocalDataSourceProvider,
  SimulTableName,
  vuuModule,
} from "@finos/vuu-data-test";
import { Table, TableProps } from "@finos/vuu-table";
import { useCallback, useMemo } from "react";

import "./Table.examples.css";
import { TableSchema } from "@finos/vuu-data-types";
import { ColumnLayout, TableConfig } from "@finos/vuu-table-types";
import { useDataSource } from "@finos/vuu-utils";

let displaySequence = 1;

type DataTableProps = Partial<
  Omit<TableProps, "config"> & { config?: Partial<TableConfig> }
> & {
  schema?: TableSchema;
};

const DataTableTemplate = ({
  allowCellBlockSelection,
  config: configProp,
  dataSource: dataSourceProp,
  height = 500,
  maxViewportRowLimit,
  navigationStyle = "cell",
  rowHeight,
  schema = getSchema("instruments"),
  selectionModel,
  viewportRowLimit,
  width = 1000,
  ...props
}: DataTableProps) => {
  const { VuuDataSource } = useDataSource();
  const tableConfig = useMemo<TableConfig>(() => {
    return {
      ...configProp,
      columns: schema.columns,
      rowSeparators: false,
      zebraStripes: true,
    };
  }, [configProp, schema]);

  const dataSource = useMemo(() => {
    return dataSourceProp ?? new VuuDataSource({ table: schema.table });
  }, [VuuDataSource, dataSourceProp, schema.table]);

  return (
    <Table
      {...props}
      allowCellBlockSelection={allowCellBlockSelection}
      config={tableConfig}
      data-testid="table"
      dataSource={dataSource}
      height={height}
      maxViewportRowLimit={maxViewportRowLimit}
      navigationStyle={navigationStyle}
      renderBufferSize={20}
      rowHeight={rowHeight}
      selectionModel={selectionModel}
      viewportRowLimit={viewportRowLimit}
      width={width}
    />
  );
};

export const CheckboxSelection = ({
  columnLayout,
  height = 645,
  width = 1000,
}: {
  columnLayout?: ColumnLayout;
  height?: number;
  width?: number;
}) => {
  const config = useMemo<Partial<TableConfig>>(() => {
    return {
      columnLayout,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, [columnLayout]);

  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <DataTableTemplate
        allowCellBlockSelection
        config={config}
        height={height}
        selectionModel="checkbox"
        width={width}
      />
    </LocalDataSourceProvider>
  );
};
CheckboxSelection.displaySequence = displaySequence++;

export const CellBlockSelectionOnly = () => {
  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <DataTableTemplate allowCellBlockSelection selectionModel="none" />
    </LocalDataSourceProvider>
  );
};
CellBlockSelectionOnly.displaySequence = displaySequence++;

export const CellBlockCheckboxSelection = () => {
  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <DataTableTemplate allowCellBlockSelection selectionModel="checkbox" />
    </LocalDataSourceProvider>
  );
};
CellBlockCheckboxSelection.displaySequence = displaySequence++;

export const CellBlockRowSelection = () => {
  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <DataTableTemplate
        allowCellBlockSelection
        selectionModel="extended"
        navigationStyle="row"
      />
    </LocalDataSourceProvider>
  );
};
CellBlockRowSelection.displaySequence = displaySequence++;
