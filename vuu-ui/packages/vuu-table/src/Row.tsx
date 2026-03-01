import { RowProps, RuntimeColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  isGroupColumn,
  isJsonColumn,
  isJsonGroup,
  isNotHidden,
  metadataKeys,
  queryClosest,
} from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { MouseEvent, memo, useCallback } from "react";
import { TableCell, TableGroupCell } from "./table-cell";

import { VirtualColSpan } from "./VirtualColSpan";

const { COUNT, DEPTH, IDX, IS_EXPANDED, IS_LEAF, SELECTED } = metadataKeys;
const classBase = "vuuTableRow";

// export const Row = memo(
export const Row = memo(
  ({
    className: classNameProp,
    classNameGenerator,
    columnMap,
    columns,
    groupToggleTarget = "group-column",
    highlighted,
    row,
    offset,
    onCellEdit,
    onClick,
    onDataEdited,
    onToggleGroup,
    searchPattern,
    showBookends = true,
    virtualColSpan = 0,
    zebraStripes = false,
    ...htmlAttributes
  }: RowProps) => {
    const {
      [COUNT]: childRowCount,
      [DEPTH]: depth,
      [IDX]: rowIndex,
      [IS_EXPANDED]: isExpanded,
      [IS_LEAF]: isLeaf,
      [SELECTED]: isSelected,
    } = row;

    const handleRowClick = useCallback(
      (evt: MouseEvent<HTMLDivElement>) => {
        const rangeSelect = evt.shiftKey;
        const keepExistingSelection = evt.ctrlKey || evt.metaKey; /* mac only */
        onClick?.(evt, row, rangeSelect, keepExistingSelection);
      },
      [onClick, row],
    );

    const className = cx(
      classBase,
      classNameProp,
      classNameGenerator?.(row, columnMap),
      {
        [`${classBase}-even`]: zebraStripes && rowIndex % 2 === 0,
        [`${classBase}-highlighted`]: highlighted,
      },
    );

    const canExpand = isLeaf === false && childRowCount > 0;
    const ariaExpanded = isExpanded ? true : canExpand ? false : undefined;
    const ariaLevel = isLeaf && depth === 1 ? undefined : depth;

    // const style = { transform: `translate3d(0px, ${offset}px, 0px)` };
    const style = { top: offset };

    const handleGroupCellClick = useCallback(
      (evt: MouseEvent, column: RuntimeColumnDescriptor) => {
        if (isGroupColumn(column) || isJsonGroup(column, row, columnMap)) {
          const toggleIconClicked =
            queryClosest(evt.target, ".vuuToggleIconButton") !== null;
          if (groupToggleTarget === "toggle-icon") {
            if (!toggleIconClicked) {
              return;
            }
          }
          if (toggleIconClicked) {
            // prevent evt bubbling, will suppress selection hook.
            // Clicking the toggle icon directly never triggers row selection
            evt.stopPropagation();
          }
          onToggleGroup?.(row, column);
        }
      },
      [columnMap, groupToggleTarget, onToggleGroup, row],
    );

    return (
      <div
        {...htmlAttributes}
        aria-expanded={ariaExpanded}
        aria-selected={isSelected ? "true" : undefined}
        aria-level={ariaLevel}
        role="row"
        className={className}
        onClick={handleRowClick}
        style={style}
      >
        {showBookends ? (
          <div className="vuuSelectionDecorator vuuStickyLeft">
            <div className="vuuTableRowBookend" />
          </div>
        ) : null}
        <VirtualColSpan width={virtualColSpan} />
        {columns.filter(isNotHidden).map((column) => {
          const isGroup = isGroupColumn(column);
          const isJsonCell = isJsonColumn(column);
          const Cell = isGroup && !isJsonCell ? TableGroupCell : TableCell;

          return (
            <Cell
              column={column}
              columnMap={columnMap}
              key={column.name}
              onClick={isGroup || isJsonCell ? handleGroupCellClick : undefined}
              onDataEdited={onDataEdited}
              row={row}
              searchPattern={searchPattern}
            />
          );
        })}
        {showBookends ? (
          <div className="vuuSelectionDecorator vuuStickyRight">
            <div className="vuuTableRowBookend" />
          </div>
        ) : null}
      </div>
    );
  },
);
Row.displayName = "Row";
