import {
  DataSourceVisualLinkCreatedMessage,
  SchemaColumn,
  TableSchema,
  VuuFeatureInvocationMessage,
} from "@finos/vuu-data";
import { MenuActionConfig, useVuuMenuActions } from "@finos/vuu-data-react";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { FilterBarProps } from "@finos/vuu-filters";
import { ActiveItemChangeHandler, useViewContext } from "@finos/vuu-layout";
import { ShellContextProps, useShellContext } from "@finos/vuu-shell";
import { Button } from "@salt-ds/core";
import { Filter } from "@finos/vuu-filter-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FilterTableFeatureProps } from "./VuuFilterTableFeature";
import { useSessionDataSource } from "./useSessionDataSource";

const NO_CONFIG: FilterTableConfig = {};

const defaultTableConfig: Partial<TableConfig> = {
  rowSeparators: true,
  zebraStripes: true,
};

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

type FilterTableConfig = {
  "available-columns"?: SchemaColumn[];
  "filterbar-config"?: Partial<FilterBarProps>;
  "table-config"?: TableConfig;
};

export const useFilterTable = ({ tableSchema }: FilterTableFeatureProps) => {
  const { dispatch, load, save } = useViewContext();

  const {
    "available-columns": availableColumnsFromState,
    "filterbar-config": filterbarConfigFromState,
    "table-config": tableConfigFromState,
  } = useMemo<FilterTableConfig>(() => load?.() ?? NO_CONFIG, [load]);

  const dataSource = useSessionDataSource({ tableSchema });

  const activeRef = useRef<number[]>(
    filterbarConfigFromState?.activeFilterIndex ?? []
  );
  const [filters, setFilters] = useState<Filter[]>(
    filterbarConfigFromState?.filters ?? []
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

  const handleChangeActiveFilterIndex = useCallback<ActiveItemChangeHandler>(
    (activeIndex) => {
      activeRef.current = activeIndex;
      save?.({ activeFilterIndex: activeIndex, filters }, "filterbar-config");
    },
    [filters, save]
  );

  const handleApplyFilter = useCallback(
    (filter: DataSourceFilter) => {
      dataSource.filter = filter;
    },
    [dataSource]
  );

  const removeVisualLink = useCallback(() => {
    dataSource.visualLink = undefined;
  }, [dataSource]);

  const handleAvailableColumnsChange = useCallback(
    (columns: SchemaColumn[]) => {
      console.log("save new available columns");
      save?.(columns, "available-columns");
    },
    [save]
  );

  const handleTableConfigChange = useCallback(
    (config: TableConfig) => {
      console.log(`table config changed`);
      save?.(config, "table-config");
    },
    [save]
  );

  const handleVuuFeatureInvoked = useCallback(
    (message: VuuFeatureInvocationMessage) => {
      if (message.type === "vuu-link-created") {
        dispatch?.({
          type: "add-toolbar-contribution",
          location: "post-title",
          content: (
            <Button
              aria-label="remove-link"
              data-icon="link"
              onClick={removeVisualLink}
            />
          ),
        });
      } else {
        dispatch?.({
          type: "remove-toolbar-contribution",
          location: "post-title",
        });
      }
    },
    [dispatch, removeVisualLink]
  );

  const { getDefaultColumnConfig, handleRpcResponse } = useShellContext();

  const tableConfig = useMemo(
    () => ({
      ...defaultTableConfig,
      ...tableConfigFromState,
      columns:
        tableConfigFromState?.columns ||
        applyDefaults(tableSchema, getDefaultColumnConfig),
    }),
    [getDefaultColumnConfig, tableConfigFromState, tableSchema]
  );

  const filterBarProps: FilterBarProps = {
    activeFilterIndex: filterbarConfigFromState?.activeFilterIndex,
    filters,
    onApplyFilter: handleApplyFilter,
    onChangeActiveFilterIndex: handleChangeActiveFilterIndex,
    onFiltersChanged: handleFiltersChanged,
    tableSchema,
  };

  const tableProps = {
    availableColumns: availableColumnsFromState ?? tableSchema.columns,
    config: {
      ...tableConfig,
    },
    dataSource,
    height: "auto",
    onAvailableColumnsChange: handleAvailableColumnsChange,
    onConfigChange: handleTableConfigChange,
    onFeatureInvocation: handleVuuFeatureInvoked,
    renderBufferSize: 50,
  };

  // It is important that these values are not assigned in advance. They
  // are accessed at the point of construction of ContextMenu
  const menuActionConfig: MenuActionConfig = useMemo(
    () => ({
      get visualLink() {
        return load?.("visual-link") as DataSourceVisualLinkCreatedMessage;
      },
    }),
    [load]
  );

  useEffect(() => {
    dataSource.resume?.();
    return () => {
      dataSource.suspend?.();
    };
  }, [dataSource]);

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource,
    menuActionConfig,
    onRpcResponse: handleRpcResponse,
  });

  return {
    buildViewserverMenuOptions,
    filterBarProps,
    handleMenuAction,
    tableProps,
  };
};
