import {
  FilterContainerFilter,
  FilterContainerFilterDescriptor,
} from "@vuu-ui/vuu-filter-types";
import { FilterAction } from "../filter-pill/FilterMenu";
import { createContext, useCallback, useContext } from "react";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";

const getCurrentFilter = (
  key: string,
  savedFilters: Map<string, FilterContainerFilterDescriptor[]>,
) => {
  const filterDescriptors = savedFilters.get(key);
  if (filterDescriptors) {
    const activeFilter = filterDescriptors.find((f) => f.active);
    if (activeFilter) {
      return activeFilter;
    }
  }
  return NullFilterDescriptor;
};

export type FilterContextFilterMenuActionHandler = <
  T extends FilterAction = FilterAction,
>(
  key: string,
  filterId: string,
  filterAction: T,
  /**
   * Some menu action handlers may use columns to enrich filter display
   */
  columns?: ColumnDescriptor[],
) => void;

export interface FilterContextProps {
  deleteFilter: (key: string, filterId: string) => void;
  saveFilter: (key: string, name: string) => void;
  savedFilters: Map<string, FilterContainerFilterDescriptor[]>;
  onFilterMenuAction?: FilterContextFilterMenuActionHandler;
  setCurrentFilter: (
    key: string,
    filter: string | FilterContainerFilter,
  ) => void;
}

export const UNSAVED_FILTER = "unsaved-filter";
export const EMPTY_FILTER = "empty-filter";
export const NULL_FILTER = "null-filter";

export const isEmptyFilter = (f?: FilterContainerFilterDescriptor) =>
  f?.id === EMPTY_FILTER;
export const isNullFilter = (f?: FilterContainerFilterDescriptor) =>
  f?.id === NULL_FILTER;

export const NullFilterDescriptor: FilterContainerFilterDescriptor = {
  active: true,
  id: NULL_FILTER,
  filter: null,
};

export const EmptyFilterDescriptor: FilterContainerFilterDescriptor = {
  active: true,
  id: EMPTY_FILTER,
  filter: null,
};

export const FilterContext = createContext<FilterContextProps>({
  savedFilters: new Map<string, FilterContainerFilterDescriptor[]>(),
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

export function useCurrentFilter(key = "GLOBAL") {
  const { savedFilters, setCurrentFilter: setCurrentFilterProp } =
    useContext(FilterContext);

  const setCurrentFilter = useCallback(
    (filter: string | FilterContainerFilter) => {
      setCurrentFilterProp(key, filter);
    },
    [key, setCurrentFilterProp],
  );
  const currentFilter = getCurrentFilter(key, savedFilters);
  return { currentFilter, setCurrentFilter };
}

interface SavedFilterHookProps {
  availableColumns?: ColumnDescriptor[];
}

export function useSavedFilters(key = "GLOBAL", props?: SavedFilterHookProps) {
  const { onFilterMenuAction, savedFilters, saveFilter, setCurrentFilter } =
    useContext(FilterContext);

  const handleFilterMenuAction = useCallback(
    (filterId: string, filterAction: FilterAction) => {
      onFilterMenuAction?.(
        key,
        filterId,
        filterAction,
        props?.availableColumns,
      );
    },
    [key, onFilterMenuAction, props?.availableColumns],
  );

  const handleSaveFilter = useCallback(
    (name: string) => {
      saveFilter(key, name);
    },
    [key, saveFilter],
  );

  const handleSetCurrentFilter = useCallback(
    (filter: string | FilterContainerFilter) => {
      setCurrentFilter(key, filter);
    },
    [key, setCurrentFilter],
  );

  return {
    currentFilter: getCurrentFilter(key, savedFilters),
    onFilterMenuAction: handleFilterMenuAction,
    savedFilters: savedFilters?.get(key),
    saveFilter: handleSaveFilter,
    setCurrentFilter: handleSetCurrentFilter,
  };
}
