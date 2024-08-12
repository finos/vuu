import { getSchema, vuuModule } from "@finos/vuu-data-test";
import { SchemaColumn, TableSchema } from "@finos/vuu-data-types";
import { FilterClauseModel, FilterClause } from "@finos/vuu-filters";
import { useMemo } from "react";
import { useAutoLoginToVuuServer } from "../../utils";

import "./FilterClause.examples.css";
import { ColumnDescriptorsByName } from "@finos/vuu-filter-types";

let displaySequence = 1;

export const NewFilterClause = () => {
  const tableSchema = getSchema("instruments");
  const { typeaheadHook } = vuuModule("SIMUL");

  const filterClauseModel = useMemo(() => new FilterClauseModel({}), []);

  return (
    <div style={{ padding: "10px" }}>
      <FilterClause
        columnsByName={columnDescriptorsByName(tableSchema.columns)}
        data-testid="filterclause"
        filterClauseModel={filterClauseModel}
        suggestionProvider={typeaheadHook}
        tableSchema={tableSchema}
      />
    </div>
  );
};
NewFilterClause.displaySequence = displaySequence++;

export const NewFilterClauseNoCompletions = () => {
  const tableSchema = getSchema("instruments");

  const filterClauseModel = useMemo(() => new FilterClauseModel({}), []);

  const alwaysEmptyTypeaheadHook = useMemo(() => {
    const suggestionFetcher = async () => {
      return [];
    };

    return () => suggestionFetcher;
  }, []);

  return (
    <div style={{ padding: "10px" }}>
      <FilterClause
        columnsByName={columnDescriptorsByName(tableSchema.columns)}
        filterClauseModel={filterClauseModel}
        suggestionProvider={alwaysEmptyTypeaheadHook}
        tableSchema={tableSchema}
      />
    </div>
  );
};
NewFilterClauseNoCompletions.displaySequence = displaySequence++;

export const PartialFilterClauseColumnOnly = () => {
  useAutoLoginToVuuServer();
  const tableSchema = getSchema("instruments");
  const filterClauseModel = useMemo(
    () =>
      new FilterClauseModel({
        column: "currency",
      }),
    [],
  );

  return (
    <div style={{ padding: "10px" }}>
      <FilterClause
        columnsByName={columnDescriptorsByName(tableSchema.columns)}
        filterClauseModel={filterClauseModel}
        tableSchema={tableSchema}
      />
    </div>
  );
};
PartialFilterClauseColumnOnly.displaySequence = displaySequence++;

export const PartialFilterClauseColumnAndOperator = () => {
  const { typeaheadHook } = vuuModule("SIMUL");
  const tableSchema = getSchema("instruments");
  const filterClauseModel = useMemo(
    () =>
      new FilterClauseModel({
        column: "currency",
        op: "=",
      }),
    [],
  );

  return (
    <div style={{ padding: "10px" }}>
      <FilterClause
        columnsByName={columnDescriptorsByName(tableSchema.columns)}
        data-testid="filterclause"
        filterClauseModel={filterClauseModel}
        suggestionProvider={typeaheadHook}
        tableSchema={tableSchema}
      />
    </div>
  );
};
PartialFilterClauseColumnAndOperator.displaySequence = displaySequence++;

export const CompleteFilterClauseTextEquals = () => {
  const { typeaheadHook } = vuuModule("SIMUL");
  const tableSchema = getSchema("instruments");

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
    <div style={{ padding: "10px" }}>
      <FilterClause
        columnsByName={columnDescriptorsByName(tableSchema.columns)}
        filterClauseModel={filterClauseModel}
        suggestionProvider={typeaheadHook}
        tableSchema={tableSchema}
      />
    </div>
  );
};
CompleteFilterClauseTextEquals.displaySequence = displaySequence++;

export const PartialFilterClauseDateColumnOnly = () => {
  const { typeaheadHook } = vuuModule("SIMUL");

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
    <div style={{ padding: "10px" }}>
      <FilterClause
        columnsByName={columnsByName}
        filterClauseModel={filterClauseModel}
        suggestionProvider={typeaheadHook}
        tableSchema={tableSchema}
      />
    </div>
  );
};
PartialFilterClauseColumnOnly.displaySequence = displaySequence++;

const columnDescriptorsByName = (columns: TableSchema["columns"]) =>
  columns.reduce((m, col) => ({ ...m, [col.name]: col }), {});
