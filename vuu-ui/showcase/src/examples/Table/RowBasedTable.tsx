import React from "react";
import { TableProps } from "./Table";
import { TableMeasurements } from "./useTableScroll";

const classBase = "vuuTable";
const headerCell = `${classBase}-headerCell`;
const headerCellLeftPinned = `${classBase}-headerCell vuuPinLeft`;

export type RowBasedTableProps = Pick<TableProps, "columns" | "data">;

export const RowBasedTable = ({ columns, data }: RowBasedTableProps) => {
  const pinnedLeftOffset = columns
    .filter((col) => col.pin === "left")
    .map((col, i, cols) => {
      return i === 0 ? 0 : cols[i - 1].width;
    });

  return (
    <table className={`${classBase}-table`}>
      <colgroup>
        {columns.map((column, i) => (
          <col key={i} width={`${column.width}px`} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {columns.map((column, i) =>
            column.pin === "left" ? (
              <th
                className={headerCellLeftPinned}
                key={i}
                style={{ left: pinnedLeftOffset[i] }}
              >
                {column.name}
              </th>
            ) : (
              <th className={headerCell} key={i}>
                {column.name}
              </th>
            )
          )}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr className={`vuuTable-row`} key={i}>
            {columns.map((column, j) =>
              column.pin === "left" ? (
                <td
                  className="vuuPinLeft"
                  key={j}
                  style={{ left: pinnedLeftOffset[j] }}
                >
                  {row[j]}
                </td>
              ) : (
                <td key={j}>{row[j]}</td>
              )
            )}
          </tr>
        ))}
        <tr className="vuuTable-filler" />
      </tbody>
    </table>
  );
};
