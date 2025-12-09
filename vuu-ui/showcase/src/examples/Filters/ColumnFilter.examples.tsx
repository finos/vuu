import { Button, FormField, FormFieldLabel } from "@salt-ds/core";
import { getSchema } from "@vuu-ui/vuu-data-test";
import { TableSchemaTable } from "@vuu-ui/vuu-data-types";
import type {
  ColumnFilterChangeHandler,
  ColumnFilterCommitHandler,
  ColumnFilterValue,
  FilterContainerFilter,
} from "@vuu-ui/vuu-filter-types";
import {
  ColumnFilter,
  FilterContainer,
  ColumnFilterProps,
  FilterDisplay,
  FilterContainerProps,
  FilterContainerColumnFilter,
  FilterAppliedHandler,
} from "@vuu-ui/vuu-filters";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { DataSourceProvider, filterAsQuery, useData } from "@vuu-ui/vuu-utils";
import { ReactNode, useCallback, useMemo, useState } from "react";

const instrumentsSchema = getSchema("instruments");
const ordersSchema = getSchema("parentOrders");

type ColumnFilterPassthroughProps = Partial<
  Pick<
    ColumnFilterProps,
    | "TypeaheadProps"
    | "onColumnFilterChange"
    | "onColumnRangeFilterChange"
    | "onCommit"
  >
>;

type FilterContainerPassthroughProps = Partial<
  Pick<FilterContainerProps, "onFilterApplied" | "onFilterCleared">
>;

const ContainerTemplate = ({
  children,
  flexDirection = "column",
  width = 330,
}: {
  children: ReactNode;
  flexDirection?: "column" | "row";
  width?: number;
}) => (
  <div
    style={{
      display: "flex",
      flexDirection,
      gap: 12,
      padding: 12,
      width,
    }}
  >
    {children}
  </div>
);

/** tags=data-consumer */
export const ControlledTextColumnFilter = ({
  TypeaheadProps,
  onColumnFilterChange,
  onCommit,
}: ColumnFilterPassthroughProps) => {
  const { VuuDataSource } = useData();
  const [value, setValue] = useState<ColumnFilterValue>("");
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: instrumentsSchema.table });
  }, [VuuDataSource]);

  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (column, op, value) => {
      console.log(`commit ${value} ${column.name} ${op}`);
      setValue(value);
      onCommit?.(column, op, value);
    },
    [onCommit],
  );

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column, op) => {
      console.log(`${value} ${column.name} ${op}`);
      setValue(value);
      onColumnFilterChange?.(value, column, op);
    },
    [onColumnFilterChange],
  );

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ContainerTemplate>
        <FormField>
          <FormFieldLabel>BBG</FormFieldLabel>
          <ColumnFilter
            TypeaheadProps={TypeaheadProps}
            column={{ name: "bbg", serverDataType: "string" }}
            onColumnFilterChange={handleColumnFilterChange}
            onCommit={handleCommit}
            table={{ module: "SIMUL", table: "instruments" }}
            value={value}
          />
        </FormField>
      </ContainerTemplate>
    </DataSourceProvider>
  );
};

export const ShowSuggestionsWithNoTextInput = ({
  TypeaheadProps = { minCharacterCountToTriggerSuggestions: 0 },
  onColumnFilterChange,
  onCommit,
}: ColumnFilterPassthroughProps) => {
  return (
    <ControlledTextColumnFilter
      TypeaheadProps={TypeaheadProps}
      onColumnFilterChange={onColumnFilterChange}
      onCommit={onCommit}
    />
  );
};

/** tags=data-consumer */
export const ControlledTextColumnFilterPopulated = () => {
  const { VuuDataSource } = useData();
  const [value, setValue] = useState<ColumnFilterValue>("AAOP.N");
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: instrumentsSchema.table });
  }, [VuuDataSource]);

  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (_column, _operator, value) => {
      setValue(value);
    },
    [],
  );

  return (
    <DataSourceProvider dataSource={dataSource}>
      <div style={{ display: "flex", gap: 5 }}>
        <Button onClick={() => setValue("AAOQ.OQ")}>AAOQ.OQ</Button>
        <Button onClick={() => setValue("AAOU.MI")}>AAOU.MI</Button>
      </div>
      <FormField>
        <FormFieldLabel>RIC</FormFieldLabel>
        <ColumnFilter
          column={{ name: "ric", serverDataType: "string" }}
          onColumnFilterChange={setValue}
          onCommit={handleCommit}
          table={{ module: "SIMUL", table: "instruments" }}
          value={value}
        />
      </FormField>
    </DataSourceProvider>
  );
};

