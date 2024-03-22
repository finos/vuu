import { VuuSortType } from "@finos/vuu-protocol-types";
import {
  ColumnDescriptor,
  RuntimeColumnDescriptor,
  TableColumnResizeHandler,
  TableConfig,
  TableHeadings,
} from "@finos/vuu-table-types";
import { isGroupColumn, isNotHidden } from "@finos/vuu-utils";
import cx from "clsx";
import { memo } from "react";
import { GroupHeaderCell, HeaderCell } from "../header-cell";
import { useTableHeader } from "./useTableHeader";

export type ColumnSortHandler = (
  column: ColumnDescriptor,
  addToExistingSort: boolean,
  sortType?: VuuSortType
) => void;

export interface TableHeaderProps {
  classBase?: string;
  columns: RuntimeColumnDescriptor[];
  headings: TableHeadings;
  onResizeColumn: TableColumnResizeHandler;
  onMoveColumn: (columns: ColumnDescriptor[]) => void;
  onMoveGroupColumn: (columns: ColumnDescriptor[]) => void;
  onRemoveGroupColumn: (column: RuntimeColumnDescriptor) => void;
  onSortColumn: ColumnSortHandler;
  showColumnHeaderMenus: boolean;
  tableConfig: TableConfig;
  tableId: string;
  virtualColSpan?: number;
}

export const TableHeader = memo(
  ({
    classBase = "vuuTable",
    columns,
    headings,
    onMoveColumn,
    onMoveGroupColumn,
    onRemoveGroupColumn,
    onResizeColumn,
    onSortColumn,
    showColumnHeaderMenus,
    tableConfig,
    tableId,
    virtualColSpan = 0,
  }: TableHeaderProps) => {
    const {
      draggableColumn,
      draggedColumnIndex,
      onClick,
      onMouseDown,
      setContainerRef,
    } = useTableHeader({
      columns,
      onMoveColumn,
      onSortColumn,
      tableConfig,
    });

    return (
      <div className={`${classBase}-col-headings`} ref={setContainerRef}>
        {headings.map((colHeaders, i) => (
          <div className="vuuTable-heading" key={i}>
            {colHeaders.map(({ label, width }, j) => (
              <div key={j} className="vuuTable-headingCell" style={{ width }}>
                {label}
              </div>
            ))}
          </div>
        ))}
        <div className={`${classBase}-col-headers`} role="row">
          {virtualColSpan > 0 ? (
            <div
              role="cell"
              className="vuuTableCell"
              style={{ width: virtualColSpan }}
            />
          ) : null}
          {columns.filter(isNotHidden).map((col, i) =>
            isGroupColumn(col) ? (
              <GroupHeaderCell
                aria-colindex={col.index}
                column={col}
                data-index={i}
                key={col.name}
                onMoveColumn={onMoveGroupColumn}
                onRemoveColumn={onRemoveGroupColumn}
                onResize={onResizeColumn}
              />
            ) : (
              <HeaderCell
                aria-colindex={col.index}
                className={cx({
                  "vuuDraggable-dragAway": i === draggedColumnIndex,
                })}
                column={col}
                data-index={i}
                id={`${tableId}-col-${i}`}
                key={col.name}
                onClick={onClick}
                onMouseDown={onMouseDown}
                onResize={onResizeColumn}
                showMenu={showColumnHeaderMenus}
              />
            )
          )}
          {draggableColumn}
        </div>
      </div>
    );
  }
);
TableHeader.displayName = "TableHeader";
