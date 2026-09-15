import { Button } from "@salt-ds/core";
import type { EditSession } from "./EditSession";
import { useCallback } from "react";
import { useEditState } from "./useEditState";

export interface EditButtonProps {
  canCancel: boolean;
  canSave: boolean;
  editSession?: EditSession;
  hasSelection?: boolean;
  onCancel?: () => void;
  onDelete?: () => void;
  onSave: (force?: boolean) => void;
  saveLabel?: string;
  confirmSave?: () => boolean | Promise<boolean>;
  confirmCancel?: () => boolean | Promise<boolean>;
}

export const EditButtons = ({
  canCancel,
  canSave,
  confirmCancel,
  confirmSave,
  editSession,
  hasSelection = false,
  onCancel,
  onDelete,
  onSave,
  saveLabel = "Save",
}: EditButtonProps) => {
  const editState = useEditState(editSession);
  const isDirty = editSession?.isDirty ?? false;

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
