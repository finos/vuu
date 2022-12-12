import React from "react";
import { TableProps } from "./Table";
import { TableMeasurements } from "./useTableScroll";
import cx from "classnames";

const classBase = "vuuTable";
const headerCell = `${classBase}-headerCell`;

export type ColumnBasedTableProps = Pick<TableProps, "columns" | "data">;

export const ColumnBasedTable = ({ columns, data }: ColumnBasedTableProps) => {
  const pinnedLeftOffset = columns
    .filter((col) => col.pin === "left")
    .map((col, i, cols) => {
      return i === 0 ? 0 : cols[i - 1].width;
    });

  return (
    <>
      {columns.map((column, i) => (
        <table
          className={cx(`${classBase}-table`, `${classBase}-columnBased`, {
            vuuPinLeft: column.pin === "left",
          })}
          key={i}
          style={{ width: column.width, left: pinnedLeftOffset[i] }}
        >
          <tbody>
            <tr key="header">
              <th className={headerCell} key={i}>
                {column.name}
              </th>
            </tr>
            {data.map((row, j) => (
              <tr className={`vuuTable-row`} key={j}>
                <td>{row[i]}</td>
              </tr>
            ))}
            <tr className="vuuTable-filler" />
          </tbody>
        </table>
      ))}
    </>
  );
};
