import { VuuSortType } from "@vuu-ui/vuu-protocol-types";
import {
  DragDropProvider,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  RestrictToHorizontalAxis,
} from "@vuu-ui/vuu-utils";
import {
  ColumnDescriptor,
  ColumnMoveHandler,
  CustomHeader,
  CustomHeaderComponent,
  CustomHeaderElement,
  HeaderCellProps,
  RuntimeColumnDescriptor,
  TableColumnResizeHandler,
  TableConfig,
  TableHeadings,
} from "@vuu-ui/vuu-table-types";
import { isGroupColumn, isNotHidden } from "@vuu-ui/vuu-utils";
import {
  cloneElement,
  isValidElement,
  memo,
  ReactElement,
  useMemo,
} from "react";
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

export interface TableHeaderProps
  extends Pick<
    HeaderCellProps,
    | "allRowsSelected"
    | "allowDragColumnHeader"
    | "allowSelectAll"
    | "onCheckBoxColumnHeaderClick"
    | "showColumnHeaderMenus"
  > {
  classBase?: string;
  columns: RuntimeColumnDescriptor[];
  customHeader?: CustomHeader | CustomHeader[];
  headings: TableHeadings;
  onHeightMeasured: (height: number, count: number) => void;
  onResizeColumn: TableColumnResizeHandler;
  onMoveColumn: ColumnMoveHandler;
  onMoveGroupColumn: (columns: ColumnDescriptor[]) => void;
  onRemoveGroupColumn: (column: RuntimeColumnDescriptor) => void;
  onSortColumn: ColumnSortHandler;
  tableConfig: TableConfig;
  tableId: string;
  virtualColSpan?: number;
}

export const TableHeader = memo(
  ({
    allowDragColumnHeader,
    allowSelectAll,
    allRowsSelected,
    classBase = "vuuTable",
    columns,
    customHeader,
    headings,
    onCheckBoxColumnHeaderClick,
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
      [ReactElement | ReactElement[] | null, number]
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

      const enrichElementWithAria = (el: ReactElement, rowIndex: number) => {
        const offset = headings.length;
        return cloneElement(el, {
          "aria-rowindex": rowIndex + offset + 2,
          ariaRole: "row",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
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

    const { dragColumn, onClick, onDragEnd, onDragStart, setContainerRef } =
      useTableHeader({
        columns,
        customHeaderCount,
        headings,
        onHeightMeasured,
        onMoveColumn,
        onSortColumn,
        tableConfig,
      });

    const visibleColumns = columns.filter(isNotHidden);

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
        <DragDropProvider // whats the difference between this and DnDContext
          onDragEnd={onDragEnd}
          onDragStart={onDragStart}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore typing error from dnd-kit
          modifiers={[RestrictToHorizontalAxis]}
          sensors={[
            KeyboardSensor.configure({
              keyboardCodes: {
                start: ["Space"],
                cancel: ["Escape"],
                end: ["Space", "Enter"],
                left: ["ArrowLeft"],
                right: ["ArrowRight"],
                up: [],
                down: [],
              },
            }),
            PointerSensor,
          ]}
        >
          <div
            className={`${classBase}-col-headers`}
            role="row"
            aria-rowindex={headings.length + 1}
          >
            {visibleColumns.map((col, i) =>
              isGroupColumn(col) ? (
                <GroupHeaderCell
                  column={col}
                  id={`${tableId}-${col.name}`}
                  key={col.name}
                  onMoveColumn={onMoveGroupColumn}
                  onRemoveColumn={onRemoveGroupColumn}
                  onResize={onResizeColumn}
                />
              ) : (
                <HeaderCell
                  allowDragColumnHeader={allowDragColumnHeader}
                  allowSelectAll={allowSelectAll}
                  allRowsSelected={allRowsSelected}
                  column={col}
                  index={i}
                  id={`${tableId}-${col.name}`}
                  key={col.name}
                  onCheckBoxColumnHeaderClick={onCheckBoxColumnHeaderClick}
                  onClick={onClick}
                  onResize={onResizeColumn}
                  showColumnHeaderMenus={showColumnHeaderMenus}
                />
              ),
            )}
          </div>
          <DragOverlay>
            {dragColumn ? (
              <div id={dragColumn.id} className="DragColumn">
                <HeaderCell
                  column={dragColumn.column}
                  className="vuuDragging"
                  id={`${tableId}-${dragColumn.id}-dragging`}
                  index={-1}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DragDropProvider>
        {customHeaders}
      </div>
    );
  },
);
TableHeader.displayName = "TableHeader";
