import { DataSourceRow } from "@finos/vuu-data";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { isGroupColumn, metadataKeys } from "@finos/vuu-utils";
import cx from "classnames";
import { HTMLAttributes, memo, useCallback } from "react";
import { ValueFormatters } from "./dataTableTypes";
import { TableCell } from "./TableCell";
import { TableGroupCell } from "./TableGroupCell";

import "./TableRow.css";

const { IDX, IS_EXPANDED } = metadataKeys;
const classBase = "vuuDataTableRow";

export interface RowProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onClick"> {
  columns: KeyedColumnDescriptor[];
  height: number;
  index: number;
  onToggleGroup?: (row: DataSourceRow) => void;
  row: DataSourceRow;
  valueFormatters?: ValueFormatters;
}

export const TableRow = memo(function Row({
  columns,
  height,
  index,
  onToggleGroup,
  row,
  valueFormatters,
}: RowProps) {
  const { [IDX]: rowIndex, [IS_EXPANDED]: isExpanded } = row;

  const className = cx(classBase, {
    [`${classBase}-even`]: rowIndex % 2 === 0,
    [`${classBase}-expanded`]: isExpanded,
  });
  const offset = rowIndex - index;

  const handleClick = useCallback(
    () => onToggleGroup?.(row),
    [onToggleGroup, row]
  );

  return (
    <tr
      data-idx={index}
      className={className}
      style={{
        transform: `translate3d(0px, ${offset * height}px, 0px)`,
      }}
    >
      {columns.map((column) => {
        const isGroup = isGroupColumn(column);
        const Cell = isGroup ? TableGroupCell : TableCell;
        return (
          <Cell
            column={column}
            key={column.name}
            onClick={isGroup ? handleClick : undefined}
            row={row}
            valueFormatter={valueFormatters?.[column.name]}
          />
        );
      })}
    </tr>
  );
});
