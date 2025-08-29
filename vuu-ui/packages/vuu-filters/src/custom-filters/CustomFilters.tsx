import { Prompt } from "@vuu-ui/vuu-ui-controls";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
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
      | "defaultFilterState"
      | "filterState"
      | "onApplyFilter"
      | "onFilterDeleted"
      | "onFilterRenamed"
      | "onFilterStateChanged"
      | "vuuTable"
    > {
  columnDescriptors: ColumnDescriptor[];
}

export const CustomFilters = ({
  columnDescriptors,
  defaultFilterState,
  filterState,
  onApplyFilter,
  onFilterDeleted,
  onFilterRenamed,
  onFilterStateChanged,
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
    onSave,
    FilterPillProps,
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
          {...FilterPillProps}
          editing={indexOfFilterBeingRenamed === i}
          columnsByName={columnsByName}
          data-index={i}
          filter={filter}
          key={`filter-${i}`}
          selected={activeFilterIndex.includes(i)}
        />,
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
          variant="secondary"
        />

        {promptProps ? <Prompt {...promptProps} open /> : null}
      </div>
      {filterModel && vuuTable && (
        <FilterEditor
          columnDescriptors={columnDescriptors}
          key="filter-editor"
          onCancel={onCancelEdit}
          onSave={onSave}
          filter={interactedFilterState?.filter}
          vuuTable={vuuTable}
        />
      )}
    </>
  );
};
