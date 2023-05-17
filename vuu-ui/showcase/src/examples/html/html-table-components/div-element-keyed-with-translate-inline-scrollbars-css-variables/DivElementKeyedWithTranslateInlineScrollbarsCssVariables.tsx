import { TableProps } from "@finos/vuu-table";
import { CSSProperties, useMemo, useRef } from "react";
import { Row } from "../Row";
import { useTable } from "./useTable";
import { metadataKeys } from "@finos/vuu-utils";

import "./DivElementKeyedWithTranslateInlineScrollbarsCssVariables.css";

const classBase = "DivElementKeyedWithTranslateInlineScrollbarsCssVariables";

const { IDX, RENDER_IDX } = metadataKeys;

export const DivElementKeyedWithTranslateInlineScrollbarsCssVariables = ({
  config,
  dataSource,
  headerHeight = 30,
  height,
  renderBufferSize = 5,
  rowHeight = 30,
  width,
}: TableProps) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const {
    columnMap,
    columns,
    containerMeasurements: { containerRef, innerSize, outerSize },
    data,
    scrollProps,
    viewportMeasurements,
  } = useTable({
    config,
    dataSource,
    headerHeight,
    renderBufferSize,
    rowHeight,
    tableRef,
  });

  console.log({ viewportMeasurements });

  const style = {
    "--content-height": `${viewportMeasurements.contentHeight}px`,
    "--horizontal-scrollbar-height": "15px",
    "--content-width": "1100px",
    "--pinned-width-left": "0px",
    "--pinned-width-right": "0px",
    "--header-height": "30px",
    "--row-height": "30px",
    "--table-height": "645px",
    "--table-width": "715px",
    "--total-header-height": "30px",
    "--vertical-scrollbar-width": "15px",
    "--viewport-body-height": "615px",
  } as CSSProperties;

  return (
    <div className={classBase} style={style}>
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
        <div className={`${classBase}-table`}>
          <div className={`${classBase}-col-headings`}>
            <div className={`${classBase}-col-headers`} role="row">
              {columns.map((col) => (
                <div
                  className={`${classBase}-col-header`}
                  key={col.name}
                  role="cell"
                  style={{ width: 100 }}
                >
                  {col.name}
                </div>
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
                data={data}
                offset={rowHeight * data[IDX] + headerHeight}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
