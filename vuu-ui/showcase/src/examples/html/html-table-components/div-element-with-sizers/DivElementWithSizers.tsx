import { TableProps } from "@finos/vuu-table";
import { useRef } from "react";
import { Row } from "../Row";
import { useTable } from "./useTable";

import "./DivElementWithSizers.css";

const classBase = "DivElementWithSizers";

export const DivElementWithSizers = ({
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
    handleScroll,
    firstRowIndex,
    lastRowIndex,
    offscreenContentHeight,
    spacerEndRef,
    spacerStartRef,
    viewportMeasurements,
  } = useTable({
    config,
    dataSource,
    headerHeight,
    renderBufferSize,
    rowHeight,
    tableRef,
  });

  return (
    <div className={classBase} onScroll={handleScroll} ref={containerRef}>
      <div
        className={`${classBase}-scroll-content`}
        style={{
          position: "absolute",
          width: 1600,
          height: viewportMeasurements.contentHeight + headerHeight,
        }}
      />

      <div className={`${classBase}-wrapper`} ref={tableRef}>
        <div className={`${classBase}-table`}>
          <div className={`${classBase}-col-headings`}>
            <div className={`${classBase}-col-headers`} role="row">
              {columns.map((col) => (
                <div
                  className={`${classBase}-col-header`}
                  key={col.name}
                  role="cell"
                  style={{ width: 145 }}
                >
                  {col.name}
                </div>
              ))}
            </div>
          </div>
          <div
            className={`${classBase}-body`}
            style={{ height: viewportMeasurements.contentHeight }}
          >
            <div className="sizer-row" key="sizer-start">
              <div
                className="sizer-cell"
                ref={spacerStartRef}
                style={{ height: 0 }}
              />
            </div>
            {data.map((data) => (
              <Row
                className="DivElementWithSizersRow"
                columnMap={columnMap}
                columns={columns}
                key={data[0]}
                data={data}
              />
            ))}
            <div className="sizer-row" key="sizer-end">
              <div
                className="sizer-cell"
                ref={spacerEndRef}
                style={{ height: offscreenContentHeight }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
