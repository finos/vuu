import { metadataKeys } from "@finos/vuu-utils";
import React, { MouseEvent, useCallback } from "react";
import { TableImplementationProps } from "./dataTableTypes";
import { TableRow } from "./TableRow";
import { TableHeaderCell } from "./TableHeaderCell";

const classBase = "vuuDataTable";
const { RENDER_IDX } = metadataKeys;

export const RowBasedTable = ({
  columnMap,
  columns,
  data,
  onHeaderCellDragStart,
  rowHeight,
}: TableImplementationProps) => {
  const handleDragStart = useCallback(
    (evt: MouseEvent) => {
      onHeaderCellDragStart?.(evt);
    },
    [onHeaderCellDragStart]
  );
  return (
    <table className={`${classBase}-table`}>
      <colgroup>
        {columns.map((column, i) => (
          <col key={i} width={`${column.width}px`} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {columns.map((column, i) => (
            <TableHeaderCell
              column={column}
              data-idx={i}
              key={i}
              onDragStart={handleDragStart}
              style={{ left: column.pinnedLeftOffset }}
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <TableRow
            columnMap={columnMap}
            columns={columns}
            height={rowHeight}
            index={i}
            key={row[RENDER_IDX]}
            row={row}
          />
        ))}
        <tr className={`${classBase}-filler`} />
      </tbody>
    </table>
  );
};
