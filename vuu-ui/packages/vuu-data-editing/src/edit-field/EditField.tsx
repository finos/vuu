import { Checkbox, FormField, FormFieldLabel, Input } from "@salt-ds/core";
import type { DataRow, TableCellEditHandler } from "@vuu-ui/vuu-table-types";
import { useCallback } from "react";
import { useEditField } from "./useEditField";
import { useEditSession } from "../DataEditingProvider";
import { dataDescriptorTypeToVuuRowDataItemType } from "@vuu-ui/vuu-utils";
import type { DataValueValidationChecker } from "@vuu-ui/vuu-data-types";
import type { VuuColumnDataType } from "@vuu-ui/vuu-protocol-types";
import { useEditMode } from "../EditModeProvider";

export type TextFieldType = "email" | "password";
export type EditFieldType = "checkbox" | TextFieldType;

export interface EditFieldProps {
  dataRow: DataRow;
  label: string;
  name: string;
  readOnly?: boolean;
  required?: boolean;
  type?: EditFieldType;
}

export const EditField = ({
  dataRow,
  label,
  name,
  readOnly = false,
  required,
  type,
}: EditFieldProps) => {
  const editSession = useEditSession();

  const { isEditMode } = useEditMode();

  const onEdit = useCallback<TableCellEditHandler>(
    async (editState, editPhase) => {
      const { isValid = true, previousValue = "", value } = editState;
      if (editPhase === "commit" && editSession) {
        if (editSession.isNewRow(dataRow.key)) {
          const isEmptyValue = typeof value === "string" && value.trim() === "";
          if (!isValid && !isEmptyValue) {
            return { errorMessage: "Invalid value", type: "ERROR_RESULT" };
          }
          editSession.setNewRowValue(name, value);
          if (
            editSession.isNewRowFinalColumn(name) ||
            editSession.isNewRowComplete()
          ) {
            return editSession.addNewRow();
          }
          return { data: undefined, type: "SUCCESS_RESULT" };
        }

        return editSession.commit(
          dataRow.key,
          name,
          previousValue,
          value,
          isValid,
        );
      }
    },
    [dataRow, editSession, name],
  );

  const onCommit = useCallback(() => {
    console.log("onCommit");
  }, []);

  const necessity = required ? "asterisk" : undefined;

  const dataValue = dataRow?.[name] ?? "";
  const column: {
    label: string;
    name: string;
    clientSideEditValidationCheck?: DataValueValidationChecker;
    serverDataType: VuuColumnDataType;
  } = { label, name, serverDataType: "string" };

  const {
    editing,
    inputProps,
    warningMessage,
    previousValue = "",
    ...editProps
  } = useEditField({
    column,
    textType: type !== "checkbox" ? type : undefined,
    onEdit,
    type: dataDescriptorTypeToVuuRowDataItemType(column),
    value: dataValue,
  });

  return (
    <FormField data-field={name} necessity={necessity}>
      <FormFieldLabel>{label}</FormFieldLabel>
      {isEditMode === false ? (
        <Input
          bordered
          inputProps={{ readOnly: true }}
          value={String(dataValue)}
        />
      ) : type === "checkbox" ? (
        <Checkbox checked={Boolean(dataValue)} onChange={onCommit} />
      ) : (
        <Input {...editProps} bordered readOnly={readOnly} />
      )}
    </FormField>
  );
};
