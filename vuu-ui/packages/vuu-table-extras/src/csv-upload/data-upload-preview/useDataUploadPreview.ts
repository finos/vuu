import type { DataSource } from "@vuu-ui/vuu-data-types";
import type {
  EditLifecycle,
  EditSession,
  EditState,
} from "@vuu-ui/vuu-data-editing";
import { useCallback, useEffect, useState } from "react";

export interface UseDataUploadPreviewProps {
  dataSource: DataSource;
  editSession: EditSession;
  onClose: () => void;
}

export const getSessionDataSource = (editSession: EditSession): DataSource => {
  const dataSource = editSession.sessionDataSource;
  if (!dataSource) {
    throw new Error("[DataUploadPreview] requires an active edit session");
  }
  return dataSource;
};

export const useDataUploadPreview = ({
  dataSource,
  editSession,
  onClose,
}: UseDataUploadPreviewProps) => {
  const [editState, setEditState] = useState<EditState>(editSession.editState);
  const [lifecycle, setLifecycle] = useState<EditLifecycle>(
    editSession.lifecycle,
  );
  const [selectionCount, setSelectionCount] = useState(0);
  const [sessionError, setSessionError] = useState<string>();

  const endSession = useCallback(
    async (save: boolean, force = false) => {
      try {
        await editSession.end(save, force);
        onClose();
      } catch (error) {
        setSessionError(
          error instanceof Error ? error.message : "Unable to end edit session",
        );
      }
    },
    [editSession, onClose],
  );

  const onCancel = useCallback(() => endSession(false), [endSession]);
  const onDelete = useCallback(
    () => editSession.deleteSelectedRows(),
    [editSession],
  );
  const onSave = useCallback(
    (force = false) => endSession(true, force),
    [endSession],
  );

  useEffect(() => {
    const handleEditState = (nextEditState: EditState) => {
      setEditState(nextEditState);
    };
    const handleLifecycle = (nextLifecycle: EditLifecycle) => {
      setLifecycle(nextLifecycle);
    };
    editSession.on("editState", handleEditState);
    editSession.on("lifecycle", handleLifecycle);
    dataSource.on("row-selection", setSelectionCount);
    return () => {
      editSession.removeListener("editState", handleEditState);
      editSession.removeListener("lifecycle", handleLifecycle);
      dataSource.removeListener("row-selection", setSelectionCount);
    };
  }, [dataSource, editSession]);

  const canCancel =
    lifecycle.status === "active" ||
    (lifecycle.status === "error" && lifecycle.operation === "end");
  const canSave =
    canCancel &&
    (editState === "dirty" || editState === "stale") &&
    editSession.invalidCount === 0;

  return {
    canCancel,
    canSave,
    hasSelection: selectionCount > 0,
    onCancel,
    onDelete,
    onSave,
    sessionError,
  };
};
