import { HTMLAttributes, UIEventHandler, useRef } from "react";
import { useScroll } from "./useScroll";

export interface HTMLTableProps extends HTMLAttributes<HTMLDivElement> {
  Row: unknown;
  bufferCount?: number;
  contentHeight: number;
  data: unknown[];
  dataRowCount: number;
  headerHeight?: number;
  onScroll: UIEventHandler<HTMLDivElement>;
  rowHeight?: number;
  viewportHeight: number;
  visibleRowCount?: number;
}
export const TableElementWithSizers = ({
  Row,
  bufferCount = 5,
  contentHeight,
  data,
  dataRowCount,
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
    <div id="scroller" onScroll={handleScroll}>
      <div
        className="scroll-content"
        style={{
          position: "absolute",
          width: 1600,
          height: contentHeight + headerHeight,
        }}
      />

      <div id="chartWrapper" ref={tableRef}>
        <table id="chart">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Job</th>
              <th>Color</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody>
            <tr className="sizer-row" key="sizer-start">
              <td
                className="sizer-cell"
                colSpan={5}
                ref={spacerStartRef}
                style={{ height: 0 }}
              />
            </tr>
            {data.slice(firstRowIndex, lastRowIndex).map((data, i) => (
              <Row index={firstRowIndex + i} key={data[0]} data={data} />
            ))}
            <tr className="sizer-row" key="sizer-end">
              <td
                className="sizer-cell"
                colSpan={5}
                ref={spacerEndRef}
                style={{ height: offscreenContentHeight }}
              />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
