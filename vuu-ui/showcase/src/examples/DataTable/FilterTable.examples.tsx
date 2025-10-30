import { ContentStatus } from "@salt-ds/lab";
import { getSchema } from "@vuu-ui/vuu-data-test";
import type { DataSourceFilter } from "@vuu-ui/vuu-data-types";
import { TableSchema } from "@vuu-ui/vuu-data-types";
import { FilterTable } from "@vuu-ui/vuu-datatable";
import type { FilterState } from "@vuu-ui/vuu-filter-types";
import type { FilterBarProps } from "@vuu-ui/vuu-filters";
import { View } from "@vuu-ui/vuu-layout";
import { TableProps } from "@vuu-ui/vuu-table";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { toColumnName, useData } from "@vuu-ui/vuu-utils";
import { CSSProperties, useCallback, useMemo, useState } from "react";

type FilterTableTemplateProps = {
  style?: CSSProperties;
  tableSchema?: TableSchema;
} & Partial<FilterBarProps> &
  Pick<TableProps, "EmptyDisplay">;

const FilterTableTemplate = ({
  EmptyDisplay,
  style,
  tableSchema = getSchema("instruments"),
  QuickFilterProps,
  variant,
}: FilterTableTemplateProps) => {
  const { VuuDataSource } = useData();

  const dataSource = useMemo(() => {
    return new VuuDataSource({
      columns: tableSchema.columns.map(toColumnName),
      table: tableSchema.table,
    });
  }, [VuuDataSource, tableSchema]);

  const config = useMemo<TableConfig>(() => {
    return {
      columns: tableSchema.columns,
    };
  }, [tableSchema]);

  const [tableConfig] = useState<TableConfig>(config);

  const [filterState, setFilterState] = useState<FilterState>({
    filters: [],
    activeIndices: [],
  });

  const handleApplyFilter = useCallback(
    (filter: DataSourceFilter) => {
      dataSource.filter = filter;
    },
    [dataSource],
  );

  const handleFilterStateChange = useCallback((fs: FilterState) => {
    setFilterState(fs);
  }, []);

  const filterBarProps: Partial<FilterBarProps> = {
    columnDescriptors: config.columns,
    filterState,
    onApplyFilter: handleApplyFilter,
    onFilterStateChanged: handleFilterStateChange,
    QuickFilterProps,
    vuuTable: tableSchema.table,
    variant,
  };

  return (
    <View style={{ height: "100%", ...style }}>
      <FilterTable
        FilterBarProps={filterBarProps}
        TableProps={{
          EmptyDisplay,
          config: tableConfig,
          dataSource,
          renderBufferSize: 20,
        }}
      />
    </View>
  );
};

/** tags=data-consumer */
export const FilterTableInstruments = () => {
  return <FilterTableTemplate />;
};

const EmptyStatus = () => (
  <ContentStatus
    message="there are no instruments to display"
    status="info"
    title="No data available"
  />
);

/** tags=data-consumer */
export const WithEmptyStatus = () => {
  return <FilterTableTemplate EmptyDisplay={EmptyStatus} />;
};

/** tags=data-consumer */
export const FilterTableInstrumentsQuickFilters = () => (
  <FilterTableTemplate
    variant="quick-filters-only"
    QuickFilterProps={{
      quickFilterColumns: ["isin", "currency", "exchange"],
    }}
  />
);

/** tags=data-consumer */
export const FilterTableArrayDataInstrumentsFullFilters = () => (
  <FilterTableTemplate variant="full-filters" />
);

/** tags=data-consumer */
export const FilterTableArrayDataInstrumentsFixedHeightContainer = () => (
  <FilterTableTemplate style={{ height: 600, width: 900 }} />
);
