import { FilterPillNext } from "@vuu-ui/vuu-filters";
import { useMemo, useState } from "react";

export const DefaultFilterPillNext = () => {
  const [active, setActive] = useState(false);
  const handleClick = useMemo(() => () => setActive((value) => !value), []);

  return (
    <FilterPillNext
      active={active}
      data-showcase-center
      filter={{
        column: "currency",
        name: "EUROS",
        op: "=",
        value: "EUR",
      }}
      id="test-filter"
      onClick={handleClick}
      onMenuAction={(actionType) => console.log(`action ${actionType}`)}
    />
  );
};
