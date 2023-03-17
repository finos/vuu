import {
  getColumnPinStyle,
  isGroupColumn,
  metadataKeys,
  notHidden,
} from "@finos/vuu-utils";
import { MouseEvent, useCallback, useMemo } from "react";
import { TableImplementationProps } from "./dataTableTypes";
import { TableRow } from "./TableRow";
import { TableGroupHeaderCell } from "./TableGroupHeaderCell";
import { TableHeaderCell } from "./TableHeaderCell";

const classBase = "vuuDataTable";
const { RENDER_IDX } = metadataKeys;

export const RowBasedTable = ({
  columns,
  columnsWithinViewport,
  data,
  headings,
  onColumnResize,
  onHeaderCellDragStart,
  onContextMenu,
  onRemoveColumnFromGroupBy,
  onRowClick,
  onSort,
  onToggleGroup,
  virtualColSpan = 0,
  rowCount,
  rowHeight,
}: TableImplementationProps) => {
  const handleDragStart = useCallback(
    (evt: MouseEvent) => {
      onHeaderCellDragStart?.(evt);
    },
    [onHeaderCellDragStart]
  );

  const visibleColumns = useMemo(() => {
    return columns.filter(notHidden);
  }, [columns]);

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
    <table aria-rowcount={rowCount} className={`${classBase}-table`}>
      <colgroup>
        {visibleColumns.map((column, i) => (
          <col key={i} width={`${column.width}px`} />
        ))}
      </colgroup>
      <thead>
        {headings.map((colHeaders, i) => (
          <tr className="vuuTable-heading" key={i}>
            {colHeaders.map(({ label, span }, j) => (
              <th colSpan={span} key={j} className="vuuTable-headingCell">
                {label}
              </th>
            ))}
          </tr>
        ))}
        <tr>
          {visibleColumns.map((column, i) => {
            const style = getColumnPinStyle(column);
            return isGroupColumn(column) ? (
              <TableGroupHeaderCell
                column={column}
                data-idx={i}
                key={i}
                onRemoveColumn={onRemoveColumnFromGroupBy}
                onResize={onColumnResize}
                style={style}
              />
            ) : (
              <TableHeaderCell
                column={column}
                data-idx={i}
                key={i}
                onClick={handleHeaderClick}
                onDragStart={handleDragStart}
                onResize={onColumnResize}
                style={style}
              />
            );
          })}
        </tr>
      </thead>
      <tbody onContextMenu={onContextMenu}>
        {data?.map((row, i) => (
          <TableRow
            columns={columnsWithinViewport}
            height={rowHeight}
            index={i}
            key={row[RENDER_IDX]}
            onClick={onRowClick}
            virtualColSpan={virtualColSpan}
            onToggleGroup={onToggleGroup}
            row={row}
          />
        ))}
        <tr className={`${classBase}-filler`} />
      </tbody>
    </table>
  );
};
