import { queryClosest } from "@finos/vuu-utils";
import { SyntheticEvent, useCallback, useState } from "react";

type FilterMode = "custom-filter" | "quick-filter";

const isFilterMode = (value?: string): value is FilterMode =>
  value === "custom-filter" || value === "quick-filter";

export const useFilterBar = () => {
  const [filterMode, setFilterMode] = useState<FilterMode>("custom-filter");

  const handleChangeFilterMode = useCallback(
    (e: SyntheticEvent<HTMLButtonElement>) => {
      const button = queryClosest<HTMLButtonElement>(e.target, "button");
      if (button && isFilterMode(button?.value)) {
        setFilterMode(button.value);
      }
    },
    []
  );

  return {
    filterMode,
    onChangeFilterMode: handleChangeFilterMode,
  };
};
