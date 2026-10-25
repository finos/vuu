import {
  CreateRowForm,
  type CreateRowFormProps,
  EditField,
  EditForm,
  type EditFormProps,
  type EditFormValidator,
  type EditFormValues,
  getFormFields,
  useEditFormContext,
} from "@vuu-ui/vuu-data-editing";
import type { DataValueDescriptor } from "@vuu-ui/vuu-data-types";
import {
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { useTableEditorContext } from "./TableEditorContext";

const classBase = "vuuTableEditorForm";

/**
 * Form editing: describes a field, overlaid on its schema column (and table
 * column). The control is chosen from its `editor` and `serverDataType`.
 */
export type TableEditorField = DataValueDescriptor;

/**
 * The fields of a generated form, from the dataSource schema and the
 * table's columns.
 */
const useFormFields = (
  fields: readonly DataValueDescriptor[] | undefined,
  operation: "insert" | "update",
  enabled: boolean,
) => {
  const { columns, dataSource } = useTableEditorContext("TableEditorForm");
  const schema = dataSource.tableSchema;
  return useMemo(
    () =>
      enabled ? getFormFields({ columns, fields, operation, schema }) : [],
    [columns, enabled, fields, operation, schema],
  );
};

const requiredNames = (fields: readonly DataValueDescriptor[]) =>
  fields.filter(({ required }) => required).map(({ name }) => name);

type ProviderOwnedProps =
  | "confirmCancel"
  | "dataSource"
  | "deleteMode"
  | "editSessionApi"
  | "onError"
  | "rowDefaults";

export interface TableEditorFormProps
  extends Omit<
    EditFormProps,
    | ProviderOwnedProps
    | "children"
    | "columns"
    | "dataRow"
    | "editModel"
    | "editSession"
    | "isEditMode"
    | "mode"
    | "requiredColumns"
  > {
  /**
   * The form's content: `EditField`s (which need no `dataRow`), custom
   * editors, tabs, `EditFormButtons` etc. Read the selected row with
   * `useTableEditor`. Defaults to an `EditField` per entry in `fields`.
   */
  children?: ReactNode;
  /**
   * Fields for the default form content, in tab order. Without `fields` or
   * `children`, a field is generated for each schema column.
   */
  fields?: readonly TableEditorField[];
  /**
   * Render the built-in Save and Cancel buttons. When you compose the form's
   * content as `children`, render `TableEditorButtons` where you want them.
   * @default true without `children`, false with them
   */
  showButtons?: boolean;
}

/** Lets the provider route `cancel` (e.g. from a mode toggle) via the form. */
const FormRegistration = () => {
  const form = useEditFormContext();
  const { formHandleRef } = useTableEditorContext("TableEditorForm");
  useLayoutEffect(() => {
    formHandleRef.current = form
      ? {
          cancel: form.cancel,
          getValues: form.getValues,
          isDirty: form.isDirty,
        }
      : undefined;
  });
  useLayoutEffect(
    () => () => {
      formHandleRef.current = undefined;
    },
    [formHandleRef],
  );
  return null;
};

/**
 * Form editing: the selected row of the enclosing `EditableTable`, read-only
 * in view mode and editable in edit mode. Renders nothing in create mode
 * (see `TableEditorCreateForm`) and when no row is selected (see
 * `TableEditorPlaceholder`).
 *
 * Without `children` or `fields`, the form is generated: a field per schema
 * column, labelled and edited as the table's columns are.
 *
 * With `editModel="direct"`, each field is validated and sent as it is
 * committed. Done returns the form to read-only.
 */
export const TableEditorForm = ({
  children,
  className,
  fields,
  onCancelled,
  onSaved,
  showButtons = children === undefined,
  validate,
  ...formProps
}: TableEditorFormProps) => {
  const {
    confirmCancel,
    dataSource,
    editModel,
    editStrategy,
    formHandleRef,
    formSessionProps,
    mode,
    onEditCancelled,
    onEditSaved,
    selectedRow,
  } = useTableEditorContext("TableEditorForm");
  const formFields = useFormFields(fields, "update", children === undefined);
  const requiredColumns = useMemo(
    () => requiredNames(formFields),
    [formFields],
  );
  const submittedValuesRef = useRef<EditFormValues | undefined>(undefined);

  const validateEdit = useCallback<EditFormValidator>(
    (values) => {
      // the selected row snapshot is updated with these once saved
      submittedValuesRef.current = values;
      return validate?.(values);
    },
    [validate],
  );

  const handleCancelled = useCallback(() => {
    onCancelled?.();
    onEditCancelled();
  }, [onCancelled, onEditCancelled]);

  const handleSaved = useCallback(() => {
    onSaved?.();
    onEditSaved(
      // direct edits are not validated as a whole on submit
      editModel === "direct"
        ? formHandleRef.current?.getValues()
        : submittedValuesRef.current,
    );
  }, [editModel, formHandleRef, onEditSaved, onSaved]);

  if (
    editStrategy !== "form" ||
    mode === "create" ||
    selectedRow === undefined
  ) {
    return null;
  }

  return (
    <EditForm
      {...formProps}
      {...formSessionProps}
      className={[classBase, className].filter(Boolean).join(" ")}
      confirmCancel={confirmCancel}
      dataRow={selectedRow}
      dataSource={dataSource}
      editModel={editModel}
      isEditMode={mode === "edit"}
      key={selectedRow.key}
      onCancelled={handleCancelled}
      onSaved={handleSaved}
      requiredColumns={requiredColumns}
      showButtons={showButtons}
      validate={validateEdit}
    >
      {children ??
        formFields.map((field) => (
          <EditField column={field} key={field.name} />
        ))}
      <FormRegistration />
    </EditForm>
  );
};

export interface TableEditorCreateFormProps
  extends Omit<CreateRowFormProps, ProviderOwnedProps | "editSession"> {}

/**
 * A form for adding a row, shown in create mode (see
 * `TableEditorNewButton`), with `editStrategy="form"` or
 * `createStrategy="form"`. Renders an `EditField` per entry in `fields`,
 * followed by `children`. Custom editors in `children` stage values with
 * `setValue` from `useEditFormContext`.
 *
 * Without `children` or `fields`, a field is generated for each schema
 * column that can be set on a new row.
 *
 * With inline session editing the row is added to the table's edit
 * session (the button reads Add), and saved with the rest of the session.
 */
export const TableEditorCreateForm = ({
  children,
  className,
  fields,
  onCancelled,
  onSaved,
  ...formProps
}: TableEditorCreateFormProps) => {
  const {
    confirmCancel,
    createKey,
    createStrategy,
    dataSource,
    editModel,
    editSession,
    editStrategy,
    formSessionProps,
    mode,
    onCreateDone,
  } = useTableEditorContext("TableEditorCreateForm");
  const generatedFields = useFormFields(
    fields,
    "insert",
    fields !== undefined || children === undefined,
  );
  // CreateRowForm fields are required unless they say otherwise. Generated
  // fields are only required when the schema or table column says so.
  const formFields = useMemo(
    () =>
      fields
        ? generatedFields
        : generatedFields.map((field) =>
            field.required ? field : { ...field, required: false },
          ),
    [fields, generatedFields],
  );
  // inline session editing: the new row joins the table's edit session
  const sharedEditSession =
    editStrategy === "inline" && editModel === "session"
      ? editSession
      : undefined;

  const handleCancelled = useCallback(() => {
    onCancelled?.();
    onCreateDone(false);
  }, [onCancelled, onCreateDone]);
  const handleSaved = useCallback(() => {
    onSaved?.();
    onCreateDone(true);
  }, [onCreateDone, onSaved]);

  if (createStrategy !== "form" || mode !== "create") {
    return null;
  }

  return (
    <CreateRowForm
      {...formProps}
      {...formSessionProps}
      className={[classBase, className].filter(Boolean).join(" ")}
      confirmCancel={confirmCancel}
      dataSource={dataSource}
      editSession={sharedEditSession}
      fields={formFields}
      key={createKey}
      onCancelled={handleCancelled}
      onSaved={handleSaved}
    >
      {children}
      <FormRegistration />
    </CreateRowForm>
  );
};
