import { TableSchema } from "@finos/vuu-data-types";
import { Filter, NamedFilter } from "@finos/vuu-filter-types";
import { useLayoutManager } from "@finos/vuu-shell";
import { useControlled } from "@finos/vuu-ui-controls";
import { useCallback } from "react";

export interface FiltersHookProps {
  defaultFilters?: Filter[];
  filters?: Filter[];
  onFiltersChanged?: (filters: Filter[]) => void;
  tableSchema?: TableSchema;
}

export const useFilters = ({
  defaultFilters,
  filters: filtersProp,
  onFiltersChanged,
  tableSchema,
}: FiltersHookProps) => {
  const [filters, setFilters] = useControlled<Filter[]>({
    controlled: filtersProp,
    default: defaultFilters ?? [],
    name: "useFilters",
    state: "Filters",
  });

  const { getApplicationSettings, saveApplicationSettings } =
    useLayoutManager();

  type SavedFilterMap = {
    [key: string]: NamedFilter[];
  };

  const hasFilter = (filters: NamedFilter[], name: string) =>
    filters.findIndex((f) => f.name === name) !== -1;

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
            if (hasFilter(savedFilters[key], name)) {
              newFilters = {
                ...savedFilters,
                [key]: savedFilters[key].map((f) =>
                  f.name === name ? { ...filter, name } : f
                ),
              };
            } else if (
              filter?.name &&
              filter?.name !== name &&
              hasFilter(savedFilters[key], filter.name)
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
      if (tableSchema && filter.name) {
        const savedFilters = getApplicationSettings(
          "filters"
        ) as SavedFilterMap;

        const { module, table } = tableSchema.table;
        const key = `${module}:${table}`;

        if (
          savedFilters[key]?.findIndex((f) => f.name === filter.name) !== -1
        ) {
          const newSavedFilters = {
            ...savedFilters,
            [key]: savedFilters[key].filter((f) => f.name !== filter.name),
          };
          saveApplicationSettings(newSavedFilters, "filters");
        }
      }
    },
    [getApplicationSettings, saveApplicationSettings, tableSchema]
  );

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
      console.log(`handleDeleteFilter`, {
        filter,
      });

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
      removeFilterFromSettings(filter);
      return index;
    },
    [filters, onFiltersChanged, removeFilterFromSettings, setFilters]
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
      saveFilterToSettings(filter, name);

      return index;
    },
    [filters, onFiltersChanged, saveFilterToSettings, setFilters]
  );

  const handleChangeFilter = useCallback(
    (oldFilter: Filter, newFilter: Filter) => {
      let index = -1;
      const newFilters = filters.map((f, i) => {
        if (f === oldFilter) {
          index = i;
          return newFilter;
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
