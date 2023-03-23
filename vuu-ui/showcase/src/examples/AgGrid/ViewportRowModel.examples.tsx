import { useViewportRowModel } from "@finos/vuu-data-ag-grid";
import { View } from "@finos/vuu-layout";
import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupChangeEventHandler,
} from "@heswell/salt-lab";
import { SaltProvider } from "@salt-ds/core";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { useMemo, useState } from "react";
import { ErrorDisplay, useSchemas, useTestDataSource } from "../utils";
import { createColumnDefs } from "./createColumnDefs";

import "./VuuAgGrid.css";
import "./VuuGrid.css";

let displaySequence = 0;

export const AgGridTables = () => {
  const [columnConfig, tables] = useMemo(
    () => [
      {
        description: { editable: true },
      },
      ["instruments", "orders", "parentOrders", "childOrders", "prices"],
    ],
    []
  );
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const { schemas } = useSchemas();
  const { columns, dataSource, error } = useTestDataSource({
    columnConfig,
    schemas,
    tablename: tables[selectedIndex],
  });

  const table = useMemo(
    () => ({ module: "SIMUL", table: tables[selectedIndex] }),
    [selectedIndex, tables]
  );

  const { createFilterDataProvider, ...gridConfig } = useViewportRowModel({
    dataSource,
  });

  const columnDefs = useMemo(
    () => createColumnDefs(createFilterDataProvider(table), columns),
    [createFilterDataProvider, columns, table]
  );

  const handleChange: ToggleButtonGroupChangeEventHandler = (_event, index) => {
    setSelectedIndex(index);
  };

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }

  return (
    <SaltProvider density="high">
      <ToggleButtonGroup onChange={handleChange} selectedIndex={selectedIndex}>
        <ToggleButton tooltipText="Alert">Instruments</ToggleButton>
        <ToggleButton tooltipText="Home">Orders</ToggleButton>
        <ToggleButton tooltipText="Print">Parent Orders</ToggleButton>
        <ToggleButton tooltipText="Child Orders">Child Orders</ToggleButton>
        <ToggleButton tooltipText="Prices">Prices</ToggleButton>
      </ToggleButtonGroup>

      <View style={{ width: 800, height: 500 }} className="ag-theme-balham">
        <AgGridReact
          {...gridConfig}
          columnDefs={columnDefs}
          headerHeight={24}
          rowGroupPanelShow="always"
          rowHeight={18}
        />
      </View>
    </SaltProvider>
  );
};
AgGridTables.displaySequence = displaySequence++;
