import { metadataKeys } from "@finos/vuu-utils";
import { CSSProperties, useCallback } from "react";
import { TableImplementationProps } from "./dataTableTypes";
import cx from "classnames";
import { TableRow } from "./TableRow";
import { TableHeaderCell } from "./TableHeaderCell";

const classBase = "vuuTable";
const { RENDER_IDX } = metadataKeys;

export const ColumnBasedTable = ({
  columns,
  data,
  headerHeight,
  onHeaderCellDragEnd,
  rowHeight,
}: TableImplementationProps) => {
  const handleDragEnd = useCallback(() => {
    onHeaderCellDragEnd?.();
  }, [onHeaderCellDragEnd]);

  console.log(`ColumnBasedTable render`);
  return (
    <>
      {columns.map((column, i) => (
        <table
          className={cx(`${classBase}-table`, `${classBase}-columnBased`, {
            vuuPinLeft: column.pin === "left",
          })}
          data-idx={i}
          id={`col-${i}`}
          key={column.name}
          style={
            {
              width: column.width,
              left: column.pinnedOffset,
              "--vuuTableHeaderHeight": `${headerHeight}px`,
              "--row-height": `${rowHeight}px`,
            } as CSSProperties
          }
        >
          <tbody>
            <tr key="header">
              <TableHeaderCell
                column={column}
                data-idx={i}
                key={i}
                onDragEnd={handleDragEnd}
              />
            </tr>
            {data.map((row, j) => (
              <TableRow
                columns={[column]}
                height={rowHeight}
                index={j}
                key={row[RENDER_IDX]}
                row={row}
              />
            ))}
            <tr className="vuuTable-filler" />
          </tbody>
        </table>
      ))}
    </>
  );
};
