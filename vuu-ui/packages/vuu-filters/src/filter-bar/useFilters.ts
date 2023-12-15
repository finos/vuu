import { useControlled } from "@finos/vuu-ui-controls";
import { Filter, NamedFilter } from "@finos/vuu-filter-types";
import { useCallback } from "react";
import { TableSchema } from "packages/vuu-data/src";
import { useLayoutManager } from "@finos/vuu-shell";

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
  const savedFilters = getApplicationSettings("filters") as {
    [key: string]: NamedFilter[];
  };

  console.log({ savedFilters });

  const saveFilterToSettings = useCallback(
    (filter: Filter, name?: string) => {
      console.log(`saveFilterToSettings`);
      if (tableSchema && name) {
        const { module, table } = tableSchema.table;
        const key = `${module}:${table}`;
        if (savedFilters) {
          console.log("add filter to existing store ... ", {
            savedFilters,
          });
          if (savedFilters[key]) {
            console.log("add filter to existing filters for this table ... ");
            if (savedFilters[key].findIndex((f) => f.name === name) !== -1) {
              console.log("We already have a filter by that name, replace it ");

              saveApplicationSettings(
                {
                  ...savedFilters,
                  [key]: savedFilters[key].map((f) => {
                    f.name === name ? { ...filter, name } : f;
                  }),
                },
                "filters"
              );
            } else if (
              name !== undefined &&
              filter?.name !== undefined &&
              filter?.name !== name &&
              savedFilters[key].findIndex((f) => f.name === filter.name) !== -1
            ) {
              saveApplicationSettings(
                {
                  ...savedFilters,
                  [key]: savedFilters[key].map((f) =>
                    f.name === filter.name ? { ...filter, name } : f
                  ),
                },
                "filters"
              );
            } else {
              saveApplicationSettings(
                {
                  ...savedFilters,
                  [key]: savedFilters[key].concat({ ...filter, name }),
                },
                "filters"
              );
            }
          } else {
            saveApplicationSettings(
              {
                ...savedFilters,
                [key]: [{ ...filter, name }],
              },
              "filters"
            );
          }
        } else {
          saveApplicationSettings(
            {
              [key]: [{ ...filter, name }],
            },
            "filters"
          );
        }
      }
    },
    [saveApplicationSettings, savedFilters, tableSchema]
  );

  const removeFilterFromSettings = useCallback(
    (filter: Filter | NamedFilter) => {
      if (tableSchema && filter.name) {
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
    [saveApplicationSettings, savedFilters, tableSchema]
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
