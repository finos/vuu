import { Button } from "@salt-ds/core";
import { EditState, EditSession } from "./EditSession";
import { useMemo, useState } from "react";

export interface EditButtonProps {
  editSession?: EditSession;
  onCancel: () => void;
  onSave: () => void;
}

export const EditButtons = ({
  editSession,
  onCancel,
  onSave,
}: EditButtonProps) => {
  const [editState, setEditState] = useState<EditState>("clean");

  useMemo(() => {
    editSession?.on("editState", setEditState);
  }, [editSession]);

  return (
    <>
      <Button
        disabled={editState === "clean"}
        onClick={onSave}
        sentiment="accented"
      >
        Save
      </Button>
      <Button onClick={onCancel}>Cancel</Button>
    </>
  );
};
