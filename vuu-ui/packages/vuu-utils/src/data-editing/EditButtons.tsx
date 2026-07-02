import { Button } from "@salt-ds/core";
import { EditState, EditSession } from "./EditSession";
import { useCallback, useMemo, useState } from "react";

export interface EditButtonProps {
  editSession?: EditSession;
  onCancel?: () => void;
  onDelete?: () => void;
  onSave: (force?: boolean) => void;
  saveLabel?: string;
}

export const EditButtons = ({
  editSession,
  onCancel,
  onDelete,
  onSave,
  saveLabel = "Save",
}: EditButtonProps) => {
  const [editState, setEditState] = useState<EditState>("clean");
  const [selectionCount, setSelectionCount] = useState(0);

  const handleSave = useCallback(() => {
    onSave(editState === "stale");
  }, [editState, onSave]);

  useMemo(() => {
    editSession?.on("editState", setEditState);
    editSession?.on("selectionCount", setSelectionCount);
  }, [editSession]);

  return (
    <>
      {onDelete && (
        <Button
          disabled={selectionCount === 0}
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
