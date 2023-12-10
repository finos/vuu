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
} from "@finos/vuu-table-types";
import { DataSourceRow } from "@finos/vuu-data-types";
import {
  MeasuredContainer,
  MeasuredContainerProps,
  MeasuredSize,
  useId,
} from "@finos/vuu-layout";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { DragStartHandler, dragStrategy } from "@finos/vuu-ui-controls";
import { metadataKeys } from "@finos/vuu-utils";
import { useForkRef } from "@salt-ds/core";
import cx from "classnames";
import {
  CSSProperties,
  FC,
  ForwardedRef,
  forwardRef,
  RefObject,
  useRef,
  useState,
} from "react";
import { Row as DefaultRow, RowProps } from "./Row";
import { useTable } from "./useTable";
import { TableHeader } from "./table-header/TableHeader";

import "./Table.css";
import { DragDropState } from "packages/vuu-ui-controls/src/drag-drop/DragDropState";

const classBase = "vuuTable";

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
  onDrop?: (dragDropState: DragDropState) => void;
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

const TableCore = ({
  Row = DefaultRow,
  allowDragDrop,
  availableColumns,
  config,
  containerRef,
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
  renderBufferSize = 0,
  rowHeight = 20,
  selectionModel = "extended",
  showColumnHeaders = true,
  headerHeight = showColumnHeaders ? 25 : 0,
  size,
}: TableProps & {
  containerRef: RefObject<HTMLDivElement>;
  size: MeasuredSize;
}) => {
  const id = useId(idProp);
  const {
    columnMap,
    columns,
    data,
    draggableRow,
    handleContextMenuAction,
    headings,
    highlightedIndex,
    onDataEdited,
    onMoveColumn,
    onMoveGroupColumn,
    onRemoveGroupColumn,
    onResizeColumn,
    onRowClick,
    onSortColumn,
    onToggleGroup,
    menuBuilder,
    scrollProps,
    tableAttributes,
    tableConfig,
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
    size,
  });

  const className = cx(`${classBase}-contentContainer`, {
    [`${classBase}-colLines`]: tableAttributes.columnSeparators,
    [`${classBase}-rowLines`]: tableAttributes.rowSeparators,
    // [`${classBase}-highlight`]: tableAttributes.showHighlightedRow,
    [`${classBase}-zebra`]: tableAttributes.zebraStripes,
    // [`${classBase}-loading`]: isDataLoading(tableProps.columns),
  });

  const cssVariables = {
    "--content-height": `${viewportMeasurements.contentHeight}px`,
    "--content-width": `${viewportMeasurements.contentWidth}px`,
    "--horizontal-scrollbar-height": `${viewportMeasurements.horizontalScrollbarHeight}px`,
    "--pinned-width-left": `${viewportMeasurements.pinnedWidthLeft}px`,
    "--pinned-width-right": `${viewportMeasurements.pinnedWidthRight}px`,
    "--header-height": `${headerHeight}px`,
    "--row-height": `${rowHeight}px`,
    "--total-header-height": `${viewportMeasurements.totalHeaderHeight}px`,
    "--vertical-scrollbar-width": `${viewportMeasurements.verticalScrollbarWidth}px`,
    "--viewport-body-height": `${viewportMeasurements.viewportBodyHeight}px`,
  } as CSSProperties;

  return (
    <ContextMenuProvider
      menuActionHandler={handleContextMenuAction}
      menuBuilder={menuBuilder}
    >
      <div
        className={`${classBase}-scrollbarContainer`}
        ref={scrollProps.scrollbarContainerRef}
        style={cssVariables}
      >
        <div className={`${classBase}-scrollbarContent`} />
      </div>
      <div
        className={className}
        ref={scrollProps.contentContainerRef}
        style={cssVariables}
      >
        <div
          {...tableProps}
          className={`${classBase}-table`}
          tabIndex={disableFocus ? undefined : -1}
        >
          {showColumnHeaders ? (
            <TableHeader
              columns={columns}
              headings={headings}
              onMoveColumn={onMoveColumn}
              onMoveGroupColumn={onMoveGroupColumn}
              onRemoveGroupColumn={onRemoveGroupColumn}
              onResizeColumn={onResizeColumn}
              onSortColumn={onSortColumn}
              tableConfig={tableConfig}
              tableId={id}
            />
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
                offset={
                  rowHeight * data[IDX] + viewportMeasurements.totalHeaderHeight
                }
                onToggleGroup={onToggleGroup}
                zebraStripes={tableAttributes.zebraStripes}
              />
            ))}
          </div>
        </div>
      </div>
      {draggableRow}
    </ContextMenuProvider>
  );
};

export const Table = forwardRef(function TableNext(
  {
    Row,
    allowDragDrop,
    availableColumns,
    className: classNameProp,
    config,
    dataSource,
    disableFocus,
    highlightedIndex,
    id,
    navigationStyle,
    onAvailableColumnsChange,
    onConfigChange,
    onDragStart,
    onDrop,
    onFeatureInvocation,
    onHighlight,
    onRowClick,
    onSelect,
    onSelectionChange,
    renderBufferSize,
    rowHeight,
    selectionModel,
    showColumnHeaders,
    headerHeight,
    style: styleProp,
    ...htmlAttributes
  }: TableProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState<MeasuredSize>();

  return (
    <MeasuredContainer
      {...htmlAttributes}
      className={cx(classBase, classNameProp)}
      id={id}
      onResize={setSize}
      ref={useForkRef(containerRef, forwardedRef)}
    >
      {size ? (
        <TableCore
          Row={Row}
          allowDragDrop={allowDragDrop}
          availableColumns={availableColumns}
          config={config}
          containerRef={containerRef}
          dataSource={dataSource}
          disableFocus={disableFocus}
          headerHeight={headerHeight}
          highlightedIndex={highlightedIndex}
          id={id}
          navigationStyle={navigationStyle}
          onAvailableColumnsChange={onAvailableColumnsChange}
          onConfigChange={onConfigChange}
          onDragStart={onDragStart}
          onDrop={onDrop}
          onFeatureInvocation={onFeatureInvocation}
          onHighlight={onHighlight}
          onRowClick={onRowClick}
          onSelect={onSelect}
          onSelectionChange={onSelectionChange}
          renderBufferSize={renderBufferSize}
          rowHeight={rowHeight}
          selectionModel={selectionModel}
          showColumnHeaders={showColumnHeaders}
          size={size}
        />
      ) : null}
    </MeasuredContainer>
  );
});
