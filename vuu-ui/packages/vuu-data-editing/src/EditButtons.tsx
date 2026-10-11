import { Button } from "@salt-ds/core";
import type { EditSession } from "./EditSession";
import { useCallback } from "react";
import { useEditSessionState } from "./useEditSessionState";

export interface EditButtonProps {
  /**
   * Enables the Cancel button. Defaults to `editSession.canCancel`, so only
   * provide this to override the session-derived value.
   */
  canCancel?: boolean;
  /**
   * Enables the Save button. Defaults to `editSession.canSave`, so only
   * provide this to override the session-derived value.
   */
  canSave?: boolean;
  editSession?: EditSession;
  hasSelection?: boolean;
  onCancel?: () => void;
  onDelete?: () => void;
  onSave: (force?: boolean) => void;
  saveLabel?: string;
  /** Return false (or resolve false) to abort the save. */
  confirmSave?: () => boolean | Promise<boolean>;
  /**
   * Called before cancelling a session with unsaved changes. Return false
   * (or resolve false) to keep editing. See `useConfirmDiscard`.
   */
  confirmCancel?: () => boolean | Promise<boolean>;
}

/**
 * Delete, Save and Cancel buttons for an edit session. Save switches to
 * "Save (force)" when the last save was rejected as stale.
 */
export const EditButtons = ({
  canCancel: canCancelProp,
  canSave: canSaveProp,
  confirmCancel,
  confirmSave,
  editSession,
  hasSelection = false,
  onCancel,
  onDelete,
  onSave,
  saveLabel = "Save",
}: EditButtonProps) => {
  const {
    canCancel: sessionCanCancel,
    canSave: sessionCanSave,
    editState,
    isDirty,
  } = useEditSessionState(editSession);
  const canSave = canSaveProp ?? sessionCanSave;
  const canCancel = canCancelProp ?? sessionCanCancel;

  const handleSave = useCallback(async () => {
    if (confirmSave) {
      const confirmed = await confirmSave();
      if (!confirmed) return;
    }
    onSave(editState === "stale");
  }, [confirmSave, editState, onSave]);

  const handleCancel = useCallback(async () => {
    if (confirmCancel && isDirty) {
      const confirmed = await confirmCancel();
      if (!confirmed) return;
    }
    onCancel?.();
  }, [confirmCancel, isDirty, onCancel]);

  return (
    <>
      {onDelete && (
        <Button
          disabled={!hasSelection}
          onClick={onDelete}
          sentiment="negative"
        >
          Delete
        </Button>
      )}
      <Button disabled={!canSave} onClick={handleSave} sentiment="accented">
        {editState === "stale" ? `${saveLabel} (force)` : saveLabel}
      </Button>
      {onCancel && (
        <Button disabled={!canCancel} onClick={handleCancel}>
          Cancel
        </Button>
      )}
    </>
  );
};
