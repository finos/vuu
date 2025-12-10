import { Badge, Button } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { FilterContainerFilterDescriptor } from "@vuu-ui/vuu-filter-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { HoverOverlay, IconButton } from "@vuu-ui/vuu-ui-controls";
import {
  filtersAreEqual,
  isBetweenFilter,
  isMultiClauseFilter,
} from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  columns: ColumnDescriptor[];
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

  const filterIcon = useMemo(
    () => (
      <IconButton
        appearance="solid"
        className={classBase}
        icon="filter-slider"
        onClick={onToggle}
        sentiment="neutral"
        size={16}
      />
    ),
    [onToggle],
  );

  const [open, setOpen] = useState(false);

  const handleClear = useCallback(() => {
    clearCurrentFilter?.();
    setOpen(false);
  }, [clearCurrentFilter]);

  const handleDeleteFilterClause = useCallback(
    (columnName: string) => {
      const { current: fag } = filterAggregatorRef;
      const column = columns.find((col) => col.name === columnName);
      if (column) {
        if (filteredColumnCount === 1) {
          handleClear();
        } else if (fag.remove(column) && fag.filter) {
          setCurrentFilter(fag.filter);
        }
      }
    },
    [columns, filteredColumnCount, handleClear, setCurrentFilter],
  );

  return currentFilter.filter ? (
    <Badge value={filteredColumnCount}>
      <HoverOverlay onOpenChange={setOpen} open={open} trigger={filterIcon}>
        <div className={`${classBase}-overlay-panel`}>
          <div>{`Filters (${filteredColumnCount})`}</div>
          <FilterDisplay
            allowDelete
            columns={columns}
            filter={currentFilter.filter}
            onDeleteFilterClause={handleDeleteFilterClause}
          />
          <div>
            <Button onClick={handleClear} sentiment="neutral">
              Clear All
            </Button>
          </div>
        </div>
      </HoverOverlay>
    </Badge>
  ) : (
    filterIcon
  );
};
