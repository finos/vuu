import { LocalDataSourceProvider, getSchema } from "@vuu-ui/vuu-data-test";
import { SchemaColumn, TableSchema } from "@vuu-ui/vuu-data-types";
import { ColumnDescriptorsByName } from "@vuu-ui/vuu-filter-types";
import { FilterClause, FilterClauseModel } from "@vuu-ui/vuu-filters";
import { ReactNode, useMemo } from "react";
import { ColumnPicker } from "@vuu-ui/vuu-filters/src/filter-clause/ColumnPicker";

import "./FilterClause.examples.css";
import { Input } from "@salt-ds/core";
import { DataSourceProvider, toColumnName, useData } from "@vuu-ui/vuu-utils";

const FilterClauseTemplate = ({
  filterClauseModel = new FilterClauseModel({}),
  tableSchema = getSchema("instruments"),
  columnsByName = columnDescriptorsByName(tableSchema.columns),
}: {
  columnsByName?: ColumnDescriptorsByName;
  filterClauseModel?: FilterClauseModel;
  tableSchema?: TableSchema;
}) => {
  return (
    <div style={{ padding: "10px" }}>
      <FilterClause
        columnsByName={columnsByName}
        data-testid="filterclause"
        filterClauseModel={filterClauseModel}
        vuuTable={tableSchema.table}
      />
    </div>
  );
};

const ExpandoContainer = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      alignItems: "center",
      border: "solid 1px black",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: 12,
      width: 300,
    }}
  >
    <Input />
    {children}
    <Input />
  </div>
);

export const DefaultColumnPicker = () => {
  const columns = useMemo(() => getSchema("instruments").columns, []);
  return (
    <ExpandoContainer>
      <ColumnPicker
        columns={columns}
        onSelect={(e, val) => console.log(`select ${val}`)}
      />
    </ExpandoContainer>
  );
};

export const NewFilterClause = () => {
  return (
    <LocalDataSourceProvider>
      <FilterClauseTemplate />
    </LocalDataSourceProvider>
  );
};

export const NewFilterClauseNoCompletions = () => {
  return <FilterClauseTemplate />;
};

export const PartialFilterClauseColumnOnly = () => {
  const filterClauseModel = useMemo(
    () =>
      new FilterClauseModel({
        column: "currency",
      }),
    [],
  );
  return (
    <LocalDataSourceProvider>
      <FilterClauseTemplate filterClauseModel={filterClauseModel} />
    </LocalDataSourceProvider>
  );
};

/** tags=data-consumer */
export const PartialFilterClauseColumnAndOperator = () => {
  const filterClauseModel = useMemo(
    () =>
      new FilterClauseModel({
        column: "currency",
        op: "=",
      }),
    [],
  );
  return <FilterClauseTemplate filterClauseModel={filterClauseModel} />;
};

/** tags=data-consumer */
export const PartialFilterClauseColumnAndOperatorWithDataSource = () => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    const schema = getSchema("instruments");
    return new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource]);
  return (
    <DataSourceProvider dataSource={dataSource}>
      <PartialFilterClauseColumnAndOperator />
    </DataSourceProvider>
  );
};

export const CompleteFilterClauseTextEquals = () => {
  const filterClauseModel = useMemo(
    () =>
      new FilterClauseModel({
        column: "currency",
        op: "=",
        value: "EUR",
      }),
    [],
  );

  return (
    <LocalDataSourceProvider>
      <FilterClauseTemplate filterClauseModel={filterClauseModel} />
    </LocalDataSourceProvider>
  );
};

export const PartialFilterClauseDateColumnOnly = () => {
  const tableColumns: SchemaColumn[] = [
    {
      name: "tradeDate",
      serverDataType: "long",
    },
    {
      name: "settlementDate",
      serverDataType: "long",
    },
  ];

  const tableSchema: TableSchema = {
    columns: tableColumns,
    key: "id",
    table: { table: "Test", module: "test" },
  };

  const columnsByName: ColumnDescriptorsByName = {
    tradeDate: {
      ...tableColumns[0],
      type: "date/time",
    },
    settlementDate: {
      ...tableColumns[1],
      type: "date/time",
    },
  };

  const filterClauseModel = useMemo(() => {
    const model = new FilterClauseModel({
      column: "tradeDate",
    });
    model.on("filterClause", (clause) =>
      console.log(`onFilterClause ${JSON.stringify(clause)}`),
    );
    return model;
  }, []);

  return (
    <LocalDataSourceProvider>
      <FilterClauseTemplate
        columnsByName={columnsByName}
        filterClauseModel={filterClauseModel}
        tableSchema={tableSchema}
      />
    </LocalDataSourceProvider>
  );
};

const columnDescriptorsByName = (columns: TableSchema["columns"]) =>
  columns.reduce((m, col) => ({ ...m, [col.name]: col }), {});
