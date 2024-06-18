import { queryClosest } from "@finos/vuu-utils";
import { useControlled } from "@salt-ds/core";
import { SyntheticEvent, useCallback } from "react";
import { FilterBarProps } from "./FilterBar";

export type FilterMode = "custom-filter" | "quick-filter";

const isFilterMode = (value?: string | null): value is FilterMode =>
  value === "custom-filter" || value === "quick-filter";

export const useFilterBar = ({
  defaultFilterMode,
  filterMode: filterModeProp,
  onChangeFilterMode,
}: Pick<
  FilterBarProps,
  "defaultFilterMode" | "filterMode" | "onChangeFilterMode"
>) => {
  const [filterMode, setFilterMode] = useControlled<FilterMode>({
    controlled: filterModeProp,
    default: defaultFilterMode ?? "custom-filter",
    name: "useFilterBar",
    state: "filterMode",
  });

  const handleChangeFilterMode = useCallback(
    (e: SyntheticEvent<HTMLButtonElement>) => {
      const button = queryClosest<HTMLButtonElement>(e.target, "button");
      const newFilterMode = button?.value;
      if (isFilterMode(newFilterMode)) {
        setFilterMode(newFilterMode);
        onChangeFilterMode?.(newFilterMode);
      }
    },
    [onChangeFilterMode, setFilterMode]
  );

  return {
    filterMode,
    onChangeFilterMode: handleChangeFilterMode,
  };
};
