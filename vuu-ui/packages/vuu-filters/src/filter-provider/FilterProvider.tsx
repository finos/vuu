import {
  FilterContainerFilter,
  FilterContainerFilterDescriptor,
} from "@vuu-ui/vuu-filter-types";
import { ReactElement, ReactNode, useCallback, useMemo, useState } from "react";
import { FilterNamePrompt } from "../saved-filters/FilterNamePrompt";
import { DeleteFilterPrompt } from "../saved-filters/DeleteFilterPrompt";
import {
  activateFilter,
  findFilter,
  insertOrReplaceFilter,
  renameFilter,
} from "./filter-descriptor-utils";
import { uuid } from "@vuu-ui/vuu-utils";
import {
  EMPTY_FILTER,
  EmptyFilterDescriptor,
  FilterContext,
  FilterContextFilterMenuActionHandler,
  NULL_FILTER,
  NullFilterDescriptor,
  UNSAVED_FILTER,
} from "./FilterContext";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";

const findActiveFilter = (
  filterDescriptors: FilterContainerFilterDescriptor[],
) => filterDescriptors.find((f) => f.active) ?? NullFilterDescriptor;

const findFilterByName = (
  filterDescriptors: FilterContainerFilterDescriptor[],
  name: string,
) => filterDescriptors.find((f) => f.filter?.name === name);

type SavedFilterMap = Map<string, FilterContainerFilterDescriptor[]>;
type SavedFilterRecord = Record<string, FilterContainerFilterDescriptor[]>;

const mapToRecord = (savedFilters: SavedFilterMap) => {
  const record: SavedFilterRecord = {};
  savedFilters.forEach((filterDescriptors, key) => {
    record[key] = filterDescriptors;
  });
  return record;
};

export interface FilterProviderProps {
  children: ReactNode;
  onFiltersSaved?: (savedFilters: SavedFilterRecord) => void;
  savedFilters?: SavedFilterRecord;
}

