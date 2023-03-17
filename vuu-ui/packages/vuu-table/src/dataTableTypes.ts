import {
  DataSource,
  DataSourceRow,
  VuuFeatureInvocationMessage,
  VuuFeatureMessage,
} from "@finos/vuu-data";
import {
  KeyedColumnDescriptor,
  GridConfig,
  TableHeadings,
  SelectionChangeHandler,
  TableSelectionModel,
} from "@finos/vuu-datagrid-types";
import { HTMLAttributes, MouseEvent } from "react";

export type tableLayoutType = "row" | "column";

export interface TableProps extends HTMLAttributes<HTMLDivElement> {
  allowConfigEditing?: boolean;
  config: Omit<GridConfig, "headings">;
  dataSource: DataSource;
  headerHeight?: number;
  height?: number;
  onConfigChange?: (config: Omit<GridConfig, "headings">) => void;
  /**
   * Features like context menu actions and visual links are enabled by the Vuu server.
   * This callback allows us to receive a notification when such a feature is available.
   * The options provided must then be used to configure appropriate UI affordances.
   */
  onFeatureEnabled?: (message: VuuFeatureMessage) => void;
  /**
   * When a Vuu feature e.g. context menu action, has been invoked, the Vuu server
   * response must be handled. This callback provides that response.
   */
  onFeatureInvocation?: (message: VuuFeatureInvocationMessage) => void;
  onShowConfigEditor?: () => void;
  onSelectionChange?: SelectionChangeHandler;
  renderBufferSize?: number;
  rowHeight?: number;
  selectionModel?: TableSelectionModel;
  tableLayout?: tableLayoutType;
  width?: number;
  zebraStripes?: boolean;
}

export type TableColumnResizeHandler = (
  phase: "begin" | "resize" | "end",
  columnName: string,
  width?: number
) => void;

export interface TableImplementationProps {
  columns: KeyedColumnDescriptor[];
  columnsWithinViewport: KeyedColumnDescriptor[];
  data: DataSourceRow[];
  headerHeight: number;
  headings: TableHeadings;
  onColumnResize?: TableColumnResizeHandler;
  onHeaderCellDragEnd?: () => void;
  onHeaderCellDragStart?: (evt: MouseEvent) => void;
  onContextMenu?: (evt: MouseEvent<HTMLElement>) => void;
  onRemoveColumnFromGroupBy?: (column: KeyedColumnDescriptor) => void;
  onRowClick?: RowClickHandler;
  onSort: (column: KeyedColumnDescriptor, isAdditive: boolean) => void;
  onToggleGroup?: (row: DataSourceRow, column: KeyedColumnDescriptor) => void;
  virtualColSpan?: number;
  rowCount: number;
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

export type RowClickHandler = (
  row: DataSourceRow,
  rangeSelect: boolean,
  keepExistingSelection: boolean
) => void;
