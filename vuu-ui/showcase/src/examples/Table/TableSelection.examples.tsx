import { getSchema, LocalDataSourceProvider } from "@finos/vuu-data-test";
import { SelectionChangeHandler, TableSchema } from "@finos/vuu-data-types";
import { Table, TableProps } from "@finos/vuu-table";
import { ColumnLayout, TableConfig } from "@finos/vuu-table-types";
import { toColumnName, useDataSource } from "@finos/vuu-utils";
import { useMemo } from "react";

import "./Misc.examples.css";

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
      columnSeparators: true,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, [configProp, schema]);

  const dataSource = useMemo(() => {
    return (
      dataSourceProp ??
      new VuuDataSource({
        columns: schema.columns.map(toColumnName),
        table: schema.table,
      })
    );
  }, [VuuDataSource, dataSourceProp, schema]);

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
    <LocalDataSourceProvider>
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

export const CellBlockSelectionOnly = () => {
  return (
    <LocalDataSourceProvider>
      <DataTableTemplate allowCellBlockSelection selectionModel="none" />
    </LocalDataSourceProvider>
  );
};

export const CellBlockCheckboxSelection = () => {
  return (
    <LocalDataSourceProvider>
      <DataTableTemplate allowCellBlockSelection selectionModel="checkbox" />
    </LocalDataSourceProvider>
  );
};

export const CellBlockRowSelection = () => {
  return (
    <LocalDataSourceProvider>
      <DataTableTemplate
        allowCellBlockSelection
        selectionModel="extended"
        navigationStyle="row"
      />
    </LocalDataSourceProvider>
  );
};

export const PreSelectedRowByIndex = () => {
  const handleSelectionChange: SelectionChangeHandler = (selection) => {
    console.log(`selection changed ${JSON.stringify(selection)}`);
  };
  return (
    <LocalDataSourceProvider>
      <DataTableTemplate
        allowCellBlockSelection
        defaultSelectedIndexValues={[4]}
        onSelectionChange={handleSelectionChange}
        selectionModel="extended"
        navigationStyle="row"
      />
    </LocalDataSourceProvider>
  );
};

export const PreSelectedRowsByIndex = () => {
  return (
    <LocalDataSourceProvider>
      <DataTableTemplate
        allowCellBlockSelection
        defaultSelectedIndexValues={[2, 4, 6, 8]}
        selectionModel="extended"
        navigationStyle="row"
      />
    </LocalDataSourceProvider>
  );
};

export const PreSelectedRangeByIndex = () => {
  return (
    <LocalDataSourceProvider>
      <DataTableTemplate
        allowCellBlockSelection
        defaultSelectedIndexValues={[[2, 8]]}
        selectionModel="extended"
        navigationStyle="row"
      />
    </LocalDataSourceProvider>
  );
};

export const PreSelectedRowByKey = () => {
  const handleSelectionChange: SelectionChangeHandler = (selection) => {
    console.log(`selection changed ${JSON.stringify(selection)}`);
  };
  return (
    <LocalDataSourceProvider>
      <DataTableTemplate
        allowCellBlockSelection
        defaultSelectedKeyValues={["AAOZ.N"]}
        onSelectionChange={handleSelectionChange}
        selectionModel="extended"
        navigationStyle="row"
      />
    </LocalDataSourceProvider>
  );
};
