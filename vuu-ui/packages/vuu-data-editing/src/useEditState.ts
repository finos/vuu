import { useCallback, useSyncExternalStore } from "react";
import type { EditSession, EditState } from "./EditSession";

export function useEditState(editSession: EditSession | undefined): EditState {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!editSession) {
        return () => undefined;
      }
      editSession.on("editState", onStoreChange);
      return () => editSession.removeListener("editState", onStoreChange);
    },
    [editSession],
  );

  const getSnapshot = useCallback(
    () => editSession?.editState ?? "clean",
    [editSession],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
