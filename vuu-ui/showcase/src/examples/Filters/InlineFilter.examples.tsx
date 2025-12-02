import { useMemo } from "react";
import { InlineFilter } from "@vuu-ui/vuu-filters";
import { LocalDataSourceProvider, getSchema } from "@vuu-ui/vuu-data-test";
import { DataSourceProvider, useData } from "@vuu-ui/vuu-utils";
import { TableConfig } from "@vuu-ui/vuu-table-types";
import { Table } from "@vuu-ui/vuu-table";
import { FilterHandler } from "@vuu-ui/vuu-filter-types";

const table = { module: "SIMUL", table: "instrumentsExtended" } as const;
const schema = getSchema("instrumentsExtended");

const TableTemplate = () => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: schema.table });
  }, [VuuDataSource]);

  const inlineFilter = useMemo(() => {
    const handleApplyFilter: FilterHandler = (filter) => {
      dataSource.setFilter?.(filter);
    };
    const handleClearFilter = () => {
      dataSource.clearFilter?.();
    };
    return (
      <InlineFilter
        onFilterApplied={handleApplyFilter}
        onFilterCleared={handleClearFilter}
        table={table}
      />
    );
  }, [dataSource]);

  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columns: schema.columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, []);

  return (
    <DataSourceProvider dataSource={dataSource}>
      <Table
        config={tableConfig}
        data-testid="table"
        dataSource={dataSource}
        customHeader={inlineFilter}
      />
    </DataSourceProvider>
  );
};

export const SimpleInlineFilters = () => {
  return (
    <LocalDataSourceProvider>
      <TableTemplate />
    </LocalDataSourceProvider>
  );
};
