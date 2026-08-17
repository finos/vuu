import { Button, FlexLayout, SidePanel, SidePanelCloseButton, SidePanelContent, SidePanelHeader, SidePanelProvider, SidePanelTitle, SidePanelTrigger, Toolbar } from "@salt-ds/core";
import { getSchema, LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { Table } from "@vuu-ui/vuu-table";
import { TableConfig, TableRowSelectHandler } from "@vuu-ui/vuu-table-types";
import { SelectionChangeHandler } from "@vuu-ui/vuu-table-types";
import { useData } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useState } from "react";
import { useAutoLoginToVuuServer } from "../utils";
import { toColumnName } from "@vuu-ui/vuu-utils";
import { View } from "@vuu-ui/vuu-layout";

/** tags=data-consumer */
export const SimpleSidePanel = () => {
  useAutoLoginToVuuServer();
  const { VuuDataSource } = useData();
  const schema = getSchema("instruments");
  const [open, setOpen] = useState(false);
  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: schema.columns.map(toColumnName),
        table: schema.table,
      }),
    [VuuDataSource, schema],
  );
  const config: TableConfig = useMemo(
    () => ({
      columns: schema.columns.filter((col) => col.name !== "vuuMsg"),
    }),
    [schema.columns],
  );

  const handleSelect = useCallback<TableRowSelectHandler>(
    (dataRow) => {
      if (dataRow) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    },
    [],
  );

  return (
    <LocalDataSourceProvider>
      <SidePanelProvider open={open} onOpenChange={setOpen}>
        <FlexLayout
          style={{
            width: "100%",
            height: 300,
            border:
              "var(--salt-size-fixed-100) var(--salt-borderStyle-solid) var(--salt-container-bold-borderColor)",
            borderRadius: "var(--salt-palette-corner-weak)",
          }}
          gap={0}
        >
          <div style={{ flex: '1 1 auto', height: 'fit-content', overflow: 'hidden' }}>
            <Table
              config={config}
              dataSource={dataSource}
              height={645}
              onSelect={handleSelect}
              renderBufferSize={10}
              resizeStrategy="defer"
              selectionModel="single"
              style={{ "flex": "1 1 auto" }}
              width="auto"
            />
          </div>
          <SidePanel position="right">
            <SidePanelHeader>
              <SidePanelTitle>Section Title</SidePanelTitle>
              <SidePanelCloseButton />
            </SidePanelHeader>
            <SidePanelContent>
              <div style={{ background: 'red' }} />
            </SidePanelContent>
          </SidePanel>
        </FlexLayout>
      </SidePanelProvider>
    </LocalDataSourceProvider>
  );
};

/** tags=data-consumer */
export const FlexSidePanel = () => {
  useAutoLoginToVuuServer();
  const { VuuDataSource } = useData();
  const schema = getSchema("instruments");
  const [open, setOpen] = useState(false);
  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: schema.columns.map(toColumnName),
        table: schema.table,
      }),
    [VuuDataSource, schema],
  );
  const config: TableConfig = useMemo(
    () => ({
      columns: schema.columns.filter((col) => col.name !== "vuuMsg"),
    }),
    [schema.columns],
  );

  const handleSelect = useCallback<TableRowSelectHandler>(
    (dataRow) => {
      if (dataRow) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    },
    [],
  );

  return (
    <LocalDataSourceProvider>
      <Toolbar>
        <Button onClick={() => setOpen(true)}>Open right panel</Button>
      </Toolbar>
      <SidePanelProvider open={open} onOpenChange={setOpen}>
        <FlexLayout direction="column" style={{ width: "100%", height: 700 }} gap={0}>
          <div style={{ width: "100%", height: 100, background: "yellow" }} />
          <FlexLayout direction="row" style={{ width: "100%", flex: 1, minHeight: 0 }} gap={0}>
            <div style={{ flex: '0 0 300px', background: "blue" }} />
            <FlexLayout
              style={{
                flex: "1 1 auto",
                minWidth: 0,
                border:
                  "var(--salt-size-fixed-100) var(--salt-borderStyle-solid) var(--salt-container-bold-borderColor)",
                borderRadius: "var(--salt-palette-corner-weak)",
              }}
              gap={0}
            >
              <div style={{ flex: "1 1 auto", minWidth: 0, minHeight: 0, overflow: "hidden" }}>
                <Table
                  config={config}
                  dataSource={dataSource}
                  onSelect={handleSelect}
                  renderBufferSize={10}
                  resizeStrategy="defer"
                  selectionModel="single"
                  style={{ flex: "1 1 auto" }}
                  width="auto"
                />
              </div>
              <SidePanel position="right">
                <SidePanelHeader>
                  <SidePanelTitle>Section Title</SidePanelTitle>
                  <SidePanelCloseButton />
                </SidePanelHeader>
                <SidePanelContent>
                  <div style={{ background: "red" }} />
                </SidePanelContent>
              </SidePanel>
            </FlexLayout>
            <div style={{ flex: '0 0 80px', background: "blue" }} />
          </FlexLayout>
          <div style={{ width: "100%", height: 100, background: "yellow" }} />
        </FlexLayout>
      </SidePanelProvider>
    </LocalDataSourceProvider>
  );
};
