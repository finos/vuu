import {
  Checkbox,
  Dropdown,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Input,
  Option,
} from "@salt-ds/core";
import type { DataRow, TableCellEditHandler } from "@vuu-ui/vuu-table-types";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import { useEditField } from "./useEditField";
import { useEditSession, useTableEditSession } from "../DataEditingProvider";
import { dataDescriptorTypeToVuuRowDataItemType } from "@vuu-ui/vuu-utils";
import type {
  DataValueDescriptor,
  DataValueValidationChecker,
} from "@vuu-ui/vuu-data-types";
import type {
  VuuColumnDataType,
  VuuRowDataItemType,
  VuuTable,
} from "@vuu-ui/vuu-protocol-types";
import { useEditMode } from "../EditModeProvider";
import { getDataItemEditControl } from "../edit-control";
import { DirectEditSession } from "../DirectEditSession";
import { useEditFormContext } from "../edit-form/EditFormContext";
import { useEditSessionState } from "../useEditSessionState";
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
  /**
   * Client side validation, run on change and before commit. Invalid values
   * are not sent to the server.
   */
  clientSideEditValidationCheck?: DataValueValidationChecker;
  /**
   * The row being edited. Use `{ key: EditSession.newRowKey }` for a new row.
   * Defaults to the row of the enclosing `EditForm`.
   */
  dataRow?: DataRow;
  /**
   * For new rows only. When true, values are staged in the EditSession draft
   * and the row is not added until `editSession.addNewRow()` is called (e.g.
   * from a form Save button). When false, the row is added as soon as the
   * final (or last required) field is committed. Defaults to true inside a
   * create-mode `EditForm`, otherwise false.
   */
  deferNewRow?: boolean;
  label: string;
  name: string;
  readOnly?: boolean;
  required?: boolean;
  /**
   * The server data type of the column. Determines how typed values are
   * converted before commit. Defaults to "boolean" for checkbox fields,
   * otherwise "string".
   */
  serverDataType?: VuuColumnDataType;
  type?: EditFieldType;
}

export interface DropdownEditFieldProps extends EditFieldProps {
  type: "dropdown";
  optionMap: OptionMap;
  table: VuuTable;
}

/**
 * A field described by a column descriptor, the same descriptor a Table
 * column uses. The control is chosen by `getDataItemEditControl`, from the
 * descriptor's `editor` and `serverDataType`. `editable` and `required` are
 * respected.
 */
export interface ColumnEditFieldProps
  extends Omit<
    EditFieldProps,
    "label" | "name" | "readOnly" | "required" | "serverDataType" | "type"
  > {
  column: DataValueDescriptor;
  /** Defaults to `column.label`, then `column.name` */
  label?: string;
}

const isColumnEditFieldProps = (
  props: EditFieldProps | DropdownEditFieldProps | ColumnEditFieldProps,
): props is ColumnEditFieldProps =>
  (props as ColumnEditFieldProps).column !== undefined;

/**
 * A labelled form field bound to the EditSession provided by the enclosing
 * DataEditingProvider. Read-only unless the enclosing EditModeProvider is in
 * edit mode. Commits on Enter or blur (text), selection (dropdown) or toggle
 * (checkbox).
 */
const resolveDataRow = (dataRow?: DataRow) => {
  if (dataRow === undefined) {
    throw Error("EditField needs a dataRow prop or an enclosing EditForm");
  }
  return dataRow;
};

export const EditField = (
  props: EditFieldProps | DropdownEditFieldProps | ColumnEditFieldProps,
) =>
  isColumnEditFieldProps(props) ? (
    <ColumnEditField {...props} />
  ) : (
    <TypedEditField {...props} />
  );

const ColumnEditField = ({
  column: descriptor,
  label = descriptor.label ?? descriptor.name,
  ...props
}: ColumnEditFieldProps) => (
  <TypedEditField
    {...props}
    descriptor={descriptor}
    label={label}
    name={descriptor.name}
    required={descriptor.required}
    serverDataType={descriptor.serverDataType}
  />
);

