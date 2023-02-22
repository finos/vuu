import { DataSourceRow } from "@finos/vuu-data";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { isGroupColumn, metadataKeys, notHidden } from "@finos/vuu-utils";
import cx from "classnames";
import { HTMLAttributes, memo, MouseEvent, useCallback } from "react";
import { RowClickHandler } from "./dataTableTypes";
import { TableCell } from "./TableCell";
import { TableGroupCell } from "./TableGroupCell";

import "./TableRow.css";

const { IDX, IS_EXPANDED, SELECTED } = metadataKeys;
const classBase = "vuuDataTableRow";

export interface RowProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onClick"> {
  columns: KeyedColumnDescriptor[];
  height: number;
  index: number;
  onClick?: RowClickHandler;
  onToggleGroup?: (row: DataSourceRow) => void;
  row: DataSourceRow;
}

export const TableRow = memo(function Row({
  columns,
  height,
  index,
  onClick,
  onToggleGroup,
  row,
}: RowProps) {
  const {
    [IDX]: rowIndex,
    [IS_EXPANDED]: isExpanded,
    [SELECTED]: isSelected,
  } = row;

  const className = cx(classBase, {
    [`${classBase}-even`]: rowIndex % 2 === 0,
    [`${classBase}-expanded`]: isExpanded,
    [`${classBase}-preSelected`]: isSelected === 2,
  });
  const offset = rowIndex - index;

  const handleRowClick = useCallback(
    (evt: MouseEvent) => {
      const rangeSelect = evt.shiftKey;
      const keepExistingSelection = evt.ctrlKey || evt.metaKey; /* mac only */
      onClick?.(row, rangeSelect, keepExistingSelection);
    },
    [onClick, row]
  );

  const handleGroupCellClick = useCallback(
    () => onToggleGroup?.(row),
    [onToggleGroup, row]
  );

  return (
    <tr
      aria-selected={isSelected === 1 ? true : undefined}
      aria-rowindex={rowIndex}
      className={className}
      onClick={handleRowClick}
      style={{
        transform: `translate3d(0px, ${offset * height}px, 0px)`,
      }}
    >
      {columns.filter(notHidden).map((column) => {
        const isGroup = isGroupColumn(column);
        const Cell = isGroup ? TableGroupCell : TableCell;
        return (
          <Cell
            column={column}
            key={column.name}
            onClick={isGroup ? handleGroupCellClick : undefined}
            row={row}
          />
        );
      })}
    </tr>
  );
});
