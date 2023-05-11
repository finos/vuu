import { useRef } from "react";
import { useScroll } from "./useScroll";
import { HTMLTableProps } from "../tableTypes";

import "./DivElementWithSizers.css";

const classBase = "DivElementWithSizers";

export const DivElementWithSizers = ({
  Row,
  bufferCount = 5,
  columns,
  contentHeight,
  data,
  dataRowCount = data.length,
  headerHeight = 30,
  rowHeight = 30,
  viewportHeight,
  visibleRowCount = 20,
}: HTMLTableProps) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const {
    handleScroll,
    firstRowIndex,
    lastRowIndex,
    offscreenContentHeight,
    spacerEndRef,
    spacerStartRef,
  } = useScroll({
    bufferCount,
    dataRowCount,
    rowHeight,
    table: tableRef,
    viewportHeight,
    visibleRowCount,
  });

  return (
    <div className={classBase} onScroll={handleScroll}>
      <div
        className={`${classBase}-scroll-content`}
        style={{
          position: "absolute",
          width: 1600,
          height: contentHeight + headerHeight,
        }}
      />

      <div className={`${classBase}-wrapper`} ref={tableRef}>
        <div className={`${classBase}-table`}>
          <div className={`${classBase}-col-headings`}>
            <div className={`${classBase}-col-headers`} role="row">
              {columns.map((column) => (
                <div
                  className={`${classBase}-col-header`}
                  key={column}
                  role="cell"
                  style={{ width: 145 }}
                >
                  {column}
                </div>
              ))}
            </div>
          </div>
          <div
            className={`${classBase}-body`}
            style={{ height: contentHeight }}
          >
            <div className="sizer-row" key="sizer-start">
              <div
                className="sizer-cell"
                ref={spacerStartRef}
                style={{ height: 0 }}
              />
            </div>
            {data.slice(firstRowIndex, lastRowIndex).map((data, i) => (
              <Row
                className="DivElementWithSizersRow"
                index={firstRowIndex + i}
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
