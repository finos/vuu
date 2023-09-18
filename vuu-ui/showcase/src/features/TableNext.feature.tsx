import { DataSourceConfig, TableSchema } from "@finos/vuu-data";
import { FilterTable } from "@finos/vuu-datatable";
import { FilterBarProps } from "@finos/vuu-filters";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { FlexboxLayout, useViewContext } from "@finos/vuu-layout";
import { DataSourceStats } from "@finos/vuu-table-extras";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTableConfig } from "../examples/utils";
import { Filter } from "packages/vuu-filter-types";

import "./TableNext.feature.css";

export interface TableNextFeatureProps {
  schema: TableSchema;
  showFilter?: boolean;
}

export const TableNextFeature = ({ schema }: TableNextFeatureProps) => {
  const { load, save } = useViewContext();
  // const namedFilters = useMemo(() => new Map<string, string>(), []);
  // const [filterState, setFilterState] = useState<FilterState>({
  //   filter: undefined,
  //   filterQuery: "",
  // });

  const {
    "datasource-config": dataSourceConfig,
    "filterbar-config": filterbarConfig,
    "table-config": tableConfig,
  } = useMemo(() => load?.() ?? ({} as any), [load]);
  filterbarConfig?.filters ?? [];
  const activeRef = useRef<number[]>(filterbarConfig?.activeFilterIndex ?? []);
  const [filters, setFilters] = useState<Filter[]>(
    filterbarConfig?.filters ?? []
  );

  const handleActiveChange = useCallback(
    (activeFilterIndex: number[]) => {
      activeRef.current = activeFilterIndex;
      save?.({ filters, activeFilterIndex }, "filterbar-config");
    },
    [filters, save]
  );

  const handleFiltersChanged = useCallback(
    (filters: Filter[]) => {
      save?.(
        { activeFilterIndex: activeRef.current, filters },
        "filterbar-config"
      );
      setFilters(filters);
    },
    [save]
  );

  const handleDataSourceConfigChange = useCallback(
    (config: DataSourceConfig | undefined, confirmed?: boolean) => {
      // confirmed / unconfirmed messages are used for UI updates, not state saving
      if (confirmed === undefined) {
        save?.(config, "datasource-config");
      }
    },
    [save]
  );

  const handleTableConfigChange = useCallback(
    (config: TableConfig) => {
      save?.(config, "table-config");
      // tableConfigRef.current = config;
    },
    [save]
  );

  const { config, dataSource, typeaheadHook } = useTableConfig({
    count: 1000,
    table: schema.table,
    dataSourceConfig,
    rangeChangeRowset: "delta",
  });

  useEffect(() => {
    dataSource.on("config", handleDataSourceConfigChange);
  }, [dataSource, handleDataSourceConfigChange]);

  const handleApplyFilter = useCallback(
    (filter: DataSourceFilter) => {
      dataSource.filter = filter;
    },
    [dataSource]
  );

  const filterBarProps: FilterBarProps = {
    activeFilterIndex: filterbarConfig?.activeFilterIndex,
    filters,
    FilterClauseEditorProps: {
      suggestionProvider: typeaheadHook,
    },
    onApplyFilter: handleApplyFilter,
    onActiveChange: handleActiveChange,
    onFiltersChanged: handleFiltersChanged,
    tableSchema: schema,
  };

  const tableProps = {
    availableColumns: schema.columns,
    config: {
      ...config,
      ...tableConfig,
    },
    dataSource,
    onConfigChange: handleTableConfigChange,
    renderBufferSize: 20,
  };

  return (
    <FlexboxLayout style={{ flexDirection: "column", height: "100%" }}>
      <FilterTable
        FilterBarProps={filterBarProps}
        TableProps={tableProps}
        style={{ flex: "1 1 auto" }}
      />
      <div className="vuuToolbarProxy vuuBlotter-footer" style={{ height: 32 }}>
        <DataSourceStats dataSource={dataSource} />
      </div>
    </FlexboxLayout>
  );
};

export default TableNextFeature;
