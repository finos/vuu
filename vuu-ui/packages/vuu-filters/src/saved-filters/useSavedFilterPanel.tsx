import { SyntheticEvent, useCallback } from "react";
import { useSavedFilters } from "../filter-provider/FilterContext";

export type FilterClickHandler = (filterId: string) => void;

export const useSavedFilterPanel = () => {
  const {
    savedFilters = [],
    setCurrentFilter,
    onFilterMenuAction,
  } = useSavedFilters();

  const handleClickFilter = useCallback(
    (e: SyntheticEvent) => {
      const { id } = e.target as HTMLElement;
      setCurrentFilter(id);
    },
    [setCurrentFilter],
  );

  return {
    onClickFilter: handleClickFilter,
    onFilterMenuAction,
    savedFilters,
  };
};
