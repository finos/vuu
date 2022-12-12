import { ConfigChangeHandler, DataSource } from "@vuu-ui/vuu-data";
import { Filter } from "@vuu-ui/vuu-filters";
import { HTMLAttributes } from "react";
import {
  VuuAggregation,
  VuuGroupBy,
  VuuRange,
  VuuSort,
} from "../../vuu-protocol-types";
import { AdornmentsDescriptor } from "./grid-adornments";
import {
  GridModelType,
  ColumnDescriptor,
  KeyedColumnDescriptor,
} from "./grid-model/gridModelTypes";

export type dragPhase = "drag-start" | "drag" | "drag-end";
export type resizePhase = "begin" | "resize" | "end";

export type ColumnDragState = {
  column: KeyedColumnDescriptor;
  columnGroupIdx: number;
  columnIdx: number;
  initialColumnPosition: number;
  columnPositions: number[][];
  mousePosition: number;
};

export type ColumnDragStartHandler = (
  phase: dragPhase,
  columnGroupIdx: number,
  column: unknown,
  columnPosition: number,
  mousePosition: number
) => void;

export type RowClickHandler = (row: HTMLElement) => void;

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  aggregations?: VuuAggregation[];
  cellSelectionModel?: "none";
  columns: ColumnDescriptor[];
  columnSizing?: "fill" | "static";
  dataSource: DataSource;
  defaultColumnWidth?: number;
  filter?: Filter; // is thei sthe right type ?
  groupBy?: VuuGroupBy;
  /**
   * Set height for column headers. If not provided, row height will be determined
   * by CSS. With default styles, this will vary by density, 24px in High Density
   * mode.
   */
  headerHeight?: number;
  /**
   * Height of the Grid. Must be a pixel value. If not supplied, Grid will fill 100% of
   * container height
   */
  height?: number;
  /**
   * The minimum width resizeable columns can be reduced to. If not provided, the default will be 30.
   */
  minColumnWidth?: number;
  noColumnHeaders?: boolean;
  onConfigChange?: ConfigChangeHandler;
  onRowClick?: RowClickHandler;
  renderBufferSize?: number;
  /**
   * Set row height. If not provided, row height will be determined by CSS, With
   * default styles, this will vary by density, 20px in High Density mode.
   */
  rowHeight?: number;
  selectionModel?: "none" | "single" | "checkbox" | "extended"; // there are others
  showLineNumbers?: boolean;
  sort?: VuuSort;
  /**
   * Width of the Grid. Must be a pixel value. If not supplied, Grid will fill 100% of
   * container widths
   */
  width?: number;
}

export interface ViewportProps {
  columnDragData?: ColumnDragState;
  custom: AdornmentsDescriptor;
  dataSource: DataSource;
  gridModel: GridModelType;
  onChangeRange: (range: VuuRange) => void;
  onColumnDrop?: (
    phase: dragPhase,
    column: KeyedColumnDescriptor,
    index: number
  ) => void;
  onColumnDragStart?: ColumnDragStartHandler;
  onConfigChange?: ConfigChangeHandler;
  onRowClick?: RowClickHandler;
}
