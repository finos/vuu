import { useCallback } from "react";
import { Filter } from "@finos/vuu-filter-types";
import { ColumnFilter } from "@finos/vuu-filters";
import { useSchemas, useTestDataSource } from "../utils";

export const DefaultColumnFilter = () => {
  const { schemas } = useSchemas();
  const { columns, dataSource } = useTestDataSource({
    schemas,
    tablename: "instruments",
  });

  const handleFilterSubmit = useCallback(
    (filterQuery: string, filter?: Filter) => {
      console.log("Query:", filterQuery);
      dataSource.filter = { filterStruct: filter, filter: filterQuery };
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
