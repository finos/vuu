import { DataSourceFilter, TableSchema } from "@finos/vuu-data-types";
import { Filter } from "@finos/vuu-filter-types";
import { Prompt } from "@finos/vuu-popups";
import { ActiveItemChangeHandler, Toolbar } from "@finos/vuu-ui-controls";
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
  activeFilterIndex?: number[];
  filters: Filter[];
  onApplyFilter: (filter: DataSourceFilter) => void;
  onChangeActiveFilterIndex: ActiveItemChangeHandler;
  onFiltersChanged?: (filters: Filter[]) => void;
  showMenu?: boolean;
  tableSchema: TableSchema;
}

const classBase = "vuuFilterBar";

export const FilterBar = ({
  activeFilterIndex: activeFilterIndexProp = [],
  FilterClauseEditorProps,
  className: classNameProp,
  filters: filtersProp,
  onApplyFilter,
  onChangeActiveFilterIndex: onChangeActiveFilterIndexProp,
  onFiltersChanged,
  showMenu: showMenuProp = false,
  tableSchema,
  ...htmlAttributes
}: FilterBarProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    activeFilterIndex,
    addButtonProps,
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
    activeFilterIndex: activeFilterIndexProp,
    containerRef: rootRef,
    filters: filtersProp,
    onApplyFilter,
    onChangeActiveFilterIndex: onChangeActiveFilterIndexProp,
    onFiltersChanged,
    showMenu: showMenuProp,
    tableSchema,
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
          <FilterPill {...pillProps} filter={filter} key={`filter-${i}`} />
        );
      });
      return items;
    } else if (editFilter) {
      // TODO what about the relationship between these clauses,which will no longer be self-evident
      // in a flat list
      const filterClauses = getFilterClauses(editFilter);
      filterClauses.forEach((filterClause, i) => {
        items.push(
          <FilterClauseEditor
            {...FilterClauseEditorProps}
            filterClause={filterClause}
            key={`editor-${i}`}
            onCancel={onCancelFilterClause}
            onChange={onChangeFilterClause}
            onBlur={onBlurFilterClause}
            onFocus={onFocusFilterClause}
            tableSchema={tableSchema}
          />
        );
      });
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
      {/* <span className={`${classBase}-icon`} data-icon="tune" /> */}
      <Toolbar
        activeItemIndex={activeFilterIndex}
        height={28}
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
