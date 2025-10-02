import { Button, FormField, FormFieldLabel } from "@salt-ds/core";
import { getSchema } from "@vuu-ui/vuu-data-test";
import { TableSchemaTable } from "@vuu-ui/vuu-data-types";
import {
  ColumnFilterChangeHandler,
  ColumnFilterValue,
  Filter,
  FilterContainerFilter,
} from "@vuu-ui/vuu-filter-types";
import {
  ColumnFilter,
  ColumnFilterContainer,
  ColumnFilterProps,
  FilterContainerColumnFilter,
  FilterDisplay,
} from "@vuu-ui/vuu-filters";
import { FilterContainerProps } from "@vuu-ui/vuu-filters/src/filter-container/FilterContainer";
import { ColumnFilterCommitHandler } from "@vuu-ui/vuu-filters/src/column-filter/useColumnFilter";
import { DataSourceProvider, useData } from "@vuu-ui/vuu-utils";
import { ReactNode, useCallback, useMemo, useState } from "react";

const schema = getSchema("instrumentsExtended");

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
export const ControlledTextColumnFilter = () => {
  const { VuuDataSource } = useData();
  const [value, setValue] = useState<ColumnFilterValue>("");
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: schema.table });
  }, [VuuDataSource]);

  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (_column, _operator, value) => {
      setValue(value);
    },
    [],
  );

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ContainerTemplate>
        <FormField>
          <FormFieldLabel>BBG</FormFieldLabel>
          <ColumnFilter
            column={{ name: "bbg", serverDataType: "string" }}
            onColumnFilterChange={setValue}
            onCommit={handleCommit}
            table={{ module: "SIMUL", table: "instruments" }}
            value={value}
          />
        </FormField>
      </ContainerTemplate>
    </DataSourceProvider>
  );
};

/** tags=data-consumer */
export const ControlledTextColumnFilterPopulated = () => {
  const { VuuDataSource } = useData();
  const [value, setValue] = useState<ColumnFilterValue>("AAOP.N");
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: schema.table });
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
          data-testid="columnfilter"
          onColumnFilterChange={setValue}
          onCommit={handleCommit}
          table={{ module: "SIMUL", table: "instruments" }}
          value={value}
        />
      </FormField>
    </DataSourceProvider>
  );
};

export const ShowSuggestionsWithNoTextInput = () => {
  const { VuuDataSource } = useData();
  const [value, setValue] = useState<ColumnFilterValue>("");
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: schema.table });
  }, [VuuDataSource]);

  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (column, _operator, value) => {
      console.log(`commit ${column.name} ${value}`);
      setValue(value);
    },
    [],
  );

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ContainerTemplate>
        <FormField>
          <FormFieldLabel>BBG</FormFieldLabel>
          <ColumnFilter
            TypeaheadProps={{ minCharacterCountToTriggerSuggestions: 0 }}
            column={{ name: "bbg", serverDataType: "string" }}
            onColumnFilterChange={setValue}
            onCommit={handleCommit}
            table={{ module: "SIMUL", table: "instruments" }}
            value={value}
          />
        </FormField>
      </ContainerTemplate>
    </DataSourceProvider>
  );
};

export const UnControlledTextColumnFilter = () => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: schema.table });
  }, [VuuDataSource]);

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column) => {
      console.log(`handleColumnFilterChange ${column.name} ${value}`);
    },
    [],
  );
  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (column, _operator, value) => {
      console.log(`handleCommit ${column.name} ${value}`);
    },
    [],
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

export const UnControlledNumericColumnFilter = () => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: schema.table });
  }, [VuuDataSource]);

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column) => {
      console.log(`handleColumnFilterChange ${column.name} ${value}`);
    },
    [],
  );
  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (column, _operator, value) => {
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
            onColumnFilterChange={handleColumnFilterChange}
            onCommit={handleCommit}
            defaultValue=""
          />
        </FormField>
      </ContainerTemplate>
    </DataSourceProvider>
  );
};
export const UnControlledNumericColumnFilterBetween = () => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: schema.table });
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
    return new VuuDataSource({ table: schema.table });
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
            data-testid="columnfilter"
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
}: Pick<ColumnFilterProps, "onColumnFilterChange">) => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: schema.table });
  }, [VuuDataSource]);
  const [value, setValue] = useState<[string, string]>([
    "00:00:00",
    "00:01:02",
  ]);

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column) => {
      console.log(`handleColumnFilterChange ${column.name} ${value}`);
      setValue(([, v2]) => [`${value}`, v2]);
      onColumnFilterChange?.(value, column, "=");
    },
    [onColumnFilterChange],
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
        <FormField>
          <FormFieldLabel>Price</FormFieldLabel>
          <ColumnFilter
            column={{
              name: "vuuCreatedTimestamp",
              serverDataType: "long",
              type: "time",
            }}
            data-testid="columnfilter"
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
    return new VuuDataSource({ table: schema.table });
  }, [VuuDataSource]);
  const [value, setValue] = useState<ColumnFilterValue>("");

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
        <FormField>
          <FormFieldLabel>Price</FormFieldLabel>
          <ColumnFilter
            column={{
              name: "vuuCreatedTimestamp",
              serverDataType: "long",
              type: "time",
            }}
            onColumnFilterChange={setValue}
            onCommit={handleCommit}
            operator="between"
            value={value}
          />
        </FormField>
      </ContainerTemplate>
    </DataSourceProvider>
  );
};

