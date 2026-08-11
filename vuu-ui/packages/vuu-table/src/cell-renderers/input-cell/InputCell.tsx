import { Input, Tooltip } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import { getVuuEditMessage } from "@vuu-ui/vuu-data-editing";
import {
  dataDescriptorTypeToVuuRowDataItemType,
  registerComponent,
} from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { useId } from "react";

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
  const editErrorId = useId();

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
  const editRejected = getVuuEditMessage(dataRow, column, previousValue);
  const { editError } = column;

  const endAdornment =
    editError && align === "left" ? (
      <Tooltip content={editError} placement="right">
        <Icon className={`${classBase}-icon`} name="error" />
      </Tooltip>
    ) : editRejected && align === "left" ? (
      <Tooltip content={editRejected} placement="right">
        <Icon className={`${classBase}-icon`} name="error" />
      </Tooltip>
    ) : warningMessage && align === "left" ? (
      <Tooltip content={warningMessage} placement="right">
        <Icon className={`${classBase}-icon`} name="error" />
      </Tooltip>
    ) : undefined;

  const startAdornment =
    editError && align === "right" ? (
      <Tooltip content={editError} placement="right">
        <Icon className={`${classBase}-icon`} name="error" />
      </Tooltip>
    ) : editRejected && align === "right" ? (
      <Tooltip content={editRejected} placement="right">
        <Icon className={`${classBase}-icon`} name="error" />
      </Tooltip>
    ) : warningMessage && align === "right" ? (
      <Tooltip content={warningMessage} placement="left">
        <Icon className={`${classBase}-icon`} name="error" />
      </Tooltip>
    ) : undefined;

  return (
    <>
      <Input
        {...editProps}
        bordered
        className={cx(classBase, {
          [`${classBase}-edited`]: editedDuringCurrentSession === true,
          [`${classBase}-error`]:
            editError !== undefined || warningMessage !== undefined,
          [`${classBase}-warning`]: editRejected !== undefined,
          vuuEditing: editing || editError !== undefined,
        })}
        endAdornment={endAdornment}
        inputProps={{
          ...inputProps,
          "aria-describedby": editError ? editErrorId : undefined,
          "aria-errormessage": editError ? editErrorId : undefined,
          "aria-invalid": editError ? true : undefined,
          "aria-label": column.label,
        }}
        startAdornment={startAdornment}
      />
      {editError ? (
        <span className={`${classBase}-errorMessage`} id={editErrorId}>
          {editError}
        </span>
      ) : null}
    </>
  );
};

registerComponent("input-cell", InputCell, "cell-renderer", {
  userCanAssign: false,
});
