import {
  getAllSchemas,
  getSchema,
  SimulTableName,
  vuuModule,
} from "@finos/vuu-data-test";
import type { DataSourceFilter } from "@finos/vuu-data-types";
import { FilterTable } from "@finos/vuu-datatable";
import type { Filter } from "@finos/vuu-filter-types";
import type { TableProps } from "@finos/vuu-table";
import type { TableConfig } from "@finos/vuu-table-types";
import type { ActiveItemChangeHandler } from "@finos/vuu-ui-controls";
import { useCallback, useMemo, useState } from "react";
import { useTestDataSource } from "../utils";

let displaySequence = 1;
const schemas = getAllSchemas();

export const DefaultFilterTable = () => {
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

  const handleChangeActiveFilterIndex = useCallback<ActiveItemChangeHandler>(
    (index) => {
      console.log(`active filters ${index.join(",")}`);
    },
    []
  );

  const filterBarProps = {
    filters: [],
    onApplyFilter: handleApplyFilter,
    onChangeFilter: handleChangeFilter,
    onChangeActiveFilterIndex: handleChangeActiveFilterIndex,
    tableSchema,
    tableConfig,
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

  const handleApplyFilter = useCallback(
    (filter: DataSourceFilter) => {
      console.log("apply filter", {
        filter,
      });
      dataSource.filter = filter;
    },
    [dataSource]
  );

  const handleChangeActiveFilterIndex = useCallback<ActiveItemChangeHandler>(
    (index) => {
      console.log(`active filters ${index.join(",")}`);
    },
    []
  );

  const filterBarProps = {
    filters: [],
    onApplyFilter: handleApplyFilter,
    onChangeActiveFilterIndex: handleChangeActiveFilterIndex,
    tableSchema: getSchema("instruments"),
    tableConfig: config,
  };

  const tableProps = {
    ...restTableProps,
    config,
    dataSource,
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