export const UnControlledTextColumnFilter = ({
  onColumnFilterChange,
  onCommit,
}: ColumnFilterPassthroughProps) => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: instrumentsSchema.table });
  }, [VuuDataSource]);

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column, op) => {
      console.log(
        `[ColumnFilter.examples] handleColumnFilterChange ${column.name} ${value}`,
      );
      onColumnFilterChange?.(value, column, op);
    },
    [onColumnFilterChange],
  );
  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (column, op, value) => {
      console.log(
        `[ColumnFilter.examples] handleCommit ${column.name} ${value}`,
      );
      onCommit?.(column, op, value);
    },
    [onCommit],
  );

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ContainerTemplate>
        <FormField>
          <FormFieldLabel>BBG</FormFieldLabel>
          <ColumnFilter
            column={{ name: "bbg", serverDataType: "string" }}
            onColumnFilterChange={handleColumnFilterChange}
            onCommit={handleCommit}
            table={{ module: "SIMUL", table: "instruments" }}
            defaultValue=""
          />
        </FormField>
      </ContainerTemplate>
    </DataSourceProvider>
  );
};

export const UnControlledNumericColumnFilter = ({
  defaultValue = "",
  onColumnFilterChange,
  onCommit,
}: ColumnFilterPassthroughProps & { defaultValue?: string }) => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: instrumentsSchema.table });
  }, [VuuDataSource]);

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column, op) => {
      console.log(
        `[ColumnFilter.examples] handleColumnFilterChange ${column.name} ${value}`,
      );
      onColumnFilterChange?.(value, column, op);
    },
    [onColumnFilterChange],
  );
  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (column, op, value) => {
      console.log(`[ColumnFilter.examples] commit ${column.name} ${value}`);
      onCommit?.(column, op, value);
    },
    [onCommit],
  );

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ContainerTemplate>
        <FormField>
          <FormFieldLabel>Price</FormFieldLabel>
          <ColumnFilter
            column={{ name: "price", serverDataType: "double" }}
            onColumnFilterChange={handleColumnFilterChange}
            onCommit={handleCommit}
            defaultValue={defaultValue}
          />
        </FormField>
      </ContainerTemplate>
    </DataSourceProvider>
  );
};
export const UnControlledNumericColumnFilterBetween = () => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: instrumentsSchema.table });
  }, [VuuDataSource]);

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column) => {
      console.log(`handleColumnFilterChange ${column.name} ${value}`);
    },
    [],
  );
  const handleColumnRangeFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column) => {
      console.log(`handleColumnFilterChange ${column.name} ${value}`);
    },
    [],
  );
  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (column, operator, value) => {
      console.log(`commit ${column.name} ${value}`);
    },
    [],
  );

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ContainerTemplate>
        <FormField>
          <FormFieldLabel>Price</FormFieldLabel>
          <ColumnFilter
            column={{ name: "price", serverDataType: "double" }}
            defaultValue={["", ""]}
            onColumnFilterChange={handleColumnFilterChange}
            onColumnRangeFilterChange={handleColumnRangeFilterChange}
            onCommit={handleCommit}
            operator="between"
          />
        </FormField>
      </ContainerTemplate>
    </DataSourceProvider>
  );
};

