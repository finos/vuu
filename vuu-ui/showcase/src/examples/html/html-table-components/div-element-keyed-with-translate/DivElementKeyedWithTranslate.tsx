import { useMemo, useRef } from "react";
import { useScroll } from "./useScroll";
import { HTMLTableProps } from "../tableTypes";

import "./DivElementKeyedWithTranslate.css";

const classBase = "DivElementKeyedWithTranslate";

export const DivElementKeyedWithTranslate = ({
  Row,
  bufferCount = 5,
  columns,
  contentHeight,
  data,
  dataRowCount = data.length,
  headerHeight = 30,
  rowHeight = 30,
  visibleRowCount = 20,
}: HTMLTableProps) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const { handleScroll, firstRowIndex, keys, lastRowIndex } = useScroll({
    bufferCount,
    dataRowCount,
    rowHeight,
    table: tableRef,
    visibleRowCount,
  });

  const bodyStyle = useMemo(
    () => ({
      height: contentHeight,
    }),
    [contentHeight]
  );

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
          <div className={`${classBase}-body`} style={bodyStyle}>
            {data.slice(firstRowIndex, lastRowIndex).map((data, i) => (
              <Row
                className="DivElementWithTranslateRow"
                index={firstRowIndex + i}
                key={keys.keyFor(data[0])}
                data={data}
                data-key={keys.keyFor(data[0])}
                offset={30 * (firstRowIndex + i + 1)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
