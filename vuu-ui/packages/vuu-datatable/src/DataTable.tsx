import { ContextMenuProvider } from "@finos/vuu-popups";
import { Button, useIdMemo } from "@salt-ds/core";
import { CSSProperties, useMemo } from "react";
import { ColumnBasedTable } from "./ColumnBasedTable";
import { buildContextMenuDescriptors } from "./context-menu";
import { TableProps } from "./dataTableTypes";
import { RowBasedTable } from "./RowBasedTable";
import { useDataTable } from "./useDataTable";
import cx from "classnames";

import "./DataTable.css";
import { isDataLoading } from "@finos/vuu-utils";

const classBase = "vuuDataTable";

export const DataTable = ({
  allowConfigEditing: showSettings = false,
  className: classNameProp,
  config,
  dataSource,
  headerHeight = 25,
  height,
  id: idProp,
  onConfigChange,
  onFeatureEnabled,
  onFeatureInvocation,
  onSelectionChange,
  onShowConfigEditor: onShowSettings,
  renderBufferSize = 0,
  rowHeight = 20,
  selectionModel = "extended",
  style: styleProp,
  tableLayout: tableLayoutProp = "row",
  width,
  zebraStripes = false,
  ...props
}: TableProps) => {
  const id = useIdMemo(idProp);
  const {
    columns,
    containerMeasurements: { containerRef, innerSize, outerSize },
    containerProps,
    dispatchColumnAction,
    draggable,
    draggedItemIndex,
    handleContextMenuAction,
    scrollProps,
    tableLayout,
    viewportMeasurements,
    ...tableProps
  } = useDataTable({
    config,
    dataSource,
    renderBufferSize,
    headerHeight,
    height,
    onConfigChange,
    onFeatureEnabled,
    onFeatureInvocation,
    onSelectionChange,
    rowHeight,
    selectionModel,
    tableLayout: tableLayoutProp,
    width,
  });

  const style = {
    ...outerSize,
    "--content-height": `${viewportMeasurements.scrollContentHeight}px`,
    "--content-width": `${viewportMeasurements.scrollContentWidth}px`,
    "--filler-height": `${viewportMeasurements.fillerHeight}px`,
    "--pinned-width-left": `${viewportMeasurements.pinnedWidthLeft}px`,
    "--pinned-width-right": `${viewportMeasurements.pinnedWidthRight}px`,
    "--header-height": `${headerHeight}px`,
    "--row-height": `${rowHeight}px`,
    "--scrollbar-size": `${viewportMeasurements.scrollbarSize}px`,
    "--table-height": `${innerSize?.height}px`,
    "--table-width": `${innerSize?.width}px`,
    "--total-header-height": `${viewportMeasurements?.totalHeaderHeight}px`,
  } as CSSProperties;

  const scrollbarContainerStyle: CSSProperties = {
    left: viewportMeasurements.pinnedWidthLeft - 1,
    // The -1 is to align the top border, might cause innaccuracy
    // It is compensated by a hardcoded adjustment in css
    // top: measurements.top - 1 + headerHeight,
    top: viewportMeasurements?.totalHeaderHeight - 1,
  };

  const Table = tableLayout === "column" ? ColumnBasedTable : RowBasedTable;

  const className = cx(classBase, classNameProp, {
    [`${classBase}-zebra`]: zebraStripes,
    [`${classBase}-loading`]: isDataLoading(columns),
  });

  // TODO this is going to go
  const nonDraggedColumns = useMemo(() => {
    return columns.filter((col, i) => i !== draggedItemIndex);
  }, [columns, draggedItemIndex]);

  return (
    <ContextMenuProvider
      menuActionHandler={handleContextMenuAction}
      menuBuilder={buildContextMenuDescriptors(dataSource)}
    >
      <div
        {...containerProps}
        className={className}
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
                columns={nonDraggedColumns}
                headerHeight={headerHeight}
                rowHeight={rowHeight}
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
