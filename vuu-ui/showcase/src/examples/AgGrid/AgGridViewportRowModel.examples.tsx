import { useViewportRowModel } from "@finos/vuu-data-ag-grid";
import { View } from "@finos/vuu-layout";
import "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";
import { ErrorDisplay, useTestDataSource } from "../utils";
import { createColumnDefs } from "./createColumnDefs";
import { getAllSchemas } from "@finos/vuu-data-test";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";

// import "./VuuAgGrid.css";
// import "./VuuGrid.css";

let displaySequence = 0;

const schemas = getAllSchemas();

export const AgGridTables = () => {
  const { dataSource, error, tableSchema } = useTestDataSource({
    schemas,
  });

  const { columns, table } = tableSchema;

  const { createFilterDataProvider, ...gridConfig } = useViewportRowModel({
    dataSource,
  });

  const columnDefs = useMemo(
    () => createColumnDefs(createFilterDataProvider(table), columns),
    [createFilterDataProvider, columns, table]
  );

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }

  return (
    <View style={{ width: 800, height: 500 }} className="ag-theme-balham">
      <AgGridReact
        {...gridConfig}
        columnDefs={columnDefs}
        headerHeight={24}
        rowGroupPanelShow="always"
        rowHeight={18}
      />
    </View>
  );
};
AgGridTables.displaySequence = displaySequence++;
