import { ContextMenuProvider } from "@finos/vuu-popups";
import { TableProps } from "@finos/vuu-table";
import { isGroupColumn, metadataKeys, notHidden } from "@finos/vuu-utils";
import cx from "classnames";
import { CSSProperties } from "react";
import { GroupHeaderCell, HeaderCell } from "./header-cell";
import { Row } from "./Row";
import { useTable } from "./useTableNext";
import { useId } from "@finos/vuu-layout";

import "./TableNext.css";

const classBase = "vuuTableNext";

const { IDX, RENDER_IDX } = metadataKeys;

export const TableNext = ({
  availableColumns,
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
  width,
  ...htmlAttributes
}: TableProps) => {
  const id = useId(idProp);
  const {
    columnMap,
    columns,
    containerMeasurements: { cssSize, innerSize },
    containerRef,
    data,
    dragDropHook,
    handleContextMenuAction,
    headerProps,
    onRemoveGroupColumn,
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
    dataSource,
    headerHeight,
    height,
    onConfigChange,
    onFeatureEnabled,
    onFeatureInvocation,
    onSelectionChange,
    renderBufferSize,
    rowHeight,
    selectionModel,
    width,
  });

  const unmeasured = innerSize === undefined;

  const getStyle = () => {
    return unmeasured
      ? ({
          "--table-css-height": `${cssSize.height}`,
          "--table-css-width": `${cssSize.width}`,
        } as CSSProperties)
      : ({
          ...styleProp,
          "--content-height": `${viewportMeasurements.contentHeight}px`,
          "--horizontal-scrollbar-height": `${viewportMeasurements.horizontalScrollbarHeight}px`,
          "--content-width": `${viewportMeasurements.contentWidth}px`,
          "--pinned-width-left": `${viewportMeasurements.pinnedWidthLeft}px`,
          "--pinned-width-right": `${viewportMeasurements.pinnedWidthRight}px`,
          "--header-height": `${headerHeight}px`,
          "--row-height": `${rowHeight}px`,
          "--table-css-height": `${cssSize?.height}`,
          "--table-css-width": `${cssSize?.width}`,
          "--table-height": `${innerSize?.height}px`,
          "--table-width": `${innerSize?.width}px`,
          "--total-header-height": `${viewportMeasurements.totalHeaderHeight}px`,
          "--vertical-scrollbar-width": `${viewportMeasurements.verticalScrollbarWidth}px`,
          "--viewport-body-height": `${viewportMeasurements.viewportBodyHeight}px`,
        } as CSSProperties);
  };
  const className = cx(classBase, classNameProp, {
    [`${classBase}-colLines`]: tableAttributes.columnSeparators,
    [`${classBase}-rowLines`]: tableAttributes.rowSeparators,
    [`${classBase}-zebra`]: tableAttributes.zebraStripes,
    // [`${classBase}-loading`]: isDataLoading(tableProps.columns),
  });

  return (
    <ContextMenuProvider
      menuActionHandler={handleContextMenuAction}
      menuBuilder={menuBuilder}
    >
      {unmeasured ? (
        <div
          {...htmlAttributes}
          className={classBase}
          id={id}
          style={getStyle()}
          ref={containerRef}
        />
      ) : (
        <div
          {...htmlAttributes}
          className={className}
          style={getStyle()}
          ref={containerRef}
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
            <div {...tableProps} className={`${classBase}-table`}>
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
              <div className={`${classBase}-body`}>
                {data.map((data) => (
                  <Row
                    columnMap={columnMap}
                    columns={columns}
                    key={data[RENDER_IDX]}
                    onClick={onRowClick}
                    row={data}
                    offset={rowHeight * data[IDX] + headerHeight}
                    onToggleGroup={onToggleGroup}
                    zebraStripes={tableAttributes.zebraStripes}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </ContextMenuProvider>
  );
};
