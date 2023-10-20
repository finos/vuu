import {
  Dropdown,
  DropdownOpenKey,
  SingleSelectionHandler,
} from "@finos/vuu-ui-controls";
import {
  isColumnTypeRenderer,
  isTypeDescriptor,
  registerComponent,
} from "@finos/vuu-utils";
import { TableCellProps } from "@finos/vuu-datagrid-types";
// import { dispatchCommitEvent } from "@finos/vuu-ui-controls";

import "./DropdownCell.css";
import { useCallback, useState } from "react";

const classBase = "vuuTableDropdownCell";

const openKeys: DropdownOpenKey[] = ["Enter", " "];

export const DropdownCell = ({ column, columnMap, row }: TableCellProps) => {
  const values =
    isTypeDescriptor(column.type) && isColumnTypeRenderer(column.type?.renderer)
      ? column.type?.renderer?.values
      : [];

  const dataIdx = columnMap[column.name];
  const [value, setValue] = useState(row[dataIdx]);

  const handleSelectionChange = useCallback<SingleSelectionHandler>(
    (evt, selectedItem) => {
      if (selectedItem) {
        setValue(selectedItem);
        // dispatchCommitEvent(evt.target as HTMLElement);
      }
    },
    []
  );

  return (
    <Dropdown
      className={classBase}
      onSelectionChange={handleSelectionChange}
      openKeys={openKeys}
      selected={value}
      source={values}
      width={column.width - 17} // temp hack
    />
  );
};

registerComponent("dropdown-cell", DropdownCell, "cell-renderer", {});
