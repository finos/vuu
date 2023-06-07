import { DataSourceRow } from "@finos/vuu-data";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { MouseEvent } from "react";
import { useCell } from "./table-next/useCell";

export interface TableCellProps {
  column: KeyedColumnDescriptor;
  onClick?: (
    evt: MouseEvent<HTMLDivElement>,
    column: KeyedColumnDescriptor
  ) => void;
  row: DataSourceRow;
}

export const TableCell = ({ column, row }: TableCellProps) => {
  const { className, style } = useCell(column, "vuuTableNextCell");

  return (
    <div className={className} role="cell" style={style}>
      {row[column.key]}
    </div>
  );
};
