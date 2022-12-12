import { DataRow, metadataKeys } from "@vuu-ui/vuu-utils";
import React, { useCallback } from "react";
import { useGridContext } from "../grid-context";
import { GroupColumnDescriptor } from "../grid-model";
import { getGroupValueAndOffset } from "../grid-model/gridModelUtils";

import "./grid-group-cell.css";

const { KEY, IS_EXPANDED, COUNT } = metadataKeys;

export interface GroupCellProps {
  column: GroupColumnDescriptor;
  row: DataRow;
}

export const GroupCell = React.memo(function GroupCell({
  column,
  row,
}: GroupCellProps) {
  const { dispatchGridAction } = useGridContext();

  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const type = row[IS_EXPANDED] ? "closeTreeNode" : "openTreeNode";
      dispatchGridAction?.({ type, key: row[KEY] });
    },
    [dispatchGridAction, row]
  );

  const count = row[COUNT];
  const [value, offset] = getGroupValueAndOffset(column.columns, row);

  return (
    <div
      className={"vuuDataGridCell"}
      onClick={handleClick}
      style={{ width: column.width }}
      tabIndex={0}
    >
      {offset !== null ? (
        <div
          className={"GridGroupCell"}
          style={{ paddingLeft: (offset - 1) * 20 }}
          tabIndex={0}
        >
          <span className="hwIconContainer" data-icon={"arrow-right"} />
          <span className="group-value">{value}</span>
          <span> ({count})</span>
        </div>
      ) : null}
    </div>
  );
});
