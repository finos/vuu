import { FilterClause } from "@finos/vuu-filter-types";
import {
  ExpandoCombobox,
  ExpandoComboboxProps,
  FilterClauseEditor,
  TextInput,
} from "@finos/vuu-filters";
import { ExpandoInput } from "@finos/vuu-ui-controls";
import { SelectionChangeHandler } from "@salt-ds/lab";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import {
  useAutoLoginToVuuServer,
  useSchema,
  useTableConfig,
} from "../../utils";

import "./FilterClause.examples.css";

let displaySequence = 1;

const EMPTY_FILTER_CLAUSE: Partial<FilterClause> = {};

export const DefaultExpandoInput = () => {
  const [value, setValuue] = useState("Enter value");

  const handleChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
    console.log(`change`);
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
      {...props}
      itemToString={getColumnName}
      onSelectionChange={handleSelectionChange}
      source={columns}
      style={{ border: "solid 2px black", minWidth: 20 }}
    />
  );
};
DefaultExpandoComboBox.displaySequence = displaySequence++;

export const DefaultExpandoComboBoxHighlightFirstRow = () => {
  return <DefaultExpandoComboBox initialHighlightedIndex={0} />;
};
DefaultExpandoComboBoxHighlightFirstRow.displaySequence = displaySequence++;

export const DataBoundTextInputEmpty = () => {
  const tableSchema = useSchema("instruments");
  const { typeaheadHook } = useTableConfig({
    rangeChangeRowset: "full",
    table: { module: "SIMUL", table: "instruments" },
  });

  const column: ColumnDescriptor = useMemo(
    () => ({ name: "currency", serverDataType: "string" }),
    []
  );

  const [value, setValue] = useState("");

  const [filterClause] = useState<Partial<FilterClause>>({
    column: "currency",
    op: "=",
  });

  const handleValueChange = useCallback((value: string | number) => {
    setValue(String(value));
  }, []);

  return (
    <TextInput
      column={column}
      filterClause={filterClause}
      onInputComplete={handleValueChange}
      operator="="
      suggestionProvider={typeaheadHook}
      table={tableSchema.table}
      value={value}
    />
  );
};
DataBoundTextInputEmpty.displaySequence = displaySequence++;

export const DataBoundTextInputLoaded = () => {
  const tableSchema = useSchema("instruments");
  const { typeaheadHook } = useTableConfig({
    rangeChangeRowset: "full",
    table: { module: "SIMUL", table: "instruments" },
  });

  const column: ColumnDescriptor = useMemo(
    () => ({ name: "currency", serverDataType: "string" }),
    []
  );

  const [value, setValue] = useState("EUR");

  const [filterClause] = useState<Partial<FilterClause>>({
    column: "currency",
    op: "=",
    value: "EUR",
  });

  const handleValueChange = useCallback((value: string | number) => {
    setValue(String(value));
  }, []);

  return (
    <TextInput
      column={column}
      filterClause={filterClause}
      onValueChange={handleValueChange}
      operator="="
      suggestionProvider={typeaheadHook}
      table={tableSchema.table}
      value={value}
    />
  );
};
DataBoundTextInputLoaded.displaySequence = displaySequence++;

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
      onSelectionChange={handleSelectionChange}
      source={columns}
      style={{ border: "solid 2px black", minWidth: 20 }}
    />
  );
};
MultiSelectExpandoComboBox.displaySequence = displaySequence++;

export const NewFilterClause = () => {
  const tableSchema = useSchema("instruments");

  const { typeaheadHook } = useTableConfig({
    count: 100_000,
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
