import { Input, Tooltip } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import {
  getVuuEditMessage,
  isEditRowReadOnly,
} from "@vuu-ui/vuu-data-editing";
import {
  dataDescriptorTypeToVuuRowDataItemType,
  registerComponent,
} from "@vuu-ui/vuu-utils";
import cx from "clsx";

import inputCellCss from "./InputCell.css";
import { useInputCell } from "./useInputCell";

const classBase = "vuuTableInputCell";

export const InputCell = ({
  column,
  dataRow,
  editedDuringCurrentSession,
  onEdit,
}: TableCellRendererProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-input-cell",
    css: inputCellCss,
    window: targetWindow,
  });
  const dataValue = dataRow[column.name] as number | string;
  const readOnly = isEditRowReadOnly(dataRow);

  const { align = "left" } = column;

  const {
    editing,
    inputProps,
    warningMessage,
    previousValue = "",
    ...editProps
  } = useInputCell({
    column,
    onEdit,
    type: dataDescriptorTypeToVuuRowDataItemType(column),
    value: dataValue,
  });

  // TODO can this move into useEdtableText ?
  const editRejectedMessage = getVuuEditMessage(
    dataRow,
    column,
    previousValue,
  );
  const errorMessage = warningMessage ?? editRejectedMessage;

  const endAdornment =
    errorMessage && align === "left" ? (
      <Tooltip content={errorMessage} placement="right">
        <Icon className={`${classBase}-icon`} name="error" />
      </Tooltip>
    ) : undefined;

  const startAdornment =
    errorMessage && align === "right" ? (
      <Tooltip content={errorMessage} placement="left">
        <Icon className={`${classBase}-icon`} name="error" />
      </Tooltip>
    ) : undefined;

  return (
    <Input
      {...editProps}
      bordered
      className={cx(classBase, {
        [`${classBase}-edited`]: editedDuringCurrentSession === true,
        [`${classBase}-error`]: warningMessage !== undefined,
        [`${classBase}-warning`]:
          warningMessage === undefined && editRejectedMessage !== undefined,
        vuuEditing: editing,
      })}
      endAdornment={endAdornment}
      inputProps={{
        ...inputProps,
        "aria-invalid": errorMessage ? true : undefined,
        "aria-label": column.label,
      }}
      readOnly={readOnly}
      startAdornment={startAdornment}
    />
  );
};

registerComponent("input-cell", InputCell, "cell-renderer", {
  userCanAssign: false,
});
