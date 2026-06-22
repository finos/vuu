import { Button } from "@salt-ds/core";
import { EditState, EditSession } from "./EditSession";
import { useCallback, useMemo, useState } from "react";

export interface EditButtonProps {
  editSession?: EditSession;
  onCancel: () => void;
  onSave: (force?: boolean) => void;
}

export const EditButtons = ({
  editSession,
  onCancel,
  onSave,
}: EditButtonProps) => {
  const [editState, setEditState] = useState<EditState>("clean");

  const handleSave = useCallback(() => {
    onSave(editState === "stale");
  }, [editState, onSave]);

  useMemo(() => {
    editSession?.on("editState", setEditState);
  }, [editSession]);

  return (
    <>
      <Button
        disabled={editState === "clean" || editState === "invalid"}
        onClick={handleSave}
        sentiment="accented"
      >
        {editState === "stale" ? "Save (force)" : "Save"}
      </Button>
      <Button onClick={onCancel}>Cancel</Button>
    </>
  );
};
