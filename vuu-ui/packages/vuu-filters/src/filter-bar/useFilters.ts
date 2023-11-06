import { useControlled } from "@finos/vuu-ui-controls";
import { Filter } from "@finos/vuu-filter-types";
import { useCallback } from "react";

export interface FiltersHookProps {
  defaultFilters?: Filter[];
  filters?: Filter[];
  onFiltersChanged?: (filters: Filter[]) => void;
}

export const useFilters = ({
  defaultFilters,
  filters: filtersProp,
  onFiltersChanged,
}: FiltersHookProps) => {
  const [filters, setFilters] = useControlled<Filter[]>({
    controlled: filtersProp,
    default: defaultFilters ?? [],
    name: "useFilters",
    state: "Filters",
  });

  const handleAddFilter = useCallback(
    (filter: Filter) => {
      const index = filters.length;
      const newFilters = filters.concat(filter);
      setFilters(newFilters);
      onFiltersChanged?.(newFilters);
      return index;
    },
    [filters, onFiltersChanged, setFilters]
  );

  const handleDeleteFilter = useCallback(
    (filter: Filter) => {
      let index = -1;
      const newFilters = filters.filter((f, i) => {
        if (f !== filter) {
          return true;
        } else {
          index = i;
          return false;
        }
      });
      setFilters(newFilters);
      onFiltersChanged?.(newFilters);
      return index;
    },
    [filters, onFiltersChanged, setFilters]
  );

  const handleRenameFilter = useCallback(
    (filter: Filter, name: string) => {
      let index = -1;
      const newFilters = filters.map((f, i) => {
        if (f === filter) {
          index = i;
          return { ...filter, name };
        } else {
          return f;
        }
      });
      setFilters(newFilters);
      onFiltersChanged?.(newFilters);
      return index;
    },
    [filters, onFiltersChanged, setFilters]
  );

  const handleChangeFilter = useCallback(
    (filter: Filter) => {
      let index = -1;
      const newFilters = filters.map((f, i) => {
        if (f === filter) {
          index = i;
          return filter;
        } else {
          return f;
        }
      });
      setFilters(newFilters);
      onFiltersChanged?.(newFilters);
      return index;
    },
    [filters, onFiltersChanged, setFilters]
  );

  return {
    filters,
    onAddFilter: handleAddFilter,
    onChangeFilter: handleChangeFilter,
    onDeleteFilter: handleDeleteFilter,
    onRenameFilter: handleRenameFilter,
  };
};
