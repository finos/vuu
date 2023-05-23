import { TableProps } from "@finos/vuu-table";
import { useMemo, useRef } from "react";
import { Row } from "../Row";
import { useTable } from "./useTable";
import { metadataKeys } from "@finos/vuu-utils";

import "./DivElementKeyedWithTranslateInlineScrollbars.css";

const classBase = "DivElementKeyedWithTranslateInlineScrollbars";

const { IDX, RENDER_IDX } = metadataKeys;

export const DivElementKeyedWithTranslateInlineScrollbars = ({
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

  const bodyStyle = useMemo(
    () => ({
      height: viewportMeasurements.contentHeight,
    }),
    [viewportMeasurements.contentHeight]
  );

  return (
    <div className={classBase}>
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
                  style={{ width: col.width }}
                >
                  {col.name}
                </div>
              ))}
            </div>
          </div>
          <div className={`${classBase}-body`} style={bodyStyle}>
            {data.map((data, i) => (
              <Row
                className="DivElementKeyedWithTranslateInlineScrollbarsRow"
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
