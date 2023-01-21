import { DataSourceRow } from "@finos/vuu-data";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import cx from "classnames";
import { HTMLAttributes } from "react";
import { ValueFormatter } from "./dataTableTypes";

import "./TableCell.css";

export interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  column: KeyedColumnDescriptor;
  row: DataSourceRow;
  valueFormatter?: ValueFormatter;
}

const defaultValueFormatter = (value: unknown) =>
  value == null ? "" : typeof value === "string" ? value : value.toString();

export const TableCell = ({
  className: classNameProp,
  column,
  row,
  valueFormatter = defaultValueFormatter,
}: TableCellProps) => {
  // might want to useMemo here, this won't change often
  const className = cx(classNameProp, {
    vuuAlignRight: column.align === "right",
    vuuPinLeft: column.pin === "left",
    "vuuTableCell-resizing": column.resizing,
  });
  const value = valueFormatter(row[column.key]);
  return column.pin === "left" ? (
    <td className={className} style={{ left: column.pinnedLeftOffset }}>
      {value}
    </td>
  ) : (
    <td className={className}>{value}</td>
  );
};
