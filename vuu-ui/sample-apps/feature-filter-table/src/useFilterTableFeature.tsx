import {
  MenuActionConfig,
  useSessionDataSource,
  useVuuMenuActions,
} from "@vuu-ui/vuu-data-react";
import {
  DataSourceVisualLinkCreatedMessage,
  SchemaColumn,
} from "@vuu-ui/vuu-data-types";
import { usePersistFilterState } from "@vuu-ui/vuu-datatable";
import { FilterBarProps, QuickFilterProps } from "@vuu-ui/vuu-filters";
import { useViewContext } from "@vuu-ui/vuu-layout";
import { useShellContext } from "@vuu-ui/vuu-utils";
import { TableConfig, TableConfigChangeHandler } from "@vuu-ui/vuu-table-types";
import {
  FilterTableFeatureProps,
  applyDefaultColumnConfig,
} from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FilterMode } from "@vuu-ui/vuu-filters/src/filter-bar/useFilterBar";
import { useVisualLinks } from "@vuu-ui/vuu-data-react";

const NO_CONFIG: FilterTableConfig = {};

const defaultTableConfig: Partial<TableConfig> = {
  columnLayout: "fit",
  columnDefaultWidth: 130,
  rowSeparators: true,
  zebraStripes: true,
};

type FilterTableConfig = {
  "available-columns"?: SchemaColumn[];
  "filter-config"?: Pick<FilterBarProps, "filterMode"> &
    Pick<QuickFilterProps, "quickFilterColumns">;
  "table-config"?: TableConfig;
};

export const useFilterTableFeature = ({
  tableSchema,
}: FilterTableFeatureProps) => {
  const { load, save, title } = useViewContext();
  const {
    filterState,
    onFilterDeleted,
    onFilterRenamed,
    onFilterStateChanged,
  } = usePersistFilterState({
    tableSchema,
  });

  const {
    "available-columns": availableColumnsFromState,
    "filter-config": filterConfigFromState,
    "table-config": tableConfigFromState,
  } = useMemo<FilterTableConfig>(() => load?.() ?? NO_CONFIG, [load]);

  const [quickFilterColumns, setQuickFilterColumns] = useState<string[]>(
    filterConfigFromState?.quickFilterColumns ?? [],
  );

  const dataSource = useSessionDataSource({ tableSchema });

  useVisualLinks(dataSource);

  const handleAvailableColumnsChange = useCallback(
    (columns: SchemaColumn[]) => {
      save?.(columns, "available-columns");
    },
    [save],
  );

  const handleTableConfigChange = useCallback<TableConfigChangeHandler>(
    (config) => {
      save?.(config, "table-config");
    },
    [save],
  );

  const handleChangeFilterMode = useCallback(
    (filterMode: FilterMode) => {
      save?.({ ...filterConfigFromState, filterMode }, "filter-config");
    },
    [filterConfigFromState, save],
  );

  const handleChangeQuickFilterColumns = useCallback(
    (columns: string[]) => {
      setQuickFilterColumns(columns);
      save?.(
        { ...filterConfigFromState, quickFilterColumns: columns },
        "filter-config",
      );
    },
    [filterConfigFromState, save],
  );

  const { getDefaultColumnConfig, handleRpcResponse } = useShellContext();

  const tableConfig = useMemo(
    () => ({
      ...defaultTableConfig,
      ...tableConfigFromState,
      columns:
        tableConfigFromState?.columns ||
        applyDefaultColumnConfig(tableSchema, getDefaultColumnConfig),
    }),
    [getDefaultColumnConfig, tableConfigFromState, tableSchema],
  );

  const filterBarProps: Omit<FilterBarProps, "onApplyFilter"> = {
    QuickFilterProps: {
      onChangeQuickFilterColumns: handleChangeQuickFilterColumns,
      quickFilterColumns,
    },
    columnDescriptors: tableConfig.columns,
    defaultFilterMode: filterConfigFromState?.filterMode,
    filterState,
    onChangeFilterMode: handleChangeFilterMode,
    onFilterDeleted,
    onFilterRenamed,
    onFilterStateChanged,
    vuuTable: tableSchema.table,
    variant: "full-filters",
  };

  const tableProps = {
    availableColumns: availableColumnsFromState ?? tableSchema.columns,
    config: { ...tableConfig },
    dataSource,
    height: "auto",
    onAvailableColumnsChange: handleAvailableColumnsChange,
    onConfigChange: handleTableConfigChange,
    renderBufferSize: 20,
  };

  // It is important that these values are not assigned in advance. They
  // are accessed at the point of construction of ContextMenu
  const menuActionConfig: MenuActionConfig = useMemo(
    () => ({
      get visualLink() {
        return load?.("visual-link") as DataSourceVisualLinkCreatedMessage;
      },
    }),
    [load],
  );

  useEffect(() => {
    if (title && dataSource.title !== title) {
      dataSource.title = title;
    }
  }, [dataSource, title]);

  const { menuBuilder, menuActionHandler } = useVuuMenuActions({
    dataSource,
    menuActionConfig,
    onRpcResponse: handleRpcResponse,
  });

  return {
    menuBuilder,
    filterBarProps,
    menuActionHandler,
    tableProps,
  };
};
