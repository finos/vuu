import { Button } from "@salt-ds/core";
import { EditState, EditTracker } from "./EditTracker";
import { useMemo, useState } from "react";

export interface EditButtonProps {
  editTracker?: EditTracker;
  onCancel: () => void;
  onSave: () => void;
}

export const EditButtons = ({
  editTracker,
  onCancel,
  onSave,
}: EditButtonProps) => {
  const [editState, setEditState] = useState<EditState>("clean");

  useMemo(() => {
    editTracker?.on("editState", setEditState);
  }, [editTracker]);

  return (
    <>
      <Button disabled={editState === "clean"} onClick={onSave}>
        Save
      </Button>
      <Button onClick={onCancel}>Cancel</Button>
    </>
  );
};
