import { MenuActionConfig, useVuuMenuActions } from "@finos/vuu-data-react";
import {
  ContextMenuItemDescriptor,
  DataSourceFilter,
  DataSourceVisualLinkCreatedMessage,
  MenuActionHandler,
  MenuBuilder,
  SchemaColumn,
  SuggestionFetcher,
  TypeaheadSuggestionProvider,
  VuuFeatureInvocationMessage,
} from "@finos/vuu-data-types";
import { Filter, FilterState, NamedFilter } from "@finos/vuu-filter-types";
import { FilterBarProps } from "@finos/vuu-filters";
import { useViewContext } from "@finos/vuu-layout";
import { TypeaheadParams } from "@finos/vuu-protocol-types";
import { useLayoutManager, useShellContext } from "@finos/vuu-shell";
import { TableConfig, TableConfigChangeHandler } from "@finos/vuu-table-types";
import {
  applyDefaultColumnConfig,
  isTypeaheadSuggestionProvider,
} from "@finos/vuu-utils";
import { Button } from "@salt-ds/core";
import { useCallback, useMemo, useState } from "react";
import { useSessionDataSource } from "./useSessionDataSource";
import { FilterTableFeatureProps } from "./VuuFilterTableFeature";

const NO_CONFIG: FilterTableConfig = {};

const defaultTableConfig: Partial<TableConfig> = {
  columnDefaultWidth: 130,
  rowSeparators: true,
  zebraStripes: true,
};

type FilterTableConfig = {
  "available-columns"?: SchemaColumn[];
  "filterbar-config"?: Partial<FilterBarProps>;
  "table-config"?: TableConfig;
};

type SavedFilterMap = {
  [key: string]: Omit<NamedFilter, "name"> & { name: string }[];
};

const hasFilterWithName = (filters: NamedFilter[], name: string) =>
  filters.findIndex((f) => f.name === name) !== -1;

