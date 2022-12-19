// import { useViewContext } from "@finos/vuu-layout";
import { useEffect, useMemo } from "react";
import "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { useViewportRowModel } from "@finos/vuu-data-ag-grid";
import { createColumnDefs } from "./createColumnDefs";

import {
  createDataSource,
  RemoteDataSource,
  TableSchema,
} from "@finos/vuu-data";

import { FeatureProps } from "@finos/vuu-shell";

import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-balham.css";
import "./AgGridFeature.css";
import { useViewContext } from "@finos/vuu-layout";

export interface FilteredGridProps extends FeatureProps {
  schema: TableSchema;
}

const AgGridFeature = ({ schema }: FilteredGridProps) => {
  const { id, dispatch, load, purge, save, loadSession, saveSession } =
    useViewContext();
  const config = useMemo(() => load(), [load]);

  console.log({ config, schema });

  const dataSource: RemoteDataSource = useMemo(() => {
    let ds = loadSession("data-source");
    if (ds) {
      return ds;
    }
    ds = createDataSource({ id, table: schema.table, schema, config });
    saveSession(ds, "data-source");
    return ds;
  }, [config, id, loadSession, saveSession, schema]);

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

  console.log({ columnDefs, gridConfig });

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
