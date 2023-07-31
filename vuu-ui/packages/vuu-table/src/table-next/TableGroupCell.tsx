import { DataSourceRow } from "@finos/vuu-data-types";
import {
  GroupColumnDescriptor,
  KeyedColumnDescriptor,
} from "@finos/vuu-datagrid-types";
import { getGroupValueAndOffset, metadataKeys } from "@finos/vuu-utils";
import { MouseEvent, useCallback } from "react";
import { useCell } from "./useCell";

export interface TableCellProps {
  column: KeyedColumnDescriptor;
  onClick?: (evt: MouseEvent, column: KeyedColumnDescriptor) => void;
  row: DataSourceRow;
}

const { IS_LEAF } = metadataKeys;

export const TableGroupCell = ({ column, onClick, row }: TableCellProps) => {
  const { columns } = column as GroupColumnDescriptor;
  const [value, offset] = getGroupValueAndOffset(columns, row);
  const { className, style } = useCell(column, "vuuTable2-groupCell");

  const handleClick = useCallback(
    (evt: MouseEvent) => {
      onClick?.(evt, column);
    },
    [column, onClick]
  );

  const isLeaf = row[IS_LEAF];
  const spacers = Array(offset)
    .fill(0)
    .map((n, i) => <span className="vuuTable2-groupCell-spacer" key={i} />);

  return (
    <div
      className={className}
      role="cell"
      style={style}
      onClick={isLeaf ? undefined : handleClick}
    >
      {spacers}
      {isLeaf ? null : (
        <span
          className="vuuTable2-groupCell-toggle"
          data-icon="vuu-triangle-right"
        />
      )}
      <span>{value}</span>
    </div>
  );
};
