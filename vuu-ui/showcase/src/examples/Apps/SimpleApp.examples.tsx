import { FlexboxLayout, LayoutProvider, View } from "@finos/vuu-layout";
import { ContextPanel } from "@finos/vuu-shell";
import { getSchema, simulModule } from "@finos/vuu-data-test";
import { useCallback, useMemo } from "react";
import { Table, TableProps } from "@finos/vuu-table";
import { FilterTable } from "@finos/vuu-datatable";
import type { FilterBarProps } from "@finos/vuu-filters";
import type { DataSourceFilter } from "@finos/vuu-data-types";

import "./SimpleApp.css";

export const SimpleApp = () => {
  const schema = getSchema("instruments");

  const tableProps1 = useMemo<Pick<TableProps, "config" | "dataSource">>(
    () => ({
      config: {
        columns: schema.columns,
        columnDefaultWidth: 200,
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource: simulModule.createDataSource("instruments"),
    }),
    [schema]
  );

  const handleApplyFilter = useCallback((filter: DataSourceFilter) => {
    console.log(`applyFIlter`, {
      filter,
    });
  }, []);

  const filterBarProps: FilterBarProps = {
    columnDescriptors: schema.columns,
    onApplyFilter: handleApplyFilter,
    tableSchema: schema,
  };
  const tableProps2 = useMemo<Pick<TableProps, "config" | "dataSource">>(
    () => ({
      config: {
        columns: schema.columns,
        columnDefaultWidth: 200,
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource: simulModule.createDataSource("instruments"),
    }),
    [schema]
  );

  return (
    <LayoutProvider>
      <FlexboxLayout
        className="simple-app"
        style={{ height: "100vh", width: "100vw" }}
      >
        <FlexboxLayout style={{ flex: 1, flexDirection: "column", padding: 8 }}>
          <View style={{ flex: 1 }}>
            <FilterTable
              FilterBarProps={filterBarProps}
              TableProps={tableProps1}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Table {...tableProps2} />
          </View>
        </FlexboxLayout>
        <ContextPanel id="context-panel" />
      </FlexboxLayout>
    </LayoutProvider>
  );
};
