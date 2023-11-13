import {
  DataSource,
  DataSourceConfig,
  DataSourceVisualLinkCreatedMessage,
  RemoteDataSource,
  TableSchema,
  VuuFeatureInvocationMessage,
} from "@finos/vuu-data";
import { MenuActionConfig, useVuuMenuActions } from "@finos/vuu-data-react";
import { GridConfig } from "@finos/vuu-datagrid-types";
import { Filter, FilterState } from "@finos/vuu-filter-types";
import {
  addFilter,
  FilterInput,
  useFilterSuggestionProvider,
} from "@finos/vuu-filters";
import { useViewContext } from "@finos/vuu-layout";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { LinkDescriptorWithLabel, VuuMenu } from "@finos/vuu-protocol-types";
import {
  FeatureProps,
  ShellContextProps,
  useShellContext,
} from "@finos/vuu-shell";
import { DataSourceStats } from "@finos/vuu-table-extras";
import { filterAsQuery } from "@finos/vuu-utils";
import { Button } from "@salt-ds/core";
import { LinkedIcon } from "@salt-ds/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfigurableDataTable } from "./ConfigurableDataTable";

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

  const { getDefaultColumnConfig, handleRpcResponse } = useShellContext();
  const [filterState, setFilterState] = useState<FilterState>({
    filter: undefined,
    filterQuery: "",
  });

  const configColumns = tableConfigFromState?.columns;

  const tableConfig = useMemo(
    () => ({
      columns: configColumns || applyDefaults(schema, getDefaultColumnConfig),
    }),
    [configColumns, getDefaultColumnConfig, schema]
  );

  const tableConfigRef = useRef<Omit<GridConfig, "headings">>(tableConfig);

  const suggestionProvider = useFilterSuggestionProvider({
    columns: schema.columns,
    table: schema.table,
  });

  const handleDataSourceConfigChange = useCallback(
    (config: DataSourceConfig | undefined, confirmed?: boolean) => {
      // confirmed / unconfirmed messages are used for UI updates, not state saving
      if (confirmed === undefined) {
        save?.(config, "datasource-config");
      }
    },
    [save]
  );

  const handleTableConfigChange = useCallback(
    (config: Omit<GridConfig, "headings">) => {
      save?.(config, "table-config");
      tableConfigRef.current = config;
    },
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
      bufferSize: 200,
      viewport: id,
      table: schema.table,
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
    schema.columns,
    schema.table,
    title,
  ]);

  useEffect(() => {
    dataSource.resume?.();
    return () => {
      // suspend activity on the dataSource when component is unmounted
      dataSource.suspend?.();
    };
  }, [dataSource]);

  const removeVisualLink = useCallback(() => {
    dataSource.visualLink = undefined;
  }, [dataSource]);

  const handleVuuFeatureInvoked = useCallback(
    (message: VuuFeatureInvocationMessage) => {
      if (message.type === "vuu-link-created") {
        dispatch?.({
          type: "add-toolbar-contribution",
          location: "post-title",
          content: (
            <Button aria-label="remove-link" onClick={removeVisualLink}>
              <LinkedIcon />
            </Button>
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
        <div className={`${classBase}-gridContainer`}>
          <ConfigurableDataTable
            {...props}
            config={tableConfigRef.current}
            dataSource={dataSource}
            onConfigChange={handleTableConfigChange}
            onFeatureInvocation={handleVuuFeatureInvoked}
            renderBufferSize={100}
            rowHeight={18}
          />
        </div>
        <div className="vuuToolbarProxy vuuTable-footer">
          <DataSourceStats dataSource={dataSource as RemoteDataSource} />
        </div>
      </div>
    </ContextMenuProvider>
  );
};

VuuTable.displayName = "VuuTable";

export default VuuTable;
