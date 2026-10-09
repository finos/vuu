import { Banner, BannerContent, Button } from "@salt-ds/core";
import {
  type FormEvent,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
} from "react";
import { DataEditingProvider } from "../DataEditingProvider";
import { EditButtons } from "../EditButtons";
import { EditModeProvider } from "../EditModeProvider";
import {
  type EditFormHookProps,
  type EditFormHookResult,
  useEditForm,
} from "../useEditForm";
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
  /** @default "Save" in edit mode, "Create" in create mode */
  saveLabel?: string;
  /** Render the buttons yourself, e.g. in a dialog footer. */
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
 * editable; fields must use `dataRow={{ key: EditSession.newRowKey }}` and
 * `deferNewRow` (`CreateRowForm` does this for you).
 */
export const EditForm = ({
  children,
  className,
  columns,
  confirmCancel,
  dataRow,
  dataSource,
  deleteMode,
  editSessionApi,
  hideCancel = false,
  isEditMode,
  mode = "edit",
  onCancelled,
  onError,
  onSaved,
  requiredColumns,
  rowDefaults,
  saveLabel = mode === "create" ? "Create" : "Save",
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
  const { cancel, canSave, editSession, error, saving, submit } = form;

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (canSave) {
        submit();
      }
    },
    [canSave, submit],
  );

  const handleCancel = useCallback(async () => {
    if (confirmCancel && form.isDirty && !(await confirmCancel())) {
      return;
    }
    cancel();
  }, [cancel, confirmCancel, form.isDirty]);

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
          {mode === "edit" ? (
            <EditButtons
              canSave={canSave}
              editSession={editSession}
              onCancel={hideCancel ? undefined : handleCancel}
              onSave={submit}
              saveLabel={saveLabel}
            />
          ) : (
            <>
              <Button disabled={!canSave} sentiment="accented" type="submit">
                {saveLabel}
              </Button>
              {hideCancel ? null : (
                <Button disabled={saving} onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </>
          )}
        </div>
      ) : null}
    </form>
  );

  // When edit mode is read from an outer EditModeProvider, leave that
  // provider in charge so that toggles inside the form still work.
  const ownsEditMode = mode === "create" || isEditMode !== undefined;

  return (
    <EditFormContext.Provider value={form}>
      <DataEditingProvider editSession={editSession}>
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
