import { ContextMenuProvider } from "@finos/vuu-popups";
import { Button, useIdMemo } from "@salt-ds/core";
import { CSSProperties } from "react";
import { buildContextMenuDescriptors } from "./context-menu";
import { TableProps } from "./dataTableTypes";
// import { RowBasedTable } from "./RowBasedTable";
import { RowBasedTable } from "./RowBasedTable";
import { useTable } from "./useTable";
import cx from "classnames";

import "./Table.css";
import "./Table-loading.css";

import { isDataLoading } from "@finos/vuu-utils";

const classBase = "vuuTable";

export interface TablePropsDeprecated
  extends Omit<TableProps, "height" | "width"> {
  height?: number;
  width?: number;
}

export const Table = ({
  allowConfigEditing: showSettings = false,
  className: classNameProp,
  config,
  dataSource,
  headerHeight = 25,
  height,
  id: idProp,
  onConfigChange,
  onFeatureInvocation,
  onSelect,
  onSelectionChange,
  onShowConfigEditor: onShowSettings,
  renderBufferSize = 0,
  rowHeight = 20,
  selectionModel = "extended",
  style: styleProp,
  width,
  ...htmlAttributes
}: TablePropsDeprecated) => {
  const id = useIdMemo(idProp);
  const {
    containerMeasurements: { containerRef, innerSize, outerSize },
    containerProps,
    dispatchColumnAction,
    draggable,
    draggedItemIndex,
    handleContextMenuAction,
    scrollProps,
    viewportMeasurements,
    ...tableProps
  } = useTable({
    config,
    dataSource,
    renderBufferSize,
    headerHeight,
    height,
    onConfigChange,
    onFeatureInvocation,
    onSelectionChange,
    rowHeight,
    selectionModel,
    width,
  });

  console.log({ tableProps });
  const style = {
    ...outerSize,
    "--content-height": `${viewportMeasurements.contentHeight}px`,
    "--horizontal-scrollbar-height": `${viewportMeasurements.horizontalScrollbarHeight}px`,
    "--content-width": `${viewportMeasurements.contentWidth}px`,
    "--pinned-width-left": `${viewportMeasurements.pinnedWidthLeft}px`,
    "--pinned-width-right": `${viewportMeasurements.pinnedWidthRight}px`,
    "--header-height": `${headerHeight}px`,
    "--row-height": `${rowHeight}px`,
    "--table-height": `${innerSize?.height}px`,
    "--table-width": `${innerSize?.width}px`,
    "--total-header-height": `${viewportMeasurements.totalHeaderHeight}px`,
    "--vertical-scrollbar-width": `${viewportMeasurements.verticalScrollbarWidth}px`,
    "--viewport-body-height": `${viewportMeasurements.viewportBodyHeight}px`,
  } as CSSProperties;

  const className = cx(classBase, classNameProp, {
    [`${classBase}-zebra`]: config.zebraStripes,
    [`${classBase}-loading`]: isDataLoading(tableProps.columns),
  });

  return (
    <ContextMenuProvider
      menuActionHandler={handleContextMenuAction}
      menuBuilder={buildContextMenuDescriptors(dataSource)}
    >
      <div
        {...htmlAttributes}
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
            ref={scrollProps.scrollbarContainerRef}
          >
            <div className={`${classBase}-scrollbarContent`} />
          </div>
        ) : null}
        {innerSize ? (
          <div
            className={`${classBase}-contentContainer`}
            ref={scrollProps.contentContainerRef}
          >
            <RowBasedTable
              {...tableProps}
              headerHeight={headerHeight}
              tableId={id}
            />
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
