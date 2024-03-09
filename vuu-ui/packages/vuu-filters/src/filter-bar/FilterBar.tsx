import { DataSourceFilter, TableSchema } from "@finos/vuu-data-types";
import { Filter, FilterState } from "@finos/vuu-filter-types";
import { Prompt } from "@finos/vuu-popups";
import { Toolbar } from "@finos/vuu-ui-controls";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { Button } from "@salt-ds/core";
import cx from "clsx";
import { HTMLAttributes, ReactElement, useRef } from "react";
import { FilterBuilderMenu } from "../filter-builder-menu";
import { FilterClauseEditor, FilterClauseEditorProps } from "../filter-clause";
import { FilterPill } from "../filter-pill";
import { filterClauses as getFilterClauses } from "../filter-utils";
import { FilterBarMenu } from "./FilterBarMenu";
import { useFilterBar } from "./useFilterBar";

import "./FilterBar.css";

export interface FilterBarProps extends HTMLAttributes<HTMLDivElement> {
  FilterClauseEditorProps?: Partial<FilterClauseEditorProps>;
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
  showMenu?: boolean;
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
  showMenu: showMenuProp = false,
  tableSchema,
  ...htmlAttributes
}: FilterBarProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    activeFilterIndex,
    addButtonProps,
    columnsByName,
    editFilter,
    filters,
    onBlurFilterClause,
    onCancelFilterClause,
    onClickAddFilter,
    onClickRemoveFilter,
    onChangeFilterClause,
    onChangeActiveFilterIndex,
    onFocusFilterClause,
    onNavigateOutOfBounds,
    onKeyDownFilterbar,
    onKeyDownMenu,
    onMenuAction,
    pillProps,
    promptProps,
    showMenu,
  } = useFilterBar({
    containerRef: rootRef,
    columnDescriptors,
    defaultFilterState,
    filterState,
    onApplyFilter,
    onFilterStateChanged,
    onFilterDeleted,
    onFilterRenamed,
    showMenu: showMenuProp,
  });

  const className = cx(classBase, classNameProp, {
    [`${classBase}-display`]: editFilter === undefined,
    [`${classBase}-edit`]: editFilter !== undefined,
  });

  const getChildren = () => {
    const items: ReactElement[] = [];
    if (editFilter === undefined) {
      filters.forEach((filter, i) => {
        items.push(
          <FilterPill
            {...pillProps}
            columnsByName={columnsByName}
            filter={filter}
            key={`filter-${i}`}
          />
        );
      });
      return items;
    } else if (editFilter) {
      const filterClauses = getFilterClauses(editFilter);
      items.push(
        <div className={`${classBase}-Editor`} key={`editor`}>
          {filterClauses.map((f, i) => (
            <FilterClauseEditor
              {...FilterClauseEditorProps}
              columnsByName={columnsByName}
              filterClause={f}
              key={`editor-${i}`}
              onCancel={onCancelFilterClause}
              onChange={onChangeFilterClause(i)}
              onBlur={onBlurFilterClause}
              onFocus={onFocusFilterClause}
              tableSchema={tableSchema}
            />
          ))}
        </div>
      );
      if (showMenu) {
        items.push(
          <FilterBuilderMenu
            key="menu"
            onMenuAction={onMenuAction}
            ListProps={{ onKeyDownCapture: onKeyDownMenu }}
          />
        );
      }
      items.push(
        <Button
          className={`${classBase}-remove`}
          data-align="right"
          data-icon="cross"
          key="filter-remove"
          onClick={onClickRemoveFilter}
          variant="primary"
        />
      );

      return items;
    }
  };

  return (
    <div
      {...htmlAttributes}
      className={className}
      onKeyDown={onKeyDownFilterbar}
      ref={rootRef}
    >
      <FilterBarMenu />
      <Toolbar
        activeItemIndex={activeFilterIndex}
        onActiveChange={onChangeActiveFilterIndex}
        onNavigateOutOfBounds={onNavigateOutOfBounds}
        selectionStrategy="multiple-special-key"
      >
        {getChildren()}
      </Toolbar>
      {editFilter === undefined ? (
        <Button
          {...addButtonProps}
          className={`${classBase}-add`}
          data-icon="plus"
          data-selectable={false}
          key="filter-add"
          onClick={onClickAddFilter}
          tabIndex={0}
          variant="primary"
        />
      ) : null}

      {promptProps ? (
        <Prompt
          {...promptProps}
          PopupProps={{
            anchorElement: rootRef,
            offsetTop: 16,
            placement: "below-center",
          }}
        />
      ) : null}
    </div>
  );
};
