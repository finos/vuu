import { DataSourceConfig, TableSchema } from "@finos/vuu-data";
import { FilterTable } from "@finos/vuu-datatable";
import { FilterBarProps } from "@finos/vuu-filters";
// import { useViewContext, View } from "@finos/vuu-layout";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { FlexboxLayout, useViewContext } from "@finos/vuu-layout";
import { DataSourceStats } from "@finos/vuu-table-extras";
import { useCallback, useEffect, useMemo } from "react";
import { useTableConfig } from "../examples/utils";

import "./TableNext.feature.css";

export interface TableNextFeatureProps {
  schema: TableSchema;
  showFilter?: boolean;
}

export const TableNextFeature = ({ schema }: TableNextFeatureProps) => {
  const { load, save } = useViewContext();
  // const namedFilters = useMemo(() => new Map<string, string>(), []);
  // const [filterState, setFilterState] = useState<FilterState>({
  //   filter: undefined,
  //   filterQuery: "",
  // });

  const { "datasource-config": dataSourceConfig, "table-config": tableConfig } =
    useMemo(() => load?.() ?? ({} as any), [load]);

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

  const filterBarProps: FilterBarProps = {
    FilterClauseEditorProps: {
      suggestionProvider: typeaheadHook,
    },
    filters: [],
    onApplyFilter: handleApplyFilter,
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
