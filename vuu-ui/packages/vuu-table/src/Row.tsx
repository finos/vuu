import { RowProps, RuntimeColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  isGroupColumn,
  isJsonColumn,
  isJsonGroup,
  isNotHidden,
  queryClosest,
} from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { MouseEvent, memo, useCallback } from "react";
import { TableCell, TableGroupCell } from "./table-cell";

import { VirtualColSpan } from "./VirtualColSpan";

const classBase = "vuuTableRow";

export const Row = memo(
  ({
    className: classNameProp,
    classNameGenerator,
    columns,
    dataRow,
    groupToggleTarget = "group-column",
    highlighted,
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
      childCount,
      depth,
      index: rowIndex,
      isExpanded,
      isLeaf,
      isSelected,
    } = dataRow;

    const handleRowClick = useCallback(
      (evt: MouseEvent<HTMLDivElement>) => {
        const rangeSelect = evt.shiftKey;
        const keepExistingSelection = evt.ctrlKey || evt.metaKey; /* mac only */
        onClick?.(evt, dataRow, rangeSelect, keepExistingSelection);
      },
      [dataRow, onClick],
    );

    const className = cx(
      classBase,
      classNameProp,
      classNameGenerator?.(dataRow),
      {
        [`${classBase}-even`]: zebraStripes && rowIndex % 2 === 0,
        [`${classBase}-highlighted`]: highlighted,
      },
    );

    const canExpand = isLeaf === false && childCount > 0;
    const ariaExpanded = isExpanded ? true : canExpand ? false : undefined;
    const ariaLevel = isLeaf && depth === 1 ? undefined : depth;

    // const style = { transform: `translate3d(0px, ${offset}px, 0px)` };
    const style = { top: offset };

    const handleGroupCellClick = useCallback(
      (evt: MouseEvent, column: RuntimeColumnDescriptor) => {
        if (isGroupColumn(column) || isJsonGroup(column, dataRow)) {
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
          onToggleGroup?.(dataRow, column);
        }
      },
      [dataRow, groupToggleTarget, onToggleGroup],
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
              dataRow={dataRow}
              key={column.name}
              onClick={isGroup || isJsonCell ? handleGroupCellClick : undefined}
              onDataEdited={onDataEdited}
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
