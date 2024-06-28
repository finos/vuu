import { MenuActionConfig, useVuuMenuActions } from "@finos/vuu-data-react";
import {
  DataSourceVisualLinkCreatedMessage,
  SchemaColumn,
  SuggestionFetcher,
  TypeaheadSuggestionProvider,
  VuuFeatureInvocationMessage,
} from "@finos/vuu-data-types";
import { usePersistFilterState } from "@finos/vuu-datatable";
import { FilterBarProps } from "@finos/vuu-filters";
import { useViewContext } from "@finos/vuu-layout";
import { TypeaheadParams } from "@finos/vuu-protocol-types";
import { useShellContext } from "@finos/vuu-shell";
import { TableConfig, TableConfigChangeHandler } from "@finos/vuu-table-types";
import { IconButton } from "@finos/vuu-ui-controls";
import {
  FilterTableFeatureProps,
  applyDefaultColumnConfig,
  isTypeaheadSuggestionProvider,
} from "@finos/vuu-utils";
import { useCallback, useEffect, useMemo } from "react";
import { useSessionDataSource } from "./useSessionDataSource";

const NO_CONFIG: FilterTableConfig = {};

const defaultTableConfig: Partial<TableConfig> = {
  columnLayout: "fit",
  columnDefaultWidth: 130,
  rowSeparators: true,
  zebraStripes: true,
};

type FilterTableConfig = {
  "available-columns"?: SchemaColumn[];
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

  const suggestionProvider = useMemo(() => {
    if (isTypeaheadSuggestionProvider(dataSource)) {
      return () => getSuggestions;
    }
  }, [dataSource, getSuggestions]);

  const signalVisualLink = useCallback(() => {
    console.log(`signal visual link`, {
      link: dataSource.visualLink,
    });
  }, [dataSource]);

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
            <IconButton
              aria-label="remove-link"
              icon="link"
              onClick={removeVisualLink}
              onMouseEnter={signalVisualLink}
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
    [dispatch, removeVisualLink, signalVisualLink]
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

  const filterBarProps: Omit<FilterBarProps, "onApplyFilter"> = {
    columnDescriptors: tableConfig.columns,
    filterState,
    onFilterDeleted,
    onFilterRenamed,
    onFilterStateChanged,
    suggestionProvider,
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
