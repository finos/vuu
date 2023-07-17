import { FilterClause } from "@finos/vuu-filters/src/filter-clause";
import { Filter } from "@finos/vuu-filter-types";
import { useSchemas, useTestDataSource } from "../utils";

export const DefaultFilterClause = () => {
  const { schemas } = useSchemas();
  const { columns } = useTestDataSource({
    schemas,
    tablename: "instruments",
  });

  const onChange = (filter?: Filter) => console.log("Filter Change", filter);

  const onClose = () => console.log("Closing filter component");

  return (
    <div style={{ padding: "10px" }}>
      <FilterClause
        onChange={onChange}
        onClose={onClose}
        columns={columns}
        table={schemas.instruments.table}
      />
    </div>
  );
};
