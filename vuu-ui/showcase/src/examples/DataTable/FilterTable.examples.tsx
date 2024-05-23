import {
  getAllSchemas,
  getSchema,
  SimulTableName,
  vuuModule,
} from "@finos/vuu-data-test";
import type { DataSourceFilter } from "@finos/vuu-data-types";
import { FilterTable } from "@finos/vuu-datatable";
import type { FilterState } from "@finos/vuu-filter-types";
import { FilterBarProps } from "@finos/vuu-filters";
import type { TableProps } from "@finos/vuu-table";
import type { TableConfig } from "@finos/vuu-table-types";
import { useCallback, useMemo, useState } from "react";
import { useTestDataSource } from "../utils";
import { FilterBarProps } from "packages/vuu-filters/src";

let displaySequence = 1;
const schemas = getAllSchemas();

export const FilterTableVuuInstruments = () => {
  const { config, dataSource, error, tableSchema } = useTestDataSource({
    // bufferSize: 1000,
    schemas,
  });

  const [tableConfig] = useState<TableConfig>(config);

  const [filterState, setFilterState] = useState<FilterState>({
    filters: [],
    activeIndices: [],
  });

  const handleApplyFilter = useCallback(
    (filter: DataSourceFilter) => {
      dataSource.filter = filter;
    },
    [dataSource]
  );

  const handleFilterStateChange = useCallback((fs: FilterState) => {
    setFilterState(fs);
  }, []);

  const filterBarProps: Partial<FilterBarProps> = {
    columnDescriptors: config.columns,
    filterState,
    onApplyFilter: handleApplyFilter,
    onFilterStateChanged: handleFilterStateChange,
    tableSchema,
  };

  const tableProps = {
    config: tableConfig,
    dataSource,
    height: 645,
    renderBufferSize: 20,
    width: 715,
  };

  if (error) {
    return error;
  }

  return (
    <FilterTable FilterBarProps={filterBarProps} TableProps={tableProps} />
  );
};
FilterTableVuuInstruments.displaySequence = displaySequence++;

export const FilterTableArrayDataInstruments = ({
  quickFilterColumns,
  variant = "custom-filters",
}: Pick<FilterBarProps, "quickFilterColumns" | "variant">) => {
  const schema = schemas.instruments;
  const { dataSource, config, ...restTableProps } = useMemo<
    Pick<TableProps, "config" | "dataSource">
  >(
    () => ({
      config: {
        columns: schema.columns,
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource:
        vuuModule<SimulTableName>("SIMUL").createDataSource("instruments"),
    }),
    [schema]
  );

  const { typeaheadHook } = vuuModule("SIMUL");

  const [filterState, setFilterState] = useState<FilterState>({
    filters: [],
    activeIndices: [],
  });

  const handleApplyFilter = useCallback(
    (filter: DataSourceFilter) => {
      console.log("apply filter", { filter });
      dataSource.filter = filter;
    },
    [dataSource]
  );

  const handleFilterStateChange = useCallback((fs: FilterState) => {
    console.log("filter state changed:", fs);
    setFilterState(fs);
  }, []);

  const FilterBarProps: FilterBarProps = {
    FilterClauseEditorProps: {
      suggestionProvider: typeaheadHook,
    },
    columnDescriptors: config.columns,
    filterState,
    onApplyFilter: handleApplyFilter,
    onFilterStateChanged: handleFilterStateChange,
    quickFilterColumns,
    tableSchema: getSchema("instruments"),
    variant,
  };

  const tableProps = {
    ...restTableProps,
    config,
    dataSource,
    renderBufferSize: 20,
  };

  return (
    <FilterTable
      FilterBarProps={FilterBarProps}
      style={{ height: "100%" }}
      TableProps={tableProps}
    />
  );
};
FilterTableArrayDataInstruments.displaySequence = displaySequence++;

export const FilterTableArrayDataInstrumentsQuickFilters = () => (
  <FilterTableArrayDataInstruments
    variant="quick-filters"
    quickFilterColumns={["isin", "currency", "exchange"]}
  />
);
FilterTableArrayDataInstrumentsQuickFilters.displaySequence = displaySequence++;

export const FilterTableArrayDataInstrumentsFullFilters = () => (
  <FilterTableArrayDataInstruments variant="full-filters" />
);
FilterTableArrayDataInstrumentsFullFilters.displaySequence = displaySequence++;
