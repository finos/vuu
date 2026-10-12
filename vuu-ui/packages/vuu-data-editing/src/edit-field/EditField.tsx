import {
  Checkbox,
  Dropdown,
  FormField,
  FormFieldLabel,
  Input,
  Option,
} from "@salt-ds/core";
import type { DataRow, TableCellEditHandler } from "@vuu-ui/vuu-table-types";
import { useCallback } from "react";
import { useEditField } from "./useEditField";
import { useEditSession } from "../DataEditingProvider";
import { dataDescriptorTypeToVuuRowDataItemType } from "@vuu-ui/vuu-utils";
import type { DataValueValidationChecker } from "@vuu-ui/vuu-data-types";
import type { VuuColumnDataType, VuuTable } from "@vuu-ui/vuu-protocol-types";
import { useEditMode } from "../EditModeProvider";
import {
  useLookupValues,
  type LookupOption,
  type OptionMap,
} from "../lookup-values/useLookupValues";

import "./EditField.css";

export type TextFieldType = "email" | "password";
export type EditFieldType = "checkbox" | "dropdown" | TextFieldType;

const classBase = "vuuEditField";

export interface EditFieldProps {
  dataRow: DataRow;
  deferNewRow?: boolean;
  label: string;
  name: string;
  readOnly?: boolean;
  required?: boolean;
  type?: EditFieldType;
}

export interface DropdownEditFieldProps extends EditFieldProps {
  type: "dropdown";
  optionMap: OptionMap;
  table: VuuTable;
}

export const EditField = ({
  dataRow,
  deferNewRow = false,
  label,
  name,
  readOnly = false,
  required,
  type,
  ...options
}: EditFieldProps | DropdownEditFieldProps) => {
  const editSession = useEditSession();

  const { isEditMode } = useEditMode();

  const lookupValues = useLookupValues({
    enabled: type === "dropdown",
    ...options,
  });

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
            !deferNewRow &&
            (editSession.isNewRowFinalColumn(name) ||
              editSession.isNewRowComplete())
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
      if (
        editPhase === "change" &&
        deferNewRow &&
        editSession?.isNewRow(dataRow.key)
      ) {
        editSession.setNewRowValue(name, value);
        return { data: undefined, type: "SUCCESS_RESULT" };
      }
    },
    [dataRow, deferNewRow, editSession, name],
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

  const { inputProps, onChange, onDropdownSelectionChange, onKeyDown, value } =
    useEditField({
      column,
      textType: type !== "checkbox" && type !== "dropdown" ? type : undefined,
      onEdit,
      type: dataDescriptorTypeToVuuRowDataItemType(column),
      value: dataValue,
    });

  return (
    <FormField className={classBase} data-field={name} necessity={necessity}>
      <FormFieldLabel>{label}</FormFieldLabel>
      {isEditMode === false ? (
        <Input
          bordered
          inputProps={{ readOnly: true }}
          value={String(dataValue)}
        />
      ) : type === "checkbox" ? (
        <Checkbox checked={Boolean(dataValue)} onChange={onCommit} />
      ) : type === "dropdown" ? (
        <Dropdown<LookupOption>
          data-icon="triangle-down"
          onSelectionChange={onDropdownSelectionChange}
          placeholder="Please select value"
          value={value}
        >
          {lookupValues.map((listOption) => (
            <Option key={listOption.value} value={listOption}>
              {listOption.label}
            </Option>
          ))}
        </Dropdown>
      ) : (
        <Input
          bordered
          inputProps={{ ...inputProps, onChange }}
          onKeyDown={onKeyDown}
          readOnly={readOnly}
          value={value}
        />
      )}
    </FormField>
  );
};
