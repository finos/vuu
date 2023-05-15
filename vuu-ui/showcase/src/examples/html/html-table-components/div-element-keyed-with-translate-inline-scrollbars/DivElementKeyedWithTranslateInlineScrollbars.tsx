import { useMemo } from "react";
import { useTable } from "./useTable";
import { HTMLTableProps } from "../tableTypes";

import "./DivElementKeyedWithTranslateInlineScrollbars.css";

const classBase = "DivElementKeyedWithTranslateInlineScrollbars";

export const DivElementKeyedWithTranslateInlineScrollbars = ({
  Row,
  bufferCount = 5,
  columns,
  contentHeight,
  data,
  dataRowCount = data.length,
  rowHeight = 30,
  visibleRowCount = 20,
}: HTMLTableProps) => {
  const { keys, range, scrollProps } = useTable();

  const { from: firstRowIndex, to: lastRowIndex } = range;

  const bodyStyle = useMemo(
    () => ({
      height: contentHeight,
    }),
    [contentHeight]
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
              {columns.map((column) => (
                <div
                  className={`${classBase}-col-header`}
                  key={column}
                  role="cell"
                  style={{ width: 100 }}
                >
                  {column}
                </div>
              ))}
            </div>
          </div>
          <div className={`${classBase}-body`} style={bodyStyle}>
            {data.slice(firstRowIndex, lastRowIndex).map((data, i) => (
              <Row
                cellWidth={100}
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
