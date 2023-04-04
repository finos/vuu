import { Filter } from "@finos/vuu-filter-types";
import { FilterPanel } from "@finos/vuu-filters/src/filter-panel/filter-panel";
import { useCallback } from "react";
import { useSchemas, useTestDataSource } from "../utils";

export const DefaultFilterPanel = () => {
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
    <FilterPanel
      table={dataSource.table}
      columns={columns}
      onFilterSubmit={handleFilterSubmit}
    />
  );
};
