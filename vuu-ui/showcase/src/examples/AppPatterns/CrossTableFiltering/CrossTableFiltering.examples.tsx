import {
  Table as DataTable,
  getSchema,
  TickingArrayDataSource,
} from "@vuu-ui/vuu-data-test";
import { TableSchema } from "@vuu-ui/vuu-data-types";
import {
  Flexbox,
  FlexboxLayout,
  LayoutProvider,
  StackLayout,
  View,
} from "@vuu-ui/vuu-layout";
import { Table, TableProps } from "@vuu-ui/vuu-table";
import {
  SelectionChangeHandler,
  TableConfig,
  TableRowClickHandler,
  TableRowSelectHandler,
} from "@vuu-ui/vuu-table-types";
import { useCallback, useMemo } from "react";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { LinkedDataSources, LinkedTableView } from "@vuu-ui/vuu-datatable";
import { TableSearch } from "@vuu-ui/vuu-ui-controls";
import { useData } from "@vuu-ui/vuu-utils";

// prettier-ignore
const ParentTableSchema:TableSchema = {
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "col1", serverDataType: "string" },
    { name: "col2", serverDataType: "string" },
    { name: "col3", serverDataType: "string" },
    { name: "col4", serverDataType: "string" },
    { name: "col5", serverDataType: "string" }
],
  key: "id",
  table: { module: "TEST", table: "ParentTable" },
};

// prettier-ignore
const ChildTableSchema:TableSchema = {
    columns: [
      { name: "id", serverDataType: "string" },
      { name: "col1", serverDataType: "string" },
      { name: "col2", serverDataType: "string" },
      { name: "col3", serverDataType: "string" },
      { name: "col4", serverDataType: "string" },
      { name: "col5", serverDataType: "string" },
      { name: "parentId", serverDataType: "string" },
  ],
    key: "id",
    table: { module: "TEST", table: "ChildTable" },
  };

// prettier-ignore
const GrandchildTableSchema:TableSchema = {
    columns: [
      { name: "id", serverDataType: "string" },
      { name: "col1", serverDataType: "string" },
      { name: "col2", serverDataType: "string" },
      { name: "col3", serverDataType: "string" },
      { name: "col4", serverDataType: "string" },
      { name: "col5", serverDataType: "string" },
      { name: "parentId", serverDataType: "string" },
  ],
    key: "id",
    table: { module: "TEST", table: "GrandchildTable" },
  };

// prettier-ignore
const parentTable = new DataTable(
    ParentTableSchema,
    [
        ["parent-001", "row 1","1 val 2","1 val 3","1 val 4","1 val 5"],
        ["parent-002", "row 2","2 val 2","1 val 3","1 val 4","1 val 5"],
        ["parent-003", "row 3","3 val 2","1 val 3","1 val 4","1 val 5"],
        ["parent-004", "row 4","4 val 2","1 val 3","1 val 4","1 val 5"],
        ["parent-005", "row 5","5 val 2","1 val 3","1 val 4","1 val 5"],
        ["parent-006", "row 6","6 val 2","1 val 3","1 val 4","1 val 5"],
        ["parent-007", "row 7","7 val 2","1 val 3","1 val 4","1 val 5"],
        ["parent-008", "row 8","8 val 2","1 val 3","1 val 4","1 val 5"],
        ["parent-009", "row 9","9 val 2","1 val 3","1 val 4","1 val 5"],
        ["parent-010", "row 10","10 val 2","1 val 3","1 val 4","1 val 5"]
    ],
    {id: 0, col1: 1, col2: 2,col3: 3,col4: 4,col5: 5}
)

// prettier-ignore
const childTable = new DataTable(
    ChildTableSchema,
    [
        ["child-001.1", "row 1","1 val 2","1 val 3","1 val 4","1 val 5", "parent-001"],
        ["child-001.2", "row 1","1 val 2","1 val 3","1 val 4","1 val 5", "parent-001"],
        ["child-001.3", "row 1","1 val 2","1 val 3","1 val 4","1 val 5", "parent-001"],
        ["child-001.4", "row 1","1 val 2","1 val 3","1 val 4","1 val 5", "parent-001"],
        ["child-002", "row 2","1 val 2","1 val 3","1 val 4","1 val 5", "parent-002"],
        ["child-003", "row 3","1 val 2","1 val 3","1 val 4","1 val 5", "parent-003"],
        ["child-004", "row 4","1 val 2","1 val 3","1 val 4","1 val 5", "parent-004"],
        ["child-005", "row 5","1 val 2","1 val 3","1 val 4","1 val 5", "parent-005"],
        ["child-006", "row 6","1 val 2","1 val 3","1 val 4","1 val 5", "parent-006"],
        ["child-007", "row 7","1 val 2","1 val 3","1 val 4","1 val 5", "parent-007"],
        ["child-008", "row 8","1 val 2","1 val 3","1 val 4","1 val 5", "parent-008"]
    ],
    {id: 0, col1: 1, col2: 2,col3: 3,col4: 4,col5: 5, parentId: 6}
)

