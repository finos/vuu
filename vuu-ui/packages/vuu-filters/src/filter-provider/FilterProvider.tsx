import {
  FilterChangeHandler,
  FilterContainerFilter,
  FilterContainerFilterDescriptor,
  FilterContainerFilterDescriptorWithFilter,
} from "@vuu-ui/vuu-filter-types";
import { ReactElement, ReactNode, useCallback, useState } from "react";
import { FilterMenuActionHandler } from "../filter-pill/FilterMenu";
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
  FilterContextProps,
  isEmptyFilter,
  isNullFilter,
  NULL_FILTER,
  NullFilterDescriptor,
} from "./FilterContext";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";

export const UNSAVED_FILTER = "unsaved-filter";

export const filterDescriptorHasFilter = (
  f: FilterContainerFilterDescriptor,
): f is FilterContainerFilterDescriptorWithFilter =>
  !isEmptyFilter(f) && !isNullFilter(f);

const findActiveFilter = (
  filterDescriptors: FilterContainerFilterDescriptor[],
) => filterDescriptors.find((f) => f.active) ?? NullFilterDescriptor;

const findFilterByName = (
  filterDescriptors: FilterContainerFilterDescriptor[],
  name: string,
) => filterDescriptors.find((f) => f.filter?.name === name);

export const FilterProvider = ({
  children,
  onFiltersSaved,
  savedFilters = [],
}: Partial<Pick<FilterContextProps, "currentFilter" | "savedFilters">> & {
  children: ReactNode;
  onFiltersSaved?: (
    filterDescriptors: FilterContainerFilterDescriptor[],
  ) => void;
}) => {
  const [filterDescriptors, setFilterDescriptors] = useState(savedFilters);
  const [dialog, setDialog] = useState<ReactElement | null>(null);

  const handleApplyFilter = useCallback<FilterChangeHandler>(() => {
    console.log("filter changed");
  }, []);

  const deleteFilter = useCallback(
    (filterId: string) => {
      setFilterDescriptors((filterDescriptors) => {
        const newFilterDescriptors = filterDescriptors.filter(
          ({ id }) => id !== filterId,
        );
        if (filterId !== UNSAVED_FILTER) {
          onFiltersSaved?.(newFilterDescriptors);
        }
        return newFilterDescriptors;
      });
    },
    [onFiltersSaved],
  );

  const applyNewName = useCallback(
    (filterId: string, name: string) => {
      setFilterDescriptors((currentFilterDescriptors) => {
        const newFilterDescriptors = renameFilter(
          currentFilterDescriptors,
          filterId,
          name,
        );
        onFiltersSaved?.(newFilterDescriptors);
        return newFilterDescriptors;
      });
    },
    [onFiltersSaved],
  );

  const PromptForFilterName = useCallback(
    ({ filter, id }: FilterContainerFilterDescriptor) => {
      const originalFilterName = filter?.name ?? "";
      setDialog(
        <FilterNamePrompt
          filterName={filter?.name}
          title="Rename filter"
          onClose={() => setDialog(null)}
          onConfirm={(name) => {
            setDialog(null);
            if (originalFilterName !== name) {
              applyNewName(id, name);
            }
          }}
        />,
      );
    },
    [applyNewName],
  );

  const promptForConfirmationOfDelete = useCallback(
    (
      filterDescriptor: FilterContainerFilterDescriptor,
      columns?: ColumnDescriptor[],
    ) => {
      setDialog(
        <DeleteFilterPrompt
          columns={columns}
          filterDescriptor={filterDescriptor}
          onConfirm={() => {
            setDialog(null);
            deleteFilter(filterDescriptor.id);
          }}
          onClose={() => setDialog(null)}
        />,
      );
    },
    [deleteFilter],
  );

  const handleFilterMenuAction = useCallback<FilterMenuActionHandler>(
    (filterId, actionType, columns) => {
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
            promptForConfirmationOfDelete(targetFilter, columns);
          }
          break;
        case "rename":
          return PromptForFilterName(targetFilter);
      }
    },
    [filterDescriptors, promptForConfirmationOfDelete, PromptForFilterName],
  );

  const handleSaveFilter = useCallback(
    (name: string) => {
      setFilterDescriptors((filterDescriptors) => {
        const activeFilter = findActiveFilter(filterDescriptors);
        if (activeFilter.filter === null) {
          throw Error("[FilterProvider] cannot save an empty filter");
        }
        const filterWithSameName = findFilterByName(filterDescriptors, name);
        // We are always renaming the active filter, how this will play out depends on whether
        // the name is unique and has actually changed
        if (activeFilter === filterWithSameName) {
          // name has not changed
          return filterDescriptors;
        } else if (filterWithSameName !== undefined) {
          // we are renaming the active filter, but another filter already has the same name,
          // keep the active filter, remove the duplicate.
          return filterDescriptors.reduce<FilterContainerFilterDescriptor[]>(
            (list, filterDescriptor) => {
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
            },
            [],
          );
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
          onFiltersSaved?.(newFilterDescriptors);
          return newFilterDescriptors;
        }
      });
    },
    [onFiltersSaved],
  );

  /**
   * Allows switching between saved filters. Alternatively, an anonymous
   * filter can be assigned. This is to allow for a dynamically created
   * filter to be active.
   */
  const setCurrentFilter = useCallback(
    (filter: string | FilterContainerFilter) => {
      if (filter === NULL_FILTER) {
        setFilterDescriptors((currentFilterDescriptors) =>
          insertOrReplaceFilter(currentFilterDescriptors, NullFilterDescriptor),
        );
      } else if (filter === EMPTY_FILTER) {
        setFilterDescriptors((currentFilterDescriptors) =>
          insertOrReplaceFilter(
            currentFilterDescriptors,
            EmptyFilterDescriptor,
          ),
        );
      } else if (typeof filter === "string") {
        setFilterDescriptors((currentFilterDescriptors) =>
          activateFilter(currentFilterDescriptors, filter),
        );
      } else if (filter) {
        setFilterDescriptors((currentFilterDescriptors) =>
          insertOrReplaceFilter(currentFilterDescriptors, {
            active: true,
            filter,
            id: UNSAVED_FILTER,
          }),
        );
      } else {
        deleteFilter(UNSAVED_FILTER);
      }
    },
    [deleteFilter],
  );

  return (
    <FilterContext.Provider
      value={{
        currentFilter: findActiveFilter(filterDescriptors),
        onApplyFilter: handleApplyFilter,
        onFilterMenuAction: handleFilterMenuAction,
        deleteFilter,
        saveFilter: handleSaveFilter,
        savedFilters: filterDescriptors.filter(filterDescriptorHasFilter),
        setCurrentFilter,
      }}
    >
      {children}
      {dialog}
    </FilterContext.Provider>
  );
};
