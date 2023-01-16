// import { useViewContext } from "@finos/vuu-layout";
import { useEffect, useMemo } from "react";
import "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { useViewportRowModel } from "@finos/vuu-data-ag-grid";
import { createColumnDefs } from "./createColumnDefs";

import {
  DataSourceVisualLinkCreatedMessage,
  RemoteDataSource,
  TableSchema,
} from "@finos/vuu-data";

import { FeatureProps } from "@finos/vuu-shell";

import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-balham.css";
import "./AgGridFeature.css";
import { useViewContext } from "@finos/vuu-layout";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuGroupBy, VuuSort } from "@finos/vuu-protocol-types";

export interface FilteredGridProps extends FeatureProps {
  schema: TableSchema;
}

type BlotterConfig = {
  columns?: KeyedColumnDescriptor[];
  groupBy?: VuuGroupBy;
  sort?: VuuSort;
  "visual-link"?: DataSourceVisualLinkCreatedMessage;
};

const AgGridFeature = ({ schema }: FilteredGridProps) => {
  const { id, load, loadSession, saveSession, title } = useViewContext();
  const config = useMemo(() => load?.() as BlotterConfig | undefined, [load]);
  const dataSource: RemoteDataSource = useMemo(() => {
    let ds = loadSession?.("data-source") as RemoteDataSource;
    if (ds) {
      return ds;
    }
    const columns = schema.columns.map((col) => col.name);
    ds = new RemoteDataSource({
      viewport: id,
      table: schema.table,
      ...config,
      columns,
      title,
    });
    saveSession?.(ds, "data-source");
    return ds;
  }, [
    config,
    id,
    loadSession,
    saveSession,
    schema.columns,
    schema.table,
    title,
  ]);

  const { createFilterDataProvider, ...gridConfig } =
    useViewportRowModel(dataSource);

  const columnDefs = useMemo(
    () =>
      createColumnDefs(
        createFilterDataProvider(schema.table),
        schema.table.table
      ),
    [createFilterDataProvider, schema.table]
  );

  useEffect(() => {
    dataSource.enable();
    return () => {
      dataSource.disable();
    };
  }, [dataSource]);

  return (
    <div className="ag-theme-balham">
      <AgGridReact
        {...gridConfig}
        columnDefs={columnDefs}
        headerHeight={18}
        rowGroupPanelShow="always"
        rowHeight={18}
      />
    </div>
  );
};

AgGridFeature.displayName = "AgGridFeature";

export default AgGridFeature;
