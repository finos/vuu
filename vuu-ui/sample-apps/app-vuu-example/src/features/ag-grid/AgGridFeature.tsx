// import { useViewContext } from "@finos/vuu-layout";
import { useMemo } from "react";
import "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { useAgGridDataSource } from "@finos/vuu-data-ag-grid";
import { createColumnDefs } from "./createColumnDefs";

import { TableSchema } from "@finos/vuu-data";

import { FeatureProps } from "@finos/vuu-shell";

import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-balham.css";
import "./AgGridFeature.css";

export interface FilteredGridProps extends FeatureProps {
  schema: TableSchema;
}

const AgGridFeature = ({ schema }: FilteredGridProps) => {
  // const { id, dispatch, load, purge, save, loadSession, saveSession } =
  //   useViewContext();
  // const config = useMemo(() => load(), [load]);

  const dataSourceConfig = useMemo(() => {
    return {
      bufferSize: 100,
      columns: [
        "bbg",
        "currency",
        "description",
        "exchange",
        "isin",
        "lotSize",
        "ric",
      ],
      table: { table: "instruments", module: "SIMUL" },
      serverUrl: "127.0.0.1:8090/websocket",
    };
  }, []);

  const { createFilterDataProvider, ...gridConfig } =
    useAgGridDataSource(dataSourceConfig);

  const columnDefs = useMemo(
    () => createColumnDefs(createFilterDataProvider(schema.table)),
    [createFilterDataProvider, schema.table]
  );

  console.log({ columnDefs, gridConfig });

  // useEffect(() => {
  //   dataSource.enable();
  //   return () => {
  //     dataSource.disable();
  //   };
  // }, [dataSource]);

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