// prettier-ignore
const grandchildTable = new DataTable(
    ChildTableSchema,
    [
        ["grandchild-001", "row 1","1 val 2","1 val 3","1 val 4","1 val 5", "child-001.1"],
        ["grandchild-002", "row 2","1 val 2","1 val 3","1 val 4","1 val 5", "child-002"],
        ["grandchild-003", "row 3","1 val 2","1 val 3","1 val 4","1 val 5", "child-003"],
        ["grandchild-004", "row 4","1 val 2","1 val 3","1 val 4","1 val 5", "child-004"],
        ["grandchild-005", "row 5","1 val 2","1 val 3","1 val 4","1 val 5", "child-005"],
        ["grandchild-006", "row 6","1 val 2","1 val 3","1 val 4","1 val 5", "child-006"],
        ["grandchild-007", "row 7","1 val 2","1 val 3","1 val 4","1 val 5", "child-007"],
        ["grandchild-008", "row 8","1 val 2","1 val 3","1 val 4","1 val 5", "child-008"]
    ],
    {id: 0, col1: 1, col2: 2,col3: 3,col4: 4,col5: 5, parentId: 6}
)

export const SimpleCrossTableFiltering = () => {
  const configParent = useMemo<TableConfig>(
    () => ({
      columns: ParentTableSchema.columns,
      rowSeparators: true,
      zebraStripes: true,
    }),
    [],
  );

  const configChild = useMemo<TableConfig>(
    () => ({
      columns: ChildTableSchema.columns,
      rowSeparators: true,
      zebraStripes: true,
    }),
    [],
  );

  const dataSourceAll = useMemo(() => {
    return new TickingArrayDataSource({
      columnDescriptors: ParentTableSchema.columns,
      table: parentTable,
    });
  }, []);
  const dataSource1 = useMemo(() => {
    return new TickingArrayDataSource({
      columnDescriptors: ParentTableSchema.columns,
      table: parentTable,
      filterSpec: { filter: 'col1 ends "1" or col1 ends "2" ' },
    });
  }, []);

  const dataSource2 = useMemo(() => {
    return new TickingArrayDataSource({
      columnDescriptors: ParentTableSchema.columns,
      table: parentTable,
      filterSpec: {
        filter:
          'col1 ends "3" or col1 ends "4" or col1 ends "5" or col1 ends "6"',
      },
    });
  }, []);

  const dataSource3 = useMemo(() => {
    return new TickingArrayDataSource({
      columnDescriptors: ParentTableSchema.columns,
      table: parentTable,
      filterSpec: {
        filter:
          'col1 ends "7" or col1 ends "8" or col1 ends "9"or col1 ends "10"',
      },
    });
  }, []);

  const dataSource4 = useMemo(() => {
    return new TickingArrayDataSource({
      columnDescriptors: ChildTableSchema.columns,
      table: childTable,
      filterSpec: {
        filter: 'id = ""',
      },
    });
  }, []);

  const dataSource5 = useMemo(() => {
    return new TickingArrayDataSource({
      columnDescriptors: GrandchildTableSchema.columns,
      table: grandchildTable,
      filterSpec: {
        filter: 'id = ""',
      },
    });
  }, []);

  const handleParentRowClick = useCallback<TableRowClickHandler>(
    (_evt, row) => {
      console.log({ rowClick: row });
      const parentId = row.data.id;
      dataSource4.filter = { filter: `parentId = "${parentId}"` };
    },
    [dataSource4],
  );

  const handleParentRowSelect = useCallback<TableRowSelectHandler>((row) => {
    console.log({ rowSelect: row });
  }, []);

  const handleParentRowSelectionChange = useCallback<SelectionChangeHandler>(
    (selectionChange) => {
      console.log({ selectionChange });
    },
    [],
  );

  const handleChildRowClick = useCallback<TableRowClickHandler>(
    (_evt, row) => {
      const parentId = row.data.id;
      dataSource5.filter = { filter: `parentId = "${parentId}"` };
    },
    [dataSource5],
  );

  return (
    <LayoutProvider>
      <FlexboxLayout
        style={{
          flexDirection: "column",
          height: "100vh",
          padding: 12,
          width: "100vw",
        }}
      >
        <StackLayout style={{ flex: 1 }}>
          <View title="All parent rows">
            <Table
              config={configParent}
              dataSource={dataSourceAll}
              onRowClick={handleParentRowClick}
              onSelect={handleParentRowSelect}
              onSelectionChange={handleParentRowSelectionChange}
            />
          </View>
          <View title="One or Two">
            <Table
              config={configParent}
              dataSource={dataSource1}
              onRowClick={handleParentRowClick}
              onSelect={handleParentRowSelect}
              onSelectionChange={handleParentRowSelectionChange}
            />
          </View>
          <View title="Three to Six">
            <Table
              config={configParent}
              dataSource={dataSource2}
              onRowClick={handleParentRowClick}
            />
          </View>
          <View title="Seven or more">
            <Table
              config={configParent}
              dataSource={dataSource3}
              onRowClick={handleParentRowClick}
            />
          </View>
        </StackLayout>
        <View header title="Child Table" style={{ flex: 1 }}>
          <Table
            config={configChild}
            dataSource={dataSource4}
            onRowClick={handleChildRowClick}
          />
        </View>
        <View header title="Child of a child" style={{ flex: 1 }}>
          <Table config={configChild} dataSource={dataSource5} />
        </View>
      </FlexboxLayout>
    </LayoutProvider>
  );
};

