import { Filter } from "@vuu-ui/vuu-filter-types";
import { SyntheticEvent, useCallback } from "react";
import { useSavedFilters } from "../filter-provider/FilterProvider";

export type FilterClickHandler = (filterId: string) => void;

export type FilterDescriptor = {
  active: boolean;
  id: string;
  filter: Filter;
};

export const useSavedFilterPanel = () => {
  const {
    savedFilters = [],
    setActiveFilter,
    onFilterMenuAction,
  } = useSavedFilters();

  const handleClickFilter = useCallback(
    (e: SyntheticEvent) => {
      const { id } = e.target as HTMLElement;
      setActiveFilter(id);
    },
    [setActiveFilter],
  );

  return {
    onClickFilter: handleClickFilter,
    onFilterMenuAction,
    savedFilters,
  };
};
