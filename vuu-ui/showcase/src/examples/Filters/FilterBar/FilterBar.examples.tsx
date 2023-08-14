import { FilterBar } from "@finos/vuu-filters";
import { NamedFilter } from "@finos/vuu-filter-types";
import { useMemo } from "react";
import { useSchema } from "../../utils";

let displaySequence = 1;

export const EmptyFilterBar = () => {
  const tableSchema = useSchema("instruments");

  return <FilterBar filters={[]} tableSchema={tableSchema} />;
};
EmptyFilterBar.displaySequence = displaySequence++;

export const FilterBarOneSimpleFilter = () => {
  const filters: NamedFilter[] = useMemo(
    () => [{ column: "currency", name: "Filter One", op: "=", value: "EUR" }],
    []
  );
  const tableSchema = useSchema("instruments");

  return <FilterBar filters={filters} tableSchema={tableSchema} />;
};
EmptyFilterBar.displaySequence = displaySequence++;