export const FilterProvider = ({
  children,
  onFiltersSaved,
  savedFilters: savedFiltersProp,
}: FilterProviderProps) => {
  const [, forceRefresh] = useState({});
  const savedFilters = useMemo<SavedFilterMap>(
    () =>
      savedFiltersProp ? new Map(Object.entries(savedFiltersProp)) : new Map(),
    [savedFiltersProp],
  );

  const [dialog, setDialog] = useState<ReactElement | null>(null);

  const deleteFilter = useCallback(
    (key: string, filterId: string) => {
      const filterDescriptors = savedFilters.get(key);
      if (filterDescriptors === undefined) {
        throw Error(`[FilterProvider] deleteFilter, key ${key} not found`);
      } else {
        const newFilterDescriptors = filterDescriptors.filter(
          ({ id }) => id !== filterId,
        );
        savedFilters.set(key, newFilterDescriptors);
        if (filterId !== UNSAVED_FILTER) {
          onFiltersSaved?.(mapToRecord(savedFilters));
        }
      }
    },
    [onFiltersSaved, savedFilters],
  );

  const applyNewName = useCallback(
    (key: string, filterId: string, name: string) => {
      const filterDescriptors = savedFilters.get(key);
      if (filterDescriptors === undefined) {
        throw Error(`[FilterProvider] applyNewName, key ${key} not found`);
      } else {
        const newFilterDescriptors = renameFilter(
          filterDescriptors,
          filterId,
          name,
        );
        savedFilters.set(key, newFilterDescriptors);
        onFiltersSaved?.(mapToRecord(savedFilters));
      }
    },
    [onFiltersSaved, savedFilters],
  );

  const promptForFilterName = useCallback(
    (key: string, { filter, id }: FilterContainerFilterDescriptor) => {
      const originalFilterName = filter?.name ?? "";
      setDialog(
        <FilterNamePrompt
          filterName={filter?.name}
          title="Rename filter"
          onClose={() => setDialog(null)}
          onConfirm={(name) => {
            setDialog(null);
            if (originalFilterName !== name) {
              applyNewName(key, id, name);
            }
          }}
        />,
      );
    },
    [applyNewName],
  );

  const promptForConfirmationOfDelete = useCallback(
    (
      key: string,
      filterDescriptor: FilterContainerFilterDescriptor,
      columns?: ColumnDescriptor[],
    ) => {
      setDialog(
        <DeleteFilterPrompt
          columns={columns}
          filterDescriptor={filterDescriptor}
          onConfirm={() => {
            setDialog(null);
            deleteFilter(key, filterDescriptor.id);
          }}
          onClose={() => setDialog(null)}
        />,
      );
    },
    [deleteFilter],
  );

  const handleFilterMenuAction =
    useCallback<FilterContextFilterMenuActionHandler>(
      (key: string, filterId, actionType, columns) => {
        const filterDescriptors = savedFilters.get(key);
        if (filterDescriptors === undefined) {
          throw Error(`[FilterProvider] applyNewName, key ${key} not found`);
        } else {
          const targetFilter = findFilter(filterDescriptors, filterId);
          switch (actionType) {
            case "close":
              console.log(`close filter ${filterId}`);
              break;
            case "edit":
              console.log(`edit filter ${filterId}`);
              break;
            case "remove":
              if (filterId === UNSAVED_FILTER) {
                console.log("remove unsaved filter");
              } else {
                promptForConfirmationOfDelete(key, targetFilter, columns);
              }
              break;
            case "rename":
              return promptForFilterName(key, targetFilter);
          }
        }
      },
      [promptForConfirmationOfDelete, promptForFilterName, savedFilters],
    );

  const handleSaveFilter = useCallback(
    (key: string, name: string) => {
      const filterDescriptors = savedFilters.get(key);
      if (filterDescriptors === undefined) {
        throw Error(`[FilterProvider] applyNewName, key ${key} not found`);
      } else {
        const activeFilter = findActiveFilter(filterDescriptors);
        if (activeFilter.filter === null) {
          throw Error("[FilterProvider] cannot save an empty filter");
        }
        const filterWithSameName = findFilterByName(filterDescriptors, name);
        // We are always renaming the active filter, how this will play out depends on whether
        // the name is unique and has actually changed
        if (activeFilter === filterWithSameName) {
          // name has not changed
          return;
        } else if (filterWithSameName !== undefined) {
          // we are renaming the active filter, but another filter already has the same name,
          // keep the active filter, remove the duplicate.
          const newFilterDescriptors = filterDescriptors.reduce<
            FilterContainerFilterDescriptor[]
          >((list, filterDescriptor) => {
            if (filterDescriptor === activeFilter) {
              list.push({
                active: true,
                filter: { ...filterDescriptor.filter, name },
                id: uuid(),
                name,
              } as FilterContainerFilterDescriptor);
            } else if (filterDescriptor.filter?.name !== name) {
              list.push(filterDescriptor);
            }
            return list;
          }, []);
          savedFilters.set(key, newFilterDescriptors);
        } else {
          const newFilterDescriptors = filterDescriptors.map(
            (filterDescriptor) =>
              filterDescriptor === activeFilter
                ? ({
                    active: true,
                    filter: { ...filterDescriptor.filter, name },
                    id: uuid(),
                    name,
                  } as FilterContainerFilterDescriptor)
                : filterDescriptor,
          );
          savedFilters.set(key, newFilterDescriptors);
          onFiltersSaved?.(mapToRecord(savedFilters));
        }
      }
      forceRefresh({});
    },
    [onFiltersSaved, savedFilters],
  );

  /**
   * Allows switching between saved filters. Alternatively, an anonymous
   * filter can be assigned. This is to allow for a dynamically created
   * filter to be active.
   */
  const setCurrentFilter = useCallback(
    (key: string, filter: string | FilterContainerFilter) => {
      const filterDescriptors = savedFilters.get(key) ?? [];

      if (filter === NULL_FILTER) {
        const newFilterDescriptors = insertOrReplaceFilter(
          filterDescriptors,
          NullFilterDescriptor,
        );
        savedFilters.set(key, newFilterDescriptors);
      } else if (filter === EMPTY_FILTER) {
        const newFilterDescriptors = insertOrReplaceFilter(
          filterDescriptors,
          EmptyFilterDescriptor,
        );
        savedFilters.set(key, newFilterDescriptors);
      } else if (typeof filter === "string") {
        const newFilterDescriptors = activateFilter(filterDescriptors, filter);
        savedFilters.set(key, newFilterDescriptors);
      } else if (filter) {
        const newFilterDescriptors = insertOrReplaceFilter(filterDescriptors, {
          active: true,
          filter,
          id: UNSAVED_FILTER,
        });
        savedFilters.set(key, newFilterDescriptors);
      } else {
        deleteFilter(key, UNSAVED_FILTER);
      }

      forceRefresh({});
    },
    [deleteFilter, savedFilters],
  );

  const clearCurrentFilter = useCallback(
    (key: string) => {
      setCurrentFilter(key, NULL_FILTER);
    },
    [setCurrentFilter],
  );

  return (
    <FilterContext.Provider
      value={{
        onFilterMenuAction: handleFilterMenuAction,
        deleteFilter,
        saveFilter: handleSaveFilter,
        filterDescriptors: savedFilters,
        clearCurrentFilter,
        setCurrentFilter,
      }}
    >
      {children}
      {dialog}
    </FilterContext.Provider>
  );
};
