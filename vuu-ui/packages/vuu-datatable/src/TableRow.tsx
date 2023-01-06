import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { ColumnMap, DataRow, metadataKeys } from "@finos/vuu-utils";
import cx from "classnames";
import { HTMLAttributes, memo } from "react";
import { ValueFormatters } from "./dataTableTypes";
import { TableCell } from "./TableCell";

import "./TableRow.css";

const { IDX } = metadataKeys;
const classBase = "vuuDataTableRow";

export interface RowProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onClick"> {
  // TODO roll column lookup key into column
  columnMap: ColumnMap;
  columns: KeyedColumnDescriptor[];
  height: number;
  index: number;
  row: DataRow;
  valueFormatters?: ValueFormatters;
}

export const TableRow = memo(function Row({
  columnMap,
  columns,
  height,
  index,
  row,
  valueFormatters,
}: RowProps) {
  const rowIndex = row[IDX];
  const className = cx(classBase, {
    [`${classBase}-even`]: rowIndex % 2 === 0,
  });
  const offset = rowIndex - index;

  return (
    <tr
      data-idx={index}
      className={className}
      style={{
        transform: `translate3d(0px, ${offset * height}px, 0px)`,
      }}
    >
      {columns.map((column) => (
        <TableCell
          column={column}
          columnMap={columnMap}
          key={column.name}
          row={row}
          valueFormatter={valueFormatters?.[column.name]}
        />
      ))}
    </tr>
  );
});
