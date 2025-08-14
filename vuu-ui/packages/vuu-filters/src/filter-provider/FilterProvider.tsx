import { FilterChangeHandler } from "@vuu-ui/vuu-filter-types";
import { Prompt } from "@vuu-ui/vuu-ui-controls";
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
import { FilterNameForm } from "../saved-filters/FilterNameForm";

export interface FilterContextProps {
  activeFilter: FilterDescriptor | undefined;
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
  setActiveFilter: () =>
    console.warn(
      "[FilterContext] setActiveFilter, no FilterProvider has been configured",
    ),
});

export const FilterProvider = ({
  children,
  savedFilters = [],
}: Partial<Pick<FilterContextProps, "activeFilter" | "savedFilters">> & {
  children: ReactNode;
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

  const renameFilter = useCallback((filterId: string, filterName: string) => {
    setFilterDescriptors((currentFilterDescriptors) => {
      return currentFilterDescriptors.map<FilterDescriptor>((f) => {
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
    });
  }, []);

  const PromptForFilterName = useCallback(
    ({ filter, id }: FilterDescriptor) => {
      const originalFilterName = filter.name ?? "";
      let filterName = originalFilterName;
      setDialog(
        <Prompt
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            setDialog(null);
            if (originalFilterName !== filterName) {
              renameFilter(id, filterName);
            }
          }}
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          open
          title="Rename Filter"
        >
          <FilterNameForm
            filterName={filter.name}
            onFilterNameChange={(value) => (filterName = value)}
          />
        </Prompt>,
      );
    },
    [renameFilter],
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
          console.log(`remove filter ${filterId}`);
          break;
        case "rename":
          return PromptForFilterName(targetFilter);
      }
    },
    [findFilter, PromptForFilterName],
  );

  const setActiveFilter = useCallback(
    (filterId?: string) => {
      setFilterDescriptors((currentFilterDescriptors) => {
        const targetFilter = filterId ? findFilter(filterId) : undefined;
        return currentFilterDescriptors.map<FilterDescriptor>((f) => {
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
    setActiveFilter,
  } = useContext(FilterContext);
  return {
    activeFilter,
    onApplyFilter,
    onFilterMenuAction,
    savedFilters,
    setActiveFilter,
  };
}
