import { getSchema } from "@vuu-ui/vuu-data-test";
import { TableSchema } from "@vuu-ui/vuu-data-types";
import { Table, TableProps } from "@vuu-ui/vuu-table";
import { DataSourceStats } from "@vuu-ui/vuu-table-extras";
import {
  ColumnLayout,
  SelectionChangeHandler,
  TableConfig,
  TableRowSelectHandler,
} from "@vuu-ui/vuu-table-types";
import { toColumnName, useData } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo } from "react";

import "./Misc.examples.css";
import "./TableSelection.examples.css";
import { Button } from "@salt-ds/core";

type DataTableProps = Partial<
  Omit<TableProps, "config"> & { config?: Partial<TableConfig> }
> & {
  schema?: TableSchema;
};

const DataTableTemplate = ({
  allowCellBlockSelection,
  allowSelectAll,
  colHeaderRowHeight = 24,
  config: configProp,
  dataSource: dataSourceProp,
  height = 500,
  maxViewportRowLimit,
  navigationStyle = "cell",
  rowHeight,
  rowSelectionBorder = true,
  schema = getSchema("instruments"),
  selectionModel,
  viewportRowLimit,
  width = 1000,
  ...props
}: DataTableProps) => {
  const { VuuDataSource } = useData();
  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columnSeparators: true,
      rowSeparators: true,
      zebraStripes: true,
      ...configProp,
      columns: schema.columns,
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

  const deselectAll = useCallback(() => {
    dataSource.select?.({
      type: "DESELECT_ALL",
    });
  }, [dataSource]);

  return (
    <>
      <div>
        <Button onClick={deselectAll}>Deselect All</Button>
      </div>
      <Table
        {...props}
        allowCellBlockSelection={allowCellBlockSelection}
        allowSelectAll={allowSelectAll}
        colHeaderRowHeight={colHeaderRowHeight}
        config={tableConfig}
        data-testid="table"
        dataSource={dataSource}
        height={height}
        maxViewportRowLimit={maxViewportRowLimit}
        navigationStyle={navigationStyle}
        renderBufferSize={20}
        rowHeight={rowHeight}
        rowSelectionBorder={rowSelectionBorder}
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
  checkboxColumnWidth,
  columnLayout,
  height = 645,
  width = 1000,
}: {
  checkboxColumnWidth?: number;
  columnLayout?: ColumnLayout;
  height?: number;
  width?: "100%" | number;
}) => {
  const config = useMemo<Partial<TableConfig>>(() => {
    return {
      checkboxColumnWidth,
      columnLayout,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, [checkboxColumnWidth, columnLayout]);

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
export const CheckboxSelectionFillWidth = () => (
  <CheckboxSelection width="100%" />
);

/** tags=data-consumer */
export const CheckboxSelectionCustomCheckbox = () => (
  <CheckboxSelection checkboxColumnWidth={50} />
);

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
export const SingleSelection = () => {
  return <DataTableTemplate allowCellBlockSelection selectionModel="single" />;
};

/** tags=data-consumer */
export const ExtendedSelection = () => {
  return <DataTableTemplate selectionModel="extended" />;
};

/** tags=data-consumer */
export const CustomSelectionStyling = () => {
  return (
    <div style={{ padding: 100 }}>
      <DataTableTemplate
        className="custom-selection-styling"
        config={{
          columnSeparators: false,
          selectionBookendWidth: 10,
          zebraStripes: false,
        }}
        rowHeight={40}
        selectionModel="extended"
        width={800}
      />
    </div>
  );
};

/** tags=data-consumer */
export const SingleSelectionNoDeselect = () => {
  const handleSelect = useCallback<TableRowSelectHandler>((row) => {
    console.log(`onSelect ${JSON.stringify(row)}`);
  }, []);
  return (
    <DataTableTemplate
      allowCellBlockSelection
      onSelect={handleSelect}
      schema={getSchema("parentOrders")}
      selectionModel="single-no-deselect"
    />
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
