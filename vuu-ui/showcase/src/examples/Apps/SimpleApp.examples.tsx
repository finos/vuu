import { getSchema, simulModule } from "@vuu-ui/vuu-data-test";
import { FilterBar, FilterBarProps } from "@vuu-ui/vuu-filters";
import {
  FlexboxLayout,
  LayoutProvider,
  StackLayout,
  View,
} from "@vuu-ui/vuu-layout";
import { ContextPanel } from "@vuu-ui/vuu-shell";
import { Table, TableProps } from "@vuu-ui/vuu-table";
import { IconButton, Tab, Tabstrip } from "@vuu-ui/vuu-ui-controls";
import { VuuShellLocation } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo } from "react";

import "./SimpleApp.css";
import { FilterHandler } from "@vuu-ui/vuu-filter-types";

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
    [schema],
  );

  const handleApplyFilter = useCallback<FilterHandler>((filter) => {
    console.log(`applyFilter`, {
      filter,
    });
  }, []);

  const handleClearFilter = useCallback(() => {
    console.log(`clearFilter`);
  }, []);

  const filterBarProps: FilterBarProps = {
    columnDescriptors: schema.columns,
    onApplyFilter: handleApplyFilter,
    onClearFilter: handleClearFilter,
    vuuTable: schema.table,
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
    [schema],
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
              className={VuuShellLocation.Workspace}
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

            <ContextPanel />
          </FlexboxLayout>
        </FlexboxLayout>
      </FlexboxLayout>
    </LayoutProvider>
  );
};
