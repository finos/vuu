import { Button, Menu, MenuItem, MenuPanel, MenuTrigger } from "@salt-ds/core";
import type { MenuActionHandler } from "@vuu-ui/vuu-context-menu";
import type { ColumnDescriptorsByName, Filter } from "@vuu-ui/vuu-filter-types";
import {
  type ForwardedRef,
  forwardRef,
  type KeyboardEventHandler,
} from "react";
import { isEditableFilter } from "../FilterModel";
import { getFilterLabel } from "../filter-pill/getFilterLabel";

const classBase = "vuuFilterOverflowMenu";

export interface FilterOverflowMenuProps {
  activeFilterIndex: number[];
  columnsByName: ColumnDescriptorsByName;
  filters: Filter[];
  /**
   * Indices, into filters, of the filters that do not fit on the row.
   */
  overflowedIndices: number[];
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
  onMenuAction: MenuActionHandler;
  onToggleFilterActive: (
    index: number,
    preserveRemainingFilters: boolean,
  ) => void;
}

/**
 * The "+N" button at the end of the filter row, for the filters that do not
 * fit. A dot shows that at least one of them is applied. Each filter opens
 * the same actions as its pill menu, plus Apply or Deactivate.
 */
export const FilterOverflowMenu = forwardRef(function FilterOverflowMenu(
  {
    activeFilterIndex,
    columnsByName,
    filters,
    onKeyDown,
    onMenuAction,
    onToggleFilterActive,
    overflowedIndices,
  }: FilterOverflowMenuProps,
  forwardedRef: ForwardedRef<HTMLButtonElement>,
) {
  const getLabel = getFilterLabel(columnsByName);
  const appliedCount = overflowedIndices.filter((i) =>
    activeFilterIndex.includes(i),
  ).length;
  const count = overflowedIndices.length;
  const ariaLabel = `${count} more filter${count === 1 ? "" : "s"}${
    appliedCount > 0 ? `, ${appliedCount} applied` : ""
  }`;

  return (
    <Menu placement="bottom-end">
      <MenuTrigger>
        <Button
          aria-label={ariaLabel}
          className={classBase}
          data-applied={appliedCount > 0 || undefined}
          onKeyDown={onKeyDown}
          ref={forwardedRef}
          sentiment="neutral"
        >
          {appliedCount > 0 ? (
            <span aria-hidden className={`${classBase}-dot`} />
          ) : null}
          {`+${count}`}
        </Button>
      </MenuTrigger>
      <MenuPanel className={`vuuFilterPill-menu ${classBase}-panel`}>
        {overflowedIndices.map((index) => {
          const filter = filters[index];
          if (filter === undefined) {
            return null;
          }
          const name = filter.name ?? getLabel(filter);
          const applied = activeFilterIndex.includes(index);
          const options = { filter };
          return (
            <Menu key={index}>
              <MenuTrigger>
                <MenuItem
                  aria-label={applied ? `${name}, applied` : name}
                  className={`${classBase}-filter`}
                >
                  <span
                    aria-hidden
                    className={`${classBase}-applied`}
                    data-applied={applied || undefined}
                  />
                  {name}
                </MenuItem>
              </MenuTrigger>
              <MenuPanel className="vuuFilterPill-menu">
                <MenuItem onClick={() => onToggleFilterActive(index, true)}>
                  {applied ? "Deactivate" : "Apply"}
                </MenuItem>
                <MenuItem
                  onClick={() => onMenuAction("rename-filter", options)}
                >
                  Rename
                </MenuItem>
                {isEditableFilter(filter) ? (
                  <MenuItem
                    onClick={() => onMenuAction("edit-filter", options)}
                  >
                    Edit
                  </MenuItem>
                ) : null}
                <MenuItem
                  className="vuuFilterMenu-delete"
                  onClick={() => onMenuAction("delete-filter", options)}
                >
                  Delete
                </MenuItem>
              </MenuPanel>
            </Menu>
          );
        })}
      </MenuPanel>
    </Menu>
  );
});
