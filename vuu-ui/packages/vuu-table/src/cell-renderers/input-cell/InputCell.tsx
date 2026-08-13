import { Input, Tooltip } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import {
  getVuuEditMessage,
  useEditSession,
} from "@vuu-ui/vuu-data-editing";
import {
  dataDescriptorTypeToVuuRowDataItemType,
  registerComponent,
} from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { useCallback } from "react";

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

  const { align = "left" } = column;
  const editSession = useEditSession();
  const shouldSuppressWarningMessage = useCallback(() => {
    const errors = editSession?.newRowState.errors ?? {};
    return (
      editSession?.isNewRow(dataRow.key) === true &&
      errors[column.name] === undefined &&
      Object.keys(errors).length > 0
    );
  }, [column.name, dataRow.key, editSession]);

  const {
    editing,
    inputProps,
    warningMessage,
    previousValue = "",
    ...editProps
  } = useInputCell({
    column,
    onEdit,
    shouldSuppressWarningMessage,
    type: dataDescriptorTypeToVuuRowDataItemType(column),
    value: dataValue,
  });

  // TODO can this move into useEdtableText ?
  const editRejectedMessage = getVuuEditMessage(
    dataRow,
    column,
    previousValue,
  );

  const endAdornment =
    editRejectedMessage && align === "left" ? (
      <Tooltip content={editRejectedMessage} placement="right">
        <Icon className={`${classBase}-icon`} name="error" />
      </Tooltip>
    ) : warningMessage && align === "left" ? (
      <Tooltip content={warningMessage} placement="right">
        <Icon className={`${classBase}-icon`} name="error" />
      </Tooltip>
    ) : undefined;

  const startAdornment =
    editRejectedMessage && align === "right" ? (
      <Tooltip content={editRejectedMessage} placement="right">
        <Icon className={`${classBase}-icon`} name="error" />
      </Tooltip>
    ) : warningMessage && align === "right" ? (
      <Tooltip content={warningMessage} placement="left">
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
        [`${classBase}-warning`]: editRejectedMessage !== undefined,
        vuuEditing: editing,
      })}
      endAdornment={endAdornment}
      inputProps={{
        ...inputProps,
        "aria-invalid": editRejectedMessage ? true : undefined,
        "aria-label": column.label,
      }}
      startAdornment={startAdornment}
    />
  );
};

registerComponent("input-cell", InputCell, "cell-renderer", {
  userCanAssign: false,
});
