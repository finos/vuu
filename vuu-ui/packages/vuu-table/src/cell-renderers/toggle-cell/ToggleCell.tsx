import {
  ColumnDescriptor,
  TableCellRendererProps,
} from "@vuu-ui/vuu-table-types";
import {
  CommitHandler,
  dataColumnAndKeyUnchanged,
  dispatchCustomEvent,
  isRpcSuccess,
  isTypeDescriptor,
  isValueListRenderer,
  registerComponent,
} from "@vuu-ui/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";

import { memo, useCallback } from "react";
import { CycleStateButton } from "@vuu-ui/vuu-ui-controls";

import toggleCellCss from "./ToggleCell.css";

const classBase = "vuuTableToggleCell";

const getValueList = ({ name, type }: ColumnDescriptor) => {
  if (isTypeDescriptor(type) && isValueListRenderer(type.renderer)) {
    return type.renderer.values;
  } else {
    throw Error(
      `useLookupValues column ${name} has not been configured with a values list`,
    );
  }
};

export const ToggleCell = memo(function ToggleCell({
  column,
  dataRow,
  onEdit,
}: TableCellRendererProps) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-toggle-cell",
    css: toggleCellCss,
    window: targetWindow,
  });

  const values = getValueList(column);
  const value = dataRow[column.name] as string;

  const handleCommit = useCallback<CommitHandler<HTMLButtonElement>>(
    async (evt, newValue) => {
      const res = await onEdit?.(
        { previousValue: value, value: newValue },
        "commit",
      );
      if (isRpcSuccess(res)) {
        dispatchCustomEvent(evt.target as HTMLElement, "vuu-commit");
      }
      return res;
    },
    [onEdit, value],
  );

  return (
    <CycleStateButton
      appearance="solid"
      className={cx(classBase, `${classBase}-${column.name}`)}
      onCommit={handleCommit}
      sentiment="accented"
      value={value}
      values={values}
    >
      {value}
    </CycleStateButton>
  );
}, dataColumnAndKeyUnchanged);

registerComponent("toggle-cell", ToggleCell, "cell-renderer", {
  userCanAssign: false,
});
