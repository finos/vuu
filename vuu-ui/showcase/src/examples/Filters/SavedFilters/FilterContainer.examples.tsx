import { getSchema } from "@vuu-ui/vuu-data-test";
import {
  ColumnFilterContainer,
  ColumnFilterNextProps,
  FilterContainerColumnFilter,
  TabbedFilterContainer,
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
import { DemoTableContainer } from "../../Table/DemoTableContainer";
import { FormField, FormFieldLabel } from "@salt-ds/core";
import { DataSourceFilter, TableSchemaTable } from "@vuu-ui/vuu-data-types";
import { FilterAppliedHandler } from "@vuu-ui/vuu-filters/src/column-filter-container/useColumnFilterContainer";
import { FilterContainerProps } from "@vuu-ui/vuu-filters/src/column-filter-container/ColumnFilterContainer";

const schema = getSchema("instruments");

const typeaheadPropsZero: ColumnFilterNextProps["TypeaheadProps"] = {
  minCharacterCountToTriggerSuggestions: 0,
  selectOnTab: false,
};
const typeaheadPropsOne: ColumnFilterNextProps["TypeaheadProps"] = {
  minCharacterCountToTriggerSuggestions: 1,
  selectOnTab: false,
};

const TableWithFiltersTemplate = () => {
  const showContextPanel = useContextPanel();
  const { VuuDataSource } = useData();
  const [filter, setFilter] =
    useState<FilterContainerProps["filter"]>(undefined);

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
      setFilter(filterStruct as FilterContainerProps["filter"]);
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

const TableWithTabbedFilterContainerTemplate = () => {
  const showContextPanel = useContextPanel();
  const { VuuDataSource } = useData();
  const [filter, setFilter] =
    useState<FilterContainerProps["filter"]>(undefined);

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
      setFilter(filterStruct as FilterContainerProps["filter"]);
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
        <TabbedFilterContainer
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
        </TabbedFilterContainer>
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

export const TableWithTabbedFilterContainer = () => {
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
          <TableWithTabbedFilterContainerTemplate />
        </ContextPanelProvider>
      </DemoTableContainer>
    </>
  );
};
