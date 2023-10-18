import { TableProps } from "@finos/vuu-table";
import { CSSProperties } from "react";
import { Row } from "../Row";
import { useTable } from "./useTable";
import { metadataKeys } from "@finos/vuu-utils";

import "./DivElementKeyedWithTranslateInlineScrollbarsCssVariables.css";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { HeaderCell } from "../HeaderCell";

const classBase = "DivElementKeyedWithTranslateInlineScrollbarsCssVariables";

const { IDX, RENDER_IDX } = metadataKeys;

export const DivElementKeyedWithTranslateInlineScrollbarsCssVariables = ({
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
    containerMeasurements: { innerSize },
    data,
    handleContextMenuAction,
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

  const style = {
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

  return (
    <ContextMenuProvider
      menuActionHandler={handleContextMenuAction}
      menuBuilder={menuBuilder}
    >
      <div {...htmlAttributes} className={classBase} style={style}>
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
                  />
                ))}
              </div>
            </div>
            <div className={`${classBase}-body`}>
              {data.map((data) => (
                <Row
                  className="DivElementKeyedWithTranslateInlineScrollbarsCssVariablesRow"
                  columnMap={columnMap}
                  columns={columns}
                  key={data[RENDER_IDX]}
                  row={data}
                  offset={rowHeight * data[IDX] + headerHeight}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </ContextMenuProvider>
  );
};
