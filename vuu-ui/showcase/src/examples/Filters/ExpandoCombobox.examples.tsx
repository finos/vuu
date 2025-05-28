import { Input, Option } from "@salt-ds/core";
import {
  ExpandoCombobox,
  FilterClauseValueEditorText,
} from "@finos/vuu-filters";
import {
  ChangeEvent,
  ReactNode,
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

const useExpandoCombo = () => {
  const [value, setValue] = useState("");
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValue(value);
  };

  const handleSelectionChange = (
    _evt: SyntheticEvent,
    newSelected: string[],
  ) => {
    if (newSelected.length === 1) {
      setValue(newSelected[0]);
    } else {
      setValue("");
    }
  };
  return {
    onChange: handleChange,
    onSelectionChange: handleSelectionChange,
    value,
  };
};

export const ExpandoComboboxStates = () => {
  const { onChange, onSelectionChange, value } = useExpandoCombo();

  return (
    <ExpandoContainer>
      <ExpandoCombobox
        onChange={onChange}
        onSelectionChange={onSelectionChange}
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
    </ExpandoContainer>
  );
};

export const ExpandoComboBoxColumns = () => {
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

  const { onChange, onSelectionChange, value } = useExpandoCombo();

  return (
    <ExpandoContainer>
      <ExpandoCombobox
        onChange={onChange}
        onSelectionChange={onSelectionChange}
        value={value}
      >
        {columns
          .filter(({ name }) =>
            name.toLowerCase().includes(value.trim().toLowerCase()),
          )
          .map(({ name, label = name }) => (
            <Option value={label} key={name} />
          ))}
      </ExpandoCombobox>
    </ExpandoContainer>
  );
};

export const FilterClauseValueEditorTextInstrumentCurrency = () => {
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
    <LocalDataSourceProvider>
      <ExpandoContainer>
        <FilterClauseValueEditorText
          column={column}
          onChangeValue={handleInputComplete}
          operator="="
          table={tableSchema.table}
          value={value}
        />
      </ExpandoContainer>
    </LocalDataSourceProvider>
  );
};

export const FilterClauseValueEditorTextInstrumentCurrencyValue = () => {
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
    <LocalDataSourceProvider>
      <ExpandoContainer>
        <FilterClauseValueEditorText
          column={column}
          onChangeValue={handleInputComplete}
          operator="="
          table={tableSchema.table}
          value={value}
        />
      </ExpandoContainer>
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
    <ExpandoContainer>
      <ExpandoCombobox multiselect onSelectionChange={handleSelectionChange}>
        {currencies.map((value, i) => (
          <Option key={i} value={value} />
        ))}
      </ExpandoCombobox>
    </ExpandoContainer>
  );
};
