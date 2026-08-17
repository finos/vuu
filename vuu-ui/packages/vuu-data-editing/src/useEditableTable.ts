import type {
  CopyOption,
  DataSource,
  DeleteRowMode,
  EditApi,
  EditSessionMode,
} from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { useLayoutEffectSkipFirst } from "@vuu-ui/vuu-utils";
import { useData } from "@vuu-ui/vuu-utils2";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditSession, type EditLifecycle, type EditState } from "./EditSession";

export type EditMode = "edit" | "view";

export interface EditableTableHookProps {
  /**
   * columns to be included in subscription. If not provided,
   * default will be '*'. Ignored if dataSource prop present.
   */
  columns?: string[];
  dataSource?: DataSource;
  addRowsCount?: number;
  deleteMode?: DeleteRowMode;
  editSessionMode?: EditSessionMode | CopyOption;
  isEditMode: boolean;
  onCancel: () => void;
  onSave: () => void;
  /**
   * If dataSource not provided, new DataSource
   * will be created using table and columns
   */
  table?: VuuTable;
}

export const useEditableTable = ({
  addRowsCount = 15,
  columns,
  dataSource: dataSourceProp,
  deleteMode = "soft",
  editSessionMode = "inline-all-rows" as EditSessionMode | CopyOption,
  isEditMode,
  onCancel,
  onSave,
  table,
}: EditableTableHookProps) => {
  const { VuuDataSource } = useData();
  const [selectionCount, setSelectionCount] = useState(0);
  const [deleteCount, setDeleteCount] = useState(0);
  useLayoutEffectSkipFirst(() => {
    console.warn("[useEditableTable] columns and or table changed");
  }, [columns, table]);

  const dataSource = useMemo(() => {
    if (dataSourceProp) {
      return dataSourceProp;
    } else if (table) {
      return new VuuDataSource({ columns, table });
    } else {
      throw Error(
        "useEditableTable unable to provide DataSource, neither dataSource nor table available as props",
      );
    }
  }, [VuuDataSource, columns, dataSourceProp, table]);

  // The editSession will be made available to all the edit controls in scope
  // by wrapping the edit component with a DataEditingProvider.
  const editSession = useMemo(
    () => new EditSession(dataSource as EditApi, deleteMode),
    [dataSource, deleteMode],
  );
  const [lifecycle, setLifecycle] = useState<EditLifecycle>(
    editSession.lifecycle,
  );
  const [editState, setEditState] = useState<EditState>(editSession.editState);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  const sessionDataSource =
    "sessionDataSource" in lifecycle ? lifecycle.sessionDataSource : undefined;

  const handleCancel = useCallback(async () => {
    try {
      await editSession.end();
      setSelectionCount(0);
      onCancel();
    } catch (error) {
      console.error("[useEditableTable] cancel edit session failed", error);
    }
  }, [editSession, onCancel]);

  const handleSave = useCallback(
    async (force = false) => {
      dataSource.resume?.();
      try {
        await editSession.end(true, force);
        setSelectionCount(0);
        onSave();
      } catch (error) {
        console.error("[useEditableTable] save edit session failed", error);
      }
    },
    [dataSource, editSession, onSave],
  );

  const handleDelete = useCallback(async () => {
    await editSession.deleteSelectedRows();
    setSelectionCount(0);
  }, [editSession]);

  const handleAddRows = useCallback(() => {
    editSession.addRows(addRowsCount);
  }, [addRowsCount, editSession]);

  const handleUndoRowChange = useCallback(
    (key: string) => void editSession.undoRowChange(key),
    [editSession],
  );

  useEffect(() => {
    const activeDataSource = sessionDataSource ?? dataSource;
    activeDataSource.on("row-selection", setSelectionCount);
    return () =>
      activeDataSource.removeListener("row-selection", setSelectionCount);
  }, [dataSource, sessionDataSource]);

  useEffect(() => {
    const handleEditState = (nextEditState: EditState) => {
      setEditState(nextEditState);
      setDeleteCount(editSession.deleteCount);
    };
    const handleLifecycle = (nextLifecycle: EditLifecycle) => {
      setLifecycle(nextLifecycle);
    };

    setEditState(editSession.editState);
    setLifecycle(editSession.lifecycle);
    editSession.on("editState", handleEditState);
    editSession.on("lifecycle", handleLifecycle);
    return () => {
      editSession.removeListener("editState", handleEditState);
      editSession.removeListener("lifecycle", handleLifecycle);
    };
  }, [editSession]);

  useEffect(() => {
    const transition = isEditMode
      ? editSession.begin(editSessionMode)
      : editSession.end();

    void transition.catch((error) => {
      if (isEditMode) {
        console.error("[useEditableTable] begin edit session failed", error);
        onCancelRef.current();
      } else {
        console.error("[useEditableTable] end edit session failed", error);
      }
    });
  }, [editSession, editSessionMode, isEditMode]);

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
    dataSource,
    editSession,
    lifecycle,
    hasSelection: selectionCount > 0 || deleteCount > 0,
    onAddRows: handleAddRows,
    onCancel: handleCancel,
    onDelete: handleDelete,
    onSave: handleSave,
    onUndoRowChange: handleUndoRowChange,
    sessionDataSource,
  };
};