export const ContainerManagedTextColumnFilter = () => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: schema.table });
  }, [VuuDataSource]);

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column) => {
      console.log(`commit ${column.name} ${value}`);
    },
    [],
  );

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ContainerTemplate>
        <ColumnFilterContainer>
          <FormField>
            <FormFieldLabel>BBG</FormFieldLabel>
            <FilterContainerColumnFilter
              column={{ name: "bbg", serverDataType: "string" }}
              onColumnFilterChange={handleColumnFilterChange}
              table={{ module: "SIMUL", table: "instruments" }}
              defaultValue=""
            />
          </FormField>
        </ColumnFilterContainer>
      </ContainerTemplate>
    </DataSourceProvider>
  );
};

export const ContainerManagedNumericColumnFilter = ({
  filter: filterProp,
}: Pick<FilterContainerProps, "filter">) => {
  const { VuuDataSource } = useData();
  const [filter, setFilter] = useState<Filter | undefined>(filterProp);
  const clearFilter = () => setFilter(undefined);

  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: schema.table });
  }, [VuuDataSource]);

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ContainerTemplate flexDirection="row" width={700}>
        <ColumnFilterContainer
          onFilterCleared={clearFilter}
          onFilterApplied={setFilter}
        >
          <FormField>
            <FormFieldLabel>Lot Size</FormFieldLabel>
            <FilterContainerColumnFilter
              column={{ name: "lotSize", serverDataType: "int" }}
              table={{ module: "SIMUL", table: "instruments" }}
            />
          </FormField>
        </ColumnFilterContainer>
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

export const ContainerManagedBetweenColumnFilter = ({
  filter: filterProp,
}: Pick<FilterContainerProps, "filter">) => {
  const { VuuDataSource } = useData();
  const [filter, setFilter] = useState<FilterContainerFilter | undefined>(
    filterProp,
  );
  const clearFilter = () => setFilter(undefined);

  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: schema.table });
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
        <ColumnFilterContainer
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
        </ColumnFilterContainer>
        <FilterDisplay filter={filter} />
      </ContainerTemplate>
    </DataSourceProvider>
  );
};

export const ContainerManagedBetweenColumnFilterWithFilter = () => (
  <ContainerManagedBetweenColumnFilter
    filter={{
      op: "and",
      filters: [
        { column: "lotSize", op: ">", value: 100 },
        { column: "lotSize", op: "<", value: 200 },
      ],
    }}
  />
);

export const ContainerManagedBetweenColumnTimeFilter = () => {
  const { VuuDataSource } = useData();
  const [filter, setFilter] = useState<Filter | undefined>(undefined);
  const clearFilter = () => setFilter(undefined);

  console.log(JSON.stringify(filter, null, 2));

  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: schema.table });
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
        <ColumnFilterContainer
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
              onColumnFilterChange={handleColumnFilterChange}
              operator="between"
              table={{ module: "SIMUL", table: "instruments" }}
            />
          </FormField>
        </ColumnFilterContainer>
        <FilterDisplay filter={filter} />
      </ContainerTemplate>
    </DataSourceProvider>
  );
};

export const ContainerManagedMultipleColumnFilters = () => {
  const { VuuDataSource } = useData();
  const [filter, setFilter] = useState<Filter | undefined>(undefined);
  const clearFilter = () => setFilter(undefined);
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: schema.table });
  }, [VuuDataSource]);

  const table = useMemo<TableSchemaTable>(
    () => ({ module: "SIMUL", table: "instruments" }),
    [],
  );

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ContainerTemplate flexDirection="row" width={700}>
        <ColumnFilterContainer
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
        </ColumnFilterContainer>
        <FilterDisplay filter={filter} />
      </ContainerTemplate>
    </DataSourceProvider>
  );
};
