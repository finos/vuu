import { ComboBoxProps, Option } from "@salt-ds/core";
import {
  ExpandoCombobox,
  FilterClauseValueEditorText,
} from "@finos/vuu-filters";
import {
  ChangeEvent,
  SyntheticEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { LocalDataSourceProvider, getSchema } from "@finos/vuu-data-test";
import { FilterClauseValueChangeHandler } from "@finos/vuu-filters/src/filter-clause/useFilterClause";
import { MultiSelectionHandler } from "@finos/vuu-ui-controls";

const longUsStates = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

function getTemplateDefaultValue({
  defaultValue,
  defaultSelected,
  multiselect,
}: Pick<
  ComboBoxProps,
  "defaultValue" | "defaultSelected" | "multiselect"
>): string {
  if (multiselect) {
    return "";
  }

  if (defaultValue) {
    return String(defaultValue);
  }

  return defaultSelected?.[0] ?? "";
}

export const DefaultExpandoComboboxSalt = (props: ComboBoxProps) => {
  const [value, setValue] = useState(getTemplateDefaultValue(props));

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    console.log(`value = ${value}`);
    setValue(value);
  };

  const handleSelectionChange = (
    event: SyntheticEvent,
    newSelected: string[],
  ) => {
    props.onSelectionChange?.(event, newSelected);
    if (props.multiselect) {
      setValue("");
      return;
    }
    if (newSelected.length === 1) {
      setValue(newSelected[0]);
    } else {
      setValue("");
    }
  };

  return (
    <ExpandoCombobox
      data-showcase-center
      onChange={handleChange}
      onSelectionChange={handleSelectionChange}
      style={{ border: "solid 1px black", minWidth: 16 }}
      value={value}
    >
      {longUsStates
        .filter((state) =>
          state.toLowerCase().includes(value.trim().toLowerCase()),
        )
        .map((state) => (
          <Option value={state} key={state} />
        ))}
    </ExpandoCombobox>
  );
};

export const DefaultExpandoComboBox = (
  props: Partial<ComboBoxProps<ColumnDescriptor>>,
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
    [],
  );

  const handleSelectionChange = useCallback(
    (_e: SyntheticEvent, [column]: ColumnDescriptor[]) => {
      console.log(`select column ${column.name}`);
    },
    [],
  );

  return (
    <ExpandoCombobox
      {...props}
      onSelectionChange={handleSelectionChange}
      style={{ border: "solid 1px black", margin: 10, minWidth: 20 }}
    >
      {columns.map((column, i) => (
        <Option key={i} value={column.name}>
          {column.label ?? column.name}
        </Option>
      ))}
    </ExpandoCombobox>
  );
};

export const DefaultExpandoComboBoxHighlightFirstRow = () => {
  return <DefaultExpandoComboBox />;
};

export const DataBoundTextInputEmpty = () => {
  const tableSchema = getSchema("instruments");

  const column: ColumnDescriptor = useMemo(
    () => ({ name: "currency", serverDataType: "string" }),
    [],
  );

  const [value, setValue] = useState("");

  const handleInputComplete = useCallback<FilterClauseValueChangeHandler>(
    (value) => {
      setValue(String(value));
    },
    [],
  );

  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <FilterClauseValueEditorText
        column={column}
        onChangeValue={handleInputComplete}
        operator="="
        table={tableSchema.table}
        value={value}
      />
    </LocalDataSourceProvider>
  );
};

export const DataBoundTextInputLoaded = () => {
  const tableSchema = getSchema("instruments");

  const column: ColumnDescriptor = useMemo(
    () => ({ name: "currency", serverDataType: "string" }),
    [],
  );

  const [value, setValue] = useState("EUR");

  const handleInputComplete = useCallback<FilterClauseValueChangeHandler>(
    (value) => {
      setValue(String(value));
    },
    [],
  );

  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <FilterClauseValueEditorText
        column={column}
        onChangeValue={handleInputComplete}
        operator="="
        table={tableSchema.table}
        value={value}
      />
    </LocalDataSourceProvider>
  );
};

export const MultiSelectExpandoComboBox = () => {
  const currencies: string[] = useMemo(
    () => ["EUR", "GBP", "USD", "CAD", "JPY"],
    [],
  );

  const handleSelectionChange = useCallback<MultiSelectionHandler>((_, ccy) => {
    console.log(`select ccy ${ccy.join(",")}`);
  }, []);

  return (
    <ExpandoCombobox
      multiselect
      onSelectionChange={handleSelectionChange}
      style={{ border: "solid 2px black", minWidth: 20 }}
    >
      {currencies.map((value, i) => (
        <Option key={i} value={value} />
      ))}
    </ExpandoCombobox>
  );
};
