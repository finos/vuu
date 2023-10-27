import { FilterTable } from "@finos/vuu-datatable";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { Filter } from "@finos/vuu-filter-types";
import { useCallback, useState } from "react";
import { useTableConfig, useTestDataSource } from "../utils";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { getAllSchemas, getSchema } from "@finos/vuu-data-test";

let displaySequence = 1;

export const DefaultFilterTable = () => {
  const schemas = getAllSchemas();
  const { config, dataSource, error, tableSchema } = useTestDataSource({
    // bufferSize: 1000,
    schemas,
  });

  const [tableConfig] = useState<TableConfig>(config);

  const handleApplyFilter = useCallback((filter: DataSourceFilter) => {
    console.log("apply filter", {
      filter,
    });
    dataSource.filter = filter;
  }, []);

  const handleChangeFilter = useCallback(
    (filter: Filter, newFilter: Filter) => {
      console.log("change filter", {
        filter,
        newFilter,
      });
    },
    []
  );

  const filterBarProps = {
    filters: [],
    onApplyFilter: handleApplyFilter,
    onChangeFilter: handleChangeFilter,
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
    <FilterTable
      FilterBarProps={filterBarProps}
      TableProps={tableProps}
      style={{ width: 900, height: 800 }}
    />
  );
};
DefaultFilterTable.displaySequence = displaySequence++;

export const FilterTableArrayDataInstruments = () => {
  const {
    typeaheadHook: _,
    config: configProp,
    dataSource,
    ...props
  } = useTableConfig({
    table: { module: "SIMUL", table: "instruments" },
  });

  const handleApplyFilter = useCallback(
    (filter: DataSourceFilter) => {
      console.log("apply filter", {
        filter,
      });
      dataSource.filter = filter;
    },
    [dataSource]
  );

  const filterBarProps = {
    filters: [],
    onApplyFilter: handleApplyFilter,
    tableSchema: getSchema("instruments"),
  };

  const tableProps = {
    config: configProp,
    dataSource,
    ...props,
    height: 645,
    renderBufferSize: 20,
    width: 715,
  };

  console.log({ tableProps });

  return (
    <FilterTable
      FilterBarProps={filterBarProps}
      TableProps={tableProps}
      style={{ width: 900, height: 800 }}
    />
  );
};
FilterTableArrayDataInstruments.displaySequence = displaySequence++;
