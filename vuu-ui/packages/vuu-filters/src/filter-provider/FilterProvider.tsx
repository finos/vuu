import {
  FilterChangeHandler,
  FilterContainerFilter,
  FilterContainerFilterDescriptor,
  FilterContainerFilterDescriptorWithFilter,
} from "@vuu-ui/vuu-filter-types";
import {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
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

export const EMPTY_FILTER = "empty-filter";
export const NULL_FILTER = "null-filter";
export const UNSAVED_FILTER = "unsaved-filter";

export const isEmptyFilter = (f?: FilterContainerFilterDescriptor) =>
  f?.id === EMPTY_FILTER;
export const isNullFilter = (f?: FilterContainerFilterDescriptor) =>
  f?.id === NULL_FILTER;

export const filterDescriptorHasFilter = (
  f: FilterContainerFilterDescriptor,
): f is FilterContainerFilterDescriptorWithFilter =>
  !isEmptyFilter(f) && !isNullFilter(f);

const NullFilterDescriptor: FilterContainerFilterDescriptor = {
  active: true,
  id: NULL_FILTER,
  filter: null,
};

const EmptyFilterDescriptor: FilterContainerFilterDescriptor = {
  active: true,
  id: EMPTY_FILTER,
  filter: null,
};

export interface FilterContextProps {
  currentFilter: FilterContainerFilterDescriptor;
  deleteFilter: (filterId: string) => void;
  saveFilter: (name: string) => void;
  savedFilters?: FilterContainerFilterDescriptor[];
  // TODO do we need this ?
  onApplyFilter: FilterChangeHandler;
  onFilterMenuAction?: FilterMenuActionHandler;
  setCurrentFilter: (filter: string | FilterContainerFilter) => void;
}

export const FilterContext = createContext<FilterContextProps>({
  currentFilter: NullFilterDescriptor,
  savedFilters: [],
  onApplyFilter: () =>
    console.warn(
      "[FilterContext] onApplyFilter, no FilterProvider has been configured",
    ),
  deleteFilter: () =>
    console.warn(
      "[FilterContext] deleteFilter, no FilterProvider has been configured",
    ),

  saveFilter: () =>
    console.warn(
      "[FilterContext] saveFilter, no FilterProvider has been configured",
    ),
  setCurrentFilter: () =>
    console.warn(
      "[FilterContext] setCurrentFilter, no FilterProvider has been configured",
    ),
});

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
    (filterDescriptor: FilterContainerFilterDescriptor) => {
      setDialog(
        <DeleteFilterPrompt
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
    (filterId, actionType) => {
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
            promptForConfirmationOfDelete(targetFilter);
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
        const newFilterDescriptors = filterDescriptors.map(
          (filterDescriptor) =>
            filterDescriptor.active && filterDescriptor.filter !== null
              ? {
                  active: true,
                  filter: { ...filterDescriptor.filter, name },
                  id: uuid(),
                  name,
                }
              : filterDescriptor,
        );
        onFiltersSaved?.(newFilterDescriptors);
        return newFilterDescriptors;
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
        currentFilter:
          filterDescriptors.find((f) => f.active) ?? NullFilterDescriptor,
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

export function useCurrentFilter() {
  const { currentFilter, onApplyFilter, setCurrentFilter } =
    useContext(FilterContext);
  return { currentFilter, onApplyFilter, setCurrentFilter };
}

export function useSavedFilters() {
  const {
    currentFilter,
    onApplyFilter,
    onFilterMenuAction,
    savedFilters,
    saveFilter,
    setCurrentFilter,
  } = useContext(FilterContext);
  return {
    currentFilter,
    onApplyFilter,
    onFilterMenuAction,
    savedFilters,
    saveFilter,
    setCurrentFilter,
  };
}
