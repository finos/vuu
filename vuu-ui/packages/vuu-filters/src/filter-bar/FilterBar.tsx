import {
  DataSourceFilter,
  SuggestionProvider,
  TableSchema,
} from "@finos/vuu-data-types";
import { Filter, FilterState } from "@finos/vuu-filter-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { Icon } from "@finos/vuu-ui-controls";
import { ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, useMemo } from "react";
import { CustomFilters } from "../custom-filters";
import { QuickFilters } from "../quick-filters";
import { FilterMode, useFilterBar } from "./useFilterBar";

import filterBarCss from "./FilterBar.css";

export type FilterBarVariant =
  | "custom-filters"
  | "quick-filters"
  | "full-filters";

export interface FilterBarProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * This is used to apply tailored filters based on column types and other attributes.
   * NOTE: Always make sure that these are passed with proper re-render optimization, otherwise,
   *       might end up with infinite state updates.
   */
  columnDescriptors: ColumnDescriptor[];
  defaultFilterMode?: FilterMode;
  defaultFilterState?: FilterState;
  filterMode?: FilterMode;
  filterState?: FilterState;
  onApplyFilter: (filter: DataSourceFilter) => void;
  onChangeFilterMode?: (filterMode: FilterMode) => void;
  onFilterDeleted?: (filter: Filter) => void;
  onFilterRenamed?: (filter: Filter, name: string) => void;
  onFilterStateChanged?: (state: FilterState) => void;
  quickFilterColumns?: string[];
  suggestionProvider?: SuggestionProvider;
  tableSchema?: TableSchema;
  variant?: FilterBarVariant;
}

const classBase = "vuuFilterBar";

export const FilterBar = ({
  className: classNameProp,
  columnDescriptors,
  defaultFilterMode,
  defaultFilterState,
  filterMode: filterModeProp,
  filterState,
  onApplyFilter,
  onChangeFilterMode: onChangeFilterModeProp,
  onFilterDeleted,
  onFilterRenamed,
  onFilterStateChanged,
  quickFilterColumns,
  suggestionProvider,
  tableSchema,
  variant = "custom-filters",
  ...htmlAttributes
}: FilterBarProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-bar",
    css: filterBarCss,
    window: targetWindow,
  });

  const allowCustomFilters = variant !== "quick-filters";
  const allowQuickFilters = variant !== "custom-filters";

  const controlledFilterMode: FilterMode | undefined = !allowCustomFilters
    ? "quick-filter"
    : !allowQuickFilters
    ? "custom-filter"
    : filterModeProp;

  const { filterMode, onChangeFilterMode } = useFilterBar({
    defaultFilterMode,
    filterMode: controlledFilterMode,
    onChangeFilterMode: onChangeFilterModeProp,
  });

  const className = cx(classBase, classNameProp);

  const startAdornment = useMemo(() => {
    if (!allowQuickFilters) {
      return <Icon name="tune" />;
    } else if (!allowCustomFilters) {
      return <Icon name="grid" />;
    } else {
      return (
        <ToggleButtonGroup
          data-variant="secondary"
          onChange={onChangeFilterMode}
          value={filterMode}
        >
          <ToggleButton
            className="vuuIconToggleButton"
            key="custom-filter"
            value="custom-filter"
            aria-label="Custom filters"
            tabIndex={-1}
          >
            <Icon name="grid" size={16} />
          </ToggleButton>
          <ToggleButton
            className="vuuIconToggleButton"
            key="quick-filter"
            value="quick-filter"
            aria-label="Quick filters"
            tabIndex={-1}
          >
            <Icon name="tune" size={16} />
          </ToggleButton>
        </ToggleButtonGroup>
      );
    }
  }, [allowCustomFilters, allowQuickFilters, filterMode, onChangeFilterMode]);

  return (
    <div
      {...htmlAttributes}
      className={cx(className, `${classBase}-${filterMode}`)}
    >
      {startAdornment}
      {filterMode === "custom-filter" ? (
        <CustomFilters
          columnDescriptors={columnDescriptors}
          defaultFilterState={defaultFilterState}
          filterState={filterState}
          onApplyFilter={onApplyFilter}
          onFilterDeleted={onFilterDeleted}
          onFilterRenamed={onFilterRenamed}
          onFilterStateChanged={onFilterStateChanged}
          suggestionProvider={suggestionProvider}
          tableSchema={tableSchema}
        />
      ) : (
        <QuickFilters
          availableColumns={columnDescriptors}
          onApplyFilter={onApplyFilter}
          quickFilterColumns={quickFilterColumns}
          suggestionProvider={suggestionProvider}
          tableSchema={tableSchema}
        />
      )}
    </div>
  );
};
