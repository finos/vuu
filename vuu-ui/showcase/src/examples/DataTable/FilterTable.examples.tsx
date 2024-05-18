import {
  getAllSchemas,
  getSchema,
  SimulTableName,
  vuuModule,
} from "@finos/vuu-data-test";
import type { DataSourceFilter } from "@finos/vuu-data-types";
import { FilterTable, FilterTableProps } from "@finos/vuu-datatable";
import type { FilterState } from "@finos/vuu-filter-types";
import type { TableProps } from "@finos/vuu-table";
import type { TableConfig } from "@finos/vuu-table-types";
import { useCallback, useMemo, useState } from "react";
import { useTestDataSource } from "../utils";

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

  const filterBarProps: FilterTableProps["FilterBarProps"] = {
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

export const FilterTableArrayDataInstruments = () => {
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

  const filterBarProps: FilterTableProps["FilterBarProps"] = {
    columnDescriptors: config.columns,
    filterState,
    onApplyFilter: handleApplyFilter,
    onFilterStateChanged: handleFilterStateChange,
    tableSchema: getSchema("instruments"),
  };

  const tableProps = {
    ...restTableProps,
    config,
    dataSource,
    renderBufferSize: 20,
  };

  return (
    <FilterTable
      FilterBarProps={filterBarProps}
      style={{ height: "100%" }}
      TableProps={tableProps}
    />
  );
};
FilterTableArrayDataInstruments.displaySequence = displaySequence++;
