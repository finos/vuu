import { FilterChangeHandler } from "@vuu-ui/vuu-filter-types";
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

export interface FilterContextProps {
  activeFilter: FilterDescriptor | undefined;
  saveFilter: (filter: FilterDescriptor) => void;
  savedFilters?: FilterDescriptor[];
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

  const findFilter = useCallback(
    (filterId: string) => {
      const filter = filterDescriptors.find(({ id }) => id === filterId);
      if (filter) {
        return filter;
      } else {
        throw Error(
          `[FilterProvider] findFilter, filter not found ${filterId}`,
        );
      }
    },
    [filterDescriptors],
  );

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

  const renameFilter = useCallback(
    (filterId: string, filterName: string) => {
      setFilterDescriptors((currentFilterDescriptors) => {
        const newFilterDescriptors =
          currentFilterDescriptors.map<FilterDescriptor>((f) => {
            if (f.id === filterId) {
              return {
                ...f,
                filter: {
                  ...f.filter,
                  name: filterName,
                },
              };
            } else {
              return f;
            }
          });
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
              renameFilter(id, name);
            }
          }}
        />,
      );
    },
    [renameFilter],
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
      const targetFilter = findFilter(filterId);
      switch (actionType) {
        case "close":
          console.log(`clode filter ${filterId}`);
          break;
        case "edit":
          console.log(`edit filter ${filterId}`);
          break;
        case "remove":
          promptForConfirmationOfDelete(targetFilter);
          break;
        case "rename":
          return PromptForFilterName(targetFilter);
      }
    },
    [findFilter, promptForConfirmationOfDelete, PromptForFilterName],
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

  const setActiveFilter = useCallback(
    (filterId?: string) => {
      setFilterDescriptors((currentFilterDescriptors) => {
        const targetFilter = filterId ? findFilter(filterId) : undefined;
        const newFilterDescriptors =
          currentFilterDescriptors.map<FilterDescriptor>((f) => {
            if (f.id === filterId) {
              return {
                ...f,
                active: !f.active,
              };
            } else if (!targetFilter?.active && f.active) {
              return {
                ...f,
                active: false,
              };
            } else {
              return f;
            }
          });
        return newFilterDescriptors;
      });
    },
    [findFilter],
  );

  return (
    <FilterContext.Provider
      value={{
        activeFilter: filterDescriptors.find((f) => f.active),
        onApplyFilter: handleApplyFilter,
        onFilterMenuAction: handleFilterMenuAction,
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
