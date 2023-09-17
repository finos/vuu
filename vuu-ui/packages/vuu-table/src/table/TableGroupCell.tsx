import {
  GroupColumnDescriptor,
  TableCellProps,
} from "@finos/vuu-datagrid-types";
import {
  getColumnStyle,
  getGroupValueAndOffset,
  metadataKeys,
} from "@finos/vuu-utils";
import { MouseEvent, useCallback } from "react";

import "./TableGroupCell.css";

const { IS_LEAF } = metadataKeys;

export const TableGroupCell = ({ column, onClick, row }: TableCellProps) => {
  const { columns } = column as GroupColumnDescriptor;
  const [value, offset] = getGroupValueAndOffset(columns, row);

  const handleClick = useCallback(
    (evt: MouseEvent) => {
      onClick?.(evt, column);
    },
    [column, onClick]
  );

  const style = getColumnStyle(column);
  const isLeaf = row[IS_LEAF];
  const spacers = Array(offset)
    .fill(0)
    .map((n, i) => <span className="vuuTableGroupCell-spacer" key={i} />);
  return (
    <div
      className={"vuuTableGroupCell vuuPinLeft"}
      onClick={isLeaf ? undefined : handleClick}
      role="cell"
      style={style}
    >
      {spacers}
      {isLeaf ? null : (
        <span className="vuuTableGroupCell-toggle" data-icon="triangle-right" />
      )}
      <span>{value}</span>
    </div>
  );
};
