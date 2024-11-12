import { getSchema, LocalDataSourceProvider } from "@finos/vuu-data-test";
import { DataSourceFilter, TableSchema } from "@finos/vuu-data-types";
import { Table, TableProps } from "@finos/vuu-table";
import {
  ColumnDescriptor,
  TableConfig,
  TableRowSelectHandler,
} from "@finos/vuu-table-types";
import {
  registerComponent,
  toColumnName,
  useDataSource,
} from "@finos/vuu-utils";
import { useCallback, useMemo } from "react";
import { PinButtonCell } from "./pin-button-cell";
import {
  ClientTableColumnProvider,
  useClientTableColumn,
} from "./ClientTableColumnProvider/ClientTableColumnProvider";
import { TableSearch } from "@finos/vuu-ui-controls";
import { Flexbox, View } from "@finos/vuu-layout";

registerComponent("pin-button", PinButtonCell, "cell-renderer", {
  userCanAssign: false,
});

let displaySequence = 0;

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
  const { VuuDataSource } = useDataSource();

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
  TableProps?: Partial<TableProps>;
}) => {
  const { VuuDataSource } = useDataSource();
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
      TableProps={TableProps}
      autoFocus
      dataSource={dataSource}
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
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <ClientTableColumnProvider>
        <TableTemplate
          selectionBookendWidth={0}
          config={{
            columnLayout: "fit",
            columns: [{ name: "description" }, PinColumn],
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
PinItemButton.displaySequence = displaySequence++;

export const SearchWithPin = () => {
  const schema = getSchema("instruments");

  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <ClientTableColumnProvider>
        <TableSearchTemplate
          TableProps={{
            selectionBookendWidth: 0,
            config: {
              columnLayout: "fit",
              columns: [{ name: "description" }, PinColumn],
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
SearchWithPin.displaySequence = displaySequence++;

const EmptyDisplay = () => {
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
      EmptyDisplay={EmptyDisplay}
      config={{
        columnLayout: "fit",
        columns: [{ name: "description" }],
      }}
      filter={{
        filter,
      }}
      rowHeight={24}
      maxViewportRowLimit={6}
      navigationStyle="row"
      schema={schema}
      selectionBookendWidth={0}
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
      EmptyDisplay={EmptyDisplay}
      config={{
        columnLayout: "fit",
        columns: [{ name: "description" }, PinColumn],
      }}
      filter={{
        filter,
      }}
      rowHeight={24}
      maxViewportRowLimit={10}
      navigationStyle="row"
      schema={schema}
      selectionBookendWidth={0}
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
        selectionBookendWidth: 0,
        config: {
          columnLayout: "fit",
          columns: [{ name: "description" }, PinColumn],
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
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <ClientTableColumnProvider>
        <Flexbox
          style={{ flexDirection: "column", height: "100%", width: 240 }}
        >
          <View
            header={{ closeable: true }}
            style={{ flexBasis: "auto", flexGrow: 0, flexShrink: 0 }}
            title="Recently Viewed Instruments"
          >
            <RecentlyUsedItemsTable schema={schema} />
          </View>
          <View
            header={{ closeable: true }}
            style={{ flexBasis: "auto", flexGrow: 0, flexShrink: 0 }}
            title="Pinned Instruments"
          >
            <PinnedItemsTable schema={schema} />
          </View>
          <View
            header
            style={{ flexBasis: 0, flexGrow: 1, flexShrink: 1 }}
            title="Browse Instruments"
          >
            <SearchItemsTable schema={schema} />
          </View>
        </Flexbox>
      </ClientTableColumnProvider>
    </LocalDataSourceProvider>
  );
};
SearchAndPinned.displaySequence = displaySequence++;
