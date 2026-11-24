import { useCallback, useSyncExternalStore } from "react";
import type { EditActionType, EditSession } from "./EditSession";

/**
 * The change made to a row in the edit session, as tracked by the client:
 * added, deleted or edited, or undefined if the row is unchanged.
 */
export const useRowAction = (
  editSession: EditSession | undefined,
  key: string,
): EditActionType | undefined => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!editSession) {
        return () => undefined;
      }
      const handleChange = (changedKey: string) => {
        if (changedKey === key) {
          onStoreChange();
        }
      };
      editSession.on("cellEditChanged", handleChange);
      editSession.on("rowActionChanged", handleChange);
      return () => {
        editSession.removeListener("cellEditChanged", handleChange);
        editSession.removeListener("rowActionChanged", handleChange);
      };
    },
    [editSession, key],
  );
  const getSnapshot = useCallback(
    () => editSession?.getRowAction(key),
    [editSession, key],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
