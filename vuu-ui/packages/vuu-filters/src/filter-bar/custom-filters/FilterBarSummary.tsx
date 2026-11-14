import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ColumnDescriptorsByName, Filter } from "@vuu-ui/vuu-filter-types";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
import { isBetweenFilter, isMultiClauseFilter } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
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
  onToggleFilterActive: (
    index: number,
    preserveRemainingFilters: boolean,
  ) => void;
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
  onToggleFilterActive,
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
        0,
      ),
    [activeFilterIndex, filters],
  );

  const getLabel = getFilterLabel(columnsByName);
  const getClauseText = getFilterAsFormattedText(columnsByName);

  const ariaLabel =
    clauseCount === 0
      ? "No filters applied"
      : `${clauseCount} filter clause${clauseCount === 1 ? "" : "s"} applied`;

  return (
    <FilterSummaryButton
      appearance="transparent"
      aria-label={ariaLabel}
      className={classBase}
      clauseCount={clauseCount}
      icon="sliders"
      onClear={onClearActiveFilters}
      placement="bottom"
      // with nothing applied there is nothing to show, so no tab stop
      tabIndex={clauseCount > 0 ? 0 : -1}
    >
      <div className={`${classBase}-filters`}>
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
