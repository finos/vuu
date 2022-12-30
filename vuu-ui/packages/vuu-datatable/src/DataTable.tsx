import { Button } from "@salt-ds/core";
import { CSSProperties, useCallback, useRef } from "react";
import { ColumnBasedTable } from "./ColumnBasedTable";
import { TableProps } from "./dataTableTypes";
import { RowBasedTable } from "./RowBasedTable";
import { useDraggableColumn } from "./useDraggableColumn";
import { isFullSize, isMeasured, useMeasuredSize } from "./useMeasuredSize";
import { useTableData } from "./useTableData";
import { useTableScroll } from "./useTableScroll";
import { useTableViewport } from "./useTableViewport";

import "./DataTable.css";

const classBase = "vuuDataTable";

const styleHidden: CSSProperties = { display: "none" };

export const DataTable = ({
  config,
  data: dataProp,
  dataSource,
  headerHeight = 25,
  height,
  onConfigChange,
  onShowConfigEditor: onShowSettings,
  rowHeight = 20,
  allowConfigEditing: showSettings = false,
  style: styleProp,
  tableLayout: tableLayoutProp = "row",
  width,
  ...props
}: TableProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollableRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const {
    columnMap,
    columns,
    data,
    dispatchColumnAction,
    setRangeVertical,
    rowCount,
  } = useTableData({
    config,
    data: dataProp,
    dataSource,
    onConfigChange,
  });

  const size = useMeasuredSize(rootRef, height, width);

  const { measurements, viewport } = useTableViewport({
    columns,
    headerHeight,
    rootRef: scrollableRef,
    rowCount,
    rowHeight,
    size,
  });

  const handleDropColumn = useCallback(
    (fromIndex: number, toIndex: number) => {
      const column = columns[fromIndex];
      dispatchColumnAction({ type: "moveColumn", column, moveTo: toIndex });
    },
    [columns, dispatchColumnAction]
  );

  const { handleRootScroll, handleScrollbarScroll } = useTableScroll({
    onRangeChange: setRangeVertical,
    rootRef: scrollableRef,
    rowHeight,
    scrollContainerRef,
    tableContainerRef,
    viewport,
    viewportHeight: size.pixelHeight - headerHeight,
  });

  const {
    draggable,
    draggedItemIndex,
    tableLayout,
    handleHeaderCellDragStart,
  } = useDraggableColumn({
    onDrop: handleDropColumn,
    tableContainerRef,
    tableLayout: tableLayoutProp,
  });

  if (isFullSize(size) && !isMeasured(size)) {
    return (
      <div
        className={`${classBase}-root`}
        ref={rootRef}
        style={
          {
            "--table-height": `100%`,
            "--table-width": `100%`,
          } as CSSProperties
        }
        {...props}
      />
    );
  }

  const style = {
    ...styleProp,
    "--content-height": `${measurements.scrollContentHeight}px`,
    "--content-width": `${viewport.scrollContentWidth}px`,
    "--filler-height": `${viewport.fillerHeight}px`,
    "--pinned-width-left": `${viewport.pinnedWidthLeft}px`,
    "--header-height": `${headerHeight}px`,
    "--row-height": `${rowHeight}px`,
    "--scrollbar-size": `${measurements.scrollbarSize}px`,
    "--table-pixel-height": `${size.pixelHeight}px`,
    "--table-pixel-width": `${size.pixelWidth}px`,
    "--table-height": isFullSize(size) ? size.height : `${size.pixelHeight}px`,
    "--table-width": isFullSize(size) ? size.width : `${size.pixelWidth}px`,
  } as CSSProperties;

  const scrollContainerStyle: CSSProperties =
    measurements.left === -1 && measurements.top === -1
      ? styleHidden
      : {
          left: viewport.pinnedWidthLeft - 1,
          // The -1 is to align the top border, might cause innaccuracy
          // It is compensated by a hardcoded adjustment in css
          // top: measurements.top - 1 + headerHeight,
          top: headerHeight - 1,
        };

  const Table = tableLayout === "column" ? ColumnBasedTable : RowBasedTable;

  return (
    <div className={classBase} ref={rootRef} style={style}>
      <div
        className={`${classBase}-scrollContainer`}
        onScroll={handleScrollbarScroll}
        ref={scrollContainerRef}
        style={scrollContainerStyle}
      >
        <div className={`${classBase}-scrollContent`} />
      </div>
      <div
        className={`${classBase}-content`}
        onScroll={handleRootScroll}
        ref={scrollableRef}
        {...props}
      >
        <div className={`${classBase}-scrollContent`} />
        <div className={`${classBase}-tableContainer`} ref={tableContainerRef}>
          <Table
            columnMap={columnMap}
            columns={columns.filter((col, i) => i !== draggedItemIndex)}
            data={data}
            headerHeight={headerHeight}
            onHeaderCellDragStart={
              tableLayout === "row" ? handleHeaderCellDragStart : undefined
            }
            rowHeight={rowHeight}
          />
        </div>
        {draggable}
      </div>
      {showSettings ? (
        <Button
          className={`${classBase}-settings`}
          data-icon="settings"
          onClick={onShowSettings}
          variant="secondary"
        />
      ) : null}
    </div>
  );
};
