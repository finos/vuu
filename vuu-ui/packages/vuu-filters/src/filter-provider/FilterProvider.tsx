import { Filter, FilterChangeHandler } from "@vuu-ui/vuu-filter-types";
import {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { FilterMenuActionHandler } from "../filter-pill/FilterMenu";
import { FilterDescriptor } from "../saved-filters/useSavedFilterPanel";
import { FilterNamePrompt } from "../saved-filters/FilterNamePrompt";
import { DeleteFilterPrompt } from "../saved-filters/DeleteFilterPrompt";
import {
  activateFilter,
  findFilter,
  insertOrReplaceFilter,
  renameFilter,
} from "./filter-descriptor-utils";

const UNSAVED_FILTER = "unsaved-filter";

export interface FilterContextProps {
  activeFilter: FilterDescriptor | undefined;
  deleteFilter: (filterId: string) => void;
  saveFilter: (filter: FilterDescriptor) => void;
  savedFilters?: FilterDescriptor[];
  // TODO do we need this ?
  onApplyFilter: FilterChangeHandler;
  onFilterMenuAction?: FilterMenuActionHandler;
  setActiveFilter: (filterId?: string) => void;
}

export const FilterContext = createContext<FilterContextProps>({
  activeFilter: undefined,
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
  setActiveFilter: () =>
    console.warn(
      "[FilterContext] setActiveFilter, no FilterProvider has been configured",
    ),
});

export const FilterProvider = ({
  children,
  onFiltersSaved,
  savedFilters = [],
}: Partial<Pick<FilterContextProps, "activeFilter" | "savedFilters">> & {
  children: ReactNode;
  onFiltersSaved?: (filterDescriptors: FilterDescriptor[]) => void;
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
        onFiltersSaved?.(newFilterDescriptors);
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
    ({ filter, id }: FilterDescriptor) => {
      const originalFilterName = filter.name ?? "";
      setDialog(
        <FilterNamePrompt
          filterName={filter.name}
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
    (filterDescriptor: FilterDescriptor) => {
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
    (filterDescriptor: FilterDescriptor) => {
      setFilterDescriptors((filterDescriptors) => {
        const newFilterDescriptors = filterDescriptor.active
          ? filterDescriptors
              .map((filterDescriptor) =>
                filterDescriptor.active
                  ? { ...filterDescriptor, active: false }
                  : filterDescriptor,
              )
              .concat(filterDescriptor)
          : filterDescriptors.concat(filterDescriptor);
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
  const setActiveFilter = useCallback((filter?: string | Filter) => {
    if (typeof filter === "string") {
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
    }
  }, []);

  return (
    <FilterContext.Provider
      value={{
        activeFilter: filterDescriptors.find((f) => f.active),
        onApplyFilter: handleApplyFilter,
        onFilterMenuAction: handleFilterMenuAction,
        deleteFilter,
        saveFilter: handleSaveFilter,
        savedFilters: filterDescriptors,
        setActiveFilter,
      }}
    >
      {children}
      {dialog}
    </FilterContext.Provider>
  );
};

export function useActiveFilter() {
  const { activeFilter, onApplyFilter } = useContext(FilterContext);
  return { activeFilter, onApplyFilter };
}

export function useSavedFilters() {
  const {
    activeFilter,
    onApplyFilter,
    onFilterMenuAction,
    savedFilters,
    saveFilter,
    setActiveFilter,
  } = useContext(FilterContext);
  return {
    activeFilter,
    onApplyFilter,
    onFilterMenuAction,
    savedFilters,
    saveFilter,
    setActiveFilter,
  };
}
