import { DataSourceRow } from "@finos/vuu-data-types";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
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
import { HTMLAttributes, memo, MouseEvent, useCallback } from "react";
import { RowClickHandler } from "./dataTableTypes";
import { TableCell } from "./TableCell";
import { TableGroupCell } from "./TableGroupCell";

import "./TableRow.css";

const { IDX, IS_EXPANDED, SELECTED } = metadataKeys;
const { True, First, Last } = RowSelected;

const classBase = "vuuTableRow";

export interface RowProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onClick"> {
  columnMap: ColumnMap;
  columns: KeyedColumnDescriptor[];
  offset: number;
  onClick?: RowClickHandler;
  onToggleGroup?: (row: DataSourceRow, column: KeyedColumnDescriptor) => void;
  row: DataSourceRow;
  virtualColSpan?: number;
}

export const TableRow = memo(function Row({
  columnMap,
  columns,
  offset,
  onClick,
  onToggleGroup,
  virtualColSpan = 0,
  row,
}: RowProps) {
  const {
    [IDX]: rowIndex,
    [IS_EXPANDED]: isExpanded,
    [SELECTED]: selectionStatus,
  } = row;

  const className = cx(classBase, {
    [`${classBase}-even`]: rowIndex % 2 === 0,
    [`${classBase}-expanded`]: isExpanded,
    [`${classBase}-selected`]: selectionStatus & True,
    [`${classBase}-selectedStart`]: selectionStatus & First,
    [`${classBase}-selectedEnd`]: selectionStatus & Last,
  });

  const handleRowClick = useCallback(
    (evt: MouseEvent) => {
      const rangeSelect = evt.shiftKey;
      const keepExistingSelection = evt.ctrlKey || evt.metaKey; /* mac only */
      onClick?.(row, rangeSelect, keepExistingSelection);
    },
    [onClick, row]
  );

  const handleGroupCellClick = useCallback(
    (evt: MouseEvent, column: KeyedColumnDescriptor) => {
      if (isGroupColumn(column) || isJsonGroup(column, row)) {
        evt.stopPropagation();
        onToggleGroup?.(row, column);
      }
    },
    [onToggleGroup, row]
  );

  return (
    <div
      aria-selected={selectionStatus & True ? true : undefined}
      aria-rowindex={rowIndex}
      className={className}
      onClick={handleRowClick}
      role="row"
      style={{
        transform: `translate3d(0px, ${offset}px, 0px)`,
      }}
    >
      {virtualColSpan > 0 ? (
        <div role="cell" style={{ width: virtualColSpan }} />
      ) : null}
      {columns.filter(notHidden).map((column) => {
        const isGroup = isGroupColumn(column);
        const isJsonCell = isJsonColumn(column);
        const Cell = isGroup ? TableGroupCell : TableCell;
        return (
          <Cell
            column={column}
            columnMap={columnMap}
            key={column.name}
            onClick={isGroup || isJsonCell ? handleGroupCellClick : undefined}
            row={row}
          />
        );
      })}
    </div>
  );
});
