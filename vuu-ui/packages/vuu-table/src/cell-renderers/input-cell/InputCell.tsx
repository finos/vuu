import { Input } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { useEditableText } from "@vuu-ui/vuu-ui-controls";
import { registerComponent } from "@vuu-ui/vuu-utils";
import cx from "clsx";

import inputCellCss from "./InputCell.css";

const classBase = "vuuTableInputCell";

export const InputCell = ({
  column,
  columnMap,
  onEdit,
  row,
}: TableCellRendererProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-input-cell",
    css: inputCellCss,
    window: targetWindow,
  });

  const dataIdx = columnMap[column.name];
  const dataValue = row[dataIdx] as number | string;
  const { align = "left", clientSideEditValidationCheck } = column;

  const { warningMessage, ...editProps } = useEditableText({
    value: dataValue,
    onEdit,
    clientSideEditValidationCheck,
  });

  const endAdornment =
    warningMessage && align === "left" ? (
      <span className={`${classBase}-icon`} data-icon="error" />
    ) : undefined;

  const startAdornment =
    warningMessage && align === "right" ? (
      <span className={`${classBase}-icon`} data-icon="error" />
    ) : undefined;

  return (
    <Input
      {...editProps}
      bordered
      className={cx(classBase, {
        [`${classBase}-error`]: warningMessage !== undefined,
      })}
      endAdornment={endAdornment}
      startAdornment={startAdornment}
    />
  );
};

registerComponent("input-cell", InputCell, "cell-renderer", {
  userCanAssign: false,
});
