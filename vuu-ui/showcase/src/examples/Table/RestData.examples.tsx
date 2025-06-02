import { RestDataSourceProvider } from "@vuu-ui/vuu-data-react/src/datasource-provider/RestDataSourceProvider";
import { getSchema } from "@vuu-ui/vuu-data-test";
import { TableProps } from "@vuu-ui/vuu-table";
import { useCallback, useMemo, useState } from "react";
import { toColumnName, useDataSource } from "@vuu-ui/vuu-utils";
import { FilterTable } from "@vuu-ui/vuu-datatable";
import { FilterBarProps } from "@vuu-ui/vuu-filters";
import { FilterState } from "@vuu-ui/vuu-filter-types";
import { DataSourceFilter } from "@vuu-ui/vuu-data-types";

const instrumentsSchema = getSchema("instruments");

const FilterTableTemplate = ({
  quickFilterColumns,
  TableProps,
  variant = "custom-filters-only",
}: Pick<FilterBarProps, "variant"> & {
  TableProps?: Partial<TableProps>;
  quickFilterColumns?: string[];
}) => {
  const { VuuDataSource } = useDataSource();
  const schema = getSchema("instruments");
  const { dataSource, config, ...restTableProps } = useMemo<
    Pick<TableProps, "config" | "dataSource">
  >(
    () => ({
      config: {
        columns: schema.columns,
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource: new VuuDataSource({
        columns: schema.columns.map(toColumnName),
        table: schema.table,
      }),
      ...TableProps,
    }),
    [TableProps, VuuDataSource, schema],
  );

  const [filterState, setFilterState] = useState<FilterState>({
    filters: [],
    activeIndices: [],
  });

  const handleApplyFilter = useCallback(
    (filter: DataSourceFilter) => {
      console.log("apply filter", { filter });
      dataSource.filter = filter;
    },
    [dataSource],
  );

  const handleFilterStateChange = useCallback((fs: FilterState) => {
    console.log("filter state changed:", fs);
    setFilterState(fs);
  }, []);

  const FilterBarProps: FilterBarProps = {
    QuickFilterProps: quickFilterColumns
      ? {
          quickFilterColumns,
        }
      : undefined,
    columnDescriptors: config.columns,
    filterState,
    onApplyFilter: handleApplyFilter,
    onFilterStateChanged: handleFilterStateChange,
    vuuTable: instrumentsSchema.table,
    variant,
  };

  const tableProps = {
    ...restTableProps,
    config,
    dataSource,
    renderBufferSize: 20,
  };

  return (
    <FilterTable
      FilterBarProps={FilterBarProps}
      style={{ height: "100%" }}
      TableProps={tableProps}
    />
  );
};

export const RestInstrumentsScrolling = () => {
  return (
    <RestDataSourceProvider url="http://localhost:8081/api">
      <FilterTableTemplate />
    </RestDataSourceProvider>
  );
};

export const RestInstrumentsCustomHttpHeaders = () => {
  // Note, the test Rest service used for these returns the Access control header
  // "Access-Control-Allow-Headers": "*"
  const createHttpHeaders = () => {
    const headers = new Headers();
    headers.append("Accept", "application/json");
    headers.append("Vuu", "rest");
    return headers;
  };
  return (
    <RestDataSourceProvider
      createHttpHeaders={createHttpHeaders}
      url="http://localhost:8081/api"
    >
      <FilterTableTemplate />
    </RestDataSourceProvider>
  );
};

export const RestInstrumentsPagination = () => {
  return (
    <RestDataSourceProvider url="http://localhost:8081/api">
      <FilterTableTemplate TableProps={{ showPaginationControls: true }} />
    </RestDataSourceProvider>
  );
};
