import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { DataRow } from "@finos/vuu-utils";
import { ValueFormatter } from "./dataTableTypes";

export interface TableCellProps {
  column: KeyedColumnDescriptor;
  row: DataRow;
  valueFormatter?: ValueFormatter;
}

const getCellClassName = (column: KeyedColumnDescriptor) => {
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
  column,
  row,
  valueFormatter = defaultValueFormatter,
}: TableCellProps) => {
  const className = getCellClassName(column);
  const value = valueFormatter(row[column.key]);
  return column.pin === "left" ? (
    <td className={className} style={{ left: column.pinnedLeftOffset }}>
      {value}
    </td>
  ) : (
    <td className={className}>{value}</td>
  );
};
