import React, { memo, useCallback } from "react";
import { TableCellRendererProps } from "@finos/vuu-table-types";
import { CheckboxIcon, WarnCommit } from "@finos/vuu-ui-controls";
import { Checkbox } from "@salt-ds/core";
import {
  dataAndColumnUnchanged,
  dispatchCustomEvent,
  registerComponent,
} from "@finos/vuu-utils";

export const CheckboxCell: React.FC<TableCellRendererProps> = memo(
  ({ column, columnMap, onCommit = WarnCommit, row }) => {
    const dataIdx = columnMap[column.name];
    const isChecked = row[dataIdx];

    const handleCommit = useCallback(
      (value) => async (evt: React.MouseEvent) => {
        const res = await onCommit(value);
        if (res === true) {
          dispatchCustomEvent(evt.target as HTMLElement, "vuu-commit");
        }
        return res;
      },
      [onCommit]
    );

    return column.editable ? (
      <Checkbox checked={isChecked} onClick={handleCommit(!isChecked)} />
    ) : (
      <CheckboxIcon checked={isChecked} disabled={true} />
    );
  },
  dataAndColumnUnchanged
);
CheckboxCell.displayName = "CheckboxCell";

registerComponent("checkbox-cell", CheckboxCell, "cell-renderer", {
  serverDataType: "boolean",
});
