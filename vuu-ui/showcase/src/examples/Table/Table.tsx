import { CSSProperties, HTMLAttributes } from "react";
import React, { useRef } from "react";
import { useTableScroll } from "./useTableScroll";
import { RowBasedTable } from "./RowBasedTable";
import { ColumnBasedTable } from "./ColumnBasedTable";

export interface Column {
  name: string;
  pin?: "left" | "right";
  width?: number;
}

const classBase = "vuuTable";

type ColumnMeasurements = {
  pinnedWidthLeft: number;
  unpinnedWidth: number;
};

const measureColumns = (columns: Column[]): ColumnMeasurements => {
  let pinnedWidthLeft = 0;
  let unpinnedWidth = 0;
  const defaultWidth = 100;
  for (const { pin, width = defaultWidth } of columns) {
    if (pin === "left") {
      pinnedWidthLeft += width;
    } else {
      unpinnedWidth += width;
    }
  }
  return { pinnedWidthLeft, unpinnedWidth };
};

const styleHidden: CSSProperties = { display: "none" };
export interface TableProps extends HTMLAttributes<HTMLDivElement> {
  columns: Column[];
  data: string[];
  height: number;
  width: number;
}

export const Table = ({
  columns,
  data,
  height,
  style: styleProp,
  width,
  ...props
}: TableProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const {
    handleRootScroll,
    handleScrollbarScroll,
    tableMeasurements,
    viewportRowCount,
  } = useTableScroll(rootRef, scrollContainerRef, tableContainerRef);

  const { pinnedWidthLeft, unpinnedWidth } = measureColumns(columns);

  const count = data.length;
  const headerHeight = 25;
  const rowHeight = 25;
  // TODO need to allow for data where no scrollbars are necessary
  const scrollbarSize = 15;
  const contentHeight = count * rowHeight;
  const scrollContentHeight = headerHeight + contentHeight + scrollbarSize;
  const scrollContentWidth = pinnedWidthLeft + unpinnedWidth;
  const fillerHeight = (count - viewportRowCount) * rowHeight - headerHeight;

  const style = {
    ...styleProp,
    "--content-height": `${scrollContentHeight}px`,
    "--content-width": `${scrollContentWidth}px`,
    "--filler-height": `${fillerHeight}px`,
    "--pinned-width-left": `${pinnedWidthLeft}px`,
    "--header-height": `${headerHeight}px`,
    "--scrollbar-size": `${scrollbarSize}px`,
    "--table-height": `${height}px`,
    "--table-width": `${width}px`,
  } as CSSProperties;

  const scrollContainerStyle: CSSProperties =
    tableMeasurements.left === -1 && tableMeasurements.top === -1
      ? styleHidden
      : {
          left: tableMeasurements.left + pinnedWidthLeft,
          top: tableMeasurements.top + headerHeight,
        };

  const scrollHeaderStyle: CSSProperties =
    tableMeasurements.left === -1 && tableMeasurements.top === -1
      ? styleHidden
      : {
          top: tableMeasurements.top,
          left: tableMeasurements.right - scrollbarSize,
        };

  const scrollFooterStyle: CSSProperties =
    tableMeasurements.left === -1 && tableMeasurements.top === -1
      ? styleHidden
      : { top: tableMeasurements.top + height, left: tableMeasurements.left };

  // const visibleData = data.slice(0, viewportRowCount);

  return (
    <div
      className={classBase}
      onScroll={handleRootScroll}
      ref={rootRef}
      style={style}
      {...props}
    >
      <div
        className={`${classBase}-scrollContainerHeader`}
        style={scrollHeaderStyle}
      />
      <div
        className={`${classBase}-scrollContainerFooter`}
        style={scrollFooterStyle}
      />
      <div className={`${classBase}-scrollContent`} />
      <div
        className={`${classBase}-scrollContainer`}
        onScroll={handleScrollbarScroll}
        ref={scrollContainerRef}
        style={scrollContainerStyle}
      >
        <div className={`${classBase}-scrollContent`} />
      </div>
      <div className={`${classBase}-tableContainer`} ref={tableContainerRef}>
        {/* <ColumnBasedTable columns={columns} data={data} /> */}
        <RowBasedTable columns={columns} data={data} />
      </div>
    </div>
  );
};
