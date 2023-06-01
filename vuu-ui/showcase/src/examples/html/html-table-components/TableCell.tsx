import { DataSourceRow } from "@finos/vuu-data";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { useCell } from "./table-next/useCell";

export interface TableCellProps {
  column: KeyedColumnDescriptor;
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
