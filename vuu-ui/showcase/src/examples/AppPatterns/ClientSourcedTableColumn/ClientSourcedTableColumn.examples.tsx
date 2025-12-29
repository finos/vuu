import { getSchema, LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { DataSourceFilter, type TableSchema } from "@vuu-ui/vuu-data-types";
import { Table, type TableProps } from "@vuu-ui/vuu-table";
import type {
  ColumnDescriptor,
  TableConfig,
  TableRowSelectHandler,
} from "@vuu-ui/vuu-table-types";
import { registerComponent, toColumnName, useData } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo } from "react";
import { PinButtonCell } from "./pin-button-cell";
import {
  ClientTableColumnProvider,
  useClientTableColumn,
} from "./ClientTableColumnProvider/ClientTableColumnProvider";
import { TableSearch } from "@vuu-ui/vuu-ui-controls";
import {
  FlexboxLayout,
  Header,
  LayoutContainer,
  LayoutProvider,
  View,
} from "@vuu-ui/vuu-layout";

registerComponent("pin-button", PinButtonCell, "cell-renderer", {
  userCanAssign: false,
});

const TableTemplate = ({
  filter,
  config,
  highlightedIndex,
  maxViewportRowLimit,
  navigationStyle,
  schema,
  viewportRowLimit,
  height = viewportRowLimit === undefined && maxViewportRowLimit === undefined
    ? 645
    : undefined,
  width = 723,
  ...props
}: {
  columns?: ColumnDescriptor[];
  filter?: DataSourceFilter;
  schema: TableSchema;
} & Partial<TableProps>) => {
  const { VuuDataSource } = useData();

  const tableConfig = useMemo<TableConfig>(() => {
    return (
      config ?? {
        columns: schema.columns,
        rowSeparators: true,
        zebraStripes: true,
      }
    );
  }, [config, schema]);

  const dataSource = useMemo(() => {
    return new VuuDataSource({
      columns: tableConfig.columns.map(toColumnName),
      // baseFilter would be ideal for this but it doesn't work
      filterSpec: filter,
      table: schema.table,
    });
  }, [VuuDataSource, tableConfig.columns, filter, schema.table]);

  return (
    <Table
      {...props}
      config={tableConfig}
      data-testid="table"
      dataSource={dataSource}
      height={height}
      highlightedIndex={highlightedIndex}
      maxViewportRowLimit={maxViewportRowLimit}
      navigationStyle={navigationStyle}
      renderBufferSize={5}
      viewportRowLimit={viewportRowLimit}
      width={width}
    />
  );
};

const TableSearchTemplate = ({
  schema,
  TableProps,
}: {
  schema: TableSchema;
  TableProps: Omit<TableProps, "dataSource">;
}) => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    const { table } = schema;
    const dataSource = new VuuDataSource({
      columns: schema.columns.map((c) => c.name),
      table,
    });
    return dataSource;
  }, [VuuDataSource, schema]);

  return (
    <TableSearch
      TableProps={{ ...TableProps, dataSource }}
      autoFocus
      searchColumns={["description"]}
      style={{ height: 400, width: 250 }}
    />
  );
};

const PinColumn: ColumnDescriptor = {
  className: "vuuIconCell",
  label: "",
  maxWidth: 24,
  name: "pinned",
  source: "client",
  type: {
    name: "boolean",
    renderer: {
      name: "pin-button",
    },
  },
  width: 24,
};

export const PinItemButton = () => {
  const schema = getSchema("instruments");

  return (
    <LocalDataSourceProvider>
      <ClientTableColumnProvider>
        <TableTemplate
          config={{
            columnLayout: "fit",
            columns: [{ name: "description" }, PinColumn],
            selectionBookendWidth: 0,
          }}
          height="auto"
          maxViewportRowLimit={15}
          rowHeight={24}
          navigationStyle="row"
          schema={schema}
          showColumnHeaderMenus={false}
          style={{ border: "solid 1px lightgray" }}
        />
      </ClientTableColumnProvider>
    </LocalDataSourceProvider>
  );
};

export const SearchWithPin = () => {
  const schema = getSchema("instruments");

  return (
    <LocalDataSourceProvider>
      <ClientTableColumnProvider>
        <TableSearchTemplate
          TableProps={{
            config: {
              columnLayout: "fit",
              columns: [{ name: "description" }, PinColumn],
              selectionBookendWidth: 0,
            },
            rowHeight: 24,
            navigationStyle: "row",
            showColumnHeaderMenus: false,
            style: { border: "solid 1px lightgray" },
          }}
          schema={schema}
        />
      </ClientTableColumnProvider>
    </LocalDataSourceProvider>
  );
};

const EmptyRecent = () => {
  return <div style={{ padding: "12px 6px" }}>No recently viewed items</div>;
};
const EmptyPinned = () => {
  return (
    <div style={{ padding: "12px 6px" }}>
      No Instruments have been pinned. Use the pin icon in the search list below
    </div>
  );
};

