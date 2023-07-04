import { TableProps } from "@finos/vuu-table";
import { useMemo, useRef } from "react";
import { Row } from "../Row";
import { useTable } from "./useTable";

import "./DivElementWithTranslate.css";

const classBase = "DivElementWithTranslate";

export const DivElementWithTranslate = ({
  config,
  dataSource,
  headerHeight = 30,
  renderBufferSize = 5,
  rowHeight = 30,
}: TableProps) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const {
    columnMap,
    columns,
    containerMeasurements: { containerRef },
    data,
    handleScroll,
    firstRowIndex,
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
          <div className={`${classBase}-body`} style={bodyStyle}>
            {data.map((data, i) => (
              <Row
                className="DivElementWithTranslateRow"
                columnMap={columnMap}
                columns={columns}
                key={data[0]}
                row={data}
                offset={30 * (firstRowIndex + i + 1)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
