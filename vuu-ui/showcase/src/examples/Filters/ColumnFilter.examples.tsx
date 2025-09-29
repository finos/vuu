import { getSchema, VuuTableName } from "@vuu-ui/vuu-data-test";
import { ColumnFilter, ColumnFilterProps } from "@vuu-ui/vuu-filters";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  ColumnFilterStore,
  DataSourceProvider,
  isMultiClauseFilter,
  isSingleValueFilter,
  toColumnName,
  useData,
} from "@vuu-ui/vuu-utils";
import { Button, FormField, FormFieldLabel, Input } from "@salt-ds/core";
import { ReactNode, useCallback, useMemo, useState } from "react";
import {
  ColumnFilterChangeHandler,
  ColumnFilterOp,
  ColumnFilterValue,
  Filter,
} from "@vuu-ui/vuu-filter-types";
import { ColumnFilterCommitHandler } from "@vuu-ui/vuu-filters/src/column-filter/useColumnFilter";
import { parseFilter } from "@vuu-ui/vuu-filter-parser";

const tableName: VuuTableName = "instruments";

const filterToValues = (filter: Filter): Record<string, ColumnFilterValue> => {
  if (isMultiClauseFilter(filter)) {
    return filter.filters.reduce<Record<string, ColumnFilterValue>>(
      (map, clause) => {
        if (isSingleValueFilter(clause)) {
          map[clause.column] = clause.value as ColumnFilterValue;
        }
        return map;
      },
      {},
    );
  } else if (isSingleValueFilter(filter)) {
    return { [filter.column]: filter.value as ColumnFilterValue };
  } else {
    throw Error("Multi value clauses not supported yet");
  }
};

const FancyStyle = ({ children }: { children: ReactNode }) => (
  <>
    <style>
      {`
        .TestColumnFilter {
          background: #15273b; 
          height: 100%;
          padding: 20px;
          width: 360px;
          .saltFormField {
            height: 40px;
            width: fit-content;
            .saltFormFieldLabel {
              align-self: center;
              color: white;
              font-size: 14px;
            }
            .vuuColumnFilter {
              background: #1d2e3e;
              padding: 4px;
              .vuuTimePicker {

                .vuuTimeInput {
                  background: transparent;
                  border: none;
                  font-family: var(--salt-typography-fontFamily);
                  font-size: 14px;
                  text-align: center;
                  width: 70px;
                  &::selection {
                    background-color: #3a98f9;
                    color: white;
                  }

                }
              }
            }
            .vuuTimePicker {
              padding: 0 8px;
              .vuuTimeInput {
                border: none;
                font-family: var(--salt-typography-fontFamily);
                font-size: 14px;
                outline: none;
              }
            }
          }
        }
    `}
    </style>
    {children}
  </>
);

const ColumnFilterTemplate = ({
  column,
  label,
  minCharacterCountToTriggerSuggestions,
  onColumnFilterChange,
  operator,
  showOperatorPicker = false,
  table,
  value,
}: Pick<
  ColumnFilterProps,
  | "column"
  | "minCharacterCountToTriggerSuggestions"
  | "onColumnFilterChange"
  | "operator"
  | "showOperatorPicker"
  | "table"
  | "value"
> & {
  label?: string;
}) => {
  const filterStore = useMemo(
    () => new ColumnFilterStore({ filter: 'ric = "AAOQ.OQ"' }),
    [],
  );

  useMemo(() => {
    filterStore.on("onChange", (store) => {
      console.log(store);
    });
  }, [filterStore]);

  const handleCommit = useCallback<ColumnFilterCommitHandler>(() => {
    console.log("committed");
  }, []);

  const handleColumnFilterChange = (
    val: ColumnFilterValue,
    column: ColumnDescriptor,
    op: ColumnFilterOp,
  ) => {
    onColumnFilterChange?.(val, column, op);
    if (val) {
      filterStore.addFilter(column, op, val);
    } else {
      filterStore.removeFilter(column);
    }
  };

  return (
    <FormField>
      <FormFieldLabel>{label}</FormFieldLabel>
      <ColumnFilter
        data-testid="columnfilter"
        column={column}
        minCharacterCountToTriggerSuggestions={
          minCharacterCountToTriggerSuggestions
        }
        operator={operator}
        onColumnFilterChange={handleColumnFilterChange}
        onCommit={handleCommit}
        showOperatorPicker={showOperatorPicker}
        table={table}
        value={value}
      />
    </FormField>
  );
};

