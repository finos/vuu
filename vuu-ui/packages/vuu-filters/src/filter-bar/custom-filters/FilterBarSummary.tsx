import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ColumnDescriptorsByName, Filter } from "@vuu-ui/vuu-filter-types";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
import { isBetweenFilter, isMultiClauseFilter } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo } from "react";
import { getFilterAsFormattedText } from "../../filter-pill/getFilterTooltipText";
import { FilterSummaryButton } from "../../filter-toggle-button/FilterSummaryButton";
import { filterAsReactNode } from "../filter-pill/filterAsReactNode";
import { getFilterLabel } from "../filter-pill/getFilterLabel";

import filterBarSummaryCss from "./FilterBarSummary.css";

const classBase = "vuuFilterBarSummary";

export const countClauses = (filter: Filter): number =>
  isBetweenFilter(filter)
    ? 1
    : isMultiClauseFilter(filter)
      ? filter.filters.reduce((count, f) => count + countClauses(f), 0)
      : 1;

export interface FilterBarSummaryProps {
  activeFilterIndex: number[];
  columnsByName: ColumnDescriptorsByName;
  filters: Filter[];
  onClearActiveFilters: () => void;
  /**
   * Clears the quick filters, from the quick filter group of the summary.
   */
  onClearQuickFilter?: () => void;
  onToggleFilterActive: (
    index: number,
    preserveRemainingFilters: boolean,
  ) => void;
  /**
   * When provided, the button is a toggle that switches the FilterBar
   * between saved filters and quick filters.
   */
  onToggleQuickFilters?: () => void;
  /**
   * The filter applied by the quick filters, listed as its own group.
   */
  quickFilter?: Filter;
  /**
   * How many quick filter controls are set. A search is one, though its
   * filter has a clause per column searched.
   */
  quickFilterCount?: number;
  /**
   * Whether quick filters are shown, the pressed state of the toggle.
   */
  quickFiltersShown?: boolean;
}

/**
 * The FilterBar start icon. A badge counts the clauses of the active filters,
 * hovering lists each active filter, which can be deactivated from there.
 */
export const FilterBarSummary = ({
  activeFilterIndex,
  columnsByName,
  filters,
  onClearActiveFilters,
  onClearQuickFilter,
  onToggleFilterActive,
  onToggleQuickFilters,
  quickFilter,
  quickFilterCount = 0,
  quickFiltersShown = false,
}: FilterBarSummaryProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-bar-summary",
    css: filterBarSummaryCss,
    window: targetWindow,
  });

  const clauseCount = useMemo(
    () =>
      activeFilterIndex.reduce(
        (count, i) => count + (filters[i] ? countClauses(filters[i]) : 0),
        quickFilterCount,
      ),
    [activeFilterIndex, filters, quickFilterCount],
  );

  const handleClear = useCallback(() => {
    onClearActiveFilters();
    onClearQuickFilter?.();
  }, [onClearActiveFilters, onClearQuickFilter]);

  const getLabel = getFilterLabel(columnsByName);
  const getClauseText = getFilterAsFormattedText(columnsByName);

  const clauseText =
    clauseCount === 0
      ? "No filters applied"
      : `${clauseCount} filter clause${clauseCount === 1 ? "" : "s"} applied`;
  const isToggle = onToggleQuickFilters !== undefined;
  const ariaLabel = isToggle ? `Quick filters, ${clauseText}` : clauseText;

  return (
    <FilterSummaryButton
      appearance="transparent"
      aria-label={ariaLabel}
      aria-pressed={isToggle ? quickFiltersShown : undefined}
      className={classBase}
      clauseCount={clauseCount}
      icon="sliders"
      onClear={handleClear}
      onClick={onToggleQuickFilters}
      placement="bottom"
      // as a toggle it is always a tab stop, otherwise with nothing applied
      // there is nothing to show
      tabIndex={isToggle || clauseCount > 0 ? 0 : -1}
    >
      <div className={`${classBase}-filters`}>
        {quickFilter ? (
          <div className={`${classBase}-filter`}>
            <div className={`${classBase}-filterName`}>
              <span>Quick filters</span>
              {onClearQuickFilter ? (
                <IconButton
                  appearance="transparent"
                  aria-label="Clear quick filters"
                  data-embedded
                  icon="close"
                  onClick={onClearQuickFilter}
                  sentiment="neutral"
                  size={10}
                />
              ) : null}
            </div>
            <div className={`${classBase}-filterClauses`}>
              {filterAsReactNode(quickFilter, getClauseText)}
            </div>
          </div>
        ) : null}
        {activeFilterIndex.map((i) => {
          const filter = filters[i];
          if (filter === undefined) {
            return null;
          }
          const name = filter.name ?? getLabel(filter);
          return (
            <div className={`${classBase}-filter`} key={i}>
              <div className={`${classBase}-filterName`}>
                <span>{name}</span>
                <IconButton
                  appearance="transparent"
                  aria-label={`Deactivate ${name}`}
                  data-embedded
                  icon="close"
                  onClick={() => onToggleFilterActive(i, true)}
                  sentiment="neutral"
                  size={10}
                />
              </div>
              <div className={`${classBase}-filterClauses`}>
                {filterAsReactNode(filter, getClauseText)}
              </div>
            </div>
          );
        })}
      </div>
    </FilterSummaryButton>
  );
};
