import { useCallback, useSyncExternalStore } from "react";
import type { EditSession } from "./EditSession";

export const useCellEdited = (
  editSession: EditSession | undefined,
  key: string,
  columnName: string,
) => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!editSession) {
        return () => undefined;
      }
      const handleCellEditChanged = (
        changedKey: string,
        changedColumnName: string,
      ) => {
        if (changedKey === key && changedColumnName === columnName) {
          onStoreChange();
        }
      };
      editSession.on("cellEditChanged", handleCellEditChanged);
      return () =>
        editSession.removeListener("cellEditChanged", handleCellEditChanged);
    },
    [columnName, editSession, key],
  );
  const getSnapshot = useCallback(
    () => editSession?.isCellEdited(key, columnName) ?? false,
    [columnName, editSession, key],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
