import { Filter } from "@finos/vuu-filter-types";
import { filterAsQuery, FilterInput, updateFilter } from "@finos/vuu-filters";
import { useViewContext } from "@finos/vuu-layout";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { ShellContextProps, useShellContext } from "@finos/vuu-shell";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSuggestionProvider } from "./useSuggestionProvider";
import { GridAction } from "@finos/vuu-datagrid-types";
import {
  isViewportMenusAction,
  isVisualLinkCreatedAction,
  isVisualLinkRemovedAction,
  isVisualLinksAction,
} from "@finos/vuu-data";

import {
  ConfigChangeMessage,
  DataSourceVisualLinkCreatedMessage,
  MenuActionConfig,
  RemoteDataSource,
  TableSchema,
  useVuuMenuActions,
} from "@finos/vuu-data";
import { Grid, GridProvider } from "@finos/vuu-datagrid";
import {
  LinkDescriptorWithLabel,
  VuuGroupBy,
  VuuMenu,
  VuuSort,
} from "@finos/vuu-protocol-types";
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
  "visual-link"?: DataSourceVisualLinkCreatedMessage;
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
  const { id, dispatch, load, purge, save, loadSession, saveSession, title } =
    useViewContext();
  const config = useMemo(() => load?.() as BlotterConfig | undefined, [load]);
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
      title,
    });
    saveSession?.(ds, "data-source");
    return ds;
    // Note: despite the dependency array, because we load dataStore from session
    // after initial load, changes to the following dependencies will not cause
    // us to create a new dataSource, which is correct.
  }, [config, id, loadSession, saveSession, schema, title]);

  useEffect(() => {
    dataSource.enable();
    return () => {
      dataSource.disable();
    };
  }, [dataSource]);

  useEffect(() => {
    if (title !== dataSource.title) {
      dataSource.title = title;
    }
  }, [dataSource, title]);

  const removeVisualLink = useCallback(() => {
    dataSource.visualLink = undefined;
  }, [dataSource]);

  const dispatchGridAction = useCallback(
    (action: GridAction) => {
      if (isVisualLinksAction(action)) {
        saveSession?.(action.links, "visual-links");
        return true;
      } else if (isVisualLinkCreatedAction(action)) {
        dispatch?.({
          type: "add-toolbar-contribution",
          location: "post-title",
          content: (
            <ToolbarButton aria-label="remove-link" onClick={removeVisualLink}>
              <LinkedIcon />
            </ToolbarButton>
          ),
        });
        save?.(action, "visual-link");
        return true;
      } else if (isVisualLinkRemovedAction(action)) {
        dispatch?.({
          type: "remove-toolbar-contribution",
          location: "post-title",
        });
        purge?.("visual-link");
        return true;
      } else if (isViewportMenusAction(action)) {
        saveSession?.(action.menu, "vs-context-menu");
        return true;
      }
      return false;
    },
    [dispatch, purge, removeVisualLink, save, saveSession]
  );

  const handleConfigChange = useCallback(
    (update: ConfigChangeMessage) => {
      switch (update.type) {
        default:
          for (const [key, state] of Object.entries(update)) {
            if (CONFIG_KEYS.includes(key)) {
              save?.(state, key);
            }
          }
      }
    },
    [save]
  );

  // It is important that these values are not assigned in advance. They
  // are accessed at the point of construction of ContextMenu
  const menuActionConfig: MenuActionConfig = useMemo(
    () => ({
      get visualLink() {
        return load?.("visual-link") as DataSourceVisualLinkCreatedMessage;
      },
      get visualLinks() {
        return loadSession?.("visual-links") as LinkDescriptorWithLabel[];
      },
      get vuuMenu() {
        return loadSession?.("vs-context-menu") as VuuMenu;
      },
    }),
    [load, loadSession]
  );

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource,
    menuActionConfig,
    onRpcResponse: handleRpcResponse,
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
