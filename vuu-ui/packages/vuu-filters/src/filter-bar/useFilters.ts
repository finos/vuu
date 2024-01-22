import { useCallback } from "react";
import { TableSchema } from "@finos/vuu-data-types";
import { Filter, NamedFilter } from "@finos/vuu-filter-types";
import { useLayoutManager } from "@finos/vuu-shell";
import { FilterStateHookProps, useFilterState } from "./useFilterState";

export interface FiltersHookProps extends FilterStateHookProps {
  onFiltersChanged?: (filters: Filter[]) => void;
  tableSchema?: TableSchema;
}

export const useFilters = ({
  onFiltersChanged,
  tableSchema,
  ...filterStateHookProps
}: FiltersHookProps) => {
  const { getApplicationSettings, saveApplicationSettings } =
    useLayoutManager();
  const { filterState, onFilterStateChange, onActiveIndicesChange } =
    useFilterState(filterStateHookProps);

  const saveFilterToSettings = useCallback(
    (filter: Filter, name?: string) => {
      if (tableSchema && name) {
        const savedFilters = getApplicationSettings(
          "filters"
        ) as SavedFilterMap;
        let newFilters = savedFilters;
        const { module, table } = tableSchema.table;
        const key = `${module}:${table}`;
        if (savedFilters) {
          if (savedFilters[key]) {
            if (hasFilterWithName(savedFilters[key], name)) {
              newFilters = {
                ...savedFilters,
                [key]: savedFilters[key].map((f) =>
                  f.name === name ? { ...filter, name } : f
                ),
              };
            } else if (
              filter?.name &&
              filter?.name !== name &&
              hasFilterWithName(savedFilters[key], filter.name)
            ) {
              newFilters = {
                ...savedFilters,
                [key]: savedFilters[key].map((f) =>
                  f.name === filter.name ? { ...filter, name } : f
                ),
              };
            } else {
              newFilters = {
                ...savedFilters,
                [key]: savedFilters[key].concat({ ...filter, name }),
              };
            }
          } else {
            newFilters = {
              ...savedFilters,
              [key]: [{ ...filter, name }],
            };
          }
        } else {
          newFilters = {
            [key]: [{ ...filter, name }],
          };
        }
        if (newFilters !== savedFilters) {
          saveApplicationSettings(newFilters, "filters");
        }
      }
    },
    [getApplicationSettings, saveApplicationSettings, tableSchema]
  );

  const removeFilterFromSettings = useCallback(
    (filter: Filter | NamedFilter) => {
      if (!tableSchema || !filter.name) return;

      const savedFilters = getApplicationSettings("filters") as SavedFilterMap;
      if (!savedFilters) return;

      const { module, table } = tableSchema.table;
      const key = `${module}:${table}`;

      if (hasFilterWithName(savedFilters[key], filter.name)) {
        const newSavedFilters = {
          ...savedFilters,
          [key]: savedFilters[key].filter((f) => f.name !== filter.name),
        };
        saveApplicationSettings(newSavedFilters, "filters");
      }
    },
    [getApplicationSettings, saveApplicationSettings, tableSchema]
  );

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
      removeFilterFromSettings(filter);
      return index;
    },
    [
      filterState,
      onFiltersChanged,
      onFilterStateChange,
      removeFilterFromSettings,
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
      saveFilterToSettings(filter, name);

      return index;
    },
    [filterState, onFiltersChanged, onFilterStateChange, saveFilterToSettings]
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

type SavedFilterMap = {
  [key: string]: NamedFilter[];
};

const hasFilterWithName = (filters: NamedFilter[], name: string) =>
  filters.findIndex((f) => f.name === name) !== -1;

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
