import { getSchema, simulModule } from "@finos/vuu-data-test";
import type { DataSourceFilter } from "@finos/vuu-data-types";
import { FilterBar, FilterBarProps } from "@finos/vuu-filters";
import {
  FlexboxLayout,
  LayoutProvider,
  StackLayout,
  View,
} from "@finos/vuu-layout";
import { ContextPanel } from "@finos/vuu-shell";
import { Table, TableProps } from "@finos/vuu-table";
import { IconButton, Tab, Tabstrip } from "@finos/vuu-ui-controls";
import { useCallback, useMemo } from "react";

import "./SimpleApp.css";

let displaySequence = 1;

const classBase = "vuuSimpleApp";

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
      showColumnHeaderMenus: false,
    }),
    [schema]
  );

  const handleApplyFilter = useCallback((filter: DataSourceFilter) => {
    console.log(`applyFilter`, {
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
      showColumnHeaderMenus: false,
    }),
    [schema]
  );

  return (
    <LayoutProvider>
      <FlexboxLayout
        className={classBase}
        style={{ height: "100vh", width: "100vw" }}
      >
        <FlexboxLayout
          style={{ height: "100%", flexDirection: "column", width: "100%" }}
        >
          <div
            className={`${classBase}-appHeader`}
            style={{
              background: "var(--salt-container-primary-background)",
              borderBottom:
                "solid 1px var(--salt-container-primary-borderColor)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              height: 38,
            }}
          >
            <span className={`${classBase}-logo`}>Logo</span>
            <Tabstrip
              activeTabIndex={0}
              className="main-tabs"
              variant="primary"
            >
              <Tab>Orders</Tab>
              <Tab>Timeline</Tab>
              <Tab>Reports</Tab>
            </Tabstrip>
          </div>

          <FlexboxLayout style={{ flex: 1 }}>
            <StackLayout id={`${classBase}-main`} showTabs={false}>
              <FlexboxLayout style={{ flexDirection: "column" }}>
                <View style={{ flex: 1 }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div className={`${classBase}-toolbar`}>
                      <FilterBar {...filterBarProps} />
                      <div
                        className={`${classBase}-tooltray`}
                        data-align="right"
                      >
                        <IconButton
                          data-embedded
                          icon="settings"
                          size={20}
                          variant="secondary"
                        />
                      </div>
                    </div>
                    <Table {...tableProps1} />
                  </div>
                </View>
                <View style={{ flex: 1 }}>
                  <Table {...tableProps2} />
                </View>
              </FlexboxLayout>
            </StackLayout>

            <ContextPanel id="context-panel" />
          </FlexboxLayout>
        </FlexboxLayout>
      </FlexboxLayout>
    </LayoutProvider>
  );
};
SimpleApp.displaySequence = displaySequence++;
