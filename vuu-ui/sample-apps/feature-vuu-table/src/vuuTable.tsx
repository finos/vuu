import {
  DataSource,
  DataSourceConfig,
  DataSourceVisualLinkCreatedMessage,
  isViewportMenusAction,
  isVisualLinksAction,
  MenuActionConfig,
  RemoteDataSource,
  TableSchema,
  useVuuMenuActions,
  VuuFeatureInvocationMessage,
  VuuFeatureMessage,
} from "@finos/vuu-data";
import { GridConfig } from "@finos/vuu-datagrid-types";
import { DataTable } from "@finos/vuu-datatable";
import { Filter } from "@finos/vuu-filter-types";
import { filterAsQuery, FilterInput, updateFilter } from "@finos/vuu-filters";
import { useViewContext } from "@finos/vuu-layout";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { LinkDescriptorWithLabel, VuuMenu } from "@finos/vuu-protocol-types";
import {
  FeatureProps,
  ShellContextProps,
  useShellContext,
} from "@finos/vuu-shell";
import { ToolbarButton } from "@heswell/salt-lab";
import { LinkedIcon } from "@salt-ds/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSuggestionProvider } from "./useSuggestionProvider";

import "./vuuTable.css";

const classBase = "vuuTable";

type BlotterConfig = {
  "datasource-config"?: DataSourceConfig;
  "table-config"?: Omit<GridConfig, "headings">;
};

const NO_CONFIG: BlotterConfig = {};

export interface FilteredTableProps extends FeatureProps {
  schema: TableSchema;
}

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

const VuuTable = ({ schema, ...props }: FilteredTableProps) => {
  const { id, dispatch, load, save, loadSession, saveSession, title } =
    useViewContext();
  const {
    "datasource-config": dataSourceConfigFromState,
    "table-config": tableConfigFromState,
  } = useMemo(() => (load?.() ?? NO_CONFIG) as BlotterConfig, [load]);

  console.log({
    dataSourceConfigFromState,
  });

  const { getDefaultColumnConfig, handleRpcResponse } = useShellContext();
  const [currentFilter, setCurrentFilter] = useState<Filter>();

  const configColumns = tableConfigFromState?.columns;

  const tableConfig = useMemo(
    () => ({
      columns: configColumns || applyDefaults(schema, getDefaultColumnConfig),
    }),
    [configColumns, getDefaultColumnConfig, schema]
  );

  const tableConfigRef = useRef<Omit<GridConfig, "headings">>(tableConfig);

  const suggestionProvider = useSuggestionProvider({
    columns: schema.columns,
    table: schema.table,
  });

  const handleDataSourceConfigChange = useCallback(
    (config: DataSourceConfig) => save?.(config, "datasource-config"),
    [save]
  );

  const dataSource: DataSource = useMemo(() => {
    let ds = loadSession?.("data-source") as RemoteDataSource;
    if (ds) {
      return ds;
    }
    const columns =
      dataSourceConfigFromState?.columns ??
      schema.columns.map((col) => col.name);

    ds = new RemoteDataSource({
      onConfigChange: handleDataSourceConfigChange,
      viewport: id,
      table: schema.table,
      ...dataSourceConfigFromState,
      columns,
      title,
    });
    saveSession?.(ds, "data-source");
    return ds;
  }, [
    dataSourceConfigFromState,
    handleDataSourceConfigChange,
    id,
    loadSession,
    saveSession,
    schema.columns,
    schema.table,
    title,
  ]);

  useEffect(() => {
    dataSource.enable?.();
    return () => {
      // suspend activity on the dataSource when component is unmounted
      dataSource.disable?.();
    };
  }, [dataSource]);

  const removeVisualLink = useCallback(() => {
    dataSource.visualLink = undefined;
  }, [dataSource]);

  const handleTableConfigChange = useCallback(
    (config: Omit<GridConfig, "headings">) => {
      save?.(config, "table-config");
      tableConfigRef.current = config;
    },
    [save]
  );

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
            <ToolbarButton aria-label="remove-link" onClick={removeVisualLink}>
              <LinkedIcon />
            </ToolbarButton>
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

  useEffect(() => {
    if (title !== dataSource.title) {
      dataSource.title = title;
    }
  }, [dataSource, title]);

  const handleSubmitFilter = useCallback(
    (
      filter: Filter | undefined,
      filterQuery: string,
      filterName?: string,
      mode = "add"
    ) => {
      if (mode === "add" && currentFilter) {
        const newFilter = updateFilter(currentFilter, filter, mode) as Filter;
        const newFilterQuery = filterAsQuery(newFilter);
        dataSource.filter = { filter: newFilterQuery, filterStruct: newFilter };
        setCurrentFilter(newFilter);
      } else {
        dataSource.filter = { filterStruct: filter, filter: filterQuery };
        setCurrentFilter(filter);
      }
    },
    [currentFilter, dataSource]
  );

  return (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildViewserverMenuOptions}
    >
      <div className={classBase}>
        <FilterInput
          existingFilter={currentFilter}
          onSubmitFilter={handleSubmitFilter}
          suggestionProvider={suggestionProvider}
        />
        <div className={`${classBase}-gridContainer`}>
          <DataTable
            {...props}
            // columnSizing="fill"
            config={tableConfigRef.current}
            dataSource={dataSource}
            // columns={columns}
            onConfigChange={handleTableConfigChange}
            onFeatureEnabled={handleVuuFeatureEnabled}
            onFeatureInvocation={handleVuuFeatureInvoked}
            renderBufferSize={80}
            rowHeight={18}
            // selectionModel="extended"
            // showLineNumbers
          />
        </div>
      </div>
    </ContextMenuProvider>
  );
};

VuuTable.displayName = "VuuTable";

export default VuuTable;
