import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { Filter, FilterState, NamedFilter } from "@finos/vuu-filter-types";
import { FilterBarProps } from "@finos/vuu-filters";
import { useViewContext } from "@finos/vuu-layout";
import { useLayoutManager } from "@finos/vuu-shell";
import { FilterTableFeatureProps } from "@finos/vuu-utils";
import { useCallback, useMemo, useState } from "react";

const NO_CONFIG: FilterBarConfig = {};

type FilterBarConfig = {
  "filterbar-config"?: Partial<FilterBarProps>;
};

type SavedFilterMap = {
  [key: string]: Omit<NamedFilter, "name"> & { name: string }[];
};

const hasFilterWithName = (filters: NamedFilter[], name: string) =>
  filters.findIndex((f) => f.name === name) !== -1;

export const usePersistFilterState = ({
  tableSchema,
}: FilterTableFeatureProps) => {
  const { load, save } = useViewContext();
  const { getApplicationSettings, saveApplicationSettings } =
    useLayoutManager();

  const { "filterbar-config": filterbarConfigFromState } =
    useMemo<FilterBarConfig>(() => load?.() ?? NO_CONFIG, [load]);

  const [filterState, setFilterState] = useState<FilterState>({
    filters: filterbarConfigFromState?.filterState?.filters ?? [],
    activeIndices: filterbarConfigFromState?.filterState?.activeIndices ?? [],
  });

  const savedFilters = useMemo(() => {
    const {
      table: { module, table },
    } = tableSchema;
    const savedFilters = getApplicationSettings("filters") as SavedFilterMap;
    const key = `${module}:${table}`;
    return savedFilters?.[key] ?? [];
  }, [getApplicationSettings, tableSchema]);

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

  const handleFilterStateChanged = useCallback(
    (filterState: FilterState) => {
      save?.({ filterState }, "filterbar-config");
      setFilterState(filterState);
    },
    [save]
  );

  const handleFilterDeleted = useCallback(
    (filter: Filter) => {
      removeFilterFromSettings(filter);
    },
    [removeFilterFromSettings]
  );

  const handleFilterRenamed = useCallback(
    (filter: Filter, name: string) => {
      saveFilterToSettings(filter, name);
    },
    [saveFilterToSettings]
  );

  const buildFilterTableMenuOptions = useCallback<MenuBuilder>(
    (location) => {
      if (location === "filter-bar-menu") {
        if (savedFilters.length > 0) {
          return savedFilters.map((filter) => ({
            action: "add-filter",
            label: filter.name,
            options: { filter },
          }));
        } else {
          return [
            {
              label: `You have no saved filters for this table`,
              action: `no-action`,
            } as ContextMenuItemDescriptor,
          ];
        }
      } else {
        return [];
      }
    },
    [savedFilters]
  );

  const handleFilterTableMenuAction = useCallback<MenuActionHandler>(
    (menuAction) => {
      const { menuId, options } = menuAction;
      if (menuId === "add-filter") {
        console.log(`add filter `, {
          options,
        });
        return true;
      } else {
        return false;
      }
      console.log(menuId, options);
      // return false;
    },
    []
  );

  return {
    buildFilterTableMenuOptions,
    filterState,
    handleFilterTableMenuAction,
    onFilterStateChanged: handleFilterStateChanged,
    onFilterDeleted: handleFilterDeleted,
    onFilterRenamed: handleFilterRenamed,
  };
};
