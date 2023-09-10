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
  onAddFilter?: (filter: Filter) => void;
  onApplyFilter: (filter: DataSourceFilter) => void;
  onChangeFilter?: (filter: Filter, newFilter: Filter) => void;
  onDeleteFilter?: (filter: Filter) => void;
  onRemoveFilter?: (filter: Filter) => void;
  showMenu?: boolean;
  tableSchema: TableSchema;
}

const classBase = "vuuFilterBar";

export const FilterBar = ({
  FilterClauseEditorProps,
  className: classNameProp,
  filters: filtersProp,
  onApplyFilter,
  onChangeFilter,
  showMenu: showMenuProp = false,
  tableSchema,
  ...htmlAttributes
}: FilterBarProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    activeFilterIndices,
    editFilter,
    filters,
    onAddFilter,
    onRemoveFilter,
    onChangeFilterClause,
    onFilterActivation,
    onKeyDown,
    onMenuAction,
    pillProps,
    promptProps,
    showMenu,
  } = useFilterBar({
    containerRef: rootRef,
    filters: filtersProp,
    onApplyFilter,
    onChangeFilter,
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
      items.push(
        <Button
          className={`${classBase}-add`}
          data-icon="plus"
          data-selectable={false}
          key="filter-add"
          onClick={onAddFilter}
          variant="primary"
        />
      );
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
          onClick={onRemoveFilter}
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
        activeItemIndex={activeFilterIndices}
        height={26}
        onActiveChange={onFilterActivation}
        selectionStrategy="multiple-special-key"
      >
        {getChildren()}
      </Toolbar>
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
