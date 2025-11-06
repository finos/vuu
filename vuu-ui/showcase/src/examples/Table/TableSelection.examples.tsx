import { getSchema } from "@vuu-ui/vuu-data-test";
import { TableSchema } from "@vuu-ui/vuu-data-types";
import { Table, TableProps } from "@vuu-ui/vuu-table";
import { DataSourceStats } from "@vuu-ui/vuu-table-extras";
import {
  ColumnLayout,
  SelectionChangeHandler,
  TableConfig,
} from "@vuu-ui/vuu-table-types";
import { toColumnName, useData } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";

import "./Misc.examples.css";

type DataTableProps = Partial<
  Omit<TableProps, "config"> & { config?: Partial<TableConfig> }
> & {
  schema?: TableSchema;
};

const DataTableTemplate = ({
  allowCellBlockSelection,
  allowSelectAll,
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
  const { VuuDataSource } = useData();
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
    <>
      <Table
        {...props}
        allowCellBlockSelection={allowCellBlockSelection}
        allowSelectAll={allowSelectAll}
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
      <div style={{ height: 40 }}>
        <DataSourceStats dataSource={dataSource} itemLabel="instrument" />
      </div>
    </>
  );
};

/** tags=data-consumer */
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
    <DataTableTemplate
      allowCellBlockSelection
      allowSelectAll
      config={config}
      height={height}
      selectionModel="checkbox"
      width={width}
    />
  );
};

/** tags=data-consumer */
export const CellBlockSelectionOnly = () => {
  return <DataTableTemplate allowCellBlockSelection selectionModel="none" />;
};

/** tags=data-consumer */
export const CellBlockCheckboxSelection = () => {
  return (
    <DataTableTemplate allowCellBlockSelection selectionModel="checkbox" />
  );
};

/** tags=data-consumer */
export const CellBlockRowSelection = () => {
  return (
    <DataTableTemplate
      allowCellBlockSelection
      selectionModel="extended"
      navigationStyle="row"
    />
  );
};

/** tags=data-consumer */
export const AutoSelectFirstRow = () => {
  const handleSelectionChange: SelectionChangeHandler = (selection) => {
    console.log(`selection changed ${JSON.stringify(selection)}`);
  };
  return (
    <DataTableTemplate
      allowCellBlockSelection
      autoSelectFirstRow
      onSelectionChange={handleSelectionChange}
      selectionModel="extended"
      navigationStyle="row"
    />
  );
};

/** tags=data-consumer */
export const AutoSelectByKey = () => {
  const handleSelectionChange: SelectionChangeHandler = (selection) => {
    console.log(`selection changed ${JSON.stringify(selection)}`);
  };
  return (
    <DataTableTemplate
      allowCellBlockSelection
      autoSelectRowKey="AAOU.MI"
      onSelectionChange={handleSelectionChange}
      selectionModel="extended"
      navigationStyle="row"
    />
  );
};
