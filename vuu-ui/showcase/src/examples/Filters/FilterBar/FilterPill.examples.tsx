import { FilterPill } from "@finos/vuu-filters";

let displaySequence = 1;

export const DefaultFilterPill = () => {
  return (
    <FilterPill
      filter={{
        column: "currency",
        op: "=",
        value: "EUR",
      }}
    />
  );
};

DefaultFilterPill.displaySequence = displaySequence++;
