import { MenuActionConfig, useVuuMenuActions } from "@finos/vuu-data-react";
import {
  DataSourceVisualLinkCreatedMessage,
  SchemaColumn,
  SuggestionFetcher,
  TypeaheadSuggestionProvider,
  VuuFeatureInvocationMessage,
} from "@finos/vuu-data-types";
import { usePersistFilterState } from "@finos/vuu-datatable";
import { FilterBarProps, QuickFilterProps } from "@finos/vuu-filters";
import { useViewContext } from "@finos/vuu-layout";
import { TypeaheadParams } from "@finos/vuu-protocol-types";
import { useShellContext } from "@finos/vuu-utils";
import { TableConfig, TableConfigChangeHandler } from "@finos/vuu-table-types";
import { IconButton } from "@finos/vuu-ui-controls";
import {
  FilterTableFeatureProps,
  applyDefaultColumnConfig,
  isTypeaheadSuggestionProvider,
} from "@finos/vuu-utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSessionDataSource } from "./useSessionDataSource";
import { FilterMode } from "@finos/vuu-filters/src/filter-bar/useFilterBar";

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

export const useFilterTable = ({ tableSchema }: FilterTableFeatureProps) => {
  const { dispatch, load, save, title } = useViewContext();

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

  const getSuggestions = useCallback<SuggestionFetcher>(
    ([, column, pattern]: TypeaheadParams) =>
      (dataSource as TypeaheadSuggestionProvider).getTypeaheadSuggestions(
        column,
        pattern,
      ),
    [dataSource],
  );

  const suggestionProvider = useMemo(() => {
    if (isTypeaheadSuggestionProvider(dataSource)) {
      return () => getSuggestions;
    }
  }, [dataSource, getSuggestions]);

  const highlightVisualLinkTarget = useCallback(() => {
    if (dataSource.visualLink) {
      dispatch?.({
        type: "broadcast-message",
        message: {
          targetId: dataSource.visualLink.parentClientVpId,
          type: "highlight-on",
        },
      });
    }
  }, [dataSource, dispatch]);

  const clearVisualLinkTarget = useCallback(() => {
    if (dataSource.visualLink) {
      dispatch?.({
        type: "broadcast-message",
        message: {
          targetId: dataSource.visualLink.parentClientVpId,
          type: "highlight-off",
        },
      });
    }
  }, [dataSource, dispatch]);

  const removeVisualLink = useCallback(() => {
    if (dataSource.visualLink) {
      dispatch?.({
        type: "broadcast-message",
        message: {
          targetId: dataSource.visualLink.parentClientVpId,
          type: "highlight-off",
        },
      });

      dataSource.visualLink = undefined;
    }
  }, [dataSource, dispatch]);

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

  const handleVuuFeatureInvoked = useCallback(
    (message: VuuFeatureInvocationMessage) => {
      if (message.type === "vuu-link-created") {
        dispatch?.({
          type: "add-toolbar-contribution",
          location: "post-title",
          content: (
            <IconButton
              aria-label="remove-link"
              icon="link"
              onClick={removeVisualLink}
              onMouseEnter={highlightVisualLinkTarget}
              onMouseLeave={clearVisualLinkTarget}
              variant="secondary"
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
    [
      dispatch,
      removeVisualLink,
      highlightVisualLinkTarget,
      clearVisualLinkTarget,
    ],
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
    suggestionProvider,
    tableSchema,
    variant: "full-filters",
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
    [load],
  );

  useEffect(() => {
    if (dataSource.title !== title) {
      dataSource.title = title;
    }
  }, [dataSource, title]);

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource,
    menuActionConfig,
    onRpcResponse: handleRpcResponse,
  });

  return {
    buildFilterTableMenuOptions: buildViewserverMenuOptions,
    filterBarProps,
    handleFilterTableMenuAction: handleMenuAction,
    tableProps,
  };
};
