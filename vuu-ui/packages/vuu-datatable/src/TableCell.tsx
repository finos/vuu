import { DataSourceRow } from "@finos/vuu-data";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { HTMLAttributes } from "react";
import { ValueFormatter } from "./dataTableTypes";
import cx from "classnames";

export interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  column: KeyedColumnDescriptor;
  row: DataSourceRow;
  valueFormatter?: ValueFormatter;
}

export const getCellClassName = (column: KeyedColumnDescriptor) => {
  const alignRight = column.align === "right";
  const pinLeft = column.pin === "left";
  if (pinLeft && alignRight) {
    return "vuuAlignRight vuuPinLeft";
  } else if (pinLeft) {
    return "vuuPinLeft";
  } else if (alignRight) {
    return "vuuAlignRight";
  }
};

const defaultValueFormatter = (value: unknown) =>
  value == null ? "" : typeof value === "string" ? value : value.toString();

export const TableCell = ({
  className: classNameProp,
  column,
  row,
  valueFormatter = defaultValueFormatter,
}: TableCellProps) => {
  const className = cx(classNameProp, getCellClassName(column), {
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
