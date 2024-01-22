import { useCallback, useState } from "react";
import { Filter } from "@finos/vuu-filter-types";
import { useControlled } from "@finos/vuu-ui-controls";

export interface FilterStateHookProps {
  activeFilterIndex: number[];
  applyFilter: (f?: Filter) => void;
  defaultFilters?: Filter[];
  filters?: Filter[];
}

export function useFilterState({
  activeFilterIndex: activeFilterIdexProp,
  applyFilter,
  defaultFilters,
  filters: filtersProp,
}: FilterStateHookProps) {
  const [filters, setFilters] = useControlled<Filter[]>({
    controlled: filtersProp,
    default: defaultFilters ?? [],
    name: "useFilters",
    state: "Filters",
  });

  const [activeIndices, setActiveIndices] =
    useState<number[]>(activeFilterIdexProp);

  const onApplyFilter = useCallback(
    ({ activeIndices, filters }: FilterState) => {
      if (activeIndices.length > 0) {
        const activeFilters = activeIndices.map((i) => filters[i]);
        if (activeFilters.length === 1) {
          const [filter] = activeFilters;
          applyFilter(filter);
        } else {
          applyFilter({ op: "and", filters: activeFilters });
        }
      } else {
        applyFilter();
      }
    },
    [applyFilter]
  );

  const onFilterStateChange = useCallback(
    ({ filters, activeIndices }: FilterState) => {
      setFilters(filters);
      setActiveIndices(activeIndices);
      onApplyFilter({ filters, activeIndices });
    },
    [onApplyFilter]
  );

  const handleActiveIndicesChange = useCallback(
    (indices: number[]) =>
      onFilterStateChange({ filters, activeIndices: indices }),
    [filters, onFilterStateChange]
  );

  return {
    filterState: { activeIndices, filters },
    onActiveIndicesChange: handleActiveIndicesChange,
    onFilterStateChange,
  };
}

type FilterState = { filters: Filter[]; activeIndices: number[] };
