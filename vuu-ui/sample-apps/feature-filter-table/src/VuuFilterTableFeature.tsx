import {
  DataSource,
  DataSourceConfig,
  DataSourceVisualLinkCreatedMessage,
  RemoteDataSource,
  SchemaColumn,
  TableSchema,
  VuuFeatureInvocationMessage,
  VuuFeatureMessage,
} from "@finos/vuu-data";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { FilterTable } from "@finos/vuu-datatable";
import { Filter } from "@finos/vuu-filter-types";
import { FilterBarProps } from "@finos/vuu-filters";
import { FlexboxLayout, useViewContext } from "@finos/vuu-layout";
import { ShellContextProps, useShellContext } from "@finos/vuu-shell";
import { DataSourceStats } from "@finos/vuu-table-extras";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  isViewportMenusAction,
  isVisualLinksAction,
  MenuActionConfig,
  useVuuMenuActions,
} from "@finos/vuu-data-react";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { LinkDescriptorWithLabel, VuuMenu } from "@finos/vuu-protocol-types";

import { Button } from "@salt-ds/core";
import "./VuuFilterTableFeature.css";

const classBase = "VuuFilterTableFeature";

export interface FilterTableFeatureProps {
  tableSchema: TableSchema;
}
type FilterTableConfig = {
  "available-columns"?: SchemaColumn[];
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
    "available-columns": availableColumnsFromState,
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

  const handleAvailableColumnsChange = useCallback(
    (columns: SchemaColumn[]) => {
      console.log("save new available columns");
      save?.(columns, "available-columns");
      // tableConfigRef.current = config;
    },
    [save]
  );

  const handleTableConfigChange = useCallback(
    (config: TableConfig) => {
      console.log(`tabale config changed`);
      save?.(config, "table-config");
      // tableConfigRef.current = config;
    },
    [save]
  );

  const { getDefaultColumnConfig, handleRpcResponse } = useShellContext();

  const tableConfig = useMemo(
    () => ({
      ...tableConfigFromState,
      columns:
        tableConfigFromState?.columns ||
        applyDefaults(tableSchema, getDefaultColumnConfig),
    }),
    [getDefaultColumnConfig, tableConfigFromState, tableSchema]
  );

  const dataSource: DataSource = useMemo(() => {
    let ds = loadSession?.("data-source") as RemoteDataSource;
    if (ds) {
      console.log(
        "%cFilterTableFeature DATA SOURCE IN SESSION STATE",
        "color:red;font-weight:bold;"
      );

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
    ds.on("config", handleDataSourceConfigChange);
    saveSession?.(ds, "data-source");
    return ds;
  }, [
    dataSourceConfigFromState,
    handleDataSourceConfigChange,
    id,
    loadSession,
    saveSession,
    tableSchema.columns,
    tableSchema.table,
    title,
  ]);

  useEffect(() => {
    dataSource.resume?.();
    return () => {
      dataSource.suspend?.();
    };
  }, [dataSource]);

  const removeVisualLink = useCallback(() => {
    dataSource.visualLink = undefined;
  }, [dataSource]);

  const handleVuuFeatureEnabled = useCallback(
    (message: VuuFeatureMessage) => {
      if (isViewportMenusAction(message)) {
        saveSession?.(message.menu, "vuu-menu");
      } else if (isVisualLinksAction(message)) {
        saveSession?.(message.links, "vuu-links");
      }
    },
    [saveSession]
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

  // It is important that these values are not assigned in advance. They
  // are accessed at the point of construction of ContextMenu
  const menuActionConfig: MenuActionConfig = useMemo(
    () => ({
      get visualLink() {
        return load?.("visual-link") as DataSourceVisualLinkCreatedMessage;
      },
      get visualLinks() {
        return loadSession?.("vuu-links") as LinkDescriptorWithLabel[];
      },
      get vuuMenu() {
        return loadSession?.("vuu-menu") as VuuMenu;
      },
    }),
    [load, loadSession]
  );

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource,
    menuActionConfig,
    onRpcResponse: handleRpcResponse,
  });

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
    onFiltersChanged: handleFiltersChanged,
    tableSchema,
  };

  const tableProps = {
    availableColumns: availableColumnsFromState ?? tableSchema.columns,
    config: {
      ...tableConfig,
    },
    dataSource,
    onAvailableColumnsChange: handleAvailableColumnsChange,
    onConfigChange: handleTableConfigChange,
    onFeatureEnabled: handleVuuFeatureEnabled,
    onFeatureInvocation: handleVuuFeatureInvoked,
    renderBufferSize: 50,
  };

  return (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildViewserverMenuOptions}
    >
      <FlexboxLayout
        className={classBase}
        style={{ flexDirection: "column", height: "100%" }}
      >
        <FilterTable
          FilterBarProps={filterBarProps}
          TableProps={tableProps}
          style={{ flex: "1 1 auto" }}
        />
        <div
          className="vuuToolbarProxy vuuBlotter-footer"
          style={{ height: 18 }}
        >
          <DataSourceStats dataSource={dataSource} />
        </div>
      </FlexboxLayout>
    </ContextMenuProvider>
  );
};

export default VuuFilterTableFeature;
