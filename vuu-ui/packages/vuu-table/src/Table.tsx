import {
  DataSource,
  SchemaColumn,
  SelectionChangeHandler,
} from "@finos/vuu-data-types";
import { ContextMenuProvider } from "@finos/vuu-popups";
import {
  CustomHeader,
  RowProps,
  TableConfig,
  TableConfigChangeHandler,
  TableRowClickHandler,
  TableRowSelectHandler,
  TableSelectionModel,
} from "@finos/vuu-table-types";
import type { DragDropState } from "@finos/vuu-ui-controls";
import {
  DragStartHandler,
  MeasuredContainer,
  MeasuredContainerProps,
  MeasuredSize,
  dragStrategy,
  reduceSizeHeight,
} from "@finos/vuu-ui-controls";
import { metadataKeys, useId } from "@finos/vuu-utils";
import { GoToInput, Pagination, Paginator, useForkRef } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  CSSProperties,
  FC,
  ForwardedRef,
  RefObject,
  forwardRef,
  useRef,
  useState,
} from "react";
import { Row as DefaultRow, RowProxy } from "./Row";
import { TableHeader } from "./table-header";
import { useMeasuredHeight } from "./useMeasuredHeight";
import { useTable } from "./useTable";
import { ScrollingAPI } from "./useTableScroll";

import tableCss from "./Table.css";
import { usePagination } from "./usePagination";

const classBase = "vuuTable";

const { IDX, RENDER_IDX } = metadataKeys;

export type TableNavigationStyle = "none" | "cell" | "row";

export interface TableProps
  extends Omit<MeasuredContainerProps, "onDragStart" | "onDrop" | "onSelect"> {
  Row?: FC<RowProps>;
  allowConfigEditing?: boolean;
  /**
   * Allow column headers to be dragged to re-arrange
   */
  allowDragColumnHeader?: boolean;
  /**
   * Allow rows to be draggable
   */
  allowDragDrop?: boolean | dragStrategy;
  /**
   * required if a fully featured column picker is to be available
   */
  availableColumns?: SchemaColumn[];
  /**
   * Provide configuration settings for Table. At minimun, column
   * descriptors must be provided.
   */
  config: TableConfig;
  dataSource: DataSource;
  disableFocus?: boolean;
  /**
   * Allows additional custom element(s) to be embedded immediately below column headers.
   * Could be used to present inline filters for example.
   * Accepts either a React Element or a Function Component or an array of these. If a React
   * Function Component is used, it will be passed the props described in BaseRowProps.
   */
  customHeader?: CustomHeader | CustomHeader[];
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
  onConfigChange?: TableConfigChangeHandler;
  onDragStart?: DragStartHandler;
  onDrop?: (dragDropState: DragDropState) => void;

  onHighlight?: (idx: number) => void;
  /**
   * callback invoked when user 'clicks' a table row. CLick triggered either
   * via mouse click or keyboard (default ENTER);
   */
  onRowClick?: TableRowClickHandler;
  onSelect?: TableRowSelectHandler;
  onSelectionChange?: SelectionChangeHandler;
  renderBufferSize?: number;
  /**
   * Pixel height of rows. If specified here, this will take precedence over CSS
   * values and Table will not respond to density changes.
   */
  rowHeight?: number;
  /**
   * imperative API for scrolling table
   */
  scrollingApiRef?: ForwardedRef<ScrollingAPI>;

  /**
   * Selection Bookends style the left and right edge of a selection block.
   * They are optional, value defaults to zero.
   * TODO this should just live in CSS
   */
  selectionBookendWidth?: number;
  /**
   * Selection behaviour for Table:
   * `none` selection disabled
   * `single` no more than one row may be selected
   * `extended` (default) multiple rows can be selected
   * `checkbox` same behaviour as extended, with checkbox column for selection
   */
  selectionModel?: TableSelectionModel;
  /**
   * if false, table rendered without headers. Useful when table is being included in a
   * composite component.
   */
  showColumnHeaders?: boolean;
  /**
   * if false, column headers will not display menu icon. Menu items are still available
   * from contexct menu
   */
  showColumnHeaderMenus?: boolean;
  /**
   * if true, pagination will be used to navigate data, scrollbars will not be rendered
   */
  showPaginationControls?: boolean;
}

