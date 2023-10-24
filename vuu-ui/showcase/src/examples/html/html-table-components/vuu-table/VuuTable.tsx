import { ContextMenuProvider } from "@finos/vuu-popups";
import { TableProps } from "@finos/vuu-table";
import { isGroupColumn, metadataKeys } from "@finos/vuu-utils";
import { useIdMemo } from "@salt-ds/core";
import { CSSProperties } from "react";
import { HeaderCell } from "../HeaderCell";
import { HeaderGroupCell } from "../HeaderGroupCell";
import { Row } from "./Row";
import { useTable } from "./useTable";

import "./VuuTable.css";
import "./VuuTableSelectionDecorator.css";

const classBase = "vuuTable2";

const { RENDER_IDX } = metadataKeys;

export const VuuTable = ({
  className: classNameProp,
  config,
  dataSource,
  headerHeight = 25,
  height,
  id: idProp,
  onConfigChange,
  onFeatureEnabled,
  onFeatureInvocation,
  onSelect,
  onSelectionChange,
  onShowConfigEditor,
  renderBufferSize = 0,
  rowHeight = 20,
  selectionModel = "extended",
  style: styleProp,
  width,
  ...htmlAttributes
}: TableProps) => {
  const id = useIdMemo(idProp);
  const {
    columnMap,
    columns,
    containerMeasurements: { cssSize, innerSize },
    containerRef,
    data,
    getRowOffset,
    handleContextMenuAction,
    onHeaderClick,
    onHeaderResize,
    onRowClick,
    onToggleGroup,
    menuBuilder,
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
    onFeatureEnabled,
    onFeatureInvocation,
    onSelectionChange,
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
  return (
    <ContextMenuProvider
      menuActionHandler={handleContextMenuAction}
      menuBuilder={menuBuilder}
    >
      {unmeasured ? (
        <div
          {...htmlAttributes}
          className={classBase}
          style={getStyle()}
          ref={containerRef}
        />
      ) : (
        <div
          {...htmlAttributes}
          className={classBase}
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
                  {columns.map((column, i) => {
                    const isGroup = isGroupColumn(column);
                    const Header = isGroup ? HeaderGroupCell : HeaderCell;
                    return (
                      <Header
                        classBase={classBase}
                        column={column}
                        idx={i}
                        key={column.key}
                        onClick={onHeaderClick}
                        onResize={onHeaderResize}
                      />
                    );
                  })}
                </div>
              </div>
              <div className={`${classBase}-body`}>
                {data.map((row) => (
                  <Row
                    className="vuuTable2Row"
                    columnMap={columnMap}
                    columns={columns}
                    key={row[RENDER_IDX]}
                    onClick={onRowClick}
                    onToggleGroup={onToggleGroup}
                    row={row}
                    offset={getRowOffset(row)}
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
