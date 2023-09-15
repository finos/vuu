import {
  DataSource,
  DataSourceConfig,
  RemoteDataSource,
  TableSchema,
} from "@finos/vuu-data";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { FilterBarProps } from "@finos/vuu-filters";
import { FlexboxLayout, useViewContext } from "@finos/vuu-layout";
import { ShellContextProps, useShellContext } from "@finos/vuu-shell";
import { FilterTable } from "@finos/vuu-datatable";
import { DataSourceStats } from "@finos/vuu-table-extras";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "./VuuFilterTableFeature.css";
import { DataSourceFilter } from "packages/vuu-data-types";
import { Filter } from "packages/vuu-filter-types";

const classBase = "VuuFilterTableFeature";

export interface FilterTableFeatureProps {
  tableSchema: TableSchema;
}

type FilterTableConfig = {
  "datasource-config"?: DataSourceConfig;
  "filterbar-config"?: Partial<FilterBarProps>;
  "table-config"?: TableConfig;
};

const NO_CONFIG: FilterTableConfig = {};

const applyDefaults = (
  { columns, table }: TableSchema,
  getDefaultColumnConfig?: ShellContextProps["getDefaultColumnConfig"]
) => {
  if (typeof getDefaultColumnConfig === "function") {
    return columns.map((column) => {
      const config = getDefaultColumnConfig(table.table, column.name);
      if (config) {
        return {
          ...column,
          ...config,
        };
      } else {
        return column;
      }
    });
  } else {
    return columns;
  }
};

const VuuFilterTableFeature = ({ tableSchema }: FilterTableFeatureProps) => {
  const { id, dispatch, load, save, loadSession, saveSession, title } =
    useViewContext();

  const {
    "datasource-config": dataSourceConfigFromState,
    "filterbar-config": filterbarConfigFromState,
    "table-config": tableConfigFromState,
  } = useMemo<FilterTableConfig>(() => load?.() ?? NO_CONFIG, [load]);

  const activeRef = useRef<number[]>(
    filterbarConfigFromState?.activeFilterIndex ?? []
  );
  const [filters, setFilters] = useState<Filter[]>(
    filterbarConfigFromState?.filters ?? []
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

  const handleTableConfigChange = useCallback(
    (config: TableConfig) => {
      save?.(config, "table-config");
      // tableConfigRef.current = config;
    },
    [save]
  );

  const { getDefaultColumnConfig, handleRpcResponse } = useShellContext();
  // const [filterState, setFilterState] = useState<FilterState>({
  //   filter: undefined,
  //   filterQuery: "",
  // });

  const configColumns = tableConfigFromState?.columns;

  const tableConfig = useMemo(
    () => ({
      columns:
        configColumns || applyDefaults(tableSchema, getDefaultColumnConfig),
    }),
    [configColumns, getDefaultColumnConfig, tableSchema]
  );

  // const suggestionProvider = useFilterSuggestionProvider({
  //   columns: tableSchema.columns,
  //   table: tableSchema.table,
  // });

  const dataSource: DataSource = useMemo(() => {
    let ds = loadSession?.("data-source") as RemoteDataSource;
    if (ds) {
      return ds;
    }
    const columns =
      dataSourceConfigFromState?.columns ??
      tableSchema.columns.map((col) => col.name);

    ds = new RemoteDataSource({
      bufferSize: 200,
      viewport: id,
      table: tableSchema.table,
      ...dataSourceConfigFromState,
      columns,
      title,
    });
    // ds.on("config", handleDataSourceConfigChange);
    saveSession?.(ds, "data-source");
    return ds;
  }, [
    dataSourceConfigFromState,
    id,
    loadSession,
    saveSession,
    tableSchema.columns,
    tableSchema.table,
    title,
  ]);

  console.log({ dataSource, tableConfig });

  useEffect(() => {
    dataSource.resume?.();
    return () => {
      // suspend activity on the dataSource when component is unmounted
      dataSource.suspend?.();
    };
  }, [dataSource]);

  const handleApplyFilter = useCallback(
    (filter: DataSourceFilter) => {
      dataSource.filter = filter;
    },
    [dataSource]
  );

  const filterBarProps: FilterBarProps = {
    activeFilterIndex: filterbarConfigFromState?.activeFilterIndex,
    filters,
    onApplyFilter: handleApplyFilter,
    onActiveChange: handleActiveChange,
    onFiltersChanged: handleFiltersChanged,
    tableSchema,
  };

  const tableProps = {
    config: {
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

export default VuuFilterTableFeature;