export const ControlledNumericRangeFilter = () => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: instrumentsSchema.table });
  }, [VuuDataSource]);
  const [value, setValue] = useState<[string, string]>(["35", "45.3"]);

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column) => {
      console.log(`handleColumnFilterChange ${column.name} ${value}`);
      setValue(([, v2]) => [`${value}`, v2]);
    },
    [],
  );
  const handleColumnRangeFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column) => {
      console.log(`handleColumnFilterChange ${column.name} ${value}`);
      setValue(([v1]) => [v1, `${value}`]);
    },
    [],
  );
  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (column, operator, value) => {
      if (Array.isArray(value)) {
        console.log(`commit ${column.name} ['${value[0]}':'${value[1]}']`);
      }
    },
    [],
  );

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ContainerTemplate>
        <div style={{ display: "flex", gap: 5 }}>
          <Button
            onClick={() => setValue(["10.96", "20.12"])}
          >{`[10.96, 20.12]`}</Button>
          <Button
            onClick={() => setValue(["100", "200"])}
          >{`[100, 200]`}</Button>
        </div>

        <FormField>
          <FormFieldLabel>Price</FormFieldLabel>
          <ColumnFilter
            column={{ name: "price", serverDataType: "double" }}
            onColumnFilterChange={handleColumnFilterChange}
            onColumnRangeFilterChange={handleColumnRangeFilterChange}
            onCommit={handleCommit}
            operator="between"
            value={value}
          />
        </FormField>
      </ContainerTemplate>
    </DataSourceProvider>
  );
};
export const ControlledTimeRangeFilter = ({
  onColumnFilterChange,
  onColumnRangeFilterChange,
  onCommit,
  value: valueProp = ["00:00:00", "23:59:59"],
}: ColumnFilterPassthroughProps & { value?: [string, string] }) => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: instrumentsSchema.table });
  }, [VuuDataSource]);
  const [value, setValue] = useState<[string, string]>(valueProp);

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column, op) => {
      console.log(
        `[ColumnFilter.examples] handleColumnFilterChange ${column.name} ${value}`,
      );
      setValue(([, v2]) => [`${value}`, v2]);
      onColumnFilterChange?.(value, column, op);
    },
    [onColumnFilterChange],
  );
  const handleColumnRangeFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column, op) => {
      console.log(
        `[ColumnFilter.examples]  handleColumnFilterChange ${column.name} ${value}`,
      );
      setValue(([v1]) => [v1, `${value}`]);
      onColumnRangeFilterChange?.(value, column, op);
    },
    [onColumnRangeFilterChange],
  );
  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (column, op, value) => {
      if (Array.isArray(value)) {
        console.log(`commit ${column.name} ['${value[0]}':'${value[1]}']`);
        onCommit?.(column, op, value);
      }
    },
    [onCommit],
  );

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ContainerTemplate>
        <FormField>
          <FormFieldLabel>Price</FormFieldLabel>
          <ColumnFilter
            column={{
              name: "vuuCreatedTimestamp",
              serverDataType: "long",
              type: "time",
            }}
            onColumnFilterChange={handleColumnFilterChange}
            onColumnRangeFilterChange={handleColumnRangeFilterChange}
            onCommit={handleCommit}
            operator="between"
            value={value}
          />
        </FormField>
      </ContainerTemplate>
    </DataSourceProvider>
  );
};

export const ControlledToggleFilter = () => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: ordersSchema.table });
  }, [VuuDataSource]);
  const [value, setValue] = useState<ColumnFilterValue>("all");

  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (_column, _operator, value) => {
      setValue(value);
      console.log();
    },
    [],
  );

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ContainerTemplate>
        <FormField>
          <FormFieldLabel>Side</FormFieldLabel>
          <ColumnFilter
            TypeaheadProps={{ minCharacterCountToTriggerSuggestions: 0 }}
            column={{
              name: "side",
              serverDataType: "string",
            }}
            onColumnFilterChange={setValue}
            onCommit={handleCommit}
            table={ordersSchema.table}
            value={value}
            values={["BUY", "SELL"]}
            variant="toggle"
          />
        </FormField>
      </ContainerTemplate>
    </DataSourceProvider>
  );
};

export const ContainerManagedTextColumnFilter = ({
  onFilterApplied,
  onFilterCleared,
}: FilterContainerPassthroughProps) => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: instrumentsSchema.table });
  }, [VuuDataSource]);

  const handleFilterApplied = useCallback<
    FilterAppliedHandler<FilterContainerFilter>
  >(
    (filter) => {
      console.log(
        `[ColumnFilter.examples] filterApplied ${JSON.stringify(filter)}`,
      );
      onFilterApplied?.(filter);
    },
    [onFilterApplied],
  );

  const handleFilterCleared = useCallback(() => {
    console.log("[ColumnFilter.examples] filterCleared");
    onFilterCleared?.();
  }, [onFilterCleared]);

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ContainerTemplate>
        <FilterContainer
          onFilterApplied={handleFilterApplied}
          onFilterCleared={handleFilterCleared}
        >
          <FormField>
            <FormFieldLabel>BBG</FormFieldLabel>
            <FilterContainerColumnFilter
              column={{ name: "bbg", serverDataType: "string" }}
              table={{ module: "SIMUL", table: "instruments" }}
              defaultValue=""
            />
          </FormField>
        </FilterContainer>
      </ContainerTemplate>
    </DataSourceProvider>
  );
};

