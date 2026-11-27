import { useCallback, useSyncExternalStore } from "react";
import type { EditSession } from "./EditSession";

/** True while the edit session has a change that undoLastChange can revert. */
export function useCanUndo(editSession: EditSession | undefined): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!editSession) {
        return () => undefined;
      }
      editSession.on("historyChanged", onStoreChange);
      return () => editSession.removeListener("historyChanged", onStoreChange);
    },
    [editSession],
  );

  const getSnapshot = useCallback(
    () => editSession?.canUndo ?? false,
    [editSession],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