/** tags=data-consumer */
export const TextColumnFilter = ({
  minCharacterCountToTriggerSuggestions = 1,
}: {
  minCharacterCountToTriggerSuggestions: 0 | 1 | 2 | 3;
}) => {
  const [value, setValue] = useState<ColumnFilterValue>("");
  const [column, table] = useMemo<[ColumnDescriptor, VuuTable]>(
    () => [
      {
        name: "ric",
        serverDataType: "string",
      },
      { module: "SIMUL", table: tableName },
    ],
    [],
  );

  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    const schema = getSchema(tableName);
    return new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource]);

  const onColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (newValue) => {
      setValue(newValue);
    },
    [],
  );

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ColumnFilterTemplate
        column={column}
        label="RIC"
        minCharacterCountToTriggerSuggestions={
          minCharacterCountToTriggerSuggestions
        }
        table={table}
        value={value}
        onColumnFilterChange={onColumnFilterChange}
      />
    </DataSourceProvider>
  );
};

/** tags=data-consumer */
export const SuggestionsWithoutText = () => (
  <TextColumnFilter minCharacterCountToTriggerSuggestions={0} />
);

/** tags=data-consumer */
export const TextColumnFilterValueSetViaBtn = () => {
  const [filterValue, setFilterValue] = useState<ColumnFilterValue>("AAOP.N");

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value) => {
      setFilterValue(value);
    },
    [],
  );

  const [column, table] = useMemo<[ColumnDescriptor, VuuTable]>(
    () => [
      {
        name: "ric",
        serverDataType: "string",
      },
      { module: "SIMUL", table: tableName },
    ],
    [],
  );

  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    const schema = getSchema(tableName);
    return new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource]);

  return (
    <DataSourceProvider dataSource={dataSource}>
      <div style={{ display: "flex", gap: 5 }}>
        <Button onClick={() => setFilterValue("AAOQ.OQ")}>AAOQ.OQ</Button>
        <Button onClick={() => setFilterValue("AAOU.MI")}>AAOU.MI</Button>
      </div>
      <ColumnFilterTemplate
        column={column}
        label={"RIC"}
        table={table}
        value={filterValue}
        onColumnFilterChange={handleColumnFilterChange}
      />
    </DataSourceProvider>
  );
};

/** tags=data-consumer */
export const NumericColumnFilterValueWithBetweenOp = (
  props: Partial<ColumnFilterProps>,
) => {
  const [filterValue, setFilterValue] = useState<ColumnFilterValue>([
    "35",
    "45.3",
  ]);

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value) => {
      setFilterValue(value);
    },
    [],
  );

  const [column, table] = useMemo<[ColumnDescriptor, VuuTable]>(
    () => [
      {
        name: "price",
        serverDataType: "double",
      },
      { module: "SIMUL", table: tableName },
    ],
    [],
  );

  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    const schema = getSchema(tableName);
    return new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource]);

  return (
    <DataSourceProvider dataSource={dataSource}>
      <div style={{ display: "flex", gap: 5 }}>
        <Button onClick={() => setFilterValue(["10.96", "20.12"])}>
          [10.96, 20.12]
        </Button>
        <Button onClick={() => setFilterValue(["100", "200"])}>
          [100, 200]
        </Button>
      </div>
      <ColumnFilterTemplate
        column={column}
        label={"Price"}
        operator="between"
        table={table}
        value={filterValue}
        onColumnFilterChange={handleColumnFilterChange}
        {...props}
      />
    </DataSourceProvider>
  );
};

