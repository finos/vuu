import { DataSourceRow } from "@finos/vuu-data-types";
import {
  DataCellEditHandler,
  RuntimeColumnDescriptor,
  RowClickHandler,
} from "@finos/vuu-datagrid-types";
import {
  ColumnMap,
  isGroupColumn,
  isJsonColumn,
  isJsonGroup,
  metadataKeys,
  notHidden,
  RowSelected,
} from "@finos/vuu-utils";
import cx from "classnames";
import { CSSProperties, memo, MouseEvent, useCallback } from "react";
import { TableCell, TableGroupCell } from "./table-cell";

import "./Row.css";

export interface RowProps {
  className?: string;
  columnMap: ColumnMap;
  columns: RuntimeColumnDescriptor[];
  highlighted?: boolean;
  row: DataSourceRow;
  offset: number;
  onClick?: RowClickHandler;
  onDataEdited?: DataCellEditHandler;
  onToggleGroup?: (row: DataSourceRow, column: RuntimeColumnDescriptor) => void;
  style?: CSSProperties;
  zebraStripes?: boolean;
}

const { IDX, IS_EXPANDED, SELECTED } = metadataKeys;
const classBase = "vuuTableNextRow";

// export const Row = memo(
export const Row = memo(
  ({
    className: classNameProp,
    columnMap,
    columns,
    highlighted,
    row,
    offset,
    onClick,
    onDataEdited,
    onToggleGroup,
    zebraStripes = false,
    ...htmlAttributes
  }: RowProps) => {
    const {
      [IDX]: rowIndex,
      [IS_EXPANDED]: isExpanded,
      [SELECTED]: selectionStatus,
    } = row;

    const handleRowClick = useCallback(
      (evt: MouseEvent<HTMLDivElement>) => {
        const rangeSelect = evt.shiftKey;
        const keepExistingSelection = evt.ctrlKey || evt.metaKey; /* mac only */
        onClick?.(row, rangeSelect, keepExistingSelection);
      },
      [onClick, row]
    );

    const { True, First, Last } = RowSelected;

    const className = cx(classBase, classNameProp, {
      [`${classBase}-even`]: zebraStripes && rowIndex % 2 === 0,
      [`${classBase}-expanded`]: isExpanded,
      [`${classBase}-highlighted`]: highlighted,
      [`${classBase}-selected`]: selectionStatus & True,
      [`${classBase}-selectedStart`]: selectionStatus & First,
      [`${classBase}-selectedEnd`]: selectionStatus & Last,
    });

    const style = { transform: `translate3d(0px, ${offset}px, 0px)` };

    const handleGroupCellClick = useCallback(
      (evt: MouseEvent, column: RuntimeColumnDescriptor) => {
        if (isGroupColumn(column) || isJsonGroup(column, row)) {
          evt.stopPropagation();
          onToggleGroup?.(row, column);
        }
      },
      [onToggleGroup, row]
    );

    return (
      <div
        {...htmlAttributes}
        aria-rowindex={row[0]}
        key={`row-${row[0]}`}
        role="row"
        className={className}
        onClick={handleRowClick}
        style={style}
      >
        <span className={`${classBase}-selectionDecorator vuuStickyLeft`} />
        {columns.filter(notHidden).map((column) => {
          const isGroup = isGroupColumn(column);
          const isJsonCell = isJsonColumn(column);
          const Cell = isGroup ? TableGroupCell : TableCell;

          return (
            <Cell
              column={column}
              columnMap={columnMap}
              key={column.key}
              onClick={isGroup || isJsonCell ? handleGroupCellClick : undefined}
              onDataEdited={onDataEdited}
              row={row}
            />
          );
        })}
        <span className={`${classBase}-selectionDecorator vuuStickyRight`} />
      </div>
    );
  }
);
Row.displayName = "Row";
