import { TableProps } from "@finos/vuu-table";
import { useRef } from "react";
import { Row } from "../Row";
import { useTable } from "./useTable";

import "./TableElementWithSizers.css";

const classBase = "TableElementWithSizers";

export const TableElementWithSizers = ({
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
        className="scroll-content"
        style={{
          position: "absolute",
          width: 1600,
          height: viewportMeasurements.contentHeight + headerHeight,
        }}
      />

      <div className={`${classBase}-wrapper`} ref={tableRef}>
        <table id="chart">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.name}>{col.name}</th>
              ))}
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
            {data.map((data) => (
              <Row
                Element="tr"
                className="TableElementWithSizersRow"
                columnMap={columnMap}
                columns={columns}
                key={data[0]}
                data={data}
              />
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
