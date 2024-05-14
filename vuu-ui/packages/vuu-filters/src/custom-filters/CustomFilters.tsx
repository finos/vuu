import { Prompt } from "@finos/vuu-popups";
import type { ColumnDescriptor } from "@finos/vuu-table-types";
import { IconButton } from "@finos/vuu-ui-controls";
import { HTMLAttributes, ReactElement, useRef } from "react";
import { type FilterBarProps } from "../filter-bar";
import { FilterEditor } from "../filter-editor";
import { FilterPill } from "../filter-pill";
import { FilterModel } from "../FilterModel";
import { isEditFilterState, useCustomFilters } from "./useCustomFilters";

const classBase = "vuuCustomFilters";

export interface CustomFilterProps
  extends HTMLAttributes<HTMLDivElement>,
    Pick<
      FilterBarProps,
      | "FilterClauseEditorProps"
      | "defaultFilterState"
      | "filterState"
      | "onApplyFilter"
      | "onFilterDeleted"
      | "onFilterRenamed"
      | "onFilterStateChanged"
      | "tableSchema"
    > {
  columnDescriptors: ColumnDescriptor[];
}

export const CustomFilters = ({
  FilterClauseEditorProps,
  columnDescriptors,
  defaultFilterState,
  filterState,
  onApplyFilter,
  onFilterDeleted,
  onFilterRenamed,
  onFilterStateChanged,
  tableSchema,
}: CustomFilterProps) => {
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
  } = useCustomFilters({
    containerRef: rootRef,
    columnDescriptors,
    defaultFilterState,
    filterState,
    onApplyFilter,
    onFilterStateChanged,
    onFilterDeleted,
    onFilterRenamed,
  });

  const indexOfFilterBeingRenamed =
    interactedFilterState?.state === "rename"
      ? interactedFilterState.index
      : -1;

  const filterModel = isEditFilterState(interactedFilterState?.state)
    ? new FilterModel(interactedFilterState.filter)
    : undefined;

  const getFilterPills = () => {
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
    <>
      <div className="vuuCustomFilters" ref={rootRef}>
        <div className={`${classBase}-filters`}>{getFilterPills()}</div>
        <IconButton
          {...addButtonProps}
          aria-label="Add filter"
          data-selectable={false}
          icon="plus"
          key="filter-add"
          tabIndex={0}
          variant="primary"
        />

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
      {filterModel && tableSchema && (
        <FilterEditor
          FilterClauseEditorProps={FilterClauseEditorProps}
          columnDescriptors={columnDescriptors}
          key="filter-editor"
          onCancel={onCancelEdit}
          onSave={onSave}
          filter={interactedFilterState?.filter}
          tableSchema={tableSchema}
        />
      )}
    </>
  );
};
