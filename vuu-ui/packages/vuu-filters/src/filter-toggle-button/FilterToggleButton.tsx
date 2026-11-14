import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { FilterContainerFilterDescriptor } from "@vuu-ui/vuu-filter-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  filtersAreEqual,
  isBetweenFilter,
  isMultiClauseFilter,
} from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FilterSummaryButton } from "./FilterSummaryButton";
import { FilterDisplay } from "../filter-display/FilterDisplay";
import { useSavedFilters } from "../filter-provider/FilterContext";

import filterToggleButtonCss from "./FilterToggleButton.css";
import { FilterAggregator } from "../FilterAggregator";

const classBase = "vuuFilterToggleButton";

export const countFilterClauses = ({
  filter,
}: FilterContainerFilterDescriptor) => {
  if (filter) {
    if (isBetweenFilter(filter)) {
      return 1;
    } else if (isMultiClauseFilter(filter)) {
      return filter.filters.length;
    } else {
      return 1;
    }
  } else {
    return 0;
  }
};

const EmptyAggregator = new FilterAggregator();

export interface FilterToggleButtonProps {
  columns: readonly ColumnDescriptor[];
  filterProviderKey?: string;
  onToggle: () => void;
}

export const FilterToggleButton = ({
  columns,
  filterProviderKey,
  onToggle,
}: FilterToggleButtonProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-toggle-button",
    css: filterToggleButtonCss,
    window: targetWindow,
  });

  const { clearCurrentFilter, currentFilter, setCurrentFilter } =
    useSavedFilters(filterProviderKey);
  const filterCount = useMemo(
    () => countFilterClauses(currentFilter),
    [currentFilter],
  );
  const [filteredColumnCount, setFilteredColumnCount] = useState(filterCount);

  const filterAggregatorRef = useRef(EmptyAggregator);

  useMemo(() => {
    if (
      !filtersAreEqual(currentFilter.filter, filterAggregatorRef.current.filter)
    ) {
      filterAggregatorRef.current = currentFilter.filter
        ? new FilterAggregator(currentFilter.filter)
        : new FilterAggregator();
    }
  }, [currentFilter]);

  useEffect(() => {
    setFilteredColumnCount(filterCount);
  }, [filterCount]);

  const handleDeleteFilterClause = useCallback(
    (columnName: string) => {
      const { current: fag } = filterAggregatorRef;
      const column = columns.find((col) => col.name === columnName);
      if (column) {
        if (filteredColumnCount === 1) {
          clearCurrentFilter?.();
        } else if (fag.remove(column) && fag.filter) {
          setCurrentFilter(fag.filter);
        }
      }
    },
    [clearCurrentFilter, columns, filteredColumnCount, setCurrentFilter],
  );

  const handleClear = useCallback(() => {
    clearCurrentFilter?.();
  }, [clearCurrentFilter]);

  return (
    <FilterSummaryButton
      className={classBase}
      clauseCount={currentFilter.filter ? filteredColumnCount : 0}
      icon="filter-slider"
      onClear={handleClear}
      onClick={onToggle}
    >
      <FilterDisplay
        allowDelete
        columns={columns}
        filter={currentFilter.filter ?? undefined}
        onDeleteFilterClause={handleDeleteFilterClause}
      />
    </FilterSummaryButton>
  );
};
