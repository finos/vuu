import { getSchema } from "@vuu-ui/vuu-data-test";
import {
  ColumnFilterContainer,
  ColumnFilterNextProps,
  FilterContainerColumnFilter,
  FilterDisplay,
  FilterProvider,
  TabbedFilterContainer,
  TabbedFilterContainerProps,
  useActiveFilter,
} from "@vuu-ui/vuu-filters";
import { Table } from "@vuu-ui/vuu-table";
import {
  ContextPanelProvider,
  IconButton,
  useContextPanel,
} from "@vuu-ui/vuu-ui-controls";
import {
  DataSourceProvider,
  filterAsQuery,
  toColumnName,
  useData,
} from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useState } from "react";
import { DemoTableContainer } from "../Table/DemoTableContainer";
import { FormField, FormFieldLabel } from "@salt-ds/core";
import { DataSourceFilter, TableSchemaTable } from "@vuu-ui/vuu-data-types";
import { FilterAppliedHandler } from "@vuu-ui/vuu-filters/src/column-filter-container/useColumnFilterContainer";
import { ColumnFilterContainerProps } from "@vuu-ui/vuu-filters/src/column-filter-container/ColumnFilterContainer";
import { DataSourceStats } from "@vuu-ui/vuu-table-extras";

const schema = getSchema("instruments");

const typeaheadPropsZero: ColumnFilterNextProps["TypeaheadProps"] = {
  minCharacterCountToTriggerSuggestions: 0,
  selectOnTab: false,
};
const typeaheadPropsOne: ColumnFilterNextProps["TypeaheadProps"] = {
  minCharacterCountToTriggerSuggestions: 1,
  selectOnTab: false,
};

export const SimpleFilterContainer = () => {
  const { VuuDataSource } = useData();
  const [filter, setFilter] =
    useState<ColumnFilterContainerProps["filter"]>(undefined);

  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: schema.columns.map(toColumnName),
        table: schema.table,
      }),
    [VuuDataSource],
  );

  const table = useMemo<TableSchemaTable>(
    () => ({ module: "SIMUL", table: "instruments" }),
    [],
  );

  const onFilterApplied = useCallback<FilterAppliedHandler>(
    (filterStruct) => {
      const vuuFilter: DataSourceFilter = {
        filter: filterAsQuery(filterStruct),
        filterStruct,
      };
      dataSource.filter = vuuFilter;
      setFilter(filterStruct as ColumnFilterContainerProps["filter"]);
    },
    [dataSource],
  );

  const onFilterCleared = useCallback(() => {
    dataSource.filter = { filter: "" };
    setFilter(undefined);
  }, [dataSource]);

  return (
    <DataSourceProvider dataSource={dataSource}>
      <ColumnFilterContainer
        filter={filter}
        onFilterApplied={onFilterApplied}
        onFilterCleared={onFilterCleared}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 12,
        }}
      >
        <FormField>
          <FormFieldLabel>BBG</FormFieldLabel>
          <FilterContainerColumnFilter
            TypeaheadProps={typeaheadPropsOne}
            column={{ name: "bbg", serverDataType: "string" }}
            table={table}
          />
        </FormField>
        <FormField>
          <FormFieldLabel>Currency</FormFieldLabel>
          <FilterContainerColumnFilter
            TypeaheadProps={typeaheadPropsZero}
            column={{ name: "currency", serverDataType: "string" }}
            table={table}
          />
        </FormField>
        <FormField>
          <FormFieldLabel>Exchange</FormFieldLabel>
          <FilterContainerColumnFilter
            TypeaheadProps={typeaheadPropsZero}
            column={{ name: "exchange", serverDataType: "string" }}
            table={table}
          />
        </FormField>
        <FormField>
          <FormFieldLabel>Lot Size</FormFieldLabel>
          <FilterContainerColumnFilter
            column={{ name: "lotSize", serverDataType: "int" }}
            operator="between"
          />
        </FormField>
      </ColumnFilterContainer>
      <FilterDisplay filter={filter} />
      <DataSourceStats dataSource={dataSource} />
    </DataSourceProvider>
  );
};

