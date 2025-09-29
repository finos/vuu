import { FormField, FormFieldLabel } from "@salt-ds/core";
import { getSchema } from "@vuu-ui/vuu-data-test";
import { TableSchemaTable } from "@vuu-ui/vuu-data-types";
import {
  ColumnFilterChangeHandler,
  ColumnFilterValue,
  Filter,
} from "@vuu-ui/vuu-filter-types";
import {
  ColumnFilterNext,
  ColumnFilterContainer,
  FilterContainerColumnFilter,
  FilterDisplay,
} from "@vuu-ui/vuu-filters";
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

export const SimpleControlledTextColumnFilter = () => {
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
          <ColumnFilterNext
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
          <ColumnFilterNext
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

export const SimpleUnControlledTextColumnFilter = () => {
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
          <ColumnFilterNext
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
          <ColumnFilterNext
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
          <ColumnFilterNext
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

export const ContainerManagedBetweenColumnFilter = () => {
  const { VuuDataSource } = useData();
  const [filter, setFilter] = useState<Filter | undefined>(undefined);
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
