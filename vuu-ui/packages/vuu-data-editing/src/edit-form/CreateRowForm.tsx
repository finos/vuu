import type { DataRow } from "@vuu-ui/vuu-table-types";
import { useMemo } from "react";
import { EditSession } from "../EditSession";
import {
  type DropdownEditFieldProps,
  EditField,
  type EditFieldProps,
} from "../edit-field/EditField";
import { EditForm, type EditFormProps } from "./EditForm";

type FieldProps<T> = Omit<T, "dataRow" | "deferNewRow">;

export type CreateRowFormField =
  | FieldProps<EditFieldProps>
  | FieldProps<DropdownEditFieldProps>;

export interface CreateRowFormProps
  extends Omit<
    EditFormProps,
    | "children"
    | "columns"
    | "dataRow"
    | "isEditMode"
    | "mode"
    | "requiredColumns"
  > {
  /**
   * Fields, in tab order. Every field is required unless it sets
   * `required: false`.
   */
  fields: readonly CreateRowFormField[];
}

const NEW_ROW = { key: EditSession.newRowKey } as DataRow;

/**
 * A form that adds one row to `dataSource`. Renders an `EditField` per entry
 * in `fields`, stages the values as a new-row draft, and adds the row on
 * Create. Required fields left empty, `validate` errors and server
 * rejections are shown on the form; the row is only added once all pass.
 *
 * The form is single-use: close it from `onSaved`/`onCancelled`, or remount
 * it (change its `key`) to create another row.
 */
export const CreateRowForm = ({ fields, ...props }: CreateRowFormProps) => {
  const fieldNames = fields.map(({ name }) => name).join();
  const requiredNames = fields
    .filter(({ required }) => required !== false)
    .map(({ name }) => name)
    .join();

  // keyed on the field names so inline `fields` arrays don't reset the form
  const columns = useMemo(
    () => (fieldNames ? fieldNames.split(",") : []),
    [fieldNames],
  );
  const requiredColumns = useMemo(
    () => (requiredNames ? requiredNames.split(",") : []),
    [requiredNames],
  );

  return (
    <EditForm
      {...props}
      columns={columns}
      mode="create"
      requiredColumns={requiredColumns}
    >
      {fields.map((field) => (
        <EditField
          {...(field as EditFieldProps)}
          dataRow={NEW_ROW}
          deferNewRow
          key={field.name}
          required={field.required !== false}
        />
      ))}
    </EditForm>
  );
};