const TypedEditField = ({
  clientSideEditValidationCheck,
  dataRow: dataRowProp,
  deferNewRow: deferNewRowProp,
  descriptor,
  label,
  name,
  readOnly = false,
  required,
  serverDataType = "string",
  type,
  ...options
}: (EditFieldProps | DropdownEditFieldProps) & {
  descriptor?: DataValueDescriptor;
}) => {
  const editSession = useEditSession();
  // an EditSession or, with direct editing, a DirectEditSession
  const tableEditSession = useTableEditSession();
  const form = useEditFormContext();
  const dataRow = resolveDataRow(dataRowProp ?? form?.dataRow);
  const deferNewRow = deferNewRowProp ?? form?.mode === "create";

  const { isEditMode } = useEditMode();
  const formFieldErrors = form?.fieldErrors;
  const isNewRow = editSession?.isNewRow(dataRow.key) ?? false;
  const { newRowState } = useEditSessionState(
    isNewRow ? editSession : undefined,
  );

  const lookupValues = useLookupValues({
    enabled: descriptor === undefined && type === "dropdown",
    ...options,
  });

  // staging through the form also clears this field's validation error
  const formSetValue = form?.setValue;
  const setNewRowValue = useCallback(
    (name: string, value: VuuRowDataItemType) => {
      if (formSetValue) {
        formSetValue(name, value);
      } else {
        editSession?.setNewRowValue(name, value);
      }
    },
    [editSession, formSetValue],
  );

  const onEdit = useCallback<TableCellEditHandler>(
    async (editState, editPhase) => {
      const { isValid = true, previousValue = "", value } = editState;
      if (editPhase === "commit" && tableEditSession) {
        if (editSession?.isNewRow(dataRow.key)) {
          const isEmptyValue = typeof value === "string" && value.trim() === "";
          if (!isValid && !isEmptyValue) {
            return { errorMessage: "Invalid value", type: "ERROR_RESULT" };
          }
          setNewRowValue(name, value);
          if (
            !deferNewRow &&
            (editSession.isNewRowFinalColumn(name) ||
              editSession.isNewRowComplete())
          ) {
            return editSession.addNewRow();
          }
          return { data: undefined, type: "SUCCESS_RESULT" };
        }

        return tableEditSession.commit(
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
        setNewRowValue(name, value);
        return { data: undefined, type: "SUCCESS_RESULT" };
      }
    },
    [dataRow, deferNewRow, editSession, name, setNewRowValue, tableEditSession],
  );

  const necessity = required ? "asterisk" : undefined;

  const dataValue = dataRow?.[name] ?? "";
  const [checked, setChecked] = useState(Boolean(dataValue));
  useEffect(() => {
    setChecked(Boolean(dataValue));
  }, [dataValue]);

  const handleCheckboxChange = useCallback(
    async (evt: ChangeEvent<HTMLInputElement>) => {
      const previousValue = checked;
      const value = evt.target.checked;
      setChecked(value);
      const response = await onEdit(
        { editType: "commit", isValid: true, previousValue, value },
        "commit",
      );
      if (response?.type === "ERROR_RESULT") {
        setChecked(previousValue);
      }
    },
    [checked, onEdit],
  );

  const column: {
    label: string;
    name: string;
    clientSideEditValidationCheck?: DataValueValidationChecker;
    serverDataType: VuuColumnDataType;
  } = {
    clientSideEditValidationCheck,
    label,
    name,
    serverDataType:
      type === "checkbox" && serverDataType === "string"
        ? "boolean"
        : serverDataType,
  };

  const {
    commit,
    inputProps,
    onChange,
    onDropdownSelectionChange,
    onKeyDown,
    value,
    warningMessage: fieldMessage,
  } = useEditField({
    column,
    textType: type !== "checkbox" && type !== "dropdown" ? type : undefined,
    onEdit,
    type: dataDescriptorTypeToVuuRowDataItemType(column),
    value: dataValue,
  });

  const warningMessage = isEditMode
    ? (fieldMessage ??
      // within an EditForm, fieldErrors already include new row errors
      (formFieldErrors ? formFieldErrors[name] : newRowState.errors[name]))
    : undefined;

  return (
    <FormField
      className={classBase}
      data-field={name}
      necessity={necessity}
      validationStatus={warningMessage ? "error" : undefined}
    >
      <FormFieldLabel>{label}</FormFieldLabel>
      {isEditMode === false ? (
        <Input
          bordered
          inputProps={{ readOnly: true }}
          value={String(dataValue)}
        />
      ) : descriptor ? (
        getDataItemEditControl({
          InputProps: {
            bordered: true,
            inputProps: { ...inputProps, onChange, value },
            onKeyDown,
            value,
          },
          commitOnBlur: true,
          dataDescriptor: descriptor,
          editOperation: isNewRow ? "insert" : "update",
          onCommit: (_evt, committedValue) => {
            void commit(String(committedValue));
          },
          table:
            tableEditSession instanceof DirectEditSession
              ? tableEditSession.dataSource.table
              : editSession?.sourceDataSource?.table,
        })
      ) : type === "checkbox" ? (
        <Checkbox
          checked={checked}
          disabled={readOnly}
          onChange={handleCheckboxChange}
        />
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
      {warningMessage ? (
        <FormFieldHelperText>{warningMessage}</FormFieldHelperText>
      ) : null}
    </FormField>
  );
};
