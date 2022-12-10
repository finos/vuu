import { ColumnMap, DataRow, metadataKeys } from "@finos/vuu-utils";
import cx from "classnames";
import React, { HTMLAttributes, memo } from "react";

import { Column, tableLayoutType } from "./dataTableTypes";
import "./TableRow.css";

const { IDX } = metadataKeys;

const classBase = "vuuDataTableRow";

export interface RowProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onClick"> {
  // TODO roll column lookup key into column
  columnMap: ColumnMap;
  columns: Column[];
  /** columnIndex is for rows in a column layout only */
  columnIndex?: number;
  height: number;
  index: number;
  row: DataRow;
  tableLayout?: tableLayoutType;
}

export const TableRow = memo(function Row({
  columnMap,
  columns,
  columnIndex = -1,
  height,
  index,
  row,
  tableLayout = "row",
}: RowProps) {
  const rowIndex = row[IDX];
  const className = cx(classBase, {
    [`${classBase}-even`]: rowIndex % 2 === 0,
  });
  const offset = rowIndex - index;

  //   console.log(
  //     `TableRow index=${index} rowIndex = ${rowIndex} translate by ${
  //       offset * height
  //     }}`
  //   );

  return (
    <tr
      data-idx={index}
      className={className}
      style={{
        transform: `translate3d(0px, ${offset * height}px, 0px)`,
      }}
    >
      {tableLayout === "row" ? (
        columns.map((column, j) =>
          column.pin === "left" ? (
            <td
              className="vuuPinLeft"
              key={j}
              style={{ left: column.pinnedLeftOffset }}
            >
              {row[columnMap[column.name]]}
            </td>
          ) : (
            <td key={j}>{row[columnMap[column.name]]}</td>
          )
        )
      ) : (
        <td>{row[columnMap[columns[columnIndex].name]]}</td>
      )}
    </tr>
  );
});
