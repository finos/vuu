import {
  ConfigChangeMessage,
  DataSourceConfig,
  DataSourceMenusMessage,
  DataSourceVisualLinksMessage,
  RemoteDataSource,
  TableSchema,
  useVuuMenuActions,
} from "@finos/vuu-data";
import { GridConfig } from "@finos/vuu-datagrid-types";
import { DataTable } from "@finos/vuu-datatable";
import { Filter } from "@finos/vuu-filter-types";
import { filterAsQuery, FilterInput, updateFilter } from "@finos/vuu-filters";
import { useViewContext } from "@finos/vuu-layout";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { VuuMenu } from "@finos/vuu-protocol-types";
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
const CONFIG_KEYS = ["filter", "filterQuery", "groupBy", "sort"];

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
  const { id, dispatch, load, purge, save, loadSession, saveSession } =
    useViewContext();
  const {
    "datasource-config": dataSourceConfigFromState,
    "table-config": tableConfigFromState,
  } = useMemo(() => (load?.() ?? NO_CONFIG) as BlotterConfig, [load]);
  console.log({ tableConfig: tableConfigFromState });
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

  const dataSource: RemoteDataSource = useMemo(() => {
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
  ]);

  useEffect(() => {
    dataSource.enable();
    return () => {
      dataSource.disable();
    };
  }, [dataSource]);

  const removeVisualLink = useCallback(() => {
    dataSource.removeLink();
  }, [dataSource]);

  const handleTableConfigChange = useCallback(
    (config: Omit<GridConfig, "headings">) => {
      save?.(config, "table-config");
      tableConfigRef.current = config;
    },
    [save]
  );

  const handleConfigChange = useCallback(
    (
      update:
        | ConfigChangeMessage
        | DataSourceMenusMessage
        | DataSourceVisualLinksMessage
    ) => {
      switch (update.type) {
        case "VIEW_PORT_MENUS_RESP":
          {
            // We only need to save the context menu into session state
            // not state (which gets persisted), They are loaded afresh
            // from the server on application load.
            saveSession?.(update.menu, "vs-context-menu");
          }
          break;
        case "VP_VISUAL_LINKS_RESP":
          {
            // See comment above, same here.
            saveSession?.(update.links, "visual-links");
          }
          break;
        case "CREATE_VISUAL_LINK_SUCCESS":
          {
            dispatch?.({
              type: "add-toolbar-contribution",
              location: "post-title",
              content: (
                <ToolbarButton
                  aria-label="remove-link"
                  onClick={removeVisualLink}
                >
                  <LinkedIcon />
                </ToolbarButton>
              ),
            });
            save?.(update, "visual-link");
          }
          break;

        case "REMOVE_VISUAL_LINK_SUCCESS":
          {
            dispatch?.({
              type: "remove-toolbar-contribution",
              location: "post-title",
            });
            purge?.("visual-link");
          }
          break;

        default:
          for (const [key, state] of Object.entries(update)) {
            if (CONFIG_KEYS.includes(key)) {
              save?.(state, key);
            }
          }
      }
    },
    [dispatch, purge, removeVisualLink, save, saveSession]
  );

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    // vuuMenu: loadSession?.("vs-context-menu") as VuuMenu,
    dataSource,
    // onConfigChange: handleConfigChange,
    onRpcResponse: handleRpcResponse,
    // visualLink: load?.("visual-link"),
    // visualLinks: loadSession?.("visual-links"),
  });

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
