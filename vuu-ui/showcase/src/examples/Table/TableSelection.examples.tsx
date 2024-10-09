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
import { TableConfig } from "@finos/vuu-table-types";
import { useDataSource } from "@finos/vuu-utils";

let displaySequence = 1;

type DataTableProps = Partial<
  Omit<TableProps, "config"> & { config?: Partial<TableConfig> }
> & {
  schema?: TableSchema;
};

const DataTableTemplate = ({
  allowCellBlockSelection,
  dataSource: dataSourceProp,
  maxViewportRowLimit,
  navigationStyle = "cell",
  rowHeight,
  schema = getSchema("instruments"),
  selectionModel,
  viewportRowLimit,
  width = 600,
  ...props
}: DataTableProps) => {
  const { VuuDataSource } = useDataSource();
  const tableConfig = useMemo<TableConfig>(() => {
    return {
      ...props.config,
      columns: schema.columns,
      rowSeparators: false,
      zebraStripes: true,
    };
  }, [props.config, schema]);

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
      height={500}
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

export const CheckboxSelection = () => {
  const tableProps = useMemo<
    Pick<TableProps, "config" | "dataSource" | "selectionModel">
  >(() => {
    const tableName: SimulTableName = "instruments";
    return {
      config: {
        columns: getSchema(tableName).columns,
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource:
        vuuModule<SimulTableName>("SIMUL").createDataSource(tableName),
      selectionModel: "checkbox",
    };
  }, []);

  const onSelect = useCallback((row) => {
    console.log("onSelect", { row });
  }, []);
  const onSelectionChange = useCallback((selected) => {
    console.log("onSelectionChange", { selected });
  }, []);

  return (
    <Table
      {...tableProps}
      height={645}
      navigationStyle="row"
      renderBufferSize={5}
      onSelect={onSelect}
      onSelectionChange={onSelectionChange}
      width={723}
    />
  );
};
CheckboxSelection.displaySequence = displaySequence++;

export const CellBlockSelection = () => {
  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <DataTableTemplate allowCellBlockSelection selectionModel="none" />
    </LocalDataSourceProvider>
  );
};
CellBlockSelection.displaySequence = displaySequence++;
