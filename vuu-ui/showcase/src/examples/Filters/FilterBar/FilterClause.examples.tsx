import { getSchema, vuuModule } from "@finos/vuu-data-test";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { TableSchema } from "@finos/vuu-data-types";
import {
  ExpandoCombobox,
  ExpandoComboboxProps,
  FilterClauseModel,
  FilterClause,
  FilterClauseValueEditorText,
} from "@finos/vuu-filters";
import {
  ExpandoInput,
  MultiSelectionHandler,
  SingleSelectionHandler,
} from "@finos/vuu-ui-controls";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { useAutoLoginToVuuServer } from "../../utils";

import "./FilterClause.examples.css";
import { FilterClauseValueChangeHandler } from "@finos/vuu-filters/src/filter-clause/useFilterClause";

let displaySequence = 1;

export const DefaultExpandoInput = () => {
  const [value, setValuue] = useState("Enter value");

  const handleChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
    const target = evt.target as HTMLInputElement;
    setValuue(target.value);
  }, []);

  return <ExpandoInput onChange={handleChange} value={value} />;
};
DefaultExpandoInput.displaySequence = displaySequence++;

export const DefaultExpandoComboBox = (
  props: Partial<ExpandoComboboxProps<ColumnDescriptor>>
) => {
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
    (column) => (column as ColumnDescriptor).name,
    []
  );

  const handleSelectionChange: SingleSelectionHandler<ColumnDescriptor> =
    useCallback((evt, column) => {
      console.log(`select column ${column.name}`);
    }, []);

  return (
    <ExpandoCombobox<ColumnDescriptor>
      {...props}
      itemToString={getColumnName}
      onSelectionChange={handleSelectionChange}
      source={columns}
      style={{ border: "solid 1px black", margin: 10, minWidth: 20 }}
    />
  );
};
DefaultExpandoComboBox.displaySequence = displaySequence++;

export const DefaultExpandoComboBoxHighlightFirstRow = () => {
  return <DefaultExpandoComboBox initialHighlightedIndex={0} />;
};
DefaultExpandoComboBoxHighlightFirstRow.displaySequence = displaySequence++;

export const DataBoundTextInputEmpty = () => {
  const tableSchema = getSchema("instruments");
  const { typeaheadHook } = vuuModule("SIMUL");

  const column: ColumnDescriptor = useMemo(
    () => ({ name: "currency", serverDataType: "string" }),
    []
  );

  const [value, setValue] = useState("");

  const handleInputComplete = useCallback<FilterClauseValueChangeHandler>(
    (value) => {
      setValue(String(value));
    },
    []
  );

  return (
    <FilterClauseValueEditorText
      column={column}
      onChangeValue={handleInputComplete}
      operator="="
      suggestionProvider={typeaheadHook}
      table={tableSchema.table}
      value={value}
    />
  );
};
DataBoundTextInputEmpty.displaySequence = displaySequence++;

export const DataBoundTextInputLoaded = () => {
  const tableSchema = getSchema("instruments");
  const { typeaheadHook } = vuuModule("SIMUL");

  const column: ColumnDescriptor = useMemo(
    () => ({ name: "currency", serverDataType: "string" }),
    []
  );

  const [value, setValue] = useState("EUR");

  const handleInputComplete = useCallback<FilterClauseValueChangeHandler>(
    (value) => {
      setValue(String(value));
    },
    []
  );

  return (
    <FilterClauseValueEditorText
      column={column}
      onChangeValue={handleInputComplete}
      operator="="
      suggestionProvider={typeaheadHook}
      table={tableSchema.table}
      value={value}
    />
  );
};
DataBoundTextInputLoaded.displaySequence = displaySequence++;

export const MultiSelectExpandoComboBox = () => {
  const currencies: string[] = useMemo(
    () => ["EUR", "GBP", "USD", "CAD", "JPY"],
    []
  );

  const handleSelectionChange = useCallback<MultiSelectionHandler>((_, ccy) => {
    console.log(`select ccy ${ccy.join(",")}`);
  }, []);

  return (
    <ExpandoCombobox
      onSelectionChange={handleSelectionChange}
      selectionStrategy="multiple"
      source={currencies}
      style={{ border: "solid 2px black", minWidth: 20 }}
    />
  );
};
MultiSelectExpandoComboBox.displaySequence = displaySequence++;

export const NewFilterClause = () => {
  const tableSchema = getSchema("instruments");
  const { typeaheadHook } = vuuModule("SIMUL");

  const filterClauseModel = useMemo(() => new FilterClauseModel({}), []);

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
    []
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
  useAutoLoginToVuuServer();
  const tableSchema = getSchema("instruments");
  const filterClauseModel = useMemo(
    () =>
      new FilterClauseModel({
        column: "currency",
        op: "=",
      }),
    []
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
PartialFilterClauseColumnAndOperator.displaySequence = displaySequence++;

export const CompleteFilterClauseTextEquals = () => {
  useAutoLoginToVuuServer();
  const tableSchema = getSchema("instruments");

  const filterClauseModel = useMemo(
    () =>
      new FilterClauseModel({
        column: "currency",
        op: "=",
        value: "EUR",
      }),
    []
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
CompleteFilterClauseTextEquals.displaySequence = displaySequence++;

const columnDescriptorsByName = (columns: TableSchema["columns"]) =>
  columns.reduce((m, col) => ({ ...m, [col.name]: col }), {});
