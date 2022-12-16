import { DataSourceRow } from "@finos/vuu-data";
import { ColumnMap } from "@finos/vuu-utils";
import { HTMLAttributes, MouseEvent } from "react";

export type tableLayoutType = "row" | "column";

export interface Column {
  name: string;
  pin?: "left" | "right";
  pinnedLeftOffset?: number;
  width?: number;
}

export interface TableProps extends HTMLAttributes<HTMLDivElement> {
  columns: Column[];
  data: DataSourceRow[];
  headerHeight?: number;
  height?: number;
  rowHeight?: number;
  tableLayout?: tableLayoutType;
  width?: number;
}

export interface TableImplementationProps
  extends Pick<TableProps, "columns" | "data"> {
  columnMap: ColumnMap;
  headerHeight: number;
  onHeaderCellDragEnd?: () => void;
  onHeaderCellDragStart?: (evt: MouseEvent) => void;
  rowHeight: number;
}

type MeasureStatus = "unmeasured" | "measured";

export interface TableMeasurements {
  contentHeight: number;
  left: number;
  right: number;
  scrollbarSize: number;
  scrollContentHeight: number;
  status: MeasureStatus;
  top: number;
}

export interface Viewport {
  fillerHeight: number;
  maxScrollContainerScrollHorizontal: number;
  maxScrollContainerScrollVertical: number;
  pinnedWidthLeft: number;
  rowCount: number;
  scrollContentWidth: number;
}
