import {
  FilterChangeHandler,
  FilterContainerFilter,
  FilterContainerFilterDescriptor,
} from "@vuu-ui/vuu-filter-types";
import { FilterMenuActionHandler } from "../filter-pill/FilterMenu";
import { createContext, useContext } from "react";

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
