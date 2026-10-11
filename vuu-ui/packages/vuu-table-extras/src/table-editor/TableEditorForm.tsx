import {
  CreateRowForm,
  type CreateRowFormField,
  type CreateRowFormProps,
  EditField,
  type EditFieldProps,
  EditForm,
  type EditFormProps,
  type EditFormValidator,
  type EditFormValues,
  useEditFormContext,
} from "@vuu-ui/vuu-data-editing";
import { type ReactNode, useCallback, useLayoutEffect, useRef } from "react";
import { useTableEditorContext } from "./TableEditorContext";

const classBase = "vuuTableEditorForm";

export type TableEditorField = CreateRowFormField;

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
  /** Fields for the default form content, in tab order. */
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
      ? { cancel: form.cancel, isDirty: form.isDirty }
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
 * Form editing: the selected row of the enclosing `TableWithEditForm`,
 * read-only in view mode and editable in edit mode. Renders nothing in
 * create mode (see `TableEditorCreateForm`) and when no row is selected (see
 * `TableEditorPlaceholder`).
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
    editIn,
    formSessionProps,
    mode,
    onEditCancelled,
    onEditSaved,
    selectedRow,
  } = useTableEditorContext("TableEditorForm");
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
    onEditSaved(submittedValuesRef.current);
  }, [onEditSaved, onSaved]);

  if (editIn !== "form" || mode === "create" || selectedRow === undefined) {
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
      isEditMode={mode === "edit"}
      key={selectedRow.key}
      onCancelled={handleCancelled}
      onSaved={handleSaved}
      showButtons={showButtons}
      validate={validateEdit}
    >
      {children ??
        fields?.map((field) => (
          <EditField {...(field as EditFieldProps)} key={field.name} />
        ))}
      <FormRegistration />
    </EditForm>
  );
};

export interface TableEditorCreateFormProps
  extends Omit<CreateRowFormProps, ProviderOwnedProps> {}

/**
 * Form editing: a form for adding a row, shown in create mode (see
 * `TableEditorNewButton`). Renders an `EditField` per entry in `fields`,
 * followed by `children`. Custom editors in `children` stage values with
 * `setValue` from `useEditFormContext`.
 */
export const TableEditorCreateForm = ({
  children,
  className,
  onCancelled,
  onSaved,
  ...formProps
}: TableEditorCreateFormProps) => {
  const {
    confirmCancel,
    createKey,
    dataSource,
    editIn,
    formSessionProps,
    mode,
    onCreateDone,
  } = useTableEditorContext("TableEditorCreateForm");

  const handleCancelled = useCallback(() => {
    onCancelled?.();
    onCreateDone(false);
  }, [onCancelled, onCreateDone]);
  const handleSaved = useCallback(() => {
    onSaved?.();
    onCreateDone(true);
  }, [onCreateDone, onSaved]);

  if (editIn !== "form" || mode !== "create") {
    return null;
  }

  return (
    <CreateRowForm
      {...formProps}
      {...formSessionProps}
      className={[classBase, className].filter(Boolean).join(" ")}
      confirmCancel={confirmCancel}
      dataSource={dataSource}
      key={createKey}
      onCancelled={handleCancelled}
      onSaved={handleSaved}
    >
      {children}
      <FormRegistration />
    </CreateRowForm>
  );
};
