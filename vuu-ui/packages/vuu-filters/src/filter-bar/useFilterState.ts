import { useCallback } from "react";
import { Filter, FilterState } from "@finos/vuu-filter-types";
import { useControlled } from "@finos/vuu-ui-controls";

export interface FiltersHookProps {
  defaultFilterState?: FilterState;
  filterState?: FilterState;
  onFilterDeleted?: (filter: Filter) => void;
  onFilterRenamed?: (filter: Filter, name: string) => void;
  onFilterStateChanged?: (s: FilterState) => void;
}

const getActiveIndices = (
  indices: number[],
  toggledIndex: number,
  preserveExisting: boolean
) => {
  const isActive = indices.includes(toggledIndex);
  if (isActive) {
    if (preserveExisting) {
      return indices.filter((i) => i !== toggledIndex);
    } else {
      return [];
    }
  } else {
    if (preserveExisting) {
      return indices.concat(toggledIndex);
    } else {
      return [toggledIndex];
    }
  }
};

export const useFilterState = ({
  defaultFilterState,
  onFilterDeleted,
  onFilterRenamed,
  onFilterStateChanged,
  filterState: filterStateProp,
}: FiltersHookProps) => {
  const [filterState, setFilterState] = useControlled<FilterState>({
    controlled: filterStateProp,
    default: defaultFilterState ?? { filters: [], activeIndices: [] },
    name: "useFilterState",
    state: "FilterState",
  });

  const handleFilterStateChange = useCallback(
    (s: FilterState) => {
      setFilterState(s);
      onFilterStateChanged?.(s);
    },
    [onFilterStateChanged, setFilterState]
  );

  const handleAddFilter = useCallback(
    (filter: Filter) => {
      const index = filterState.filters.length;
      const newFilters = filterState.filters.concat(filter);
      const newIndices = appendIfNotPresent(filterState.activeIndices, index);
      handleFilterStateChange({
        filters: newFilters,
        activeIndices: newIndices,
      });
      return index;
    },
    [filterState, handleFilterStateChange]
  );

  const handleDeleteFilter = useCallback(
    (filter: Filter) => {
      let index = -1;
      const newFilters = filterState.filters.filter((f, i) => {
        if (f !== filter) {
          return true;
        } else {
          index = i;
          return false;
        }
      });

      const newIndices = removeIndexAndDecrementLarger(
        filterState.activeIndices,
        index
      );

      handleFilterStateChange({
        filters: newFilters,
        activeIndices: newIndices,
      });
      onFilterDeleted?.(filter);
      return index;
    },
    [
      filterState.filters,
      filterState.activeIndices,
      handleFilterStateChange,
      onFilterDeleted,
    ]
  );

  const handleRenameFilter = useCallback(
    (filter: Filter, name: string) => {
      let index = -1;
      const newFilters = filterState.filters.map((f, i) => {
        if (f === filter) {
          index = i;
          return { ...filter, name };
        } else {
          return f;
        }
      });
      handleFilterStateChange({ ...filterState, filters: newFilters });
      onFilterRenamed?.(filter, name);

      return index;
    },
    [filterState, handleFilterStateChange, onFilterRenamed]
  );

  const handleChangeFilter = useCallback(
    (oldFilter: Filter, newFilter: Filter) => {
      let index = -1;
      const newFilters = filterState.filters.map((f, i) => {
        if (f === oldFilter) {
          index = i;
          return newFilter;
        } else {
          return f;
        }
      });
      handleFilterStateChange({ ...filterState, filters: newFilters });

      return index;
    },
    [filterState, handleFilterStateChange]
  );

  const handleToggleFilterActive = useCallback(
    (filterIndex: number, preserveRemainingFilters = false) => {
      handleFilterStateChange({
        ...filterState,
        activeIndices: getActiveIndices(
          filterState.activeIndices,
          filterIndex,
          preserveRemainingFilters
        ),
      });
    },
    [filterState, handleFilterStateChange]
  );

  return {
    activeFilterIndex: filterState.activeIndices,
    filters: filterState.filters,
    onToggleFilterActive: handleToggleFilterActive,
    onAddFilter: handleAddFilter,
    onChangeFilter: handleChangeFilter,
    onDeleteFilter: handleDeleteFilter,
    onRenameFilter: handleRenameFilter,
  };
};

const appendIfNotPresent = (ns: number[], n: number) =>
  ns.includes(n) ? ns : ns.concat(n);

const removeIndexAndDecrementLarger = (
  indices: number[],
  idxToRemove: number
) => {
  return indices.reduce<number[]>((res, i) => {
    if (i === idxToRemove) return res;
    return res.concat(i > idxToRemove ? i - 1 : i);
  }, []);
};
