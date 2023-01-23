import { ContextMenuProvider } from "@finos/vuu-popups";
import { Button, useIdMemo } from "@salt-ds/core";
import { CSSProperties, useCallback, useRef } from "react";
import { ColumnBasedTable } from "./ColumnBasedTable";
import { buildContextMenuDescriptors, useContextMenu } from "./context-menu";
import { TableProps } from "./dataTableTypes";
import { RowBasedTable } from "./RowBasedTable";
import { useDataTable } from "./useDataTable";
import { useDraggableColumn } from "./useDraggableColumn";

import "./DataTable.css";

const classBase = "vuuDataTable";

export const DataTable = ({
  config,
  data: dataProp,
  dataSource,
  headerHeight = 25,
  height,
  id: idProp,
  onConfigChange,
  onShowConfigEditor: onShowSettings,
  rowHeight = 20,
  allowConfigEditing: showSettings = false,
  style: styleProp,
  tableLayout: tableLayoutProp = "row",
  width,
  ...props
}: TableProps) => {
  const id = useIdMemo(idProp);
  const {
    columns,
    dispatchColumnAction,
    containerMeasurements: { containerRef, innerSize, outerSize },
    containerProps,
    setRangeVertical,
    rowCount,
    scrollProps,
    valueFormatters,
    viewportMeasurements,
    ...tableProps
  } = useDataTable({
    config,
    data: dataProp,
    dataSource,
    headerHeight,
    height,
    onConfigChange,
    rowHeight,
    width,
  });

  const handleContextMenuAction = useContextMenu({
    dataSource,
    dispatchColumnAction,
  });

  const handleDropColumn = useCallback(
    (fromIndex: number, toIndex: number) => {
      const column = columns[fromIndex];
      dispatchColumnAction({ type: "moveColumn", column, moveTo: toIndex });
    },
    [columns, dispatchColumnAction]
  );

  const {
    draggable,
    draggedItemIndex,
    tableLayout,
    handleHeaderCellDragStart,
  } = useDraggableColumn({
    onDrop: handleDropColumn,
    tableContainerRef: scrollProps.tableContainerRef,
    tableLayout: tableLayoutProp,
  });

  const style = {
    ...outerSize,
    "--content-height": `${viewportMeasurements.scrollContentHeight}px`,
    "--content-width": `${viewportMeasurements.scrollContentWidth}px`,
    "--filler-height": `${viewportMeasurements.fillerHeight}px`,
    "--pinned-width-left": `${viewportMeasurements.pinnedWidthLeft}px`,
    "--header-height": `${headerHeight}px`,
    "--row-height": `${rowHeight}px`,
    "--scrollbar-size": `${viewportMeasurements.scrollbarSize}px`,
    "--table-height": `${innerSize?.height}px`,
    "--table-width": `${innerSize?.width}px`,
  } as CSSProperties;

  const scrollbarContainerStyle: CSSProperties = {
    left: viewportMeasurements.pinnedWidthLeft - 1,
    // The -1 is to align the top border, might cause innaccuracy
    // It is compensated by a hardcoded adjustment in css
    // top: measurements.top - 1 + headerHeight,
    top: headerHeight - 1,
  };

  const Table = tableLayout === "column" ? ColumnBasedTable : RowBasedTable;

  return (
    <ContextMenuProvider
      menuActionHandler={handleContextMenuAction}
      menuBuilder={buildContextMenuDescriptors(dataSource)}
    >
      <div
        {...containerProps}
        className={classBase}
        id={id}
        ref={containerRef}
        style={style}
        tabIndex={-1}
      >
        {innerSize ? (
          <div
            className={`${classBase}-scrollbarContainer`}
            onScroll={scrollProps.onScrollbarContainerScroll}
            ref={scrollProps.scrollbarContainerRef}
            style={scrollbarContainerStyle}
          >
            <div className={`${classBase}-scrollContent`} />
          </div>
        ) : null}
        {innerSize ? (
          <div
            className={`${classBase}-contentContainer`}
            onScroll={scrollProps.onContentContainerScroll}
            ref={scrollProps.contentContainerRef}
            {...props}
          >
            <div className={`${classBase}-scrollContent`} />
            <div
              className={`${classBase}-tableContainer`}
              onScroll={scrollProps.onTableContainerScroll}
              ref={scrollProps.tableContainerRef}
            >
              <Table
                {...tableProps}
                columns={columns.filter((col, i) => i !== draggedItemIndex)}
                headerHeight={headerHeight}
                onHeaderCellDragStart={
                  tableLayout === "row" ? handleHeaderCellDragStart : undefined
                }
                rowHeight={rowHeight}
                valueFormatters={valueFormatters}
              />
            </div>
            {draggable}
          </div>
        ) : null}
        {showSettings && innerSize ? (
          <Button
            className={`${classBase}-settings`}
            data-icon="settings"
            onClick={onShowSettings}
            variant="secondary"
          />
        ) : null}
      </div>
    </ContextMenuProvider>
  );
};
