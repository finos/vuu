import { useIdMemo } from "@salt-ds/core";
import {
  MenuActionConfig,
  useSessionDataSource,
  useVisualLinks,
  useVuuMenuActions,
} from "@vuu-ui/vuu-data-react";
import {
  DataSourceConfig,
  DataSourceConfigChangeHandler,
  DataSourceSuspenseProps,
  DataSourceVisualLinkCreatedMessage,
  SchemaColumn,
} from "@vuu-ui/vuu-data-types";
import { usePersistFilterState } from "@vuu-ui/vuu-datatable";
import {
  FilterBarProps,
  FilterMode,
  QuickFilterProps,
} from "@vuu-ui/vuu-filters";
import { useViewContext } from "@vuu-ui/vuu-layout";
import { VuuRange } from "@vuu-ui/vuu-protocol-types";
import { TableProps } from "@vuu-ui/vuu-table";
import { TableConfig, TableConfigChangeHandler } from "@vuu-ui/vuu-table-types";
import {
  FilterTableFeatureProps,
  applyDefaultColumnConfig,
  isConfigChanged,
  toColumnName,
  useShellContext,
} from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const NO_CONFIG: FilterTableConfig = {};

const defaultTableConfig: Partial<TableConfig> = {
  columnLayout: "fit",
  columnDefaultWidth: 130,
  rowSeparators: true,
  zebraStripes: true,
};

type FilterTableConfig = {
  "available-columns"?: SchemaColumn[];
  "datasource-config"?: DataSourceConfig;
  "filter-config"?: Pick<FilterBarProps, "filterMode"> &
    Pick<QuickFilterProps, "quickFilterColumns">;
  "table-config"?: TableConfig;
};

const NoSuspense: DataSourceSuspenseProps = {
  escalateToDisable: false,
};

export const useFilterTableFeature = ({
  tableSchema,
}: FilterTableFeatureProps) => {
  const { id, load, save, title } = useViewContext();
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
    "datasource-config": datasourceConfigFromState,
    "filter-config": filterConfigFromState,
    "table-config": tableConfigFromState,
  } = useMemo<FilterTableConfig>(() => load?.() ?? NO_CONFIG, [load]);

  const sessionKey = useIdMemo(id);

  const [quickFilterColumns, setQuickFilterColumns] = useState<string[]>(
    filterConfigFromState?.quickFilterColumns ?? [],
  );

  const handleDataSourceConfigChange =
    useCallback<DataSourceConfigChangeHandler>(
      (
        config: DataSourceConfig | undefined,
        _range: VuuRange,
        confirmed?: boolean,
      ) => {
        if (confirmed !== false) {
          const { noChanges } = isConfigChanged(
            dataSourceConfigRef.current,
            config,
          );
          if (noChanges === false) {
            dataSourceConfigRef.current = config;
            save?.(config, "datasource-config");
          }
        }
      },
      [save],
    );

  const dataSourceConfigRef = useRef<DataSourceConfig | undefined>(undefined);

  const { getDataSource } = useSessionDataSource({
    onConfigChange: handleDataSourceConfigChange,
  });

  const dataSource = getDataSource(sessionKey, {
    ...datasourceConfigFromState,
    columns:
      datasourceConfigFromState?.columns ??
      tableSchema.columns.map(toColumnName),
    suspenseProps: NoSuspense,
    table: tableSchema.table,
  });

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

  const filterBarProps: Omit<
    FilterBarProps,
    "onApplyFilter" | "onClearFilter"
  > = {
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
  };

  const tableProps: Partial<TableProps> = {
    availableColumns: availableColumnsFromState ?? tableSchema.columns,
    config: { ...tableConfig },
    dataSource,
    height: "auto",
    onAvailableColumnsChange: handleAvailableColumnsChange,
    onConfigChange: handleTableConfigChange,
    renderBufferSize: 20,
    rowSelectionBorder: true,
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
