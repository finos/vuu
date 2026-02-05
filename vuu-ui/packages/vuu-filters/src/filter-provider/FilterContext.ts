import {
  FilterContainerFilter,
  FilterContainerFilterDescriptor,
  FilterContainerFilterDescriptorWithFilter,
} from "@vuu-ui/vuu-filter-types";
import { FilterAction } from "../filter-pill/FilterMenu";
import { createContext, useCallback, useContext } from "react";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";

export const filterDescriptorHasFilter = (
  f: FilterContainerFilterDescriptor,
): f is FilterContainerFilterDescriptorWithFilter =>
  !isEmptyFilter(f) && !isNullFilter(f);

const isSavedFilter = (
  f: FilterContainerFilterDescriptor,
): f is FilterContainerFilterDescriptorWithFilter =>
  f.id !== UNSAVED_FILTER && f.id !== NULL_FILTER && f.id !== EMPTY_FILTER;

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

export type PromptInputProps = {
  filterNameMaxLength: number;
};

export interface FilterContextProps {
  deleteFilter: (key: string, filterId: string) => void;
  saveFilter: (key: string, name: string) => void;
  filterDescriptors: Map<string, FilterContainerFilterDescriptor[]>;
  onFilterMenuAction?: FilterContextFilterMenuActionHandler;
  clearCurrentFilter: (key: string) => void;
  setCurrentFilter: (
    key: string,
    filter: string | FilterContainerFilter,
  ) => void;
  promptInputProps?: PromptInputProps;
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
  filterDescriptors: new Map<string, FilterContainerFilterDescriptor[]>(),
  deleteFilter: () =>
    console.warn(
      "[FilterContext] deleteFilter, no FilterProvider has been configured",
    ),
  saveFilter: () =>
    console.warn(
      "[FilterContext] saveFilter, no FilterProvider has been configured",
    ),
  clearCurrentFilter: () =>
    console.warn(
      "[FilterContext] clearFilter, no FilterProvider has been configured",
    ),
  setCurrentFilter: () =>
    console.warn(
      "[FilterContext] setCurrentFilter, no FilterProvider has been configured",
    ),
});

interface SavedFilterHookProps {
  availableColumns?: ColumnDescriptor[];
}

export function useSavedFilters(key = "GLOBAL", props?: SavedFilterHookProps) {
  const {
    onFilterMenuAction,
    filterDescriptors,
    saveFilter,
    setCurrentFilter,
    promptInputProps,
  } = useContext(FilterContext);

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

  /**
   * Set the current filter, using the filterProviderKey specified
   * in hook call. Alternatively, a localKey can be provided in this
   * call to override the key above. This can be useful where
   * setCurrentFilter is called from a hook where the key is not in
   * scope at the point where  useSavedFilters is called.
   */
  const handleSetCurrentFilter = useCallback(
    (filter: string | FilterContainerFilter, localKey = key) => {
      setCurrentFilter(localKey, filter);
    },
    [key, setCurrentFilter],
  );

  const handleClearCurrentFilter = useCallback(
    (localKey = key) => {
      setCurrentFilter(localKey, NULL_FILTER);
    },
    [key, setCurrentFilter],
  );

  return {
    currentFilter: getCurrentFilter(key, filterDescriptors),
    onFilterMenuAction: handleFilterMenuAction,
    savedFilters: filterDescriptors?.get(key)?.filter(isSavedFilter),
    saveFilter: handleSaveFilter,
    clearCurrentFilter: handleClearCurrentFilter,
    setCurrentFilter: handleSetCurrentFilter,
    promptInputProps,
  };
}