export const ContainerManagedNumericColumnFilter = ({
  filter: filterProp,
  onFilterApplied,
  onFilterCleared,
}: FilterContainerPassthroughProps & Pick<FilterContainerProps, "filter">) => {
  const { VuuDataSource } = useData();
  const [filter, setFilter] = useState<FilterContainerFilter | undefined>(
    filterProp,
  );
  const handleFilterApplied = useCallback<
    FilterAppliedHandler<FilterContainerFilter>
  >(
    (filter) => {
      console.log(
        `[ColumnFilter.examples] filterApplied ${JSON.stringify(filter)}`,
      );
      setFilter(filter);
      onFilterApplied?.(filter);
    },
    [onFilterApplied],
  );

  const handleFilterCleared = useCallback(() => {
    console.log("[ColumnFilter.examples] filterCleared");
    setFilter(undefined);
    onFilterCleared?.();
  }, [onFilterCleared]);

  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: instrumentsSchema.table });
  }, [VuuDataSource]);

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ContainerTemplate flexDirection="row" width={700}>
        <FilterContainer
          filter={filter}
          onFilterCleared={handleFilterCleared}
          onFilterApplied={handleFilterApplied}
        >
          <FormField>
            <FormFieldLabel>Lot Size</FormFieldLabel>
            <FilterContainerColumnFilter
              column={{ name: "lotSize", serverDataType: "int" }}
              table={{ module: "SIMUL", table: "instruments" }}
            />
          </FormField>
        </FilterContainer>
        <FilterDisplay filter={filter} />
      </ContainerTemplate>
    </DataSourceProvider>
  );
};

export const ContainerManagedNumericColumnFilterWithFilter = () => (
  <ContainerManagedNumericColumnFilter
    filter={{ column: "lotSize", op: "=", value: 100 }}
  />
);

export const ContainerManagedNumericRangeFilter = ({
  filter: filterProp,
}: Pick<FilterContainerProps, "filter">) => {
  const { VuuDataSource } = useData();
  const [filter, setFilter] = useState<FilterContainerFilter | undefined>(
    filterProp,
  );
  const clearFilter = () => setFilter(undefined);

  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: instrumentsSchema.table });
  }, [VuuDataSource]);

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column) => {
      console.log(`commit ${column.name} ${value}`);
    },
    [],
  );

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ContainerTemplate flexDirection="row" width={700}>
        <FilterContainer
          filter={filter}
          onFilterCleared={clearFilter}
          onFilterApplied={setFilter}
        >
          <FormField>
            <FormFieldLabel>Lot Size</FormFieldLabel>
            <FilterContainerColumnFilter
              column={{ name: "lotSize", serverDataType: "int" }}
              onColumnFilterChange={handleColumnFilterChange}
              operator="between"
              table={{ module: "SIMUL", table: "instruments" }}
            />
          </FormField>
        </FilterContainer>
        <FilterDisplay filter={filter} />
      </ContainerTemplate>
    </DataSourceProvider>
  );
};

export const ContainerManagedNumericRangeFilterWithFilter = () => (
  <ContainerManagedNumericRangeFilter
    filter={{
      op: "and",
      filters: [
        { column: "lotSize", op: ">", value: 100 },
        { column: "lotSize", op: "<", value: 200 },
      ],
    }}
  />
);

export const ContainerManagedToggleFilter = ({
  filter: filterProp,
}: Pick<FilterContainerProps, "filter">) => {
  const { VuuDataSource } = useData();
  const [filter, setFilter] = useState<FilterContainerFilter | undefined>(
    filterProp,
  );
  const clearFilter = () => setFilter(undefined);

  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: ordersSchema.table });
  }, [VuuDataSource]);

  const column: ColumnDescriptor = {
    label: "Side",
    name: "side",
    serverDataType: "string",
  };

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ContainerTemplate flexDirection="row" width={700}>
        <FilterContainer
          onFilterCleared={clearFilter}
          onFilterApplied={setFilter}
        >
          <FormField>
            <FormFieldLabel>Side</FormFieldLabel>
            <FilterContainerColumnFilter
              column={column}
              table={{ module: "SIMUL", table: "parentOrders" }}
              values={["BUY", "SELL"]}
              variant="toggle"
            />
          </FormField>
        </FilterContainer>
        <FilterDisplay columns={[column]} filter={filter} />
      </ContainerTemplate>
    </DataSourceProvider>
  );
};

