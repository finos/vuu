import {
  DataSource,
  DataSourceConfig,
  RemoteDataSource,
  TableSchema,
} from "@finos/vuu-data";
import { GridConfig } from "@finos/vuu-datagrid-types";
import { ConfigurableTable } from "@finos/vuu-datatable";
import { Filter, FilterState } from "@finos/vuu-filter-types";
import {
  addFilter,
  FilterInput,
  useFilterSuggestionProvider,
} from "@finos/vuu-filters";
import { useViewContext } from "@finos/vuu-layout";
import { ShellContextProps, useShellContext } from "@finos/vuu-shell";
import { DataSourceStats } from "@finos/vuu-table-extras";
import { filterAsQuery } from "@finos/vuu-utils";
import { useCallback, useMemo, useState } from "react";
import { DockLayout } from "../examples/html/components/DockLayout";

import "./VuuBlotter.feature.css";

export interface VuuBlotterProps {
  schema: TableSchema;
  showFilter?: boolean;
}

const classBase = "vuuBlotter2";

type BlotterConfig = {
  "datasource-config"?: DataSourceConfig;
  "table-config"?: Omit<GridConfig, "headings">;
};

const NO_CONFIG: BlotterConfig = {};

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

export const VuuBlotter = ({
  schema,
  showFilter = false,
  ...props
}: VuuBlotterProps) => {
  const { id, load, loadSession, save, saveSession, title } = useViewContext();
  const { getDefaultColumnConfig } = useShellContext();
  const namedFilters = useMemo(() => new Map<string, string>(), []);
  const [filterState, setFilterState] = useState<FilterState>({
    filter: undefined,
    filterQuery: "",
  });

  console.log("VuuBlotter render", { props, schema });

  const {
    "datasource-config": dataSourceConfigFromState,
    "table-config": tableConfigFromState,
  } = useMemo(() => (load?.() ?? NO_CONFIG) as BlotterConfig, [load]);

  const configColumns = tableConfigFromState?.columns;

  const tableConfig = useMemo(
    () => ({
      columns: configColumns || applyDefaults(schema, getDefaultColumnConfig),
    }),
    [configColumns, getDefaultColumnConfig, schema]
  );

  const suggestionProvider = useFilterSuggestionProvider({
    columns: schema.columns,
    table: schema.table,
  });

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
    // ds.on("config", handleDataSourceConfigChange);
    saveSession?.(ds, "data-source");
    return ds;
  }, [
    dataSourceConfigFromState,
    id,
    loadSession,
    saveSession,
    schema.columns,
    schema.table,
    title,
  ]);

  const handleTableConfigChange = useCallback(
    (config: Omit<GridConfig, "headings">) => {
      console.log(`VuuBlotter config changed`);
      save?.(config, "table-config");
      // tableConfigRef.current = config;
    },
    [save]
  );

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

  const handleFilterShown = useCallback(() => {
    console.log("here we go");
  }, []);

  return (
    <DockLayout
      bottomPanelSize={24}
      onTopPanelVisible={handleFilterShown}
      resize="defer"
      showTopPanel={showFilter}
      showBottomPanel
      topPanelSize={28}
    >
      <FilterInput
        data-dock="top"
        existingFilter={filterState.filter}
        iconName="chevron-right"
        onSubmitFilter={handleSubmitFilter}
        suggestionProvider={suggestionProvider}
      />

      <ConfigurableTable
        className={classBase}
        config={tableConfig}
        data-dock="content"
        dataSource={dataSource}
        onConfigChange={handleTableConfigChange}
      />
      <div className="vuuToolbarProxy vuuBlotter-footer" data-dock="bottom">
        <DataSourceStats dataSource={dataSource as RemoteDataSource} />
      </div>
    </DockLayout>
  );
};

export default VuuBlotter;