export const TimeColumnFilter = () => {
  const [filterValue, setFilterValue] = useState<ColumnFilterValue>("00:00:01");
  const [column, table] = useMemo<[ColumnDescriptor, VuuTable]>(
    () => [
      {
        name: "lastUpdate",
        serverDataType: "long",
        type: "time",
      },
      { module: "SIMUL", table: tableName },
    ],
    [],
  );

  return (
    <ColumnFilterTemplate
      column={column}
      label="Last Update"
      table={table}
      value={filterValue}
      onColumnFilterChange={(value) => setFilterValue(value)}
    />
  );
};

export const TimeColumnRangeFilter = (props: Partial<ColumnFilterProps>) => {
  const [filterValue, setFilterValue] = useState<ColumnFilterValue>([
    "00:00:00",
    "00:01:02",
  ]);
  const column = useMemo<ColumnDescriptor>(
    () => ({
      name: "lastUpdate",
      serverDataType: "long",
      type: "time",
    }),
    [],
  );

  return (
    <div style={{ padding: 100 }}>
      <FormField>
        <FormFieldLabel>Last Update</FormFieldLabel>
        <ColumnFilterTemplate
          column={column}
          operator="between"
          value={filterValue}
          onColumnFilterChange={(value) => setFilterValue(value)}
          {...props}
        />
      </FormField>
    </div>
  );
};

export const TimeColumnRangeFilterWithStyle = () => {
  const [filterValue, setFilterValue] = useState<ColumnFilterValue>([
    "00:00:00",
    "00:01:02",
  ]);

  const column = useMemo<ColumnDescriptor>(
    () => ({
      name: "lastUpdate",
      serverDataType: "long",
      type: "time",
    }),
    [],
  );

  return (
    <FancyStyle>
      <div className="TestColumnFilter">
        <FormField labelPlacement="left">
          <FormFieldLabel>May 15,2025</FormFieldLabel>
          <ColumnFilterTemplate
            label={"Last Update"}
            column={column}
            value={filterValue}
            onColumnFilterChange={(value) => setFilterValue(value)}
            operator="between"
          />
        </FormField>
      </div>
    </FancyStyle>
  );
};

export const TimeColumnRangeFilterValueSetViaBtn = () => {
  const [timeValue, setTimeValue] = useState<ColumnFilterValue>([
    "07:00:00",
    "08:00:00",
  ]);

  const column = useMemo<ColumnDescriptor>(
    () => ({
      name: "orderCreationTime",
      serverDataType: "long",
      type: "time",
    }),
    [],
  );

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value) => {
      setTimeValue(value);
    },
    [],
  );

  return (
    <>
      <div style={{ display: "flex", gap: 5 }}>
        <Button onClick={() => setTimeValue(["02:00:00", "03:00:00"])}>
          02:00:00 - 03:00:00
        </Button>
        <Button onClick={() => setTimeValue(["04:00:00", "05:00:00"])}>
          04:00:00 - 05:00:00
        </Button>
      </div>

      <ColumnFilterTemplate
        column={column}
        label="Time"
        value={timeValue}
        operator="between"
        onColumnFilterChange={handleColumnFilterChange}
      />
    </>
  );
};

const insertOrReplace = <T extends ColumnFilterValue>(
  value: T,
  newValue: ColumnFilterValue,
  index: 0 | 1,
): T => {
  if (Array.isArray(value)) {
    if (index === 0) {
      return [newValue, value[1]] as T;
    } else {
      return [value[0], newValue] as T;
    }
  } else {
    return newValue as T;
  }
};

