import { Prompt } from "@vuu-ui/vuu-ui-controls";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
import { HTMLAttributes, ReactElement, useRef } from "react";
import { type FilterBarProps } from "../FilterBar";
import { FilterEditor } from "../filter-editor";
import { FilterPill } from "../filter-pill";
import { isEditableFilter } from "../FilterModel";
import { FilterBarSummary } from "./FilterBarSummary";
import { isEditFilterState, useCustomFilters } from "./useCustomFilters";

const classBase = "vuuCustomFilters";

export interface CustomFilterProps
  extends HTMLAttributes<HTMLDivElement>,
    Pick<
      FilterBarProps,
      | "defaultFilterState"
      | "filterState"
      | "onApplyFilter"
      | "onClearFilter"
      | "onFilterDeleted"
      | "onFilterRenamed"
      | "onFilterStateChanged"
      | "vuuTable"
    > {
  columnDescriptors: readonly ColumnDescriptor[];
  /**
   * Render the filter icon, with a badge and hover summary of active filters.
   */
  showFilterSummary?: boolean;
}

export const CustomFilters = ({
  columnDescriptors,
  defaultFilterState,
  filterState,
  onApplyFilter,
  onClearFilter,
  onFilterDeleted,
  onFilterRenamed,
  onFilterStateChanged,
  showFilterSummary = false,
  vuuTable,
}: CustomFilterProps) => {
  const rootRef = useRef<HTMLDivElement>(null);

  const {
    activeFilterIndex,
    addButtonProps,
    columnsByName,
    filters,
    interactedFilterState,
    onCancelEdit,
    onClearActiveFilters,
    onSave,
    onToggleFilterActive,
    FilterPillProps,
    promptProps,
  } = useCustomFilters({
    containerRef: rootRef,
    columnDescriptors,
    defaultFilterState,
    filterState,
    onApplyFilter,
    onClearFilter,
    onFilterStateChanged,
    onFilterDeleted,
    onFilterRenamed,
  });

  const indexOfFilterBeingRenamed =
    interactedFilterState?.state === "rename"
      ? interactedFilterState.index
      : -1;

  const editState = interactedFilterState?.state;
  const isEditing = isEditFilterState(editState);
  const indexOfFilterBeingEdited =
    editState === "edit" ? (interactedFilterState?.index ?? -1) : -1;

  const filterEditor = isEditing ? (
    <FilterEditor
      columnDescriptors={columnDescriptors}
      key="filter-editor"
      onCancel={onCancelEdit}
      onSave={onSave}
      filter={interactedFilterState?.filter}
      vuuTable={vuuTable}
    />
  ) : null;

  // The editor takes the place of the pill being edited, a new filter is
  // edited at the end, in place of the Add button.
  const getFilterPills = () => {
    const items: ReactElement[] = [];
    filters.forEach((filter, i) => {
      if (i === indexOfFilterBeingEdited && filterEditor) {
        items.push(filterEditor);
      } else {
        items.push(
          <FilterPill
            {...FilterPillProps}
            allowEdit={isEditableFilter(filter)}
            editing={indexOfFilterBeingRenamed === i}
            columnsByName={columnsByName}
            data-index={i}
            filter={filter}
            key={`filter-${i}`}
            selected={activeFilterIndex.includes(i)}
          />,
        );
      }
    });
    if (editState === "create" && filterEditor) {
      items.push(filterEditor);
    }
    return items;
  };

  return (
    <div className={classBase} ref={rootRef}>
      {showFilterSummary ? (
        <FilterBarSummary
          activeFilterIndex={activeFilterIndex}
          columnsByName={columnsByName}
          filters={filters}
          onClearActiveFilters={onClearActiveFilters}
          onToggleFilterActive={onToggleFilterActive}
        />
      ) : null}
      <div className={`${classBase}-filters`}>{getFilterPills()}</div>
      {editState === "create" ? null : (
        <IconButton
          {...addButtonProps}
          aria-label="Add filter"
          className={`${classBase}-add`}
          data-selectable={false}
          icon="plus"
          key="filter-add"
          tabIndex={0}
          variant="secondary"
        />
      )}
      {promptProps ? <Prompt {...promptProps} open /> : null}
    </div>
  );
};
