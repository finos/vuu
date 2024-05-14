import { DataSourceFilter, TableSchema } from "@finos/vuu-data-types";
import { Filter, FilterState } from "@finos/vuu-filter-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { Icon } from "@finos/vuu-ui-controls";
import { ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes } from "react";
import { CustomFilters } from "../custom-filters";
import { FilterClauseProps } from "../filter-clause";
import { QuickFilters } from "../quick-filters";
import { useFilterBar } from "./useFilterBar";

import filterBarCss from "./FilterBar.css";

export interface FilterBarProps extends HTMLAttributes<HTMLDivElement> {
  FilterClauseEditorProps?: Partial<FilterClauseProps>;
  /**
   * This is used to apply tailored filters based on column types and other attributes.
   * NOTE: Always make sure that these are passed with proper re-render optimization, otherwise,
   *       might end up with infinite state updates.
   */
  columnDescriptors: ColumnDescriptor[];
  defaultFilterState?: FilterState;
  filterState?: FilterState;
  onApplyFilter: (filter: DataSourceFilter) => void;
  onFilterDeleted?: (filter: Filter) => void;
  onFilterRenamed?: (filter: Filter, name: string) => void;
  onFilterStateChanged?: (state: FilterState) => void;
  tableSchema?: TableSchema;
}

const classBase = "vuuFilterBar";

export const FilterBar = ({
  FilterClauseEditorProps,
  className: classNameProp,
  columnDescriptors,
  defaultFilterState,
  filterState,
  onApplyFilter,
  onFilterDeleted,
  onFilterRenamed,
  onFilterStateChanged,
  tableSchema,
  ...htmlAttributes
}: FilterBarProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-bar",
    css: filterBarCss,
    window: targetWindow,
  });

  const { filterMode, onChangeFilterMode } = useFilterBar();

  const className = cx(classBase, classNameProp);

  return (
    <div
      {...htmlAttributes}
      className={cx(className, `${classBase}-${filterMode}`)}
    >
      <ToggleButtonGroup onChange={onChangeFilterMode} value={filterMode}>
        <ToggleButton
          className="vuuIconToggleButton"
          value="custom-filter"
          aria-label="Custom filters"
          tabIndex={-1}
        >
          <Icon name="grid" size={24} />
        </ToggleButton>
        <ToggleButton
          className="vuuIconToggleButton"
          value="quick-filter"
          aria-label="Quick filters"
          tabIndex={-1}
        >
          <Icon name="tune" size={24} />
        </ToggleButton>
      </ToggleButtonGroup>

      {filterMode === "custom-filter" ? (
        <CustomFilters
          FilterClauseEditorProps={FilterClauseEditorProps}
          columnDescriptors={columnDescriptors}
          defaultFilterState={defaultFilterState}
          filterState={filterState}
          onApplyFilter={onApplyFilter}
          onFilterDeleted={onFilterDeleted}
          onFilterRenamed={onFilterRenamed}
          onFilterStateChanged={onFilterStateChanged}
          tableSchema={tableSchema}
        />
      ) : (
        <QuickFilters columns={[]} />
      )}
    </div>
  );
};
