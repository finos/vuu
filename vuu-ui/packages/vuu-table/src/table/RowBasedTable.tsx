import {
  buildColumnMap,
  getColumnStyle,
  isGroupColumn,
  metadataKeys,
  notHidden,
  visibleColumnAtIndex,
} from "@finos/vuu-utils";
import { MouseEvent, useCallback, useMemo } from "react";
import { TableImplementationProps } from "./dataTableTypes";
import { TableRow } from "./TableRow";
import { TableGroupHeaderCell } from "./TableGroupHeaderCell";
import { TableHeaderCell } from "./TableHeaderCell";

import "./RowBasedTable.css";

const classBase = "vuuTable";
const { RENDER_IDX } = metadataKeys;

export const RowBasedTable = ({
  columns,
  columnsWithinViewport,
  data,
  getRowOffset,
  headings,
  onColumnResize,
  onHeaderCellDragStart,
  onContextMenu,
  onRemoveColumnFromGroupBy,
  onRowClick,
  onSort,
  onToggleGroup,
  tableId,
  virtualColSpan = 0,
  rowCount,
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

  const columnMap = useMemo(() => buildColumnMap(columns), [columns]);

  const handleHeaderClick = useCallback(
    (evt: MouseEvent) => {
      const targetElement = evt.target as HTMLElement;
      const headerCell = targetElement.closest(
        ".vuuTable-headerCell"
      ) as HTMLElement;
      const colIdx = parseInt(headerCell?.dataset.idx ?? "-1");
      const column = visibleColumnAtIndex(columns, colIdx);
      const isAdditive = evt.shiftKey;
      column && onSort(column, isAdditive);
    },
    [columns, onSort]
  );

  return (
    <div aria-rowcount={rowCount} className={`${classBase}-table`} role="table">
      <div className={`${classBase}-headers`} role="rowGroup">
        {headings.map((colHeaders, i) => (
          <div className="vuuTable-heading" key={i}>
            {colHeaders.map(({ label, width }, j) => (
              <div key={j} className="vuuTable-headingCell" style={{ width }}>
                {label}
              </div>
            ))}
          </div>
        ))}
        <div role="row">
          {visibleColumns.map((column, i) => {
            const style = getColumnStyle(column);
            return isGroupColumn(column) ? (
              <TableGroupHeaderCell
                column={column}
                data-idx={i}
                key={i}
                onRemoveColumn={onRemoveColumnFromGroupBy}
                onResize={onColumnResize}
                role="columnHeader"
                style={style}
              />
            ) : (
              <TableHeaderCell
                column={column}
                data-idx={i}
                id={`${tableId}-${i}`}
                key={i}
                onClick={handleHeaderClick}
                onDragStart={handleDragStart}
                onResize={onColumnResize}
                role="columnHeader"
                style={style}
              />
            );
          })}
        </div>
      </div>
      <div
        className={`${classBase}-body`}
        onContextMenu={onContextMenu}
        role="rowGroup"
      >
        {data?.map((row) => (
          <TableRow
            columnMap={columnMap}
            columns={columnsWithinViewport}
            offset={getRowOffset(row)}
            key={row[RENDER_IDX]}
            onClick={onRowClick}
            virtualColSpan={virtualColSpan}
            onToggleGroup={onToggleGroup}
            row={row}
          />
        ))}
      </div>
    </div>
  );
};
