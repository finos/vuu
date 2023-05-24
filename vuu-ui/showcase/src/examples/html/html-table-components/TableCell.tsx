import { DataSourceRow } from "@finos/vuu-data";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import cx from "classnames";

export interface TableCellProps {
  column: KeyedColumnDescriptor;
  row: DataSourceRow;
}

export const TableCell = ({ column, row }: TableCellProps) => {
  const { align, key, pin, width } = column;

  const className = cx("vuuTableNextCell", {
    vuuAlignRight: align === "right",
    vuuPinFloating: pin === "floating",
    vuuPinLeft: pin === "left",
    vuuPinRight: pin === "right",
  });

  return (
    <div className={className} role="cell" style={{ width }}>
      {row[key]}
    </div>
  );
};
