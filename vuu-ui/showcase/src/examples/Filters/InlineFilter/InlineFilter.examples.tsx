import { useMemo } from "react";
import { FilterValueChangeHandler, InlineFilter } from "@finos/vuu-filters";
import { LocalDataSourceProvider, getSchema } from "@finos/vuu-data-test";
import { useDataSource } from "@finos/vuu-utils";
import { TableConfig } from "@finos/vuu-table-types";
import { Table } from "@finos/vuu-table";

const table = { module: "SIMUL", table: "instrumentsExtended" } as const;
const schema = getSchema("instrumentsExtended");

const TableTemplate = () => {
  const { VuuDataSource } = useDataSource();

  const dataSource = useMemo(() => {
    return new VuuDataSource({ table: schema.table });
  }, [VuuDataSource]);

  const inlineFilter = useMemo(() => {
    const onChange: FilterValueChangeHandler = (filter) => {
      dataSource.filter = filter;
    };
    return <InlineFilter onChange={onChange} table={table} />;
  }, [dataSource]);

  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columns: schema.columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, []);

  return (
    <Table
      config={tableConfig}
      data-testid="table"
      dataSource={dataSource}
      customHeader={inlineFilter}
    />
  );
};

export const SimpleInlineFilters = () => {
  return (
    <LocalDataSourceProvider>
      <TableTemplate />
    </LocalDataSourceProvider>
  );
};
