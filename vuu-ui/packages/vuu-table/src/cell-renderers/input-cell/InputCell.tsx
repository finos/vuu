import { TableCellRendererProps } from "@finos/vuu-table-types";
import { registerComponent } from "@finos/vuu-utils";
import { Input } from "@salt-ds/core";
import { useEditableText } from "@finos/vuu-ui-controls";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";

import inputCellCss from "./InputCell.css";

const classBase = "vuuTableInputCell";

const WarnCommit = (): Promise<true> => {
  console.warn(
    "onCommit handler has not been provided to InputCell cell renderer"
  );
  return Promise.resolve(true);
};
export const InputCell = ({
  column,
  columnMap,
  onCommit = WarnCommit,
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
    initialValue: dataValue,
    onCommit,
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
