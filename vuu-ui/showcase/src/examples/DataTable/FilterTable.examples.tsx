import { FilterTable } from "@finos/vuu-datatable";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { Filter } from "@finos/vuu-filter-types";
import { useCallback, useState } from "react";
import { useSchemas, useTestDataSource } from "../utils";
import { DataSourceFilter } from "packages/vuu-data-types";

export const DefaultFilterTable = () => {
  const { schemas } = useSchemas();
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
