import { isGroupColumn, metadataKeys } from "@finos/vuu-utils";
import { MouseEvent, useCallback } from "react";
import { TableImplementationProps } from "./dataTableTypes";
import { TableRow } from "./TableRow";
import { TableGroupHeaderCell } from "./TableGroupHeaderCell";
import { TableHeaderCell } from "./TableHeaderCell";

const classBase = "vuuDataTable";
const { RENDER_IDX } = metadataKeys;

export const RowBasedTable = ({
  columns,
  data,
  onColumnResize,
  onHeaderCellDragStart,
  onRemoveColumnFromGroupBy,
  onSort,
  onToggleGroup,
  rowHeight,
  valueFormatters,
}: TableImplementationProps) => {
  const handleDragStart = useCallback(
    (evt: MouseEvent) => {
      console.log(`handkleDRagSTart`, {
        evt,
        onHeaderCellDragStart,
      });
      //TODO do not fire this untila delay has elapsed
      // onHeaderCellDragStart?.(evt);
    },
    [onHeaderCellDragStart]
  );

  const handleHeaderClick = useCallback(
    (evt: MouseEvent) => {
      const targetElement = evt.target as HTMLElement;
      const headerCell = targetElement.closest(
        ".vuuTable-headerCell"
      ) as HTMLElement;
      const colIdx = parseInt(headerCell?.dataset.idx ?? "-1");
      const column = columns[colIdx];
      const isAdditive = evt.shiftKey;
      column && onSort(column, isAdditive);
    },
    [columns, onSort]
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
          {columns.map((column, i) =>
            isGroupColumn(column) ? (
              <TableGroupHeaderCell
                column={column}
                data-idx={i}
                key={i}
                // onClick={handleHeaderClick}
                // onDragStart={handleDragStart}
                onRemoveColumn={onRemoveColumnFromGroupBy}
                onResize={onColumnResize}
                style={{ left: column.pinnedLeftOffset }}
              />
            ) : (
              <TableHeaderCell
                column={column}
                data-idx={i}
                key={i}
                onClick={handleHeaderClick}
                onDragStart={handleDragStart}
                onResize={onColumnResize}
                style={{ left: column.pinnedLeftOffset }}
              />
            )
          )}
        </tr>
      </thead>
      <tbody>
        {data?.map((row, i) => (
          <TableRow
            columns={columns}
            height={rowHeight}
            index={i}
            key={row[RENDER_IDX]}
            onToggleGroup={onToggleGroup}
            row={row}
            valueFormatters={valueFormatters}
          />
        ))}
        <tr className={`${classBase}-filler`} />
      </tbody>
    </table>
  );
};
