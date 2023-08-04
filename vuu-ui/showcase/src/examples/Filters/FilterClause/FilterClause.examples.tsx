import { ColumnSelector, FilterClause } from "@finos/vuu-filters";
import { Filter } from "@finos/vuu-filter-types";
import { useSchemas, useTestDataSource } from "../../utils";

import "./FilterClause.examples.css";
import { useMemo } from "react";

let displaySequence = 1;

export const DefaultColumnSelector = () => {
  const columns = useMemo(
    () => [
      { name: "ccy" },
      { name: "exchange" },
      { name: "ric" },
      { name: "lotSize" },
      { name: "price" },
      { name: "quantity" },
      { name: "bid" },
      { name: "offer" },
      { name: "pctComplete" },
      { name: "trader" },
      { name: "book" },
    ],
    []
  );
  return <ColumnSelector columns={columns} />;
};
DefaultColumnSelector.displaySequence = displaySequence++;

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
DefaultFilterClause.displaySequence = displaySequence++;
