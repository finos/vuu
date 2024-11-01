import {
  DataSource,
  SchemaColumn,
  SelectionChangeHandler,
} from "@finos/vuu-data-types";
import { ContextMenuProvider } from "@finos/vuu-popups";
import {
  CustomHeader,
  DataCellEditNotification,
  GroupToggleTarget,
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
import { useForkRef } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  CSSProperties,
  FC,
  ForwardedRef,
  RefObject,
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { Row as DefaultRow, RowProxy } from "./Row";
import { PaginationControl } from "./pagination";
import { TableHeader } from "./table-header";
import { useMeasuredHeight } from "./useMeasuredHeight";
import { useTable } from "./useTable";
import { ScrollingAPI } from "./useTableScroll";

import tableCss from "./Table.css";
import { TableCellBlock } from "./cell-block/cellblock-utils";

const classBase = "vuuTable";

const { IDX, RENDER_IDX } = metadataKeys;

export type TableNavigationStyle = "none" | "cell" | "row" | "tree";

export interface TableProps
  extends Omit<MeasuredContainerProps, "onDragStart" | "onDrop" | "onSelect"> {
  Row?: FC<RowProps>;
  /**
   * Allow a block of cells to be selected. Typically to be copied.
   */
  allowCellBlockSelection?: boolean;
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
   * When rows are grouped, user can click group row(s) to expand/collapse display of child rows.
   * This allows precise configuration of where user may click to trigger toggle/collapse. When
   * row selection is also supported, clicking outside the region specified here will select or
   * deselect the row.
   * - toggle-icon - the small toggle icon must be clicked directly
   * - group-column (default) - user can click anywhere within the group column, i.e on the icon or the column text
   */
  groupToggleTarget?: GroupToggleTarget;
  /**
   * Defined how focus navigation within data cells will be handled by table.
   * Default is cell.
   */
  highlightedIndex?: number;

  /**
   * Behaves in most respects like viewportRowLimit except that, when there are fewer
   * rows available than the limit set here, the Table height will reduce. This can be
   * useful where a Table is used in a dropdown control.
   */
  maxViewportRowLimit?: number;

  /**
   * Determines bahaviour of keyboard navigation , either row focused or cell focused.
   * `tree` is a specialised navigation behaviour only useful where table is being
   * used to present purely grouped data (see TreeTable)
   */
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

  onDataEdited?: DataCellEditNotification;

  onDragStart?: DragStartHandler;
  onDrop?: (dragDropState: DragDropState) => void;

  onHighlight?: (idx: number) => void;
  /**
   * callback invoked when user 'clicks' a table row. CLick triggered either
   * via mouse click or keyboard (default ENTER);
   */
  onRowClick?: TableRowClickHandler;
  onSelect?: TableRowSelectHandler;
  /**
   * Triggered when a block of cells is selected. CellBlock selection can be
   * effected with either mouse or keyboard.
   * - mouse: hold down mouse and drag over selection area
   * - keyboard: press and hold shift key from start cell, then use arrow keys
   *   to extend selection block.
   *
   * This callback is invoked when mouse is released or shift key released.
   */
  onSelectCellBlock?: (cellBlock: TableCellBlock) => void;

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
   * They are optional, value currently defaults to 4.
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

  /**
   * As an alternative to sizing the Table height via CSS or via an explicit height value,
   * specify the number of rows to be displayed within the Viewport. The actual height
   * will then be the product of  viewportRowLimit and rowHeight. Row Height will be
   * determined in the usual way, it can be specified explicitly in a prop or set via
   * CSS. If both explicit height and viewportRowLimit are provided by props, rowHeight
   * will be derived from these. Do not pass props for all three values - height,
   * rowHeight and viewportRowLimit. That will be rejected.
   * Use maxViewportRowLimit rather than viewportRowLimit if the height of the table
   * should be reduced when fewer rows are actually available than the limit specified.
   */
  viewportRowLimit?: number;
}

const TableCore = ({
  Row = DefaultRow,
  allowCellBlockSelection,
  allowDragColumnHeader = true,
  allowDragDrop,
  availableColumns,
  config,
  containerRef,
  customHeader,
  dataSource,
  disableFocus = false,
  groupToggleTarget,
  highlightedIndex: highlightedIndexProp,
  id: idProp,
  navigationStyle = "cell",
  onAvailableColumnsChange,
  onConfigChange,
  onDataEdited: onDataEditedProp,
  onDragStart,
  onDrop,
  onHighlight,
  onRowClick: onRowClickProp,
  onSelect,
  onSelectCellBlock,
  onSelectionChange,
  renderBufferSize = 0,
  rowHeight,
  scrollingApiRef,
  selectionBookendWidth = 0,
  selectionModel = "extended",
  showColumnHeaders = true,
  showColumnHeaderMenus = true,
  showPaginationControls,
  size,
}: Omit<
  TableProps,
  "maxViewportRowLimit" | "rowHeight" | "viewportRowLimit"
> & {
  containerRef: RefObject<HTMLDivElement>;
  rowHeight: number;
  size: MeasuredSize;
}) => {
  const id = useId(idProp);
  const {
    cellBlock,
    columnMap,
    columns,
    data,
    draggableRow,
    focusCellPlaceholderKeyDown,
    focusCellPlaceholderRef,
    getRowOffset,
    handleContextMenuAction,
    headerState: { height: headerHeight, count: headerCount },
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
    tableBodyRef,
    tableConfig,
    viewportMeasurements,
    ...tableProps
  } = useTable({
    allowCellBlockSelection,
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
    onDataEdited: onDataEditedProp,
    onDragStart,
    onDrop,
    onHighlight,
    onRowClick: onRowClickProp,
    onSelect,
    onSelectCellBlock,
    onSelectionChange,
    renderBufferSize,
    rowHeight,
    scrollingApiRef,
    selectionBookendWidth,
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

  const cssScrollbarSize = {
    "--horizontal-scrollbar-height": `${viewportMeasurements.horizontalScrollbarHeight}px`,
    "--vertical-scrollbar-width": `${viewportMeasurements.verticalScrollbarWidth}px`,
  } as CSSProperties;

  const cssVariables = {
    ...cssScrollbarSize,
    "--content-height": `${viewportMeasurements.contentHeight}px`,
    "--content-width": `${viewportMeasurements.contentWidth}px`,
    "--pinned-width-left": `${viewportMeasurements.pinnedWidthLeft}px`,
    "--pinned-width-right": `${viewportMeasurements.pinnedWidthRight}px`,
    "--total-header-height": `${headerHeight}px`,
    "--viewport-body-height": `${viewportMeasurements.viewportBodyHeight}px`,
  } as CSSProperties;

  const headersReady = showColumnHeaders === false || headerHeight > 0;
  const readyToRenderTableBody = headersReady && data.length > 0;

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
          tabIndex={-1}
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
          {readyToRenderTableBody ? (
            <div className={`${classBase}-body`} ref={tableBodyRef}>
              {data.map((data) => {
                const ariaRowIndex = data[IDX] + headerCount + 1;
                return (
                  <Row
                    aria-rowindex={ariaRowIndex}
                    classNameGenerator={rowClassNameGenerator}
                    columnMap={columnMap}
                    columns={scrollProps.columnsWithinViewport}
                    groupToggleTarget={groupToggleTarget}
                    highlighted={highlightedIndex === ariaRowIndex}
                    key={data[RENDER_IDX]}
                    onClick={onRowClick}
                    onDataEdited={onDataEdited}
                    row={data}
                    offset={showPaginationControls ? 0 : getRowOffset(data)}
                    onToggleGroup={onToggleGroup}
                    showBookends={selectionBookendWidth > 0}
                    virtualColSpan={scrollProps.virtualColSpan}
                    zebraStripes={tableAttributes.zebraStripes}
                  />
                );
              })}
              {/* 
                The focusCellPlaceholder allows us to deal with the situation where a cell 
                that has focus is scrolled out of the viewport. That cell, along with the 
                containing row, will be recycled to render another DataRow. The html table 
                cell must not retain focus once it is re-used but we need to track the 
                original focus, in case user uses arrow key to resume navigation. 
                The placeholder is fixed in place at the location where the focused cell 
                was last rendered. It assumes focus. If we get an arrowkey mousedown event 
                on the placeholder, the user has resumed navigation whilst the focused cell 
                is offscreen. We scroll back to the focus location and pass focus back to 
                the correct target cell.
              */}
              <div
                aria-hidden={true}
                className={`${classBase}-focusCellPlaceholder`}
                onKeyDown={focusCellPlaceholderKeyDown}
                ref={focusCellPlaceholderRef}
                tabIndex={-1}
              />

              {cellBlock}
            </div>
          ) : null}
        </div>
      </div>
      {/* 
        This keeps the heights of content container and scrollbar container aligned for
        cases where we rely on height: fit-content. (ScrollbarContainer isn't taken into 
        account because its absolutely positioned).
      */}
      <div
        className={`${classBase}-scrollbarFiller`}
        style={cssScrollbarSize}
      />
      {draggableRow}
    </ContextMenuProvider>
  );
};

export const Table = forwardRef(function Table(
  {
    Row,
    allowCellBlockSelection,
    allowDragColumnHeader,
    allowDragDrop,
    availableColumns,
    className: classNameProp,
    config,
    customHeader,
    dataSource,
    disableFocus,
    groupToggleTarget,
    height,
    highlightedIndex,
    id,
    maxViewportRowLimit,
    navigationStyle,
    onAvailableColumnsChange,
    onConfigChange,
    onDataEdited,
    onDragStart,
    onDrop,
    onHighlight,
    onRowClick,
    onSelect,
    onSelectCellBlock,
    onSelectionChange,
    renderBufferSize,
    rowHeight: rowHeightProp,
    scrollingApiRef,
    selectionBookendWidth = 4,
    selectionModel,
    showColumnHeaders,
    showColumnHeaderMenus,
    showPaginationControls,
    style: styleProp,
    viewportRowLimit,
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

  const [size, _setSize] = useState<MeasuredSize>();
  // TODO this will rerender entire table, move footer into seperate component
  const { measuredHeight: rowHeight, measuredRef: rowRef } = useMeasuredHeight({
    height: rowHeightProp,
  });
  const { measuredHeight: footerHeight, measuredRef: footerRef } =
    useMeasuredHeight({});

  const rowLimit = maxViewportRowLimit ?? viewportRowLimit;

  if (config === undefined) {
    throw Error(
      "vuu Table requires config prop. Minimum config is list of Column Descriptors",
    );
  }
  if (dataSource === undefined) {
    throw Error("vuu Table requires dataSource prop");
  }

  if (showPaginationControls && renderBufferSize !== undefined) {
    console.warn(
      `Table: When pagination controls are used, renderBufferSize is ignored`,
    );
  }

  if (rowLimit && height && rowHeightProp) {
    console.warn(
      `Table: when viewportRowLimit, rowHeight and height are used in combination, height is ignored`,
    );
    height = rowLimit * rowHeightProp;
  } else if (rowLimit && rowHeightProp) {
    height = rowLimit * rowHeightProp;
  } else if (rowLimit) {
    height = rowLimit * rowHeight;
  }

  const sizeRef = useRef<MeasuredSize>();
  const setSize = useCallback(
    (size: MeasuredSize) => {
      if (viewportRowLimit && !rowHeight) {
        sizeRef.current = size;
      } else if (
        size.height !== sizeRef.current?.height ||
        size.width !== sizeRef.current?.width
      ) {
        _setSize(size);
      }
    },
    [rowHeight, viewportRowLimit],
  );
  useMemo(() => {
    if (sizeRef.current && rowHeight) {
      const size = {
        ...sizeRef.current,
        height: rowHeight * (viewportRowLimit as number),
      };
      sizeRef.current = size;
      _setSize(size);
    }
  }, [rowHeight, viewportRowLimit]);

  // TODO render TableHeader here and measure before row construction begins
  // TODO we could have MeasuredContainer render a Provider and make size available via a context hook ?
  return (
    <MeasuredContainer
      {...htmlAttributes}
      className={cx(classBase, classNameProp, {
        [`${classBase}-pagination`]: showPaginationControls,
        [`${classBase}-maxViewportRowLimit`]: maxViewportRowLimit,
        [`${classBase}-viewportRowLimit`]: viewportRowLimit,
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
      {size &&
      rowHeight &&
      (footerHeight || showPaginationControls !== true) ? (
        <TableCore
          Row={Row}
          allowCellBlockSelection={allowCellBlockSelection}
          allowDragColumnHeader={allowDragColumnHeader}
          allowDragDrop={allowDragDrop}
          availableColumns={availableColumns}
          config={config}
          containerRef={containerRef}
          customHeader={customHeader}
          dataSource={dataSource}
          disableFocus={disableFocus}
          groupToggleTarget={groupToggleTarget}
          highlightedIndex={highlightedIndex}
          id={id}
          navigationStyle={navigationStyle}
          onAvailableColumnsChange={onAvailableColumnsChange}
          onConfigChange={onConfigChange}
          onDataEdited={onDataEdited}
          onDragStart={onDragStart}
          onDrop={onDrop}
          onHighlight={onHighlight}
          onRowClick={onRowClick}
          onSelect={onSelect}
          onSelectCellBlock={onSelectCellBlock}
          onSelectionChange={onSelectionChange}
          renderBufferSize={
            showPaginationControls ? 0 : Math.max(5, renderBufferSize ?? 0)
          }
          rowHeight={rowHeight}
          scrollingApiRef={scrollingApiRef}
          selectionBookendWidth={selectionBookendWidth}
          selectionModel={selectionModel}
          showColumnHeaders={showColumnHeaders}
          showColumnHeaderMenus={showColumnHeaderMenus}
          showPaginationControls={showPaginationControls}
          size={reduceSizeHeight(size, footerHeight)}
        />
      ) : null}
      {showPaginationControls ? (
        <div className={`${classBase}-footer`} ref={footerRef}>
          <PaginationControl dataSource={dataSource} />
        </div>
      ) : null}
    </MeasuredContainer>
  );
});
