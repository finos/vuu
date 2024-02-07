import { GroupColumnDescriptor, TableCellProps } from "@finos/vuu-table-types";
import { getGroupValueAndOffset, metadataKeys } from "@finos/vuu-utils";
import { MouseEvent, useCallback } from "react";
import { useCell } from "../useCell";
import cx from "clsx";

import "./TableGroupCell.css";

const { IS_LEAF } = metadataKeys;

const classBase = "vuuTableGroupCell";

export const TableGroupCell = ({
  column,
  columnMap,
  onClick,
  row,
}: TableCellProps) => {
  const { columns } = column as GroupColumnDescriptor;
  const [value, offset] = getGroupValueAndOffset(columns, row, columnMap);
  const { className, style } = useCell(column, classBase);

  const handleClick = useCallback(
    (evt: MouseEvent<HTMLDivElement>) => {
      onClick?.(evt, column);
    },
    [column, onClick]
  );

  const isLeaf = row[IS_LEAF];
  const spacers = Array(offset)
    .fill(0)
    .map((n, i) => <span className={`${classBase}-spacer`} key={i} />);

  return (
    <div
      className={cx(className, "vuuTableCell")}
      role="cell"
      style={style}
      onClick={isLeaf ? undefined : handleClick}
    >
      {spacers}
      {isLeaf ? null : (
        <span className={`${classBase}-toggle`} data-icon="triangle-right" />
      )}
      <span>{value}</span>
    </div>
  );
};
