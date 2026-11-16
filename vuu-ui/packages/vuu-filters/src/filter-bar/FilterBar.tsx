import { Filter, FilterHandler, FilterState } from "@vuu-ui/vuu-filter-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, useCallback, useState } from "react";
import { CustomFilters } from "./custom-filters";
import { QuickFilterProps, QuickFilters } from "./quick-filters";
import { FilterMode, useFilterBar } from "./useFilterBar";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";

import filterBarCss from "./FilterBar.css";

export type FilterBarVariant =
  | "custom-filters-only"
  | "quick-filters-only"
  | "full-filters";

export interface FilterBarProps extends HTMLAttributes<HTMLDivElement> {
  QuickFilterProps?: Pick<
    QuickFilterProps,
    | "allowAddColumn"
    | "allowFind"
    | "defaultQuickFilterColumns"
    | "onChangeQuickFilterColumns"
    | "quickFilterColumns"
    | "showFind"
  >;
  /**
   * Used to ensure we present filter editors appropriate to the data type of column.
   * NOTE: Always make sure that these are passed with proper re-render optimization (i.e make
   * sure its a stable reference, in React terminology), otherwise might end up with infinite
   * state updates.
   */
  columnDescriptors: readonly ColumnDescriptor[];
  defaultFilterMode?: FilterMode;
  defaultFilterState?: FilterState;
  filterMode?: FilterMode;
  filterState?: FilterState;
  onApplyFilter: FilterHandler;
  onChangeFilterMode?: (filterMode: FilterMode) => void;
  onClearFilter: () => void;
  onFilterDeleted?: FilterHandler;
  onFilterRenamed?: (filter: Filter, name: string) => void;
  onFilterStateChanged?: (state: FilterState) => void;
  /**
   * Defines table used in call to Vuu Typeahead service
   */
  vuuTable?: VuuTable;
  variant?: FilterBarVariant;
}

const classBase = "vuuFilterBar";

export const FilterBar = ({
  QuickFilterProps,
  className: classNameProp,
  columnDescriptors,
  defaultFilterMode,
  defaultFilterState,
  filterMode: filterModeProp,
  filterState,
  onApplyFilter,
  onChangeFilterMode: onChangeFilterModeProp,
  onClearFilter,
  onFilterDeleted,
  onFilterRenamed,
  onFilterStateChanged,
  vuuTable,
  variant = "custom-filters-only",
  ...htmlAttributes
}: FilterBarProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-bar",
    css: filterBarCss,
    window: targetWindow,
  });

  const allowCustomFilters = variant !== "quick-filters-only";
  const allowQuickFilters = variant !== "custom-filters-only";

  const controlledFilterMode: FilterMode | undefined = !allowCustomFilters
    ? "quick-filter"
    : !allowQuickFilters
      ? "custom-filter"
      : filterModeProp;

  const {
    applyCustomFilter,
    applyQuickFilter,
    clearCustomFilter,
    filterMode,
    quickFilter,
    quickFilterCount,
    toggleFilterMode,
  } = useFilterBar({
    defaultFilterMode,
    filterMode: controlledFilterMode,
    onApplyFilter,
    onChangeFilterMode: onChangeFilterModeProp,
    onClearFilter,
  });

  // clearing quick filters from the summary starts them afresh
  const [quickFiltersKey, setQuickFiltersKey] = useState(0);
  const clearQuickFilter = useCallback(() => {
    setQuickFiltersKey((key) => key + 1);
    applyQuickFilter(undefined, 0);
  }, [applyQuickFilter]);

  const quickFiltersShown = filterMode === "quick-filter";
  const className = cx(classBase, classNameProp);

  // Both stay mounted while hidden, so neither loses its state, and the
  // filters of both apply.
  return (
    <div
      {...htmlAttributes}
      className={cx(className, `${classBase}-${filterMode}-mode`)}
    >
      {allowCustomFilters ? (
        <CustomFilters
          columnDescriptors={columnDescriptors}
          defaultFilterState={defaultFilterState}
          filterState={filterState}
          onApplyFilter={applyCustomFilter}
          onClearFilter={clearCustomFilter}
          onClearQuickFilter={allowQuickFilters ? clearQuickFilter : undefined}
          onFilterDeleted={onFilterDeleted}
          onFilterRenamed={onFilterRenamed}
          onFilterStateChanged={onFilterStateChanged}
          onToggleQuickFilters={
            allowQuickFilters ? toggleFilterMode : undefined
          }
          quickFilter={quickFilter}
          quickFilterCount={quickFilterCount}
          quickFiltersShown={quickFiltersShown}
          showFilterSummary
          vuuTable={vuuTable}
        />
      ) : null}
      {allowQuickFilters ? (
        <QuickFilters
          {...QuickFilterProps}
          availableColumns={columnDescriptors}
          hidden={!quickFiltersShown}
          key={quickFiltersKey}
          onQuickFilterChange={applyQuickFilter}
          vuuTable={vuuTable}
        />
      ) : null}
    </div>
  );
};
