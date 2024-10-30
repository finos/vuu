import {
  ColumnDescriptor,
  TableCellRendererProps,
} from "@finos/vuu-table-types";
import {
  dataColumnAndKeyUnchanged,
  dispatchCustomEvent,
  isTypeDescriptor,
  isValueListRenderer,
  registerComponent,
} from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";

import { memo, useCallback } from "react";
import { CycleStateButton } from "@finos/vuu-ui-controls";

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
  columnMap,
  onEdit,
  row,
}: TableCellRendererProps) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-toggle-cell",
    css: toggleCellCss,
    window: targetWindow,
  });

  const values = getValueList(column);
  const dataIdx = columnMap[column.name];
  const value = row[dataIdx] as string;

  const handleCommit = useCallback(
    async (evt, newValue) => {
      const res = await onEdit?.(
        { previousValue: value, value: newValue },
        "commit",
      );
      if (res === true) {
        dispatchCustomEvent(evt.target as HTMLElement, "vuu-commit");
      }
      return res;
    },
    [onEdit, value],
  );

  return (
    <CycleStateButton
      className={cx(classBase, `${classBase}-${column.name}`)}
      onCommit={handleCommit}
      value={value}
      values={values}
      variant="cta"
    >
      {value}
    </CycleStateButton>
  );
}, dataColumnAndKeyUnchanged);

registerComponent("toggle-cell", ToggleCell, "cell-renderer", {
  userCanAssign: false,
});
