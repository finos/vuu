import { SyntheticEvent, useCallback } from "react";
import { useSavedFilters } from "../filter-provider/FilterContext";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";

export type FilterClickHandler = (filterId: string) => void;

interface SavedFilterPanelProps {
  availableColumns?: ColumnDescriptor[];
  filterProviderKey?: string;
}

export const useSavedFilterPanel = (props?: SavedFilterPanelProps) => {
  const {
    savedFilters = [],
    setCurrentFilter,
    onFilterMenuAction,
  } = useSavedFilters(props?.filterProviderKey, {
    availableColumns: props?.availableColumns,
  });

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
