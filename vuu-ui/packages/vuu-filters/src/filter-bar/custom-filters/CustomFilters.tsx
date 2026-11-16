import { Prompt } from "@vuu-ui/vuu-ui-controls";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
import type { Filter } from "@vuu-ui/vuu-filter-types";
import { HTMLAttributes, ReactElement, useRef } from "react";
import { type FilterBarProps } from "../FilterBar";
import { FilterEditor } from "../filter-editor";
import { FilterPill } from "../filter-pill";
import { isEditableFilter } from "../FilterModel";
import { useOverflowItems } from "../useOverflowItems";
import { FilterBarSummary } from "./FilterBarSummary";
import { FilterOverflowMenu } from "./FilterOverflowMenu";
import { isEditFilterState, useCustomFilters } from "./useCustomFilters";

const classBase = "vuuCustomFilters";
/** Pills truncate their label down to this width before any overflow. */
const MIN_PILL_WIDTH = 76;

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
   * See FilterBarSummary.
   */
  onClearQuickFilter?: () => void;
  /**
   * See FilterBarSummary. When provided, the filter icon toggles between
   * saved filters and quick filters.
   */
  onToggleQuickFilters?: () => void;
  quickFilter?: Filter;
  quickFilterCount?: number;
  /**
   * While quick filters are shown, only the filter icon is rendered. The
   * saved filters keep their state, and those applied stay applied.
   */
  quickFiltersShown?: boolean;
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
  onClearQuickFilter,
  onToggleQuickFilters,
  quickFilter,
  quickFilterCount,
  quickFiltersShown = false,
  showFilterSummary = false,
  vuuTable,
}: CustomFilterProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const overflowButtonRef = useRef<HTMLButtonElement>(null);

  const {
    activeFilterIndex,
    addButtonProps,
    columnsByName,
    filters,
    interactedFilterState,
    onCancelEdit,
    onClearActiveFilters,
    onOverflowKeyDown,
    onPillMenuAction,
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

  const overflowedIndices = useOverflowItems({
    containerRef: filtersRef,
    measureKey: [
      filters,
      activeFilterIndex,
      interactedFilterState,
      quickFiltersShown,
    ],
    minItemWidth: MIN_PILL_WIDTH,
    overflowButtonRef,
  });

  // the editor always keeps its place on the row
  const filterEditor = isEditing ? (
    <FilterEditor
      columnDescriptors={columnDescriptors}
      data-overflow-item
      data-overflow-pinned
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
      const overflowed = overflowedIndices.includes(i) || undefined;
      if (i === indexOfFilterBeingEdited && filterEditor) {
        items.push(filterEditor);
      } else {
        const renaming = indexOfFilterBeingRenamed === i;
        items.push(
          <FilterPill
            {...FilterPillProps}
            allowEdit={isEditableFilter(filter)}
            editing={renaming}
            columnsByName={columnsByName}
            data-index={i}
            data-overflow-item
            data-overflow-pinned={renaming || undefined}
            data-overflow-shrink
            data-overflowed={overflowed}
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

  const overflowMenu =
    overflowedIndices.length > 0 ? (
      <FilterOverflowMenu
        activeFilterIndex={activeFilterIndex}
        columnsByName={columnsByName}
        filters={filters}
        onKeyDown={onOverflowKeyDown}
        onMenuAction={onPillMenuAction}
        onToggleFilterActive={onToggleFilterActive}
        overflowedIndices={overflowedIndices}
        ref={overflowButtonRef}
      />
    ) : null;

  return (
    <div
      className={classBase}
      data-quick-filters-shown={quickFiltersShown || undefined}
      ref={rootRef}
    >
      {showFilterSummary ? (
        <FilterBarSummary
          activeFilterIndex={activeFilterIndex}
          columnsByName={columnsByName}
          filters={filters}
          onClearActiveFilters={onClearActiveFilters}
          onClearQuickFilter={onClearQuickFilter}
          onToggleFilterActive={onToggleFilterActive}
          onToggleQuickFilters={onToggleQuickFilters}
          quickFilter={quickFilter}
          quickFilterCount={quickFilterCount}
          quickFiltersShown={quickFiltersShown}
        />
      ) : null}
      <div
        className={`${classBase}-filters`}
        hidden={quickFiltersShown}
        ref={filtersRef}
      >
        {getFilterPills()}
      </div>
      {quickFiltersShown ? null : overflowMenu}
      {quickFiltersShown || editState === "create" ? null : (
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