const TableCore = ({
  Row = DefaultRow,
  allowDragColumnHeader = true,
  allowDragDrop,
  availableColumns,
  config,
  containerRef,
  customHeader,
  dataSource,
  disableFocus = false,
  highlightedIndex: highlightedIndexProp,
  id: idProp,
  navigationStyle = "cell",
  onAvailableColumnsChange,
  onConfigChange,
  onDragStart,
  onDrop,
  onHighlight,
  onRowClick: onRowClickProp,
  onSelect,
  onSelectionChange,
  renderBufferSize = 0,
  rowHeight,
  scrollingApiRef,
  selectionModel = "extended",
  showColumnHeaders = true,
  showColumnHeaderMenus = true,
  showPaginationControls,
  size,
}: Omit<TableProps, "rowHeight"> & {
  containerRef: RefObject<HTMLDivElement>;
  rowHeight: number;
  size: MeasuredSize;
}) => {
  const id = useId(idProp);
  const {
    columnMap,
    columns,
    data,
    draggableRow,
    getRowOffset,
    handleContextMenuAction,
    headerHeight,
    headings,
    highlightedIndex,
    menuBuilder,
    onDataEdited,
    onHeaderHeightMeasured,
    onMoveColumn,
    onMoveGroupColumn,
    onRemoveGroupColumn,
    onResizeColumn,
    onRowClick,
    onSortColumn,
    onToggleGroup,
    rowClassNameGenerator,
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
    highlightedIndex: highlightedIndexProp,
    id,
    navigationStyle,
    onAvailableColumnsChange,
    onConfigChange,
    onDragStart,
    onDrop,
    onHighlight,
    onRowClick: onRowClickProp,
    onSelect,
    onSelectionChange,
    renderBufferSize,
    rowHeight,
    scrollingApiRef,
    selectionModel,
    showColumnHeaders,
    showPaginationControls,
    size,
  });

  const contentContainerClassName = cx(`${classBase}-contentContainer`, {
    [`${classBase}-colLines`]: tableAttributes.columnSeparators,
    [`${classBase}-rowLines`]: tableAttributes.rowSeparators,
    [`${classBase}-zebra`]: tableAttributes.zebraStripes,
  });

  const cssVariables = {
    "--content-height": `${viewportMeasurements.contentHeight}px`,
    "--content-width": `${viewportMeasurements.contentWidth}px`,
    "--horizontal-scrollbar-height": `${viewportMeasurements.horizontalScrollbarHeight}px`,
    "--pinned-width-left": `${viewportMeasurements.pinnedWidthLeft}px`,
    "--pinned-width-right": `${viewportMeasurements.pinnedWidthRight}px`,
    "--total-header-height": `${headerHeight}px`,
    "--vertical-scrollbar-width": `${viewportMeasurements.verticalScrollbarWidth}px`,
    "--viewport-body-height": `${viewportMeasurements.viewportBodyHeight}px`,
  } as CSSProperties;

  return (
    <ContextMenuProvider
      menuActionHandler={handleContextMenuAction}
      menuBuilder={menuBuilder}
    >
      {showPaginationControls !== true ? (
        <div
          className={`${classBase}-scrollbarContainer`}
          ref={scrollProps.scrollbarContainerRef}
          style={cssVariables}
        >
          <div className={`${classBase}-scrollbarContent`} />
        </div>
      ) : null}
      <div
        className={contentContainerClassName}
        ref={scrollProps.contentContainerRef}
        style={cssVariables}
      >
        <div
          {...tableProps}
          className={`${classBase}-table`}
          role="table"
          tabIndex={disableFocus ? undefined : -1}
        >
          {showColumnHeaders ? (
            <TableHeader
              allowDragColumnHeader={allowDragColumnHeader}
              columns={scrollProps.columnsWithinViewport}
              customHeader={customHeader}
              headings={headings}
              onHeightMeasured={onHeaderHeightMeasured}
              onMoveColumn={onMoveColumn}
              onMoveGroupColumn={onMoveGroupColumn}
              onRemoveGroupColumn={onRemoveGroupColumn}
              onResizeColumn={onResizeColumn}
              onSortColumn={onSortColumn}
              showColumnHeaderMenus={showColumnHeaderMenus}
              tableConfig={tableConfig}
              tableId={id}
              virtualColSpan={scrollProps.virtualColSpan}
            />
          ) : null}
          {showColumnHeaders === false || headerHeight > 0 ? (
            <div className={`${classBase}-body`}>
              {data.map((data) => (
                <Row
                  aria-rowindex={data[0] + 1}
                  classNameGenerator={rowClassNameGenerator}
                  columnMap={columnMap}
                  columns={scrollProps.columnsWithinViewport}
                  highlighted={highlightedIndex === data[IDX]}
                  key={data[RENDER_IDX]}
                  onClick={onRowClick}
                  onDataEdited={onDataEdited}
                  row={data}
                  offset={showPaginationControls ? 0 : getRowOffset(data)}
                  onToggleGroup={onToggleGroup}
                  virtualColSpan={scrollProps.virtualColSpan}
                  zebraStripes={tableAttributes.zebraStripes}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {draggableRow}
    </ContextMenuProvider>
  );
};

export const Table = forwardRef(function Table(
  {
    Row,
    allowDragColumnHeader,
    allowDragDrop,
    availableColumns,
    className: classNameProp,
    config,
    customHeader,
    dataSource,
    disableFocus,
    height,
    highlightedIndex,
    id,
    navigationStyle,
    onAvailableColumnsChange,
    onConfigChange,
    onDragStart,
    onDrop,
    onHighlight,
    onRowClick,
    onSelect,
    onSelectionChange,
    renderBufferSize = 0,
    rowHeight: rowHeightProp,
    scrollingApiRef,
    selectionModel,
    showColumnHeaders,
    showColumnHeaderMenus,
    showPaginationControls,
    style: styleProp,
    width,
    ...htmlAttributes
  }: TableProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table",
    css: tableCss,
    window: targetWindow,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState<MeasuredSize>();
  // TODO this will rerender entire table, move foter into seperate component
  const { rowHeight, rowRef } = useMeasuredHeight({ height: rowHeightProp });
  const { rowHeight: footerHeight, rowRef: footerRef } = useMeasuredHeight({});

  if (config === undefined) {
    throw Error(
      "vuu Table requires config prop. Minimum config is list of Column Descriptors",
    );
  }
  if (dataSource === undefined) {
    throw Error("vuu Table requires dataSource prop");
  }

  const { onPageChange, pageCount } = usePagination({
    dataSource,
    showPaginationControls,
  });

  // TODO render TableHeader here and measure before row construction begins
  // TODO we could have MeasuredContainer render a Provider and make size available via a context hook ?
  return (
    <MeasuredContainer
      {...htmlAttributes}
      className={cx(classBase, classNameProp, {
        [`${classBase}-pagination`]: showPaginationControls,
      })}
      height={height}
      id={id}
      onResize={setSize}
      ref={useForkRef(containerRef, forwardedRef)}
      style={
        {
          "--row-height-prop": rowHeight > 0 ? `${rowHeight}px` : undefined,
        } as CSSProperties
      }
      width={width}
    >
      <RowProxy ref={rowRef} height={rowHeightProp} />
      {size && rowHeight && (footerHeight || showColumnHeaders !== true) ? (
        <TableCore
          Row={Row}
          allowDragColumnHeader={allowDragColumnHeader}
          allowDragDrop={allowDragDrop}
          availableColumns={availableColumns}
          config={config}
          containerRef={containerRef}
          customHeader={customHeader}
          dataSource={dataSource}
          disableFocus={disableFocus}
          highlightedIndex={highlightedIndex}
          id={id}
          navigationStyle={navigationStyle}
          onAvailableColumnsChange={onAvailableColumnsChange}
          onConfigChange={onConfigChange}
          onDragStart={onDragStart}
          onDrop={onDrop}
          onHighlight={onHighlight}
          onRowClick={onRowClick}
          onSelect={onSelect}
          onSelectionChange={onSelectionChange}
          renderBufferSize={
            showPaginationControls ? 0 : Math.max(5, renderBufferSize)
          }
          rowHeight={rowHeight}
          scrollingApiRef={scrollingApiRef}
          selectionModel={selectionModel}
          showColumnHeaders={showColumnHeaders}
          showColumnHeaderMenus={showColumnHeaderMenus}
          showPaginationControls={showPaginationControls}
          size={reduceSizeHeight(size, footerHeight)}
        />
      ) : null}
      {showPaginationControls ? (
        <div className={`${classBase}-pagination-container`} ref={footerRef}>
          <Pagination count={pageCount} onPageChange={onPageChange}>
            <GoToInput />
            <Paginator />
          </Pagination>
        </div>
      ) : null}
    </MeasuredContainer>
  );
});
