import {
  ConfigChangeMessage,
  DataSourceVisualLinkCreatedMessage,
  isViewportMenusAction,
  isVisualLinkCreatedAction,
  isVisualLinkRemovedAction,
  isVisualLinksAction,
  RemoteDataSource,
  TableSchema,
} from "@finos/vuu-data";
import { MenuActionConfig, useVuuMenuActions } from "@finos/vuu-data-react";
import { Grid, GridProvider } from "@finos/vuu-datagrid";
import { GridAction, KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { Filter, FilterState } from "@finos/vuu-filter-types";
import {
  addFilter,
  FilterInput,
  useFilterSuggestionProvider,
} from "@finos/vuu-filters";
import { useViewContext } from "@finos/vuu-layout";
import { ContextMenuProvider } from "@finos/vuu-popups";
import {
  LinkDescriptorWithLabel,
  VuuGroupBy,
  VuuMenu,
  VuuSort,
} from "@finos/vuu-protocol-types";
import {
  FeatureProps,
  ShellContextProps,
  useShellContext,
} from "@finos/vuu-shell";
import { filterAsQuery } from "@finos/vuu-utils";
import { Button } from "@salt-ds/core";
import { LinkedIcon } from "@salt-ds/icons";
import { useCallback, useEffect, useMemo, useState } from "react";

import "./VuuBlotter.css";

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
  const [filterState, setFilterState] = useState<FilterState>({
    filter: undefined,
    filterQuery: "",
  });

  const suggestionProvider = useFilterSuggestionProvider({
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
            <Button aria-label="remove-link" onClick={removeVisualLink}>
              <LinkedIcon />
            </Button>
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

  const namedFilters = useMemo(() => new Map<string, string>(), []);

  const handleSubmitFilter = useCallback(
    (
      newFilter: Filter | undefined,
      filterQuery: string,
      mode = "add",
      filterName?: string
    ) => {
      let newFilterState: FilterState;
      if (newFilter && (mode === "and" || mode === "or")) {
        const fullFilter = addFilter(filterState.filter, newFilter, {
          combineWith: mode,
        }) as Filter;
        newFilterState = {
          filter: fullFilter,
          filterQuery: filterAsQuery(fullFilter),
          filterName,
        };
      } else {
        newFilterState = {
          filter: newFilter,
          filterQuery,
          filterName,
        };
      }

      dataSource.filter = {
        filter: newFilterState.filterQuery,
        filterStruct: newFilterState.filter,
      };
      setFilterState(newFilterState);
      if (filterName && newFilterState.filter) {
        namedFilters.set(filterName, newFilterState.filterQuery);
      }
    },
    [dataSource, filterState.filter, namedFilters]
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
          existingFilter={filterState.filter}
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
              // showLineNumbers
            />
          </div>
        </GridProvider>
      </div>
    </ContextMenuProvider>
  );
};

VuuBlotter.displayName = "FilteredGrid";

export default VuuBlotter;
