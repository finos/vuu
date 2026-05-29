import { Input, Tooltip } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { Icon, useEditableText } from "@vuu-ui/vuu-ui-controls";
import {
  dataDescriptorTypeToVuuRowDataItemType,
  getVuuEditMessage,
  registerComponent,
} from "@vuu-ui/vuu-utils";
import cx from "clsx";

import inputCellCss from "./InputCell.css";

const classBase = "vuuTableInputCell";

export const InputCell = ({
  column,
  dataRow,
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

  const {
    edited,
    editing,
    warningMessage,
    previousValue = "",
    ...editProps
  } = useEditableText({
    column,
    onEdit,
    type: dataDescriptorTypeToVuuRowDataItemType(column),
    value: dataValue,
  });

  // TODO can this move into useEdtableText ?
  const editRejected = getVuuEditMessage(dataRow, column, previousValue);

  const endAdornment =
    editRejected && align === "left" ? (
      <Tooltip content={editRejected} placement="right">
        <Icon className={`${classBase}-icon`} name="error" />
      </Tooltip>
    ) : warningMessage && align === "left" ? (
      <Tooltip content={warningMessage} placement="right">
        <Icon className={`${classBase}-icon`} name="error" />
      </Tooltip>
    ) : undefined;

  const startAdornment =
    editRejected && align === "right" ? (
      <Tooltip content={editRejected} placement="right">
        <Icon className={`${classBase}-icon`} name="error" />
      </Tooltip>
    ) : warningMessage && align === "right" ? (
      <Tooltip content={warningMessage} placement="left">
        <Icon className={`${classBase}-icon`} name="error" />
      </Tooltip>
    ) : undefined;

  console.log(`[InputCell] render`);

  return (
    <Input
      {...editProps}
      bordered
      className={cx(classBase, {
        [`${classBase}-edited`]: edited,
        [`${classBase}-error`]: warningMessage !== undefined,
        [`${classBase}-warning`]: editRejected !== undefined,
        vuuEditing: editing,
      })}
      endAdornment={endAdornment}
      startAdornment={startAdornment}
    />
  );
};

registerComponent("input-cell", InputCell, "cell-renderer", {
  userCanAssign: false,
});