const TableWithFiltersTemplate = () => {
  const showContextPanel = useContextPanel();
  const { VuuDataSource } = useData();
  const [filter, setFilter] =
    useState<ColumnFilterContainerProps["filter"]>(undefined);

  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: schema.columns.map(toColumnName),
        table: schema.table,
      }),
    [VuuDataSource],
  );

  const table = useMemo<TableSchemaTable>(
    () => ({ module: "SIMUL", table: "instruments" }),
    [],
  );

  const config = useMemo(
    () => ({
      columns: schema.columns,
    }),
    [],
  );

  const onFilterApplied = useCallback<FilterAppliedHandler>(
    (filterStruct) => {
      const vuuFilter: DataSourceFilter = {
        filter: filterAsQuery(filterStruct),
        filterStruct,
      };
      dataSource.filter = vuuFilter;
      setFilter(filterStruct as ColumnFilterContainerProps["filter"]);
    },
    [dataSource],
  );

  const onFilterCleared = useCallback(() => {
    dataSource.filter = { filter: "" };
    setFilter(undefined);
  }, [dataSource]);

  const showFilters = useCallback(() => {
    const columnFilterContainer = (
      <DataSourceProvider dataSource={dataSource}>
        <ColumnFilterContainer
          filter={filter}
          onFilterApplied={onFilterApplied}
          onFilterCleared={onFilterCleared}
        >
          <FormField>
            <FormFieldLabel>BBG</FormFieldLabel>
            <FilterContainerColumnFilter
              TypeaheadProps={typeaheadPropsOne}
              column={{ name: "bbg", serverDataType: "string" }}
              table={table}
            />
          </FormField>
          <FormField>
            <FormFieldLabel>Currency</FormFieldLabel>
            <FilterContainerColumnFilter
              TypeaheadProps={typeaheadPropsZero}
              column={{ name: "currency", serverDataType: "string" }}
              table={table}
            />
          </FormField>
          <FormField>
            <FormFieldLabel>Exchange</FormFieldLabel>
            <FilterContainerColumnFilter
              TypeaheadProps={typeaheadPropsZero}
              column={{ name: "exchange", serverDataType: "string" }}
              table={table}
            />
          </FormField>
          <FormField>
            <FormFieldLabel>Lot Size</FormFieldLabel>
            <FilterContainerColumnFilter
              column={{ name: "lotSize", serverDataType: "int" }}
              operator="between"
            />
          </FormField>
        </ColumnFilterContainer>
      </DataSourceProvider>
    );

    showContextPanel(columnFilterContainer, "filters");
  }, [
    dataSource,
    filter,
    onFilterApplied,
    onFilterCleared,
    showContextPanel,
    table,
  ]);

  return (
    <>
      <div style={{ height: 32, display: "flex", justifyContent: "flex-end" }}>
        <IconButton
          appearance="transparent"
          data-embedded
          icon="filter"
          onClick={showFilters}
          sentiment="neutral"
        />
      </div>
      <Table config={config} dataSource={dataSource} />
    </>
  );
};

export const TableWithFilters = () => {
  return (
    <>
      <style>{`
        .vuuFilterContainer {
            height: 100%;
            padding: 12px;
        }
    `}</style>
      <DemoTableContainer>
        <ContextPanelProvider>
          <TableWithFiltersTemplate />
        </ContextPanelProvider>
      </DemoTableContainer>
    </>
  );
};

const TableWithTabbedFilterContainerTemplate = ({
  children,
}: Pick<TabbedFilterContainerProps, "children">) => {
  const showContextPanel = useContextPanel();
  const { VuuDataSource } = useData();

  const { currentFilter } = useActiveFilter();

  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: schema.columns.map(toColumnName),
        table: schema.table,
      }),
    [VuuDataSource],
  );

  useMemo(() => {
    if (currentFilter && currentFilter.filter !== null) {
      const vuuFilter: DataSourceFilter = {
        filter: filterAsQuery(currentFilter?.filter),
        filterStruct: currentFilter?.filter,
      };
      dataSource.filter = vuuFilter;
    } else {
      dataSource.filter = { filter: "" };
    }
  }, [currentFilter, dataSource]);

  const config = useMemo(
    () => ({
      columns: schema.columns,
    }),
    [],
  );

  const showFilters = useCallback(() => {
    const columnFilterContainer = (
      <DataSourceProvider dataSource={dataSource}>
        <TabbedFilterContainer>{children}</TabbedFilterContainer>
      </DataSourceProvider>
    );

    showContextPanel(columnFilterContainer, "filters");
  }, [children, dataSource, showContextPanel]);

  return (
    <>
      <div style={{ height: 32, display: "flex", justifyContent: "flex-end" }}>
        <IconButton
          appearance="transparent"
          data-embedded
          icon="filter"
          onClick={showFilters}
          sentiment="neutral"
        />
      </div>
      <Table config={config} dataSource={dataSource} />
    </>
  );
};

export const TableWithTabbedFilterContainerAndFilterProvider = () => {
  const table = useMemo<TableSchemaTable>(
    () => ({ module: "SIMUL", table: "instruments" }),
    [],
  );

  return (
    <>
      <style>{`
        .vuuFilterContainer {
            height: 100%;
            padding: 12px;
        }
    `}</style>
      <FilterProvider>
        <DemoTableContainer>
          <ContextPanelProvider>
            <TableWithTabbedFilterContainerTemplate>
              <FormField>
                <FormFieldLabel>Vuu Created</FormFieldLabel>
                <FilterContainerColumnFilter
                  TypeaheadProps={typeaheadPropsOne}
                  column={{
                    name: "vuuCreatedTimestamp",
                    serverDataType: "long",
                    type: "time",
                  }}
                  operator="between"
                  table={table}
                />
              </FormField>
              <FormField>
                <FormFieldLabel>BBG</FormFieldLabel>
                <FilterContainerColumnFilter
                  TypeaheadProps={typeaheadPropsOne}
                  column={{ name: "bbg", serverDataType: "string" }}
                  table={table}
                />
              </FormField>
              <FormField>
                <FormFieldLabel>Currency</FormFieldLabel>
                <FilterContainerColumnFilter
                  TypeaheadProps={typeaheadPropsZero}
                  column={{ name: "currency", serverDataType: "string" }}
                  table={table}
                />
              </FormField>
              <FormField>
                <FormFieldLabel>Exchange</FormFieldLabel>
                <FilterContainerColumnFilter
                  TypeaheadProps={typeaheadPropsZero}
                  column={{ name: "exchange", serverDataType: "string" }}
                  table={table}
                />
              </FormField>
              <FormField>
                <FormFieldLabel>Lot Size</FormFieldLabel>
                <FilterContainerColumnFilter
                  column={{ name: "lotSize", serverDataType: "int" }}
                  operator="between"
                />
              </FormField>
            </TableWithTabbedFilterContainerTemplate>
          </ContextPanelProvider>
        </DemoTableContainer>
      </FilterProvider>
    </>
  );
};
