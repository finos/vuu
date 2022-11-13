import { DataSource } from "@finos/vuu-data";
import { Filter } from "@finos/vuu-utils";
import { HTMLAttributes } from "react";
import {
  VuuAggregation,
  VuuFilter,
  VuuGroupBy,
  VuuRange,
  VuuSort,
} from "../../vuu-protocol-types";
import { AdornmentsDescriptor } from "./grid-adornments";
import { GridModelType } from "./grid-model/gridModelTypes";

export interface ColumnType {
  name: string;
  renderer?: {
    name: string;
  };
}

export interface ColumnDescriptor {
  className?: string;
  flex?: number;
  isSystemColumn?: boolean;
  label?: string;
  name: string;
  sortable?: boolean;
  type?: ColumnType;
  width?: number;
}

export type ColumnDragState = {
  column: unknown;
  columnGroupIdx: number;
  columnIdx: number;
  initialColumnPosition: number;
  columnPositions: unknown;
  mousePosition: number;
};

export interface ConfigChange {
  aggregations?: VuuAggregation[];
  columns?: ColumnDescriptor[];
  filter?: VuuFilter;
  group?: VuuGroupBy;
  sort?: VuuSort;
  type?: "columns";
}

export type ConfigChangedHandler = (config: ConfigChange) => void;

export type RowClickHandler = () => void;

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  aggregations?: VuuAggregation[];
  cellSelectionModel?: "none";
  columns: ColumnDescriptor[];
  columnSizing?: "fill" | "static";
  dataSource: DataSource;
  defaultColumnWidth?: number;
  filter?: Filter; // is thei sthe right type ?
  groupBy?: VuuGroupBy;
  headerHeight?: number;
  height?: number;
  minColumnWidth?: number;
  noColumnHeaders?: boolean;
  onConfigChange?: ConfigChangedHandler;
  onRowClick?: RowClickHandler;
  renderBufferSize?: number;
  rowHeight?: number;
  selectionModel?: "none" | "checkbox"; // there are others
  showLineNumbers?: boolean;
  sort?: VuuSort;
  width?: number;
}

export type dragPhase = "drag-start" | "drag" | "drag-end";

export interface ViewportProps {
  columnDragData?: ColumnDragState;
  custom: AdornmentsDescriptor;
  dataSource: DataSource;
  gridModel: GridModelType;
  onChangeRange: (range: VuuRange) => void;
  onColumnDrop?: (phase: DragPhase, column: any) => void;
  onColumnDragStart?: any;
  onConfigChange?: ConfigChangedHandler;
  onRowClick?: RowClickHandler;
}
