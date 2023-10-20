import { TableSchema } from "@finos/vuu-data";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { Filter } from "@finos/vuu-filter-types";
import { Toolbar } from "@finos/vuu-layout";
import { Prompt } from "@finos/vuu-popups";
import { Button } from "@salt-ds/core";
import cx from "classnames";
import { HTMLAttributes, ReactElement, useRef } from "react";
import { FilterBuilderMenu } from "../filter-builder-menu";
import { FilterClauseEditor, FilterClauseEditorProps } from "../filter-clause";
import { FilterPill } from "../filter-pill";
import { filterClauses as getFilterClauses } from "../filter-utils";
import { useFilterBar } from "./useFilterBar";

import "./FilterBar.css";

export interface FilterBarProps extends HTMLAttributes<HTMLDivElement> {
  FilterClauseEditorProps?: Partial<FilterClauseEditorProps>;
  activeFilterIndex?: number[];
  filters: Filter[];
  onApplyFilter: (filter: DataSourceFilter) => void;
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
    onClickAddFilter,
    onClickRemoveFilter,
    onChangeFilterClause,
    onChangeActiveFilterIndex,
    onNavigateOutOfBounds,
    onKeyDown,
    onMenuAction,
    pillProps,
    promptProps,
    showMenu,
  } = useFilterBar({
    activeFilterIndex: activeFilterIndexProp,
    containerRef: rootRef,
    filters: filtersProp,
    onApplyFilter,
    onFiltersChanged,
    showMenu: showMenuProp,
  });

  const className = cx(classBase, classNameProp, {
    [`${classBase}-display`]: editFilter === undefined,
    [`${classBase}-edit`]: editFilter !== undefined,
  });

  const onClose = () => console.log("Closing filter component");

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
            onChange={onChangeFilterClause}
            onClose={onClose}
            tableSchema={tableSchema}
          />
        );
      });
      if (showMenu) {
        items.push(
          <FilterBuilderMenu key="menu" onMenuAction={onMenuAction} />
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
      onKeyDown={onKeyDown}
      ref={rootRef}
    >
      <span className={`${classBase}-icon`} data-icon="tune" />
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
