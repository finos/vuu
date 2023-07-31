import { TableSchema } from "@finos/vuu-data";
import { GridConfig } from "@finos/vuu-datagrid-types";
import { ConfigurableTable } from "@finos/vuu-datatable";
import { Filter, FilterState } from "@finos/vuu-filter-types";
import {
  addFilter,
  FilterInput,
  useFilterSuggestionProvider,
} from "@finos/vuu-filters";
import { useViewContext } from "@finos/vuu-layout";
import { DataSourceStats } from "@finos/vuu-table-extras";
import { filterAsQuery } from "@finos/vuu-utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DockLayout } from "../examples/html/components/DockLayout";
import { useTableConfig } from "../examples/utils";

import "./VuuBlotter.feature.css";

const classBase = "vuuBlotter2";

interface VuuBlotterProps {
  schema: TableSchema;
  showFilter?: boolean;
}

export const VuuBlotterMockData = ({
  schema,
  showFilter = false,
  ...props
}: VuuBlotterProps) => {
  const { save } = useViewContext();
  const namedFilters = useMemo(() => new Map<string, string>(), []);
  const [filterState, setFilterState] = useState<FilterState>({
    filter: undefined,
    filterQuery: "",
  });
  const { config, dataSource, typeaheadHook } = useTableConfig({
    count: 1000,
    lazyData: false,
    table: schema.table,
  });

  console.log("VuuBlotter render", { props, schema });
  useEffect(() => {
    console.log("%cVuuBlotterMockDataFeature mount", "color: green;");
    return () => {
      console.log("%cVuuBlotterMockDataFeature unmount", "color:red;");
    };
  }, []);

  const suggestionProvider = useFilterSuggestionProvider({
    columns: schema.columns,
    table: schema.table,
    typeaheadHook,
  });

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
      style={{ height: 700 }}
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
        config={config}
        data-dock="content"
        dataSource={dataSource}
        onConfigChange={handleTableConfigChange}
      />
      <div className="vuuToolbarProxy vuuBlotter-footer" data-dock="bottom">
        <DataSourceStats dataSource={dataSource} />
      </div>
    </DockLayout>
  );
};

export default VuuBlotterMockData;
