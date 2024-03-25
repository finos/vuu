import { DataSourceFilter, TableSchema } from "@finos/vuu-data-types";
import { Filter, FilterState } from "@finos/vuu-filter-types";
import { PopupComponent as Popup, Portal, Prompt } from "@finos/vuu-popups";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { IconButton } from "@finos/vuu-ui-controls";
import cx from "clsx";
import { HTMLAttributes, ReactElement, useRef } from "react";
import { FilterClauseProps } from "../filter-clause";
import { FilterEditor } from "../filter-editor";
import { FilterPill } from "../filter-pill";
import { FilterBarMenu } from "./FilterBarMenu";
import { useFilterBar } from "./useFilterBar";

import "./FilterBar.css";
import { FilterModel } from "../FilterModel";

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
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    activeFilterIndex,
    addButtonProps,
    columnsByName,
    filters,
    interactedFilterState,
    onCancelEdit,
    onSave,
    pillProps,
    promptProps,
  } = useFilterBar({
    containerRef: rootRef,
    columnDescriptors,
    defaultFilterState,
    filterState,
    onApplyFilter,
    onFilterStateChanged,
    onFilterDeleted,
    onFilterRenamed,
  });

  const className = cx(classBase, classNameProp);

  const indexOfFilterBeingRenamed =
    interactedFilterState?.state === "rename"
      ? interactedFilterState.index
      : -1;

  const filterModel =
    interactedFilterState?.state === "edit" ||
    interactedFilterState?.state === "create"
      ? new FilterModel(interactedFilterState.filter)
      : undefined;

  const getChildren = () => {
    const items: ReactElement[] = [];
    filters.forEach((filter, i) => {
      items.push(
        <FilterPill
          {...pillProps}
          editing={indexOfFilterBeingRenamed === i}
          columnsByName={columnsByName}
          data-index={i}
          filter={filter}
          key={`filter-${i}`}
          selected={activeFilterIndex.includes(i)}
        />
      );
    });
    return items;
  };

  return (
    <div {...htmlAttributes} className={className} ref={rootRef}>
      <FilterBarMenu />
      <>
        <div className={`${classBase}-filters`}>{getChildren()}</div>
        <IconButton
          {...addButtonProps}
          className={cx("vuuIconButton", `${classBase}-add`)}
          data-selectable={false}
          icon="plus"
          key="filter-add"
          tabIndex={0}
          variant="primary"
        />
      </>

      {filterModel && tableSchema && (
        <Portal>
          <Popup
            anchorElement={rootRef}
            offsetTop={-10}
            offsetLeft={20}
            placement="below"
          >
            <FilterEditor
              FilterClauseEditorProps={FilterClauseEditorProps}
              columnDescriptors={columnDescriptors}
              key="filter-editor"
              onCancel={onCancelEdit}
              onSave={onSave}
              filter={interactedFilterState?.filter}
              tableSchema={tableSchema}
            />
          </Popup>
        </Portal>
      )}

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
