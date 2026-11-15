import { useControlled } from "@salt-ds/core";
import type { Filter } from "@vuu-ui/vuu-filter-types";
import { useCallback, useRef, useState } from "react";
import { FilterBarProps } from "./FilterBar";

export type FilterMode = "custom-filter" | "quick-filter";

type QuickFilterState = {
  count: number;
  filter?: Filter;
};

const NO_QUICK_FILTER: QuickFilterState = { count: 0 };

export const useFilterBar = ({
  defaultFilterMode,
  filterMode: filterModeProp,
  onApplyFilter,
  onChangeFilterMode,
  onClearFilter,
}: Pick<
  FilterBarProps,
  | "defaultFilterMode"
  | "filterMode"
  | "onApplyFilter"
  | "onChangeFilterMode"
  | "onClearFilter"
>) => {
  const [filterMode, setFilterMode] = useControlled<FilterMode>({
    controlled: filterModeProp,
    default: defaultFilterMode ?? "custom-filter",
    name: "useFilterBar",
    state: "filterMode",
  });

  const toggleFilterMode = useCallback(() => {
    const newFilterMode =
      filterMode === "quick-filter" ? "custom-filter" : "quick-filter";
    setFilterMode(newFilterMode);
    onChangeFilterMode?.(newFilterMode);
  }, [filterMode, onChangeFilterMode, setFilterMode]);

  // Saved filters and quick filters apply together. Each reports its own
  // filter; the FilterBar applies both.
  const [quickFilter, setQuickFilter] =
    useState<QuickFilterState>(NO_QUICK_FILTER);
  const customFilterRef = useRef<Filter | undefined>(undefined);
  const quickFilterRef = useRef<Filter | undefined>(undefined);
  const handlersRef = useRef({ onApplyFilter, onClearFilter });
  handlersRef.current = { onApplyFilter, onClearFilter };

  const applyFilters = useCallback(() => {
    const filters = [customFilterRef.current, quickFilterRef.current].filter(
      (f): f is Filter => f !== undefined,
    );
    if (filters.length === 0) {
      handlersRef.current.onClearFilter();
    } else if (filters.length === 1) {
      handlersRef.current.onApplyFilter(filters[0]);
    } else {
      handlersRef.current.onApplyFilter({ op: "and", filters });
    }
  }, []);

  const applyCustomFilter = useCallback(
    (filter: Filter) => {
      customFilterRef.current = filter;
      applyFilters();
    },
    [applyFilters],
  );
  const clearCustomFilter = useCallback(() => {
    customFilterRef.current = undefined;
    applyFilters();
  }, [applyFilters]);

  const applyQuickFilter = useCallback(
    (filter: Filter | undefined, count: number) => {
      quickFilterRef.current = filter;
      setQuickFilter(filter ? { count, filter } : NO_QUICK_FILTER);
      applyFilters();
    },
    [applyFilters],
  );

  return {
    applyCustomFilter,
    applyQuickFilter,
    clearCustomFilter,
    filterMode,
    quickFilter: quickFilter.filter,
    quickFilterCount: quickFilter.count,
    toggleFilterMode,
  };
};
