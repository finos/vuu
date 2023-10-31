import { ContextMenuProvider } from "@finos/vuu-popups";
import { TableProps } from "@finos/vuu-table";
import { isGroupColumn, metadataKeys, notHidden } from "@finos/vuu-utils";
import cx from "classnames";
import { CSSProperties, ForwardedRef, forwardRef, useRef } from "react";
import {
  GroupHeaderCellNext as GroupHeaderCell,
  HeaderCell,
} from "./header-cell";
import { Row as DefaultRow } from "./Row";
import { useTable } from "./useTableNext";
import { MeasuredContainer, useId } from "@finos/vuu-layout";
import { useForkRef } from "@salt-ds/core";

import "./TableNext.css";

const classBase = "vuuTableNext";

const { IDX, RENDER_IDX } = metadataKeys;

export const TableNext = forwardRef(function TableNext(
  {
    Row = DefaultRow,
    availableColumns,
    className: classNameProp,
    config,
    dataSource,
    id: idProp,
    navigationStyle = "cell",
    onAvailableColumnsChange,
    onConfigChange,
    onFeatureInvocation,
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
    dragDropHook,
    handleContextMenuAction,
    headerProps,
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
    availableColumns,
    config,
    containerRef,
    dataSource,
    headerHeight,
    navigationStyle,
    onAvailableColumnsChange,
    onConfigChange,
    onFeatureInvocation,
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
    [`${classBase}-highlight`]: tableAttributes.showHighlightedRow,
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
          <div {...tableProps} className={`${classBase}-table`} tabIndex={-1}>
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
                  {dragDropHook.draggable}
                </div>
              </div>
            ) : null}
            <div className={`${classBase}-body`}>
              {data.map((data) => (
                <Row
                  columnMap={columnMap}
                  columns={columns}
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
      </MeasuredContainer>
    </ContextMenuProvider>
  );
});
