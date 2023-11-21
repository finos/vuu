import {
  DataSource,
  SchemaColumn,
  VuuFeatureInvocationMessage,
} from "@finos/vuu-data";
import { DataSourceRow } from "@finos/vuu-data-types";
import {
  KeyedColumnDescriptor,
  RowClickHandler,
  SelectionChangeHandler,
  TableConfig,
  TableHeadings,
  TableRowClickHandler,
  TableSelectionModel,
} from "@finos/vuu-datagrid-types";
import { MeasuredContainerProps } from "@finos/vuu-layout";
import { DragStartHandler, dragStrategy } from "@finos/vuu-ui-controls";
import { FC, MouseEvent } from "react";
import { RowProps } from "../table-next/Row";

// TODO implement a Model object to represent a row data for better API
export type TableRowSelectHandler = (row: DataSourceRow) => void;

export type TableNavigationStyle = "none" | "cell" | "row";

export interface TableProps
  extends Omit<MeasuredContainerProps, "onDragStart" | "onDrop" | "onSelect"> {
  Row?: FC<RowProps>;
  allowConfigEditing?: boolean;
  allowDragDrop?: boolean | dragStrategy;
  /**
   * required if a fully featured column picker is to be available
   */
  availableColumns?: SchemaColumn[];
  config: TableConfig;
  dataSource: DataSource;
  disableFocus?: boolean;
  headerHeight?: number;
  /**
   * Defined how focus navigation within data cells will be handled by table.
   * Default is cell.
   */
  highlightedIndex?: number;
  navigationStyle?: TableNavigationStyle;
  /**
   * required if a fully featured column picker is to be available.
   * Available columns can be changed by the addition or removal of
   * one or more calculated columns.
   */
  onAvailableColumnsChange?: (columns: SchemaColumn[]) => void;
  /**
   * This callback will be invoked any time a config attribute of TableConfig
   * is changed. By persisting this value and providing it to the Table as a
   * prop, table state can be persisted across sessions.
   */
  onConfigChange?: (config: TableConfig) => void;
  onDragStart?: DragStartHandler;
  onDrop?: () => void;
  /**
   * When a Vuu feature e.g. context menu action, has been invoked, the Vuu server
   * response must be handled. This callback provides that response.
   */
  onFeatureInvocation?: (message: VuuFeatureInvocationMessage) => void;

  onHighlight?: (idx: number) => void;
  /**
   * callback invoked when user 'clicks' a table row. CLick triggered either
   * via mouse click or keyboard (default ENTER);
   */
  onRowClick?: TableRowClickHandler;
  onShowConfigEditor?: () => void;
  onSelect?: TableRowSelectHandler;
  onSelectionChange?: SelectionChangeHandler;
  renderBufferSize?: number;
  rowHeight?: number;
  /**
   * Selection Bookends style the left and right edge of a selection block.
   * They are optional, value defaults to zero.
   * TODO this should just live in CSS
   */
  selectionBookendWidth?: number;
  selectionModel?: TableSelectionModel;
  /**
   * if false, table rendered without headers. Useful when table is being included in a
   * composite component.
   */
  showColumnHeaders?: boolean;
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
  getRowOffset: (row: DataSourceRow) => number;
  headerHeight: number;
  headings: TableHeadings;
  onColumnResize?: TableColumnResizeHandler;
  onHeaderCellDragEnd?: () => void;
  onHeaderCellDragStart?: (evt: MouseEvent) => void;
  onContextMenu?: (evt: MouseEvent<HTMLElement>) => void;
  onRemoveColumnFromGroupBy?: (column?: KeyedColumnDescriptor) => void;
  onRowClick?: RowClickHandler;
  onSort: (column: KeyedColumnDescriptor, isAdditive: boolean) => void;
  onToggleGroup?: (row: DataSourceRow, column: KeyedColumnDescriptor) => void;
  tableId: string;
  virtualColSpan?: number;
  rowCount: number;
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
  maxScrollContainerScrollHorizontal: number;
  maxScrollContainerScrollVertical: number;
  pinnedWidthLeft: number;
  rowCount: number;
  // contentWidth: number;
}