const TableSearchTemplate = ({
  schema,
  TableProps: TablePropsProp,
}: {
  schema: TableSchema;
  TableProps: Partial<TableProps>;
}) => {
  const { VuuDataSource } = useData();
  const { table } = schema;
  const TableProps = useMemo<TableProps>(
    () => ({
      config: {
        columns: [
          {
            name: "description",
            width: 200,
            type: {
              name: "string",
              renderer: {
                name: "search-cell",
              },
            },
          },
        ],
      },
      dataSource: new VuuDataSource({
        columns: schema.columns.map((c) => c.name),
        table,
      }),
      ...TablePropsProp,
    }),
    [TablePropsProp, VuuDataSource, schema.columns, table],
  );

  return (
    <TableSearch
      TableProps={TableProps}
      autoFocus
      searchColumns={["description"]}
      style={{ height: 400, width: 250 }}
    />
  );
};

export const FilteredLinkedTableView = () => {
  const linkedDataSources = useMemo<LinkedDataSources>(() => {
    return {
      "1": {
        dataSource: {
          table: { module: "SIMUL", table: "instruments" },
        },
        title: "instruments",
      },
      "2": {
        dataSource: {
          table: { module: "SIMUL", table: "parentOrders" },
        },
        title: "Orders",
        vuuLink: {
          fromColumn: "ric",
          toColumn: "ric",
        },
      },
      "3": [
        {
          vuuLink: {
            fromColumn: "parentOrderId",
            toColumn: "id",
          },
          dataSource: {
            table: { module: "SIMUL", table: "childOrders" },
            title: "Child Orders",
          },
          title: "Child Orders 1",
        },
        {
          vuuLink: {
            fromColumn: "parentOrderId",
            toColumn: "id",
          },
          dataSource: {
            table: { module: "SIMUL", table: "childOrders" },
          },
          title: "Child Orders 2",
        },
      ],
    };
  }, []);

  const schema = getSchema("instruments");

  const onSelect = useCallback<TableRowSelectHandler>((row) => {
    console.log({ row });
  }, []);

  return (
    <LocalDataSourceProvider>
      <Flexbox style={{ height: "100%" }}>
        <div
          style={{
            borderRight: "solid 1px black",
            flexGrow: 0,
            flexShrink: 0,
            flexBasis: 200,
          }}
        >
          <TableSearchTemplate TableProps={{ onSelect }} schema={schema} />
        </div>
        <LinkedTableView
          linkedDataSources={linkedDataSources}
          style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }}
        />
      </Flexbox>
    </LocalDataSourceProvider>
  );
};
