import { FormField, FormFieldLabel } from "@salt-ds/core";
import { getSchema } from "@vuu-ui/vuu-data-test";
import { DataSourceFilter, TableSchemaTable } from "@vuu-ui/vuu-data-types";
import {
  ColumnFilterProps,
  FilterAppliedHandler,
  FilterContainer,
  FilterContainerColumnFilter,
  FilterContainerProps,
  FilterDisplay,
  FilterProvider,
  TabbedFilterContainer,
  TabbedFilterContainerProps,
  useActiveFilter,
} from "@vuu-ui/vuu-filters";
import { Table } from "@vuu-ui/vuu-table";
import { DataSourceStats } from "@vuu-ui/vuu-table-extras";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
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

const schema = getSchema("instruments");

const typeaheadPropsZero: ColumnFilterProps["TypeaheadProps"] = {
  minCharacterCountToTriggerSuggestions: 0,
  selectOnTab: false,
};
const typeaheadPropsOne: ColumnFilterProps["TypeaheadProps"] = {
  minCharacterCountToTriggerSuggestions: 1,
  selectOnTab: false,
};

const SimpleFilterContainerTemplate = ({
  filter: filterProp,
}: Pick<FilterContainerProps, "filter">) => {
  const { VuuDataSource } = useData();
  const [filter, setFilter] =
    useState<FilterContainerProps["filter"]>(filterProp);

  const [columns, [vuuCreatedTime, bbg, currency, exchange, lotSize]] = useMemo<
    [ColumnDescriptor[], ColumnDescriptor[]]
  >(() => {
    const cols: ColumnDescriptor[] = [
      {
        label: "Vuu Created Time",
        name: "vuuCreatedTime",
        serverDataType: "long",
        type: "time",
      },
      { name: "bbg", serverDataType: "string", label: "BBG" },
      { name: "currency", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "lotSize", serverDataType: "int" },
    ];
    return [cols, cols];
  }, []);

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
      setFilter(filterStruct as FilterContainerProps["filter"]);
    },
    [dataSource],
  );

  const onFilterCleared = useCallback(() => {
    dataSource.filter = { filter: "" };
    setFilter(undefined);
  }, [dataSource]);

  return (
    <DataSourceProvider dataSource={dataSource}>
      <FilterContainer
        filter={filter}
        onFilterApplied={onFilterApplied}
        onFilterCleared={onFilterCleared}
        style={{
          justifyContent: "flex-start",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 12,
        }}
      >
        <FormField>
          <FormFieldLabel>Created Time</FormFieldLabel>
          <FilterContainerColumnFilter
            TypeaheadProps={typeaheadPropsOne}
            column={vuuCreatedTime}
            operator="between"
            table={table}
          />
        </FormField>
        <FormField>
          <FormFieldLabel>BBG</FormFieldLabel>
          <FilterContainerColumnFilter
            TypeaheadProps={typeaheadPropsOne}
            column={bbg}
            table={table}
          />
        </FormField>
        <FormField>
          <FormFieldLabel>Currency</FormFieldLabel>
          <FilterContainerColumnFilter
            TypeaheadProps={typeaheadPropsZero}
            column={currency}
            table={table}
          />
        </FormField>
        <FormField>
          <FormFieldLabel>Exchange</FormFieldLabel>
          <FilterContainerColumnFilter
            TypeaheadProps={typeaheadPropsZero}
            column={exchange}
            table={table}
          />
        </FormField>
        <FormField>
          <FormFieldLabel>Lot Size</FormFieldLabel>
          <FilterContainerColumnFilter column={lotSize} operator="between" />
        </FormField>
        <FilterDisplay columns={columns} filter={filter} />
        <DataSourceStats dataSource={dataSource} />
        <div style={{ background: "lightgray", whiteSpace: "preserve" }}>
          {JSON.stringify(filter, null, 2)}
        </div>
      </FilterContainer>
    </DataSourceProvider>
  );
};

export const SimpleFilterContainerEmpty = () => (
  <SimpleFilterContainerTemplate />
);
export const WithSimpleFilter = () => (
  <SimpleFilterContainerTemplate
    filter={{ column: "currency", op: "=", value: "GBP" }}
  />
);
export const WithMultiCLauseFilter = () => (
  <SimpleFilterContainerTemplate
    filter={{
      op: "and",
      filters: [
        { column: "currency", op: "=", value: "GBP" },
        { column: "exchange", op: "=", value: "XLON/SETS" },
        {
          op: "and",
          filters: [
            { column: "lotSize", op: ">", value: 100 },
            { column: "lotSize", op: "<", value: 200 },
          ],
        },
      ],
    }}
  />
);

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
        <FilterContainer
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
        </FilterContainer>
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