const RecentlyUsedItemsTable = ({ schema }: { schema: TableSchema }) => {
  const { recent } = useClientTableColumn();
  const filter =
    recent.length === 0
      ? 'ric in ["NA"]'
      : `ric in [${recent.map((v) => `"${v}"`).join(",")}]`;

  return (
    <TableTemplate
      EmptyDisplay={EmptyRecent}
      config={{
        columnLayout: "fit",
        columns: [{ name: "description" }],
        selectionBookendWidth: 0,
      }}
      filter={{
        filter,
      }}
      rowHeight={24}
      maxViewportRowLimit={6}
      navigationStyle="row"
      schema={schema}
      showColumnHeaders={false}
      style={{ border: "solid 1px lightgray" }}
      width="100%"
    />
  );
};

const PinnedItemsTable = ({ schema }: { schema: TableSchema }) => {
  const { allValues } = useClientTableColumn();
  const filter =
    allValues.length === 0
      ? 'ric in ["NA"]'
      : `ric in [${allValues.map((v) => `"${v}"`).join(",")}]`;

  return (
    <TableTemplate
      EmptyDisplay={EmptyPinned}
      config={{
        columnLayout: "fit",
        columns: [{ name: "description" }, PinColumn],
        selectionBookendWidth: 0,
      }}
      filter={{
        filter,
      }}
      rowHeight={24}
      maxViewportRowLimit={10}
      navigationStyle="row"
      schema={schema}
      showColumnHeaders={false}
      style={{ border: "solid 1px lightgray" }}
      width="100%"
    />
  );
};

const SearchItemsTable = ({ schema }: { schema: TableSchema }) => {
  const { itemUsed } = useClientTableColumn();

  const onSelect = useCallback<TableRowSelectHandler>(
    (row) => {
      if (row) {
        itemUsed(row.key);
      }
    },
    [itemUsed],
  );

  return (
    <TableSearchTemplate
      TableProps={{
        config: {
          columnLayout: "fit",
          columns: [{ name: "description" }, PinColumn],
          selectionBookendWidth: 0,
        },
        rowHeight: 24,
        navigationStyle: "row",
        onSelect,
        showColumnHeaderMenus: false,
        style: { border: "solid 1px lightgray" },
      }}
      schema={schema}
    />
  );
};

export const SearchAndPinned = () => {
  const schema = getSchema("instruments");

  return (
    <LocalDataSourceProvider>
      <ClientTableColumnProvider>
        <LayoutProvider>
          <FlexboxLayout
            style={{ flexDirection: "column", height: "100%", width: 260 }}
          >
            <View
              closeable
              collapsed={false}
              header={{ closeable: true }}
              style={{ flexBasis: "auto", flexGrow: 0, flexShrink: 0 }}
              title="Recently Viewed Instruments"
            >
              <RecentlyUsedItemsTable schema={schema} />
            </View>
            <View
              closeable
              collapsed={false}
              header={{ closeable: true }}
              style={{ flexBasis: "auto", flexGrow: 0, flexShrink: 0 }}
              title="Pinned Instruments"
            >
              <PinnedItemsTable schema={schema} />
            </View>
            <View
              collapsed={false}
              header
              style={{ flexBasis: 0, flexGrow: 1, flexShrink: 1 }}
              title="Browse Instruments"
            >
              <SearchItemsTable schema={schema} />
            </View>
          </FlexboxLayout>
        </LayoutProvider>
      </ClientTableColumnProvider>
    </LocalDataSourceProvider>
  );
};

export const SearchAndPinnedWithAdditionalContent = () => {
  const schema = getSchema("instruments");

  return (
    <LocalDataSourceProvider>
      <ClientTableColumnProvider>
        <LayoutProvider>
          <LayoutContainer
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              width: 300,
            }}
          >
            <Header style={{ height: 48 }} title="Instruments" />
            <FlexboxLayout
              style={{
                flexBasis: "auto",
                flexGrow: 1,
                flexDirection: "column",
              }}
            >
              <View
                closeable
                collapsed={false}
                header={{ closeable: true }}
                style={{ flexBasis: "auto", flexGrow: 0, flexShrink: 0 }}
                title="Recently Viewed Instruments"
              >
                <RecentlyUsedItemsTable schema={schema} />
              </View>
              <View
                closeable
                collapsed={false}
                header={{ closeable: true }}
                style={{ flexBasis: "auto", flexGrow: 0, flexShrink: 0 }}
                title="Pinned Instruments"
              >
                <PinnedItemsTable schema={schema} />
              </View>
              <View
                collapsed={false}
                header
                style={{ flexBasis: 0, flexGrow: 1, flexShrink: 1 }}
                title="Browse Instruments"
              >
                <SearchItemsTable schema={schema} />
              </View>
            </FlexboxLayout>
            <Header style={{ height: 48 }} title="Filters" />
            <View style={{ flexBasis: "auto", flexGrow: 1 }}>
              <div style={{ background: "red", height: "100%" }} />
            </View>
          </LayoutContainer>
        </LayoutProvider>
      </ClientTableColumnProvider>
    </LocalDataSourceProvider>
  );
};
