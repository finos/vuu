import { Button } from "@salt-ds/core";
import { EditState, EditSession } from "./EditSession";
import { useCallback, useEffect, useState } from "react";

export interface EditButtonProps {
  editSession?: EditSession;
  hasSelection?: boolean;
  onCancel?: () => void;
  onDelete?: () => void;
  onAddRows?: () => void;
  onSave: (force?: boolean) => void;
  saveLabel?: string;
  confirmSave?: () => boolean | Promise<boolean>;
  confirmCancel?: () => boolean | Promise<boolean>;
}

export const EditButtons = ({
  confirmCancel,
  confirmSave,
  editSession,
  hasSelection = false,
  onAddRows,
  onCancel,
  onDelete,
  onSave,
  saveLabel = "Save",
}: EditButtonProps) => {
  const [editState, setEditState] = useState<EditState>("clean");

  const handleSave = useCallback(async () => {
    if (confirmSave) {
      const confirmed = await confirmSave();
      if (!confirmed) return;
    }
    onSave(editState === "stale");
  }, [confirmSave, editState, onSave]);

  const handleCancel = useCallback(async () => {
    if (confirmCancel) {
      const confirmed = await confirmCancel();
      if (!confirmed) return;
    }
    onCancel?.();
  }, [confirmCancel, onCancel]);

  useEffect(() => {
    if (editSession) {
      editSession.on("editState", setEditState);
      return () => editSession.removeListener("editState", setEditState);
    }
  }, [editSession]);

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
      {onAddRows && (
        <Button onClick={onAddRows} sentiment="neutral">
          Add Rows
        </Button>
      )}
      <Button
        disabled={editState === "clean" || editState === "invalid"}
        onClick={handleSave}
        sentiment="accented"
      >
        {editState === "stale" ? `${saveLabel} (force)` : saveLabel}
      </Button>      
      {onCancel && <Button onClick={handleCancel}>Cancel</Button>}
    </>
  );
};
