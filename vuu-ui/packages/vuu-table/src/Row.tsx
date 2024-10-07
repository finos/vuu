import { RowProps, RuntimeColumnDescriptor } from "@finos/vuu-table-types";
import {
  isGroupColumn,
  isJsonColumn,
  isJsonGroup,
  isNotHidden,
  metadataKeys,
  RowSelected,
} from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { forwardRef, memo, MouseEvent, useCallback } from "react";
import { TableCell, TableGroupCell } from "./table-cell";

import rowCss from "./Row.css";
import { VirtualColSpan } from "./VirtualColSpan";

const { IDX, IS_EXPANDED, SELECTED } = metadataKeys;
const classBase = "vuuTableRow";

// A dummy Table Row rendered once and not visible. We measure this to
// determine height of Row(s) and monitor it for size changes (in
// case of runtime density switch). This allows ListItem height to
// be controlled purely through CSS.
export const RowProxy = forwardRef<HTMLDivElement, { height?: number }>(
  function RowProxy({ height }, forwardedRef) {
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-table-row",
      css: rowCss,
      window: targetWindow,
    });

    return (
      <div
        aria-hidden
        className={cx(classBase, `${classBase}-proxy`)}
        ref={forwardedRef}
        style={{ height }}
      />
    );
  },
);

// export const Row = memo(
export const Row = memo(
  ({
    className: classNameProp,
    classNameGenerator,
    columnMap,
    columns,
    highlighted,
    row,
    offset,
    onClick,
    onDataEdited,
    onToggleGroup,
    virtualColSpan = 0,
    zebraStripes = false,
    ...htmlAttributes
  }: RowProps) => {
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-table-row",
      css: rowCss,
      window: targetWindow,
    });

    const {
      [IDX]: rowIndex,
      [IS_EXPANDED]: isExpanded,
      [SELECTED]: selectionStatus,
    } = row;

    const handleRowClick = useCallback(
      (evt: MouseEvent<HTMLDivElement>) => {
        const rangeSelect = evt.shiftKey;
        const keepExistingSelection = evt.ctrlKey || evt.metaKey; /* mac only */
        onClick?.(evt, row, rangeSelect, keepExistingSelection);
      },
      [onClick, row],
    );

    const { True, First, Last } = RowSelected;

    const className = cx(
      classBase,
      classNameProp,
      classNameGenerator?.(row, columnMap),
      {
        [`${classBase}-even`]: zebraStripes && rowIndex % 2 === 0,
        [`${classBase}-expanded`]: isExpanded,
        [`${classBase}-highlighted`]: highlighted,
        [`${classBase}-selected`]: selectionStatus & True,
        [`${classBase}-selectedStart`]: selectionStatus & First,
        [`${classBase}-selectedEnd`]: selectionStatus & Last,
      },
    );

    // const style = { transform: `translate3d(0px, ${offset}px, 0px)` };
    const style = { top: offset };

    const handleGroupCellClick = useCallback(
      (evt: MouseEvent, column: RuntimeColumnDescriptor) => {
        if (isGroupColumn(column) || isJsonGroup(column, row, columnMap)) {
          evt.stopPropagation();
          onToggleGroup?.(row, column);
        }
      },
      [columnMap, onToggleGroup, row],
    );

    return (
      <div
        {...htmlAttributes}
        role="row"
        className={className}
        onClick={handleRowClick}
        style={style}
      >
        <span className={`${classBase}-selectionDecorator vuuStickyLeft`} />
        <VirtualColSpan width={virtualColSpan} />
        {columns.filter(isNotHidden).map((column) => {
          const isGroup = isGroupColumn(column);
          const isJsonCell = isJsonColumn(column);
          const Cell = isGroup ? TableGroupCell : TableCell;

          return (
            <Cell
              column={column}
              columnMap={columnMap}
              key={column.name}
              onClick={isGroup || isJsonCell ? handleGroupCellClick : undefined}
              onDataEdited={onDataEdited}
              row={row}
            />
          );
        })}
        <span className={`${classBase}-selectionDecorator vuuStickyRight`} />
      </div>
    );
  },
);
Row.displayName = "Row";
