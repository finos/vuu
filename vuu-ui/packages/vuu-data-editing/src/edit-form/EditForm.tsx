import { Banner, BannerContent } from "@salt-ds/core";
import {
  type FormEvent,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
} from "react";
import { DataEditingProvider } from "../DataEditingProvider";
import { EditModeProvider } from "../EditModeProvider";
import {
  type EditFormHookProps,
  type EditFormHookResult,
  useEditForm,
} from "../useEditForm";
import { EditFormButtons } from "./EditFormButtons";
import { EditFormContext } from "./EditFormContext";

import "./EditForm.css";

const classBase = "vuuEditForm";

export interface EditFormProps
  extends EditFormHookProps,
    Omit<
      HTMLAttributes<HTMLFormElement>,
      "children" | "onError" | "onSubmit" | "title"
    > {
  /**
   * Form fields, typically `EditField`s. Pass a function to receive the form
   * state, e.g. to render fields conditionally.
   */
  children: ReactNode | ((form: EditFormHookResult) => ReactNode);
  /** Return false (or resolve false) to keep editing. See `useConfirmDiscard`. */
  confirmCancel?: () => boolean | Promise<boolean>;
  /** Hide the Cancel button. */
  hideCancel?: boolean;
  /**
   * @default "Save" in edit mode, "Done" with direct editing, "Create" in
   * create mode, or "Add" when adding to a shared `editSession`
   */
  saveLabel?: string;
  /**
   * Set false to render the buttons yourself, with `EditFormButtons`.
   * @default true
   */
  showButtons?: boolean;
  title?: ReactNode;
}

/**
 * A form that edits one row of `dataSource`, or creates a new one. Owns the
 * EditSession (via `useEditForm`), provides it to child `EditField`s, and
 * renders an error banner plus Save/Cancel buttons.
 *
 * In edit mode, fields are editable while `isEditMode` is true (or the
 * enclosing `EditModeProvider` is in edit mode). Create mode is always
 * editable. `EditField`s pick up the form's row (a new-row placeholder in
 * create mode), so need no `dataRow` prop.
 */
export const EditForm = ({
  children,
  className,
  columns,
  confirmCancel,
  dataRow,
  dataSource,
  deleteMode,
  editModel,
  editSession: sharedEditSession,
  editSessionApi,
  hideCancel = false,
  isEditMode,
  mode = "edit",
  onCancelled,
  onError,
  onSaved,
  requiredColumns,
  rowDefaults,
  saveLabel,
  showButtons = true,
  title,
  validate,
  ...htmlAttributes
}: EditFormProps) => {
  const form = useEditForm({
    columns,
    dataRow,
    dataSource,
    deleteMode,
    editModel,
    editSession: sharedEditSession,
    editSessionApi,
    isEditMode,
    mode,
    onCancelled,
    onError,
    onSaved,
    requiredColumns,
    rowDefaults,
    validate,
  });
  const { canSave, error, fieldEditSession, saving, submit } = form;

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (canSave) {
        submit();
      }
    },
    [canSave, submit],
  );

  const content = (
    <form
      {...htmlAttributes}
      aria-busy={saving || undefined}
      className={[classBase, `${classBase}-${mode}`, className]
        .filter(Boolean)
        .join(" ")}
      noValidate
      onSubmit={handleSubmit}
    >
      {title ? <h2 className={`${classBase}-title`}>{title}</h2> : null}
      {error ? (
        <Banner className={`${classBase}-error`} status="error">
          <BannerContent>{error.message}</BannerContent>
        </Banner>
      ) : null}
      <div className={`${classBase}-fields`}>
        {typeof children === "function" ? children(form) : children}
      </div>
      {showButtons && form.isEditMode ? (
        <div className={`${classBase}-buttons`}>
          <EditFormButtons
            confirmCancel={confirmCancel}
            hideCancel={hideCancel}
            saveLabel={saveLabel}
          />
        </div>
      ) : null}
    </form>
  );

  // When edit mode is read from an outer EditModeProvider, leave that
  // provider in charge so that toggles inside the form still work.
  const ownsEditMode = mode === "create" || isEditMode !== undefined;

  return (
    <EditFormContext.Provider value={form}>
      <DataEditingProvider editSession={fieldEditSession}>
        {ownsEditMode ? (
          <EditModeProvider isEditMode={form.isEditMode}>
            {content}
          </EditModeProvider>
        ) : (
          content
        )}
      </DataEditingProvider>
    </EditFormContext.Provider>
  );
};
