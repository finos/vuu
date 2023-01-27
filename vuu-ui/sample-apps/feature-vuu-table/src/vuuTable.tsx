import {
  ConfigChangeMessage,
  DataSourceMenusMessage,
  DataSourceVisualLinksMessage,
  RemoteDataSource,
  TableSchema,
  useVuuMenuActions,
} from "@finos/vuu-data";
import { GridConfig, KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { DataTable } from "@finos/vuu-datatable";
import { Filter } from "@finos/vuu-filter-types";
import { filterAsQuery, FilterInput, updateFilter } from "@finos/vuu-filters";
import { useViewContext } from "@finos/vuu-layout";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { VuuGroupBy, VuuMenu, VuuSort } from "@finos/vuu-protocol-types";
import {
  FeatureProps,
  ShellContextProps,
  useShellContext,
} from "@finos/vuu-shell";
import { ToolbarButton } from "@heswell/salt-lab";
import { LinkedIcon } from "@salt-ds/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSuggestionProvider } from "./useSuggestionProvider";

import "./vuuTable.css";

const classBase = "vuuTable";
const CONFIG_KEYS = ["filter", "filterQuery", "groupBy", "sort"];

type BlotterConfig = {
  columns?: KeyedColumnDescriptor[];
  groupBy?: VuuGroupBy;
  sort?: VuuSort;
};

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
  const config = useMemo(() => load?.() as BlotterConfig | undefined, [load]);
  console.log({ config });
  const { getDefaultColumnConfig, handleRpcResponse } = useShellContext();
  const [currentFilter, setCurrentFilter] = useState<Filter>();

  const suggestionProvider = useSuggestionProvider({
    columns: schema.columns,
    table: schema.table,
  });

  const dataSource: RemoteDataSource = useMemo(() => {
    let ds = loadSession?.("data-source") as RemoteDataSource;
    if (ds) {
      return ds;
    }
    const columns = schema.columns.map((col) => col.name);
    ds = new RemoteDataSource({
      viewport: id,
      table: schema.table,
      ...config,
      columns,
    });
    saveSession?.(ds, "data-source");
    return ds;
  }, [config, id, loadSession, saveSession, schema]);

  useEffect(() => {
    dataSource.enable();
    return () => {
      dataSource.disable();
    };
  }, [dataSource]);

  const removeVisualLink = useCallback(() => {
    dataSource.removeLink();
  }, [dataSource]);

  const handleTableConfigChange = useCallback((config: GridConfig) => {
    // we want this to be used when editor is opened next, but we don;t want
    // to trigger a re-render of our dataTable
    console.log(`config changed ${JSON.stringify(config)}`);
    // configRef.current = config;
  }, []);

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
    vuuMenu: loadSession?.("vs-context-menu") as VuuMenu,
    dataSource,
    onConfigChange: handleConfigChange,
    onRpcResponse: handleRpcResponse,
    visualLink: load?.("visual-link"),
    visualLinks: loadSession?.("visual-links"),
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

  const configColumns = config?.columns;

  const tableConfig = useMemo(
    () => ({
      columns: configColumns || applyDefaults(schema, getDefaultColumnConfig),
    }),
    [configColumns, getDefaultColumnConfig, schema]
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
            config={tableConfig}
            dataSource={dataSource}
            height="100%"
            // columns={columns}
            onConfigChange={handleTableConfigChange}
            // renderBufferSize={80}
            rowHeight={18}
            // selectionModel="extended"
            // showLineNumbers
            width="100%"
          />
        </div>
      </div>
    </ContextMenuProvider>
  );
};

VuuTable.displayName = "VuuTable";

export default VuuTable;
