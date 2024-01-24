import { useCallback } from "react";
import { TableSchema } from "@finos/vuu-data-types";
import { Filter } from "@finos/vuu-filter-types";
import { FilterStateHookProps, useFilterState } from "./useFilterState";

export interface FiltersHookProps extends FilterStateHookProps {
  onFilterDeleted?: (filter: Filter) => void;
  onFilterRenamed?: (filter: Filter, name: string) => void;
  onFiltersChanged?: (filters: Filter[]) => void;
  tableSchema?: TableSchema;
}

export const useFilters = ({
  onFilterDeleted,
  onFilterRenamed,
  onFiltersChanged,
  tableSchema,
  ...filterStateHookProps
}: FiltersHookProps) => {
  const { filterState, onFilterStateChange, onActiveIndicesChange } =
    useFilterState(filterStateHookProps);

  const handleAddFilter = useCallback(
    (filter: Filter) => {
      const index = filterState.filters.length;
      const newFilters = filterState.filters.concat(filter);
      const newIndices = appendIfNotPresent(filterState.activeIndices, index);
      onFilterStateChange({ filters: newFilters, activeIndices: newIndices });
      onFiltersChanged?.(newFilters);
      return index;
    },
    [filterState, onFiltersChanged, onFilterStateChange]
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

      onFilterStateChange({ filters: newFilters, activeIndices: newIndices });
      onFiltersChanged?.(newFilters);
      onFilterDeleted?.(filter);
      return index;
    },
    [
      filterState.filters,
      filterState.activeIndices,
      onFilterStateChange,
      onFiltersChanged,
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
      onFilterStateChange({ ...filterState, filters: newFilters });
      onFiltersChanged?.(newFilters);
      onFilterRenamed?.(filter, name);

      return index;
    },
    [filterState, onFilterStateChange, onFiltersChanged, onFilterRenamed]
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
      onFilterStateChange({ ...filterState, filters: newFilters });
      onFiltersChanged?.(newFilters);

      return index;
    },
    [filterState, onFiltersChanged, onFilterStateChange]
  );

  return {
    ...filterState,
    activeFilterIndex: filterState.activeIndices,
    onChangeActiveFilterIndex: onActiveIndicesChange,
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
