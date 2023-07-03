import { useCallback } from "react";
import { ColumnFilter } from "@finos/vuu-filters";
import { useSchemas, useTestDataSource } from "../utils";
import { DataSourceFilter } from "@finos/vuu-data-types";

export const DefaultColumnFilter = () => {
  const { schemas } = useSchemas();
  const { columns, dataSource } = useTestDataSource({
    schemas,
    tablename: "instruments",
  });

  const handleFilterSubmit = useCallback(
    (filter: DataSourceFilter) => {
      console.log("Query:", filter.filter);
      dataSource.filter = filter;
    },
    [dataSource]
  );

  return (
    <ColumnFilter
      style={{ width: 700 }}
      table={schemas.instruments.table}
      columns={columns}
      onFilterSubmit={handleFilterSubmit}
    />
  );
};
