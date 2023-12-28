import { TableCellRendererProps } from "@finos/vuu-table-types";
import { registerComponent } from "@finos/vuu-utils";
import { Input } from "@salt-ds/core";
import { useEditableText } from "@finos/vuu-ui-controls";
import cx from "clsx";

import "./InputCell.css";

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
  const dataIdx = columnMap[column.name];
  const { align = "left", clientSideEditValidationCheck } = column;

  const { warningMessage, ...editProps } = useEditableText({
    initialValue: row[dataIdx],
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

registerComponent("input-cell", InputCell, "cell-renderer", {});
