import { ExpandoCombobox, FilterClauseEditor } from "@finos/vuu-filters";
import { FilterClause } from "@finos/vuu-filter-types";
import {
  useAutoLoginToVuuServer,
  useSchema,
  useTableConfig,
} from "../../utils";

import "./FilterClause.examples.css";
import { useCallback, useMemo, useState } from "react";
import { SelectionChangeHandler } from "@salt-ds/lab";
import { ColumnDescriptor } from "packages/vuu-datagrid-types";

let displaySequence = 1;

const EMPTY_FILTER_CLAUSE: Partial<FilterClause> = {};

export const DefaultExpandoComboBox = () => {
  const columns: ColumnDescriptor[] = useMemo(
    () => [
      { name: "ccy", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
      { name: "lotSize", serverDataType: "int" },
      { name: "price", serverDataType: "double" },
      { name: "quantity", serverDataType: "double" },
      { name: "bid", serverDataType: "double" },
      { name: "offer", serverDataType: "double" },
      { name: "pctComplete", serverDataType: "double" },
      { name: "trader", serverDataType: "string" },
      { name: "book", serverDataType: "string" },
    ],
    []
  );

  const getColumnName = useCallback(
    (column: ColumnDescriptor) => column.name,
    []
  );

  const handleSelectionChange: SelectionChangeHandler<ColumnDescriptor> =
    useCallback((evt, column) => {
      console.log("select column", {
        column,
      });
    }, []);

  return (
    <ExpandoCombobox<ColumnDescriptor>
      itemToString={getColumnName}
      source={columns}
      onSelectionChange={handleSelectionChange}
    />
  );
};
DefaultExpandoComboBox.displaySequence = displaySequence++;

export const MultiSelectExpandoComboBox = () => {
  const columns: ColumnDescriptor[] = useMemo(
    () => [
      { name: "ccy", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
      { name: "lotSize", serverDataType: "int" },
      { name: "price", serverDataType: "double" },
      { name: "quantity", serverDataType: "double" },
      { name: "bid", serverDataType: "double" },
      { name: "offer", serverDataType: "double" },
      { name: "pctComplete", serverDataType: "double" },
      { name: "trader", serverDataType: "string" },
      { name: "book", serverDataType: "string" },
    ],
    []
  );

  const getColumnName = useCallback(
    (column: ColumnDescriptor) => column.name,
    []
  );

  const handleSelectionChange: SelectionChangeHandler<ColumnDescriptor> =
    useCallback((evt, column) => {
      console.log("select column", {
        column,
      });
    }, []);

  return (
    <ExpandoCombobox<ColumnDescriptor>
      allowMultipleSelection
      itemToString={getColumnName}
      source={columns}
      onSelectionChange={handleSelectionChange}
    />
  );
};
MultiSelectExpandoComboBox.displaySequence = displaySequence++;

export const NewFilterClause = () => {
  useAutoLoginToVuuServer();
  const tableSchema = useSchema("instruments");

  const { typeaheadHook } = useTableConfig({
    rangeChangeRowset: "full",
    table: { module: "SIMUL", table: "instruments" },
  });

  const onChange = (filterClause: Partial<FilterClause>) =>
    console.log("Filter Change", filterClause);

  const onClose = () => console.log("Closing filter component");

  return (
    <div style={{ padding: "10px" }}>
      <FilterClauseEditor
        filterClause={EMPTY_FILTER_CLAUSE}
        onChange={onChange}
        onClose={onClose}
        suggestionProvider={typeaheadHook}
        tableSchema={tableSchema}
      />
    </div>
  );
};
NewFilterClause.displaySequence = displaySequence++;

export const PartialFilterClauseColumnOnly = () => {
  useAutoLoginToVuuServer();
  const tableSchema = useSchema("instruments");
  const [filterClause] = useState<Partial<FilterClause>>({
    column: "currency",
  });
  const onChange = (filterClause?: Partial<FilterClause>) =>
    console.log("Filter Change", filterClause);

  const onClose = () => console.log("Closing filter component");

  return (
    <div style={{ padding: "10px" }}>
      <FilterClauseEditor
        filterClause={filterClause}
        onChange={onChange}
        onClose={onClose}
        tableSchema={tableSchema}
      />
    </div>
  );
};
PartialFilterClauseColumnOnly.displaySequence = displaySequence++;

export const PartialFilterClauseColumnAndOperator = () => {
  useAutoLoginToVuuServer();
  const tableSchema = useSchema("instruments");
  const [filterClause] = useState<Partial<FilterClause>>({
    column: "currency",
    op: "=",
  });

  const onChange = (filterClause?: Partial<FilterClause>) =>
    console.log("Filter Change", filterClause);

  const onClose = () => console.log("Closing filter component");

  return (
    <div style={{ padding: "10px" }}>
      <FilterClauseEditor
        filterClause={filterClause}
        onChange={onChange}
        onClose={onClose}
        tableSchema={tableSchema}
      />
    </div>
  );
};
PartialFilterClauseColumnAndOperator.displaySequence = displaySequence++;

export const CompleteFilterClauseTextEquals = () => {
  useAutoLoginToVuuServer();
  const tableSchema = useSchema("instruments");

  const [filterClause] = useState<Partial<FilterClause>>({
    column: "currency",
    op: "=",
    value: "EUR",
  });

  const onChange = (filterClause?: Partial<FilterClause>) =>
    console.log("Filter Change", filterClause);

  const onClose = () => console.log("Closing filter component");

  return (
    <div style={{ padding: "10px" }}>
      <FilterClauseEditor
        filterClause={filterClause}
        onChange={onChange}
        onClose={onClose}
        tableSchema={tableSchema}
      />
    </div>
  );
};
CompleteFilterClauseTextEquals.displaySequence = displaySequence++;
