import { ContextMenuProvider } from "@finos/vuu-popups";
import { TableProps } from "@finos/vuu-table";
import { metadataKeys } from "@finos/vuu-utils";
import { CSSProperties, useEffect } from "react";
import { HeaderCell } from "./HeaderCell";
import { Row } from "./Row";
import { useTable } from "./useTableNext";

import "./TableNext.css";

const classBase = "vuuTableNext";

const { IDX, RENDER_IDX } = metadataKeys;

export const TableNext = ({
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
  const {
    columnMap,
    columns,
    containerMeasurements: { cssSize, innerSize },
    containerRef,
    data,
    handleContextMenuAction,
    onHeaderClick,
    onRowClick,
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
  console.log(`%cTableNext render`, "color:red;font-weight:bold;");
  useEffect(() => {
    console.log(
      `%cTableNext actual render`,
      "background-color:red;color: white;font-weight:bold;"
    );
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
                  {columns.map((col, i) => (
                    <HeaderCell
                      classBase={classBase}
                      column={col}
                      idx={i}
                      key={col.name}
                      onClick={onHeaderClick}
                    />
                  ))}
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
