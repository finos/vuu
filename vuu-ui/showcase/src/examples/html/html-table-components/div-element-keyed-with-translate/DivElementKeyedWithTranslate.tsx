import { TableProps } from "@finos/vuu-table";
import { useMemo, useRef } from "react";
import { Row } from "../Row";
import { useTable } from "./useTable";
import { metadataKeys } from "@finos/vuu-utils";

import "./DivElementKeyedWithTranslate.css";

const classBase = "DivElementKeyedWithTranslate";

const { IDX, RENDER_IDX } = metadataKeys;

export const DivElementKeyedWithTranslate = ({
  config,
  dataSource,
  headerHeight = 30,
  renderBufferSize = 5,
  rowHeight = 30,
}: TableProps) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const { columnMap, columns, data, handleScroll, viewportMeasurements } =
    useTable({
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
    <div className={classBase} onScroll={handleScroll}>
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
                  style={{ width: col.width }}
                >
                  {col.name}
                </div>
              ))}
            </div>
          </div>
          <div className={`${classBase}-body`} style={bodyStyle}>
            {data.map((data) => (
              <Row
                className="DivElementKeyedWithTranslateRow"
                columnMap={columnMap}
                columns={columns}
                key={data[RENDER_IDX]}
                row={data}
                offset={rowHeight * data[IDX] + rowHeight}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
