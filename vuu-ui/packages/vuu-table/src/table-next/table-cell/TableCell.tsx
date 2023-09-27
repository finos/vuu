import { DataSourceRow } from "@finos/vuu-data-types";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { ColumnMap } from "packages/vuu-utils/src";
import { MouseEvent } from "react";
import { useCell } from "../useCell";

import "./TableCell.css";

const classBase = "vuuTableNextCell";

export interface TableCellProps {
  column: KeyedColumnDescriptor;
  columnMap: ColumnMap;
  onClick?: (
    evt: MouseEvent<HTMLDivElement>,
    column: KeyedColumnDescriptor
  ) => void;
  row: DataSourceRow;
}

export const TableCell = ({ column, columnMap, row }: TableCellProps) => {
  const { className, style } = useCell(column, classBase);
  const { CellRenderer, valueFormatter } = column;
  const dataIdx = columnMap[column.name];
  const value = valueFormatter(row[dataIdx]);

  return (
    <div className={className} role="cell" style={style}>
      {CellRenderer ? (
        <CellRenderer column={column} columnMap={columnMap} row={row} />
      ) : (
        value
      )}
    </div>
  );
};
