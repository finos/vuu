import {
  DataSource,
  SchemaColumn,
  VuuFeatureInvocationMessage,
} from "@finos/vuu-data";
import {
  SelectionChangeHandler,
  TableConfig,
  TableRowClickHandler,
  TableSelectionModel,
} from "@finos/vuu-datagrid-types";
import { DataSourceRow } from "@finos/vuu-data-types";
import {
  MeasuredContainer,
  MeasuredContainerProps,
  useId,
} from "@finos/vuu-layout";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { DragStartHandler, dragStrategy } from "@finos/vuu-ui-controls";
import { isGroupColumn, metadataKeys, notHidden } from "@finos/vuu-utils";
import { useForkRef } from "@salt-ds/core";
import cx from "classnames";
import { CSSProperties, FC, ForwardedRef, forwardRef, useRef } from "react";
import {
  GroupHeaderCellNext as GroupHeaderCell,
  HeaderCell,
} from "./header-cell";
import { Row as DefaultRow, RowProps } from "./Row";
import { useTable } from "./useTableNext";

import "./TableNext.css";

const classBase = "vuuTableNext";

const { IDX, RENDER_IDX } = metadataKeys;

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

export const TableNext = forwardRef(function TableNext(
  {
    Row = DefaultRow,
    allowDragDrop,
    availableColumns,
    className: classNameProp,
    config,
    dataSource,
    disableFocus = false,
    highlightedIndex: highlightedIndexProp,
    id: idProp,
    navigationStyle = "cell",
    onAvailableColumnsChange,
    onConfigChange,
    onDragStart,
    onDrop,
    onFeatureInvocation,
    onHighlight,
    onRowClick: onRowClickProp,
    onSelect,
    onSelectionChange,
    onShowConfigEditor: onShowSettings,
    renderBufferSize = 0,
    rowHeight = 20,
    selectionModel = "extended",
    showColumnHeaders = true,
    headerHeight = showColumnHeaders ? 25 : 0,
    style: styleProp,
    ...htmlAttributes
  }: TableProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const id = useId(idProp);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    columnMap,
    columns,
    data,
    draggableColumn,
    draggableRow,
    dragDropHook,
    handleContextMenuAction,
    headerProps,
    highlightedIndex,
    onDataEdited,
    onRemoveGroupColumn,
    onResize,
    onRowClick,
    onToggleGroup,
    menuBuilder,
    scrollProps,
    tableAttributes,
    viewportMeasurements,
    ...tableProps
  } = useTable({
    allowDragDrop,
    availableColumns,
    config,
    containerRef,
    dataSource,
    disableFocus,
    headerHeight,
    highlightedIndex: highlightedIndexProp,
    id,
    navigationStyle,
    onAvailableColumnsChange,
    onConfigChange,
    onDragStart,
    onDrop,
    onFeatureInvocation,
    onHighlight,
    onRowClick: onRowClickProp,
    onSelect,
    onSelectionChange,
    renderBufferSize,
    rowHeight,
    selectionModel,
  });

  const getStyle = () => {
    return {
      ...styleProp,
      "--content-height": `${viewportMeasurements.contentHeight}px`,
      "--horizontal-scrollbar-height": `${viewportMeasurements.horizontalScrollbarHeight}px`,
      "--content-width": `${viewportMeasurements.contentWidth}px`,
      "--pinned-width-left": `${viewportMeasurements.pinnedWidthLeft}px`,
      "--pinned-width-right": `${viewportMeasurements.pinnedWidthRight}px`,
      "--header-height": `${headerHeight}px`,
      "--row-height": `${rowHeight}px`,
      "--total-header-height": `${viewportMeasurements.totalHeaderHeight}px`,
      "--vertical-scrollbar-width": `${viewportMeasurements.verticalScrollbarWidth}px`,
      "--viewport-body-height": `${viewportMeasurements.viewportBodyHeight}px`,
    } as CSSProperties;
  };
  const className = cx(classBase, classNameProp, {
    [`${classBase}-colLines`]: tableAttributes.columnSeparators,
    [`${classBase}-rowLines`]: tableAttributes.rowSeparators,
    // [`${classBase}-highlight`]: tableAttributes.showHighlightedRow,
    [`${classBase}-zebra`]: tableAttributes.zebraStripes,
    // [`${classBase}-loading`]: isDataLoading(tableProps.columns),
  });

  return (
    <ContextMenuProvider
      menuActionHandler={handleContextMenuAction}
      menuBuilder={menuBuilder}
    >
      <MeasuredContainer
        {...htmlAttributes}
        className={className}
        id={id}
        onResize={onResize}
        ref={useForkRef(containerRef, forwardedRef)}
        style={getStyle()}
      >
        <div
          className={`${classBase}-scrollbarContainer`}
          ref={scrollProps.scrollbarContainerRef}
        >
          <div className={`${classBase}-scrollbarContent`} />
        </div>
        <div
          className={`${classBase}-contentContainer`}
          ref={scrollProps.contentContainerRef}
        >
          <div
            {...tableProps}
            className={`${classBase}-table`}
            tabIndex={disableFocus ? undefined : -1}
          >
            {showColumnHeaders ? (
              <div className={`${classBase}-col-headings`}>
                <div className={`${classBase}-col-headers`} role="row">
                  {columns.filter(notHidden).map((col, i) =>
                    isGroupColumn(col) ? (
                      <GroupHeaderCell
                        {...headerProps}
                        column={col}
                        data-index={i}
                        key={col.name}
                        onRemoveColumn={onRemoveGroupColumn}
                      />
                    ) : (
                      <HeaderCell
                        {...headerProps}
                        className={cx({
                          "vuuDraggable-dragAway":
                            i === dragDropHook.draggedItemIndex,
                        })}
                        column={col}
                        data-index={i}
                        id={`${id}-col-${i}`}
                        key={col.name}
                      />
                    )
                  )}
                  {draggableColumn}
                </div>
              </div>
            ) : null}
            <div className={`${classBase}-body`}>
              {data.map((data) => (
                <Row
                  columnMap={columnMap}
                  columns={columns}
                  highlighted={highlightedIndex === data[IDX]}
                  key={data[RENDER_IDX]}
                  onClick={onRowClick}
                  onDataEdited={onDataEdited}
                  row={data}
                  offset={rowHeight * data[IDX] + headerHeight}
                  onToggleGroup={onToggleGroup}
                  zebraStripes={tableAttributes.zebraStripes}
                />
              ))}
            </div>
          </div>
        </div>
        {draggableRow}
      </MeasuredContainer>
    </ContextMenuProvider>
  );
});
