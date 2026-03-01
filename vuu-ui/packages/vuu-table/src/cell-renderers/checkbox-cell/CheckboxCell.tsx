import { MouseEvent, KeyboardEventHandler, memo, useCallback } from "react";
import { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { Checkbox } from "@salt-ds/core";
import {
  dataColumnAndKeyUnchanged,
  dispatchCustomEvent,
  isRpcSuccess,
  registerComponent,
} from "@vuu-ui/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import checkboxCellCss from "./CheckboxCell.css";

const classBase = "vuuCheckboxCell";

export const CheckboxCell = memo(
  ({ column, columnMap, onEdit, row }: TableCellRendererProps) => {
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-checkbox-cell",
      css: checkboxCellCss,
      window: targetWindow,
    });

    const dataIdx = columnMap[column.name];
    const isChecked = !!row[dataIdx];

    const handleCommit = useCallback(
      (value: boolean) => async (evt: MouseEvent) => {
        const res = await onEdit?.(
          { previousValue: isChecked, value },
          "commit",
        );
        if (isRpcSuccess(res)) {
          dispatchCustomEvent(evt.target as HTMLElement, "vuu-commit");
        }
        return res;
      },
      [isChecked, onEdit],
    );

    const handleKeyDown = useCallback<KeyboardEventHandler>(
      async (evt) => {
        if (evt.key === "Enter") {
          const res = await onEdit?.(
            { previousValue: isChecked, value: !isChecked },
            "commit",
          );
          if (isRpcSuccess(res)) {
            dispatchCustomEvent(evt.target as HTMLElement, "vuu-commit");
          }
        }
      },
      [isChecked, onEdit],
    );

    const className = `${classBase}-checkbox`;

    return column.editable ? (
      <Checkbox
        checked={isChecked}
        className={className}
        onClick={handleCommit(!isChecked)}
        onKeyDown={handleKeyDown}
      />
    ) : (
      <Checkbox checked={isChecked} className={className} disabled={true} />
    );
  },
  dataColumnAndKeyUnchanged,
);
CheckboxCell.displayName = "CheckboxCell";

registerComponent("checkbox-cell", CheckboxCell, "cell-renderer", {
  serverDataType: "boolean",
});
