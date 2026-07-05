import { Button } from "@salt-ds/core";
import { EditState, EditSession } from "./EditSession";
import { useCallback, useMemo, useState } from "react";

export interface EditButtonProps {
  editSession?: EditSession;
  hasSelection?: boolean;
  onCancel?: () => void;
  onDelete?: () => void;
  onSave: (force?: boolean) => void;
  saveLabel?: string;
  confirmSave?: () => boolean | Promise<boolean>;
}

export const EditButtons = ({
  confirmSave,
  editSession,
  hasSelection = false,
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

  useMemo(() => {
    editSession?.on("editState", setEditState);
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
      <Button
        disabled={editState === "clean" || editState === "invalid"}
        onClick={handleSave}
        sentiment="accented"
      >
        {editState === "stale" ? `${saveLabel} (force)` : saveLabel}
      </Button>      
      {onCancel && <Button onClick={onCancel}>Cancel</Button>}
    </>
  );
};
