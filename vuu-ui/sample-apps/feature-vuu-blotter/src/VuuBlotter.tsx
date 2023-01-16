import { Filter } from "@finos/vuu-filter-types";
import { filterAsQuery, FilterInput, updateFilter } from "@finos/vuu-filters";
import { useViewContext } from "@finos/vuu-layout";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { ShellContextProps, useShellContext } from "@finos/vuu-shell";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSuggestionProvider } from "./useSuggestionProvider";

import {
  ConfigChangeMessage,
  DataSourceMenusMessage,
  DataSourceVisualLinksMessage,
  RemoteDataSource,
  TableSchema,
  useVuuMenuActions,
} from "@finos/vuu-data";
import { Grid, GridProvider } from "@finos/vuu-datagrid";
import { VuuGroupBy, VuuSort } from "@finos/vuu-protocol-types";
import { ToolbarButton } from "@heswell/salt-lab";
import { LinkedIcon } from "@salt-ds/icons";

import { FeatureProps } from "@finos/vuu-shell";

import "./VuuBlotter.css";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";

const classBase = "vuuBlotter";

const CONFIG_KEYS = ["filter", "filterQuery", "groupBy", "sort"];

type BlotterConfig = {
  columns?: KeyedColumnDescriptor[];
  groupBy?: VuuGroupBy;
  sort?: VuuSort;
};
export interface FilteredGridProps extends FeatureProps {
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

const VuuBlotter = ({ schema, ...props }: FilteredGridProps) => {
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
    let ds = loadSession?.("data-source");
    if (ds) {
      return ds;
    }
    const columns = schema.columns.map((col) => col.name);
    ds = new RemoteDataSource({
      viewport: id,
      columns,
      table: schema.table,
      ...config,
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

  const { buildViewserverMenuOptions, dispatchGridAction, handleMenuAction } =
    useVuuMenuActions({
      vuuMenu: loadSession?.("vs-context-menu"),
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
        dataSource.filter(newFilter, newFilterQuery);
        setCurrentFilter(newFilter);
      } else {
        dataSource.filter(filter, filterQuery);
        setCurrentFilter(filter);
      }
    },
    [currentFilter, dataSource]
  );

  const configColumns = config?.columns;

  const columns = useMemo(() => {
    return configColumns || applyDefaults(schema, getDefaultColumnConfig);
  }, [configColumns, getDefaultColumnConfig, schema]);

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
        <GridProvider value={{ dispatchGridAction }}>
          <div className={`${classBase}-gridContainer`}>
            <Grid
              {...props}
              columnSizing="fill"
              dataSource={dataSource}
              aggregations={config?.aggregations}
              columns={columns}
              onConfigChange={handleConfigChange}
              renderBufferSize={80}
              rowHeight={18}
              selectionModel="extended"
              showLineNumbers
            />
          </div>
        </GridProvider>
      </div>
    </ContextMenuProvider>
  );
};

VuuBlotter.displayName = "FilteredGrid";

export default VuuBlotter;