export const ContainerManagedToggleFilterWithFilter = () => (
  <ContainerManagedToggleFilter
    filter={{ column: "side", op: "=", value: "BUY" }}
  />
);

export const ContainerManagedBetweenColumnTimeFilter = ({
  filter: filterProp,
  op = "between",
}: {
  filter?: FilterContainerFilter;
  op?: "between" | "between-inclusive";
}) => {
  const { VuuDataSource } = useData();
  const [filter, setFilter] = useState<FilterContainerFilter | undefined>(
    filterProp,
  );
  const clearFilter = () => setFilter(undefined);

  console.log({ filter });
  if (filter) {
    console.log(filterAsQuery(filter));
  }

  console.log(JSON.stringify(filter, null, 2));

  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: instrumentsSchema.table });
  }, [VuuDataSource]);

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column) => {
      console.log(`commit ${column.name} ${value}`);
    },
    [],
  );

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ContainerTemplate flexDirection="row" width={700}>
        <FilterContainer
          filter={filter}
          onFilterCleared={clearFilter}
          onFilterApplied={setFilter}
        >
          <FormField>
            <FormFieldLabel>Lot Size</FormFieldLabel>
            <FilterContainerColumnFilter
              column={{
                name: "vuuCreatedTime",
                serverDataType: "long",
                type: "time",
              }}
              extendedFilterOptions={{ date: "today", type: "TimeString" }}
              onColumnFilterChange={handleColumnFilterChange}
              operator={op}
              table={{ module: "SIMUL", table: "instruments" }}
            />
          </FormField>
        </FilterContainer>
        <FilterDisplay filter={filter} />
      </ContainerTemplate>
    </DataSourceProvider>
  );
};

export const ContainerManagedBetweenColumnTimeFilterWithFilter = () => (
  <ContainerManagedBetweenColumnTimeFilter
    filter={{
      op: "and",
      filters: [
        {
          column: "vuuCreatedTime",
          op: ">=",
          value: "12:00:00",
          extendedOptions: { date: "today", type: "TimeString" },
        },
        {
          column: "vuuCreatedTime",
          op: "<=",
          value: "13:00:00",
          extendedOptions: { date: "today", type: "TimeString" },
        },
      ],
    }}
  />
);

export const ContainerManagedBetweenInclusiveColumnTimeFilter = () => (
  <ContainerManagedBetweenColumnTimeFilter op="between-inclusive" />
);

export const ContainerManagedMultipleColumnFilters = () => {
  const { VuuDataSource } = useData();
  const [filter, setFilter] = useState<FilterContainerFilter | undefined>(
    undefined,
  );
  const clearFilter = () => setFilter(undefined);
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: instrumentsSchema.table });
  }, [VuuDataSource]);

  const table = useMemo<TableSchemaTable>(
    () => ({ module: "SIMUL", table: "instruments" }),
    [],
  );

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ContainerTemplate flexDirection="row" width={700}>
        <FilterContainer
          onFilterCleared={clearFilter}
          onFilterApplied={setFilter}
        >
          <FormField>
            <FormFieldLabel>BBG</FormFieldLabel>
            <FilterContainerColumnFilter
              column={{ name: "bbg", serverDataType: "string" }}
              table={table}
            />
          </FormField>
          <FormField>
            <FormFieldLabel>Currency</FormFieldLabel>
            <FilterContainerColumnFilter
              column={{ name: "currency", serverDataType: "string" }}
              table={table}
            />
          </FormField>
          <FormField>
            <FormFieldLabel>Exchange</FormFieldLabel>
            <FilterContainerColumnFilter
              column={{ name: "exchange", serverDataType: "string" }}
              table={table}
            />
          </FormField>
          <FormField>
            <FormFieldLabel>Price</FormFieldLabel>
            <FilterContainerColumnFilter
              column={{ name: "price", serverDataType: "double" }}
              operator="between"
            />
          </FormField>
        </FilterContainer>
        <FilterDisplay filter={filter} />
      </ContainerTemplate>
    </DataSourceProvider>
  );
};
