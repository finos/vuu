import { Button } from "@salt-ds/core";
import { useCallback } from "react";
import { EditButtons } from "../EditButtons";
import type { EditFormHookResult } from "../useEditForm";
import { useEditFormContext } from "./EditFormContext";

const assertForm = (form?: EditFormHookResult) => {
  if (form === undefined) {
    throw Error("EditFormButtons must be rendered within an EditForm");
  }
  return form;
};

export interface EditFormButtonsProps {
  /** Return false (or resolve false) to keep editing. See `useConfirmDiscard`. */
  confirmCancel?: () => boolean | Promise<boolean>;
  /** Hide the Cancel button. */
  hideCancel?: boolean;
  /**
   * @default "Save" in edit mode, "Done" with direct editing, "Create" in
   * create mode, or "Add" when adding to a shared session
   */
  saveLabel?: string;
}

/**
 * Save (or Create) and Cancel buttons for the enclosing `EditForm`. The form
 * renders these itself while editing; render them yourself, with
 * `showButtons={false}` on the form, to place them elsewhere in the form or
 * to show them, disabled, outside edit mode.
 */
export const EditFormButtons = ({
  confirmCancel,
  hideCancel = false,
  saveLabel: saveLabelProp,
}: EditFormButtonsProps) => {
  const {
    cancel,
    canSave,
    editModel,
    editSession,
    isDirty,
    isSharedSession,
    mode,
    saving,
    submit,
  } = assertForm(useEditFormContext());
  const saveLabel =
    saveLabelProp ??
    (mode === "create"
      ? isSharedSession
        ? "Add"
        : "Create"
      : editModel === "direct"
        ? "Done"
        : "Save");

  const handleCancel = useCallback(async () => {
    if (confirmCancel && isDirty && !(await confirmCancel())) {
      return;
    }
    cancel();
  }, [cancel, confirmCancel, isDirty]);

  if (editModel === "direct") {
    // each field was sent as it was committed, there is nothing to cancel
    return (
      <Button onClick={() => submit()} sentiment="accented">
        {saveLabel}
      </Button>
    );
  }

  return mode === "edit" ? (
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
  );
};
