import { VuuSortType } from "@finos/vuu-protocol-types";
import {
  ColumnDescriptor,
  CustomHeader,
  CustomHeaderComponent,
  CustomHeaderElement,
  RuntimeColumnDescriptor,
  TableColumnResizeHandler,
  TableConfig,
  TableHeadings,
} from "@finos/vuu-table-types";
import { isGroupColumn, isNotHidden } from "@finos/vuu-utils";
import cx from "clsx";
import { cloneElement, isValidElement, memo, useMemo } from "react";
import { GroupHeaderCell, HeaderCell } from "../header-cell";
import { HeaderProvider } from "./HeaderProvider";
import { useTableHeader } from "./useTableHeader";

export type ColumnSortHandler = (
  column: ColumnDescriptor,
  addToExistingSort: boolean,
  sortType?: VuuSortType,
) => void;

const isHeaderElement = (h: CustomHeader): h is CustomHeaderElement =>
  isValidElement(h);

export interface TableHeaderProps {
  allowDragColumnHeader: boolean;
  classBase?: string;
  columns: RuntimeColumnDescriptor[];
  customHeader?: CustomHeader | CustomHeader[];
  headings: TableHeadings;
  onHeightMeasured: (height: number, count: number) => void;
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
    allowDragColumnHeader,
    classBase = "vuuTable",
    columns,
    customHeader,
    headings,
    onHeightMeasured,
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
    const [customHeaders, customHeaderCount] = useMemo<
      [JSX.Element | JSX.Element[] | null, number]
    >(() => {
      const offset = headings.length;
      const createElement = (
        Component: CustomHeaderComponent,
        index: number,
      ) => (
        <Component
          ariaRowIndex={offset + index + 2}
          ariaRole="row"
          columns={columns}
          key={index}
          virtualColSpan={virtualColSpan}
        />
      );

      const enrichElementWithAria = (el: JSX.Element, rowIndex: number) => {
        const offset = headings.length;
        return cloneElement(el, {
          "aria-rowindex": rowIndex + offset + 2,
          ariaRole: "row",
        });
      };

      if (customHeader === undefined) {
        return [null, 0];
      } else if (Array.isArray(customHeader)) {
        const header = (
          <HeaderProvider columns={columns} virtualColSpan={virtualColSpan}>
            {customHeader.map((header, i) =>
              isHeaderElement(header)
                ? enrichElementWithAria(header, i)
                : createElement(header, i),
            )}
          </HeaderProvider>
        );
        return [header, customHeader.length];
      } else if (isHeaderElement(customHeader)) {
        // TODO rowIndex and role
        const header = (
          <HeaderProvider columns={columns} virtualColSpan={virtualColSpan}>
            {enrichElementWithAria(customHeader, 0)}
          </HeaderProvider>
        );
        return [header, 1];
      } else {
        return [createElement(customHeader, 0), 1];
      }
    }, [columns, customHeader, headings.length, virtualColSpan]);

    const {
      draggableColumn,
      draggedColumnIndex,
      onClick,
      onMouseDown,
      setContainerRef,
    } = useTableHeader({
      allowDragColumnHeader,
      columns,
      customHeaderCount,
      headings,
      onHeightMeasured,
      onMoveColumn,
      onSortColumn,
      tableConfig,
    });

    return (
      <div
        className={`${classBase}-col-headings`}
        ref={setContainerRef}
        role="rowgroup"
      >
        {headings.map((colHeaders, i) => (
          <div
            className="vuuTable-heading"
            key={i}
            role="row"
            aria-rowindex={i + 1}
          >
            {colHeaders.map(({ label, width }, j) => (
              <div key={j} className="vuuTable-headingCell" style={{ width }}>
                {label}
              </div>
            ))}
          </div>
        ))}
        <div
          className={`${classBase}-col-headers`}
          role="row"
          aria-rowindex={headings.length + 1}
        >
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
                column={col}
                data-index={i}
                key={col.name}
                onMoveColumn={onMoveGroupColumn}
                onRemoveColumn={onRemoveGroupColumn}
                onResize={onResizeColumn}
              />
            ) : (
              <HeaderCell
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
            ),
          )}
          {draggableColumn}
        </div>
        {customHeaders}
      </div>
    );
  },
);
TableHeader.displayName = "TableHeader";
