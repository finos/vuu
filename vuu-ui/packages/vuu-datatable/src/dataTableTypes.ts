import { DataSource, DataSourceRow } from "@finos/vuu-data";
import { KeyedColumnDescriptor, GridConfig } from "@finos/vuu-datagrid-types";
import { HTMLAttributes, MouseEvent } from "react";

export type tableLayoutType = "row" | "column";

export interface Column {
  name: string;
  pin?: "left" | "right";
  // TODO add this to internal extension of Column type
  pinnedLeftOffset?: number;
  width?: number;
}

export interface TableProps extends HTMLAttributes<HTMLDivElement> {
  config: GridConfig;
  data?: DataSourceRow[];
  dataSource?: DataSource;
  headerHeight?: number;
  height?: number;
  rowHeight?: number;
  onConfigChange?: (config: GridConfig) => void;
  onShowConfigEditor?: () => void;
  allowConfigEditing?: boolean;
  tableLayout?: tableLayoutType;
  width?: number;
}

export type ValueFormatter = (value: unknown) => string;
export type ValueFormatters = {
  [key: string]: ValueFormatter;
};

export type TableColumnResizeHandler = (
  phase: "begin" | "resize" | "end",
  columnName: string,
  width?: number
) => void;

export interface TableImplementationProps {
  columns: KeyedColumnDescriptor[];
  data: DataSourceRow[];
  headerHeight: number;
  onColumnResize?: TableColumnResizeHandler;
  onHeaderCellDragEnd?: () => void;
  onHeaderCellDragStart?: (evt: MouseEvent) => void;
  onRemoveColumnFromGroupBy?: (column: KeyedColumnDescriptor) => void;
  onSort: (column: KeyedColumnDescriptor, isAdditive: boolean) => void;
  onToggleGroup?: (row: DataSourceRow) => void;
  rowHeight: number;
  valueFormatters?: ValueFormatters;
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
