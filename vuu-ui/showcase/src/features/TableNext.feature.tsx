import { DataSourceConfig, TableSchema } from "@finos/vuu-data";
import { FilterTable } from "@finos/vuu-datatable";
import { FilterBarProps } from "@finos/vuu-filters";
// import { useViewContext, View } from "@finos/vuu-layout";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { FlexboxLayout, useViewContext } from "@finos/vuu-layout";
import { DataSourceStats } from "@finos/vuu-table-extras";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTableConfig } from "../examples/utils";

import "./TableNext.feature.css";
import { Filter } from "packages/vuu-filter-types";

export interface TableNextFeatureProps {
  schema: TableSchema;
  showFilter?: boolean;
}

let renderCount = 0;

type FilterbarConfig = Pick<FilterBarProps, "filters">;
const getFilterbarProps = (config?: FilterbarConfig) => {
  if (config === undefined) {
    return {
      filters: [],
    };
  } else {
    return config;
  }
};

export const TableNextFeature = ({ schema }: TableNextFeatureProps) => {
  const { load, save } = useViewContext();
  // const namedFilters = useMemo(() => new Map<string, string>(), []);
  // const [filterState, setFilterState] = useState<FilterState>({
  //   filter: undefined,
  //   filterQuery: "",
  // });

  const {
    "datasource-config": dataSourceConfig,
    "filterbar-config": filterbarConfig,
    "table-config": tableConfig,
  } = useMemo(() => load?.() ?? ({} as any), [load]);

  console.log(`TableNextFeature ${renderCount++}`);

  if (renderCount > 5) {
    throw Error("too many renders");
  }

  const filterbarConfigRef = useRef<FilterbarConfig>(
    getFilterbarProps(filterbarConfig)
  );

  console.log({ filterbarConfigRef: filterbarConfigRef.current });

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
    (config: TableConfig) => {
      save?.(config, "table-config");
      // tableConfigRef.current = config;
    },
    [save]
  );

  const { config, dataSource, typeaheadHook } = useTableConfig({
    count: 1000,
    table: schema.table,
    dataSourceConfig,
    rangeChangeRowset: "delta",
  });

  useEffect(() => {
    dataSource.on("config", handleDataSourceConfigChange);
  }, [dataSource, handleDataSourceConfigChange]);

  const handleApplyFilter = useCallback(
    (filter: DataSourceFilter) => {
      dataSource.filter = filter;
    },
    [dataSource]
  );

  const handleAddFilter = useCallback((filter: Filter) => {
    console.log("change filter", {
      filter,
    });
  }, []);
  const handleChangeFilter = useCallback((filter: Filter) => {
    console.log("change filter", {
      filter,
    });
  }, []);

  const filterBarProps: FilterBarProps = {
    ...getFilterbarProps(filterbarConfig as FilterbarConfig),
    FilterClauseEditorProps: {
      suggestionProvider: typeaheadHook,
    },
    onApplyFilter: handleApplyFilter,
    onAddFilter: handleAddFilter,
    onChangeFilter: handleChangeFilter,
    tableSchema: schema,
  };

  const tableProps = {
    config: {
      ...config,
      ...tableConfig,
    },
    dataSource,
    onConfigChange: handleTableConfigChange,
    renderBufferSize: 20,
  };

  return (
    <FlexboxLayout style={{ flexDirection: "column", height: "100%" }}>
      <FilterTable
        FilterBarProps={filterBarProps}
        TableProps={tableProps}
        style={{ flex: "1 1 auto" }}
      />
      <div className="vuuToolbarProxy vuuBlotter-footer" style={{ height: 32 }}>
        <DataSourceStats dataSource={dataSource} />
      </div>
    </FlexboxLayout>
  );
};

export default TableNextFeature;
