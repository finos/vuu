import { TableCellRendererProps } from "@finos/vuu-datagrid-types";
import { registerComponent } from "@finos/vuu-utils";
import { Input } from "@salt-ds/core";
import { useEditableText, WarnCommit } from "@finos/vuu-ui-controls";
import cx from "classnames";
// make sure all validators are loaded - how do we manage this ?
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CaseValidator, PatternValidator } from "@finos/vuu-table-extras";

import "./InputCell.css";

const classBase = "vuuTableInputCell";

export const InputCell = ({
  column,
  columnMap,
  onCommit = WarnCommit,
  row,
}: TableCellRendererProps) => {
  const dataIdx = columnMap[column.name];
  const {
    align = "left",
    clientSideEditValidationCheck,
    valueFormatter,
  } = column;

  const { warningMessage, ...editProps } = useEditableText({
    initialValue: valueFormatter(row[dataIdx]),
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
