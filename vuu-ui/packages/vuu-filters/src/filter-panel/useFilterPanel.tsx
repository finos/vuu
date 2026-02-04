import { ReactElement, useCallback, useState } from "react";
import { FilterContainerProps } from "../filter-container/FilterContainer";
import {
  EMPTY_FILTER,
  NULL_FILTER,
  useSavedFilters,
} from "../filter-provider/FilterContext";
import { FilterAppliedHandler } from "../filter-container/useFilterContainer";
import { FilterNamePrompt } from "../saved-filters/FilterNamePrompt";
import { FilterContainerFilter } from "@vuu-ui/vuu-filter-types";

export const useFilterPanel = ({
  filter,
  filterProviderKey,
  onFilterApplied,
  onFilterCleared,
}: Pick<
  FilterContainerProps,
  "filter" | "filterProviderKey" | "onFilterApplied" | "onFilterCleared"
>) => {
  const { saveFilter, currentFilter, setCurrentFilter, promptInputProps } =
    useSavedFilters(filterProviderKey);
  const [saveFilterPrompt, setSaveFilterPrompt] = useState<ReactElement | null>(
    null,
  );

  console.log(
    `[useFilterPanel] current filter ${JSON.stringify(currentFilter)}`,
  );

  const clearFilter = useCallback(() => {
    setCurrentFilter(NULL_FILTER);
  }, [setCurrentFilter]);

  const handleConfirm = useCallback(
    (name: string) => {
      setSaveFilterPrompt(null);
      saveFilter(name);
    },
    [saveFilter],
  );

  const handleClose = () => {
    setSaveFilterPrompt(null);
  };

  const handleSaveFilter = useCallback(() => {
    setSaveFilterPrompt(
      <FilterNamePrompt
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Save Filter"
        inputProps={promptInputProps?.filterNamePrompt}
      />,
    );
  }, [handleConfirm, promptInputProps?.filterNamePrompt]);

  const handleFilterApplied = useCallback<
    FilterAppliedHandler<FilterContainerFilter>
  >(
    (filter) => {
      setCurrentFilter?.(filter);
      onFilterApplied?.(filter);
    },
    [onFilterApplied, setCurrentFilter],
  );

  const handleFilterCleared = useCallback(() => {
    setCurrentFilter(EMPTY_FILTER);
    onFilterCleared?.();
  }, [onFilterCleared, setCurrentFilter]);

  return {
    clearFilter,
    disableClear: currentFilter.filter === null,
    disableSave: currentFilter.filter === null,
    filter: currentFilter.filter ?? filter,
    onFilterApplied: handleFilterApplied,
    onFilterCleared: handleFilterCleared,
    saveFilter: handleSaveFilter,
    saveFilterPrompt,
  };
};