/** tags=data-consumer */
export const MultipleFiltersWithColumnFilterStore = () => {
  const defaultValues = useMemo<Record<string, ColumnFilterValue>>(
    () => ({
      lastUpdate: ["00:00:00", "23:59:59"],
      price: "",
      ric: "",
      volume: ["", ""],
    }),
    [],
  );

  const [values, setValues] = useState(defaultValues);

  const [filter, _setFilter] = useState<string>("");
  const filterStore = useMemo(() => {
    const store = new ColumnFilterStore({ filter });
    store.on("onChange", (store) => {
      console.log(store);
    });
    return store;
  }, [filter]);

  const setFilter = useCallback(
    (filter: string) => {
      if (filter === "") {
        setValues(defaultValues);
        _setFilter("");
      } else {
        const filterStruct = parseFilter(filter);
        console.log({ filterStruct });
        setValues({
          ...defaultValues,
          ...filterToValues(filterStruct),
        });
        _setFilter(filter);
      }
    },
    [defaultValues],
  );

  const onColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column) => {
      console.log(`onColumnFilterChange ${JSON.stringify(value)}`);
      setValues((v) => {
        const newValue = {
          ...v,
          [column.name]: insertOrReplace(v[column.name], value, 0),
        };
        console.log(`newValue = ${JSON.stringify(newValue)}`);
        return newValue;
      });
    },
    [],
  );
  const onColumnRangeFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column) => {
      console.log(`onColumnFilterChange ${JSON.stringify(value)}`);
      setValues((v) => {
        const newValue = {
          ...v,
          [column.name]: insertOrReplace(v[column.name], value, 1),
        };
        console.log(`newValue = ${JSON.stringify(newValue)}`);
        return newValue;
      });
    },
    [],
  );

  const onCommit = useCallback<ColumnFilterCommitHandler>(
    (column, op, value) => {
      setValues((v) => ({ ...v, [column.name]: value }));
      if (value) {
        filterStore.addFilter(column, op, value);
      } else {
        filterStore.removeFilter(column);
      }
    },
    [filterStore],
  );

  const columns = useMemo<Record<string, ColumnDescriptor>>(
    () => ({
      price: {
        name: "price",
        serverDataType: "double",
      },
      volume: {
        name: "volume",
        serverDataType: "long",
      },
      ric: {
        name: "ric",
        serverDataType: "string",
      },
      lastUpdate: {
        name: "lastUpdate",
        serverDataType: "long",
        type: "time",
      },
    }),
    [],
  );

  const { VuuDataSource } = useData();
  const schema = getSchema(tableName);
  const dataSource = useMemo(() => {
    return new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource, schema.columns, schema.table]);

  return (
    <DataSourceProvider dataSource={dataSource}>
      <div style={{ display: "flex" }}>
        <div
          style={{
            border: "solid 1px lightgray",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            height: 400,
            width: 500,
          }}
        >
          <Input placeholder="Start here" />
          <FormField>
            <FormFieldLabel>Last Updated</FormFieldLabel>
            <ColumnFilter
              column={columns.lastUpdate}
              operator="between"
              onColumnFilterChange={onColumnFilterChange}
              onColumnRangeFilterChange={onColumnRangeFilterChange}
              onCommit={onCommit}
              value={values.lastUpdate}
            />
          </FormField>
          <FormField>
            <FormFieldLabel>RIC</FormFieldLabel>
            <ColumnFilter
              column={columns.ric}
              table={schema.table}
              value={values.ric}
              onColumnFilterChange={onColumnFilterChange}
              onCommit={onCommit}
            />
          </FormField>
          <FormField>
            <FormFieldLabel>Price</FormFieldLabel>
            <ColumnFilter
              column={columns.price}
              table={schema.table}
              value={values.price}
              onColumnFilterChange={onColumnFilterChange}
              onCommit={onCommit}
            />
          </FormField>
          <FormField>
            <FormFieldLabel>Volume</FormFieldLabel>
            <ColumnFilter
              column={columns.volume}
              operator="between"
              table={schema.table}
              value={values.volume}
              onColumnFilterChange={onColumnFilterChange}
              onColumnRangeFilterChange={onColumnRangeFilterChange}
              onCommit={onCommit}
            />
          </FormField>
          <Input placeholder="exit here" />
        </div>
        <div style={{ background: "ivory", width: 300 }}>
          <Button onClick={() => setFilter('ric = "BAOO.L"')}>
            ric = BAOO.L
          </Button>
          <Button onClick={() => setFilter('ric = "AAOR.AS" and price = 1000')}>
            ric = AAOR.AS and price GT 1000
          </Button>
          <Button onClick={() => setFilter("")}> Clear</Button>
        </div>
      </div>
    </DataSourceProvider>
  );
};
