import { Dropdown, DropdownOpenKey } from "@finos/vuu-ui-controls";
import {
  isColumnTypeRenderer,
  isTypeDescriptor,
  registerComponent,
} from "@finos/vuu-utils";
import { TableCellProps } from "@finos/vuu-datagrid-types";

import "./DropdownCell.css";

const classBase = "vuuTableDropdownCell";

const openKeys: DropdownOpenKey[] = ["Enter", " "];

export const DropdownCell = ({ column, columnMap, row }: TableCellProps) => {
  const { valueFormatter } = column;
  const values =
    isTypeDescriptor(column.type) && isColumnTypeRenderer(column.type?.renderer)
      ? column.type?.renderer?.values
      : [];

  const dataIdx = columnMap[column.name];
  const value = valueFormatter(row[dataIdx]);
  return (
    <Dropdown
      className={classBase}
      openKeys={openKeys}
      selected={value}
      source={values}
      width={column.width - 17} // temp hack
    />
  );
};

registerComponent("dropdown-cell", DropdownCell, "cell-renderer", {});
