import { Input } from "@salt-ds/core";
import { LocalDataSourceProvider, getSchema } from "@vuu-ui/vuu-data-test";
import { SchemaColumn, TableSchema } from "@vuu-ui/vuu-data-types";
import { ColumnDescriptorsByName } from "@vuu-ui/vuu-filter-types";
import { FilterClause, FilterClauseModel } from "@vuu-ui/vuu-filters";
import { ColumnPicker } from "@vuu-ui/vuu-filters/src/filter-clause/ColumnPicker";
import { DataSourceProvider, toColumnName, useData } from "@vuu-ui/vuu-utils";
import { ReactNode, useMemo } from "react";

import "./FilterClause.examples.css";

const FilterClauseTemplate = ({
  filterClauseModel = new FilterClauseModel({}),
  tableSchema = getSchema("instruments"),
  columnsByName = columnDescriptorsByName(tableSchema.columns),
  openDropdownOnFocus,
}: {
  columnsByName?: ColumnDescriptorsByName;
  filterClauseModel?: FilterClauseModel;
  tableSchema?: TableSchema;
  openDropdownOnFocus?: boolean;
}) => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    return new VuuDataSource({
      columns: tableSchema.columns.map(toColumnName),
      table: tableSchema.table,
    });
  }, [VuuDataSource, tableSchema.columns, tableSchema.table]);

  return (
    <DataSourceProvider dataSource={dataSource}>
      <div style={{ padding: "10px" }}>
        <FilterClause
          columnsByName={columnsByName}
          data-testid="filterclause"
          filterClauseModel={filterClauseModel}
          vuuTable={tableSchema.table}
          openDropdownOnFocus={openDropdownOnFocus}
        />
      </div>
    </DataSourceProvider>
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

/** tags=data-consumer */
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

/** tags=data-consumer */
export const NewFilterClauseWithDropdownOpenOnFocusDisabled = () => {
  const filterClauseModel = useMemo(() => new FilterClauseModel({}), []);
  return (
    <FilterClauseTemplate
      filterClauseModel={filterClauseModel}
      openDropdownOnFocus={false}
    />
  );
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
export const FilterColumnWithDropdownOpenOnFocusDisabled = () => {
  const filterClauseModel = useMemo(
    () =>
      new FilterClauseModel({
        column: "currency",
      }),
    [],
  );
  return (
    <FilterClauseTemplate
      filterClauseModel={filterClauseModel}
      openDropdownOnFocus={false}
    />
  );
};

export const FilterColumnAndOperatorWithDropdownOpenOnFocusDisabled = () => {
  const filterClauseModel = useMemo(
    () =>
      new FilterClauseModel({
        column: "exchange",
        op: "=",
      }),
    [],
  );
  return (
    <FilterClauseTemplate
      filterClauseModel={filterClauseModel}
      openDropdownOnFocus={false}
    />
  );
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
    table: { table: "TestDates", module: "TEST" },
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

export const PartialFilterClauseTimeColumnOnly = () => {
  const tableColumns: SchemaColumn[] = [
    {
      name: "created",
      serverDataType: "long",
    },
    {
      name: "lastUpdate",
      serverDataType: "long",
    },
  ];

  const tableSchema: TableSchema = {
    columns: tableColumns,
    key: "id",
    table: { table: "TestDates", module: "TEST" },
  };

  const columnsByName: ColumnDescriptorsByName = {
    created: {
      ...tableColumns[0],
      type: "time",
    },
    lastUpdate: {
      ...tableColumns[1],
      type: "time",
    },
  };

  const filterClauseModel = useMemo(() => {
    const model = new FilterClauseModel({
      column: "created",
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
