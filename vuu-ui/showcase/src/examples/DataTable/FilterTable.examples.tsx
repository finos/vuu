import { getSchema, LocalDataSourceProvider } from "@finos/vuu-data-test";
import { TableSchema } from "@finos/vuu-data-types";
import type { DataSourceFilter } from "@finos/vuu-data-types";
import { FilterTable } from "@finos/vuu-datatable";
import type { FilterState } from "@finos/vuu-filter-types";
import type { FilterBarProps } from "@finos/vuu-filters";
import type { TableConfig } from "@finos/vuu-table-types";
import { CSSProperties, useCallback, useMemo, useState } from "react";
import { toColumnName, useDataSource } from "@finos/vuu-utils";
import { useAutoLoginToVuuServer } from "../utils";
import { VuuDataSourceProvider } from "@finos/vuu-data-react";
import { View } from "@finos/vuu-layout";

let displaySequence = 1;

type FilterTableTemplateProps = {
  style?: CSSProperties;
  tableSchema?: TableSchema;
} & Partial<FilterBarProps>;

const FilterTableTemplate = ({
  style,
  tableSchema = getSchema("instruments"),
  QuickFilterProps,
  variant,
}: FilterTableTemplateProps) => {
  useAutoLoginToVuuServer();
  const { VuuDataSource } = useDataSource();

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
    tableSchema,
    variant,
  };

  return (
    <View style={{ height: "100%", ...style }}>
      <FilterTable
        FilterBarProps={filterBarProps}
        TableProps={{
          config: tableConfig,
          dataSource,
          renderBufferSize: 20,
        }}
      />
    </View>
  );
};

export const FilterTableVuuInstruments = () => {
  return (
    <VuuDataSourceProvider>
      <FilterTableTemplate />
    </VuuDataSourceProvider>
  );
};
FilterTableVuuInstruments.displaySequence = displaySequence++;

export const FilterTableArrayDataInstruments = () => {
  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <FilterTableTemplate />
    </LocalDataSourceProvider>
  );
};
FilterTableArrayDataInstruments.displaySequence = displaySequence++;

export const FilterTableInstrumentsQuickFilters = () => (
  <LocalDataSourceProvider modules={["SIMUL"]}>
    <FilterTableTemplate
      variant="quick-filters-only"
      QuickFilterProps={{
        quickFilterColumns: ["isin", "currency", "exchange"],
      }}
    />
  </LocalDataSourceProvider>
);
FilterTableInstrumentsQuickFilters.displaySequence = displaySequence++;

export const FilterTableArrayDataInstrumentsFullFilters = () => (
  <LocalDataSourceProvider modules={["SIMUL"]}>
    <FilterTableTemplate variant="full-filters" />
  </LocalDataSourceProvider>
);
FilterTableArrayDataInstrumentsFullFilters.displaySequence = displaySequence++;

export const FilterTableArrayDataInstrumentsFixedHeightContainer = () => (
  <LocalDataSourceProvider modules={["SIMUL"]}>
    <FilterTableTemplate style={{ height: 600, width: 900 }} />
  </LocalDataSourceProvider>
);
FilterTableArrayDataInstrumentsFixedHeightContainer.displaySequence =
  displaySequence++;
