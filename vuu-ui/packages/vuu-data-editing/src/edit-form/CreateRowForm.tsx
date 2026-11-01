import type { DataValueDescriptor } from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { type ReactNode, useMemo } from "react";
import { EditSession } from "../EditSession";
import { EditField } from "../edit-field/EditField";
import { EditForm, type EditFormProps } from "./EditForm";

/**
 * A create form field. The control is chosen from its `editor` and
 * `serverDataType` by `getDataItemEditControl`. Required unless
 * `required: false`.
 */
export type CreateRowFormField = DataValueDescriptor;

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
  /** Rendered after the fields. */
  children?: ReactNode;
  /**
   * Fields, in tab order. Every field is required unless it sets
   * `required: false`. Omit to compose custom editors as `children`, which
   * stage their values with `setValue` from `useEditFormContext`.
   */
  fields?: readonly CreateRowFormField[];
}

const NEW_ROW = { key: EditSession.newRowKey } as DataRow;
const NO_FIELDS: readonly CreateRowFormField[] = [];

/**
 * A form that adds one row to `dataSource`, or, given an `editSession`, to
 * that session. Renders an `EditField` per entry in `fields`, stages the values as a new-row draft, and adds the row on
 * Create. Required fields left empty, `validate` errors and server
 * rejections are shown on the form; the row is only added once all pass.
 *
 * The form is single-use: close it from `onSaved`/`onCancelled`, or remount
 * it (change its `key`) to create another row.
 */
export const CreateRowForm = ({
  children,
  fields = NO_FIELDS,
  ...props
}: CreateRowFormProps) => {
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
          column={
            field.required === false ? field : { ...field, required: true }
          }
          dataRow={NEW_ROW}
          deferNewRow
          key={field.name}
        />
      ))}
      {children}
    </EditForm>
  );
};