export const useFilterTable = ({ tableSchema }: FilterTableFeatureProps) => {
  const { dispatch, load, save } = useViewContext();
  const { getApplicationSettings, saveApplicationSettings } =
    useLayoutManager();

  const savedFilters = useMemo(() => {
    const {
      table: { module, table },
    } = tableSchema;
    const savedFilters = getApplicationSettings("filters") as SavedFilterMap;
    const key = `${module}:${table}`;
    return savedFilters?.[key] ?? [];
  }, [getApplicationSettings, tableSchema]);

  const {
    "available-columns": availableColumnsFromState,
    "filterbar-config": filterbarConfigFromState,
    "table-config": tableConfigFromState,
  } = useMemo<FilterTableConfig>(() => load?.() ?? NO_CONFIG, [load]);

  const dataSource = useSessionDataSource({ tableSchema });

  const getSuggestions = useCallback<SuggestionFetcher>(
    ([, column, pattern]: TypeaheadParams) =>
      (dataSource as TypeaheadSuggestionProvider).getTypeaheadSuggestions(
        column,
        pattern
      ),
    [dataSource]
  );

  const removeFilterFromSettings = useCallback(
    (filter: Filter | NamedFilter) => {
      if (!tableSchema || !filter.name) return;

      const savedFilters = getApplicationSettings("filters") as SavedFilterMap;
      if (!savedFilters) return;

      const { module, table } = tableSchema.table;
      const key = `${module}:${table}`;

      if (hasFilterWithName(savedFilters[key], filter.name)) {
        const newSavedFilters = {
          ...savedFilters,
          [key]: savedFilters[key].filter((f) => f.name !== filter.name),
        };
        saveApplicationSettings(newSavedFilters, "filters");
      }
    },
    [getApplicationSettings, saveApplicationSettings, tableSchema]
  );

  const saveFilterToSettings = useCallback(
    (filter: Filter, name?: string) => {
      if (tableSchema && name) {
        const savedFilters = getApplicationSettings(
          "filters"
        ) as SavedFilterMap;
        let newFilters = savedFilters;
        const { module, table } = tableSchema.table;
        const key = `${module}:${table}`;
        if (savedFilters) {
          if (savedFilters[key]) {
            if (hasFilterWithName(savedFilters[key], name)) {
              newFilters = {
                ...savedFilters,
                [key]: savedFilters[key].map((f) =>
                  f.name === name ? { ...filter, name } : f
                ),
              };
            } else if (
              filter?.name &&
              filter?.name !== name &&
              hasFilterWithName(savedFilters[key], filter.name)
            ) {
              newFilters = {
                ...savedFilters,
                [key]: savedFilters[key].map((f) =>
                  f.name === filter.name ? { ...filter, name } : f
                ),
              };
            } else {
              newFilters = {
                ...savedFilters,
                [key]: savedFilters[key].concat({ ...filter, name }),
              };
            }
          } else {
            newFilters = {
              ...savedFilters,
              [key]: [{ ...filter, name }],
            };
          }
        } else {
          newFilters = {
            [key]: [{ ...filter, name }],
          };
        }
        if (newFilters !== savedFilters) {
          saveApplicationSettings(newFilters, "filters");
        }
      }
    },
    [getApplicationSettings, saveApplicationSettings, tableSchema]
  );

  const suggestionProvider = useMemo(() => {
    if (isTypeaheadSuggestionProvider(dataSource)) {
      return () => getSuggestions;
    }
  }, [dataSource, getSuggestions]);

  const [filterState, setFilterState] = useState<FilterState>({
    filters: filterbarConfigFromState?.filterState?.filters ?? [],
    activeIndices: filterbarConfigFromState?.filterState?.activeIndices ?? [],
  });

  const handleFilterStateChanged = useCallback(
    (filterState: FilterState) => {
      save?.({ filterState }, "filterbar-config");
      setFilterState(filterState);
    },
    [save]
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
      save?.(columns, "available-columns");
    },
    [save]
  );

  const handleTableConfigChange = useCallback<TableConfigChangeHandler>(
    (config) => {
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
        applyDefaultColumnConfig(tableSchema, getDefaultColumnConfig),
    }),
    [getDefaultColumnConfig, tableConfigFromState, tableSchema]
  );

  const handleFilterDeleted = useCallback(
    (filter: Filter) => {
      removeFilterFromSettings(filter);
    },
    [removeFilterFromSettings]
  );

  const handleFilterRenamed = useCallback(
    (filter: Filter, name: string) => {
      saveFilterToSettings(filter, name);
    },
    [saveFilterToSettings]
  );

  const filterBarProps: FilterBarProps = {
    FilterClauseEditorProps: suggestionProvider
      ? {
          suggestionProvider,
        }
      : undefined,
    columnDescriptors: tableConfig.columns,
    filterState,
    onApplyFilter: handleApplyFilter,
    onFilterDeleted: handleFilterDeleted,
    onFilterRenamed: handleFilterRenamed,
    onFilterStateChanged: handleFilterStateChanged,
    tableSchema,
  };

  const tableProps = {
    availableColumns: availableColumnsFromState ?? tableSchema.columns,
    config: { ...tableConfig },
    dataSource,
    height: "auto",
    onAvailableColumnsChange: handleAvailableColumnsChange,
    onConfigChange: handleTableConfigChange,
    onFeatureInvocation: handleVuuFeatureInvoked,
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
    [load]
  );

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource,
    menuActionConfig,
    onRpcResponse: handleRpcResponse,
  });

  const buildFilterTableMenuOptions = useCallback<MenuBuilder>(
    (location, options) => {
      if (location === "filter-bar-menu") {
        if (savedFilters.length > 0) {
          return savedFilters.map((filter) => ({
            action: "add-filter",
            label: filter.name,
            options: { filter },
          }));
        } else {
          return [
            {
              label: `You have no saved filters for this table`,
              action: `no-action`,
            } as ContextMenuItemDescriptor,
          ];
        }
      } else {
        return buildViewserverMenuOptions(location, options);
      }
    },
    [buildViewserverMenuOptions, savedFilters]
  );

  const handleFilterTableMenuAction = useCallback<MenuActionHandler>(
    (menuAction) => {
      const { menuId, options } = menuAction;
      if (menuId === "add-filter") {
        console.log(`add filter `, {
          options,
        });
      } else {
        return handleMenuAction(menuAction);
      }
      console.log(menuId, options);
      // return false;
    },
    [handleMenuAction]
  );

  return {
    buildFilterTableMenuOptions,
    filterBarProps,
    handleFilterTableMenuAction,
    tableProps,
  };
};
