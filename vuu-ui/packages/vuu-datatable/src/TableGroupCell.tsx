import { DataSourceRow } from "@finos/vuu-data";
import {
  GroupColumnDescriptor,
  KeyedColumnDescriptor,
} from "@finos/vuu-datagrid-types";
import { metadataKeys } from "@finos/vuu-utils";
import { TableCellProps } from "./TableCell";

import "./TableGroupCell.css";

const { DEPTH, IS_LEAF } = metadataKeys;

export const getGroupValueAndOffset = (
  columns: KeyedColumnDescriptor[],
  row: DataSourceRow
): [unknown, number] => {
  const { [DEPTH]: depth, [IS_LEAF]: isLeaf } = row;
  // Depth can be greater tha group columns when we have just removed a column from groupby
  // but new data has not yet been received.
  if (isLeaf || depth > columns.length) {
    return [null, depth === null ? 0 : depth - 1];
  } else if (depth === 0) {
    return ["$root", 0];
  } else {
    // offset 1 for now to allow for $root
    const column = columns[depth - 1];
    return [row[column.key], depth - 1];
  }
};

// const defaultValueFormatter = (value: unknown) =>
//   value == null ? "" : typeof value === "string" ? value : value.toString();

export const TableGroupCell = ({
  column,
  onClick,
  row,
}: // valueFormatter = defaultValueFormatter,
TableCellProps) => {
  const { columns } = column as GroupColumnDescriptor;
  // const value = valueFormatter(row[column.key]);
  const [value, offset] = getGroupValueAndOffset(columns, row);
  const style = {
    left: column.pin == "left" ? column.pinnedOffset : undefined,
    // paddingLeft: (offset - 1) * 20,
  };
  const isLeaf = row[IS_LEAF];
  const spacers = Array(offset)
    .fill(0)
    .map((n, i) => <span className="vuuTableGroupCell-spacer" key={i} />);
  return (
    <td
      className={"vuuTableGroupCell vuuPinLeft"}
      onClick={isLeaf ? undefined : onClick}
      style={style}
    >
      {spacers}
      {isLeaf ? null : (
        <span className="vuuTableGroupCell-toggle" data-icon="triangle-right" />
      )}
      <span>{value}</span>
    </td>
  );
};
