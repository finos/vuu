import {
  DataEditingProvider,
  type EditableTableHookProps,
  EditButtons,
  useEditableTable,
} from "@vuu-ui/vuu-data-editing";
import type { CopyOption, DataSource } from "@vuu-ui/vuu-data-types";
import { BulkEditPanel, type BulkEditPanelProps } from "@vuu-ui/vuu-table";
import { useModal } from "@vuu-ui/vuu-ui-controls";
import { useCallback, useEffect, useRef, useState } from "react";

export interface BulkEditDialogHookProps
  extends Pick<
    EditableTableHookProps,
    "deleteMode" | "editSessionApi" | "onError" | "rowDefaults"
  > {
  /** Options passed through to the BulkEditPanel. */
  bulkEditPanelProps?: Partial<
    Omit<
      BulkEditPanelProps,
      "parentDs" | "rowClassNameGenerators" | "sessionDs"
    >
  >;
  /** Asked before an edit session with unsaved changes is discarded. */
  confirmCancel?: () => boolean | Promise<boolean>;
  dataSource: DataSource;
  onCancelled?: () => void;
  onSaved?: () => void;
  saveLabel?: string;
  title?: string;
}

interface DialogState {
  copyOption: CopyOption;
  editing: boolean;
}

const NOT_EDITING: DialogState = { copyOption: "Selected", editing: false };

/**
 * Edits many rows at once in a modal dialog. Call `editSelectedRows()` to
 * edit the rows selected in `dataSource`, or `insertRows()` to add new rows.
 * Edits are staged in a session table and applied on Save.
 *
 * Requires a `ModalProvider` above the calling component.
 */
export const useBulkEditDialog = ({
  bulkEditPanelProps,
  confirmCancel,
  dataSource: sourceTableDataSource,
  deleteMode,
  editSessionApi,
  onCancelled,
  onError,
  onSaved,
  rowDefaults,
  saveLabel = "Save",
  title = "Edit rows",
}: BulkEditDialogHookProps) => {
  const { closeDialog, showDialog } = useModal();
  const [{ copyOption, editing }, setDialogState] =
    useState<DialogState>(NOT_EDITING);
  const callbacksRef = useRef({ onCancelled, onSaved });
  callbacksRef.current = { onCancelled, onSaved };

  const handleCancelled = useCallback(() => {
    setDialogState(NOT_EDITING);
    callbacksRef.current.onCancelled?.();
  }, []);

  const handleSaved = useCallback(() => {
    setDialogState(NOT_EDITING);
    callbacksRef.current.onSaved?.();
  }, []);

  const {
    editSession,
    onCancel,
    onSave,
    rowClassNameGenerators,
    sessionDataSource,
    sourceDataSource,
  } = useEditableTable({
    copyOption,
    dataSource: sourceTableDataSource,
    deleteMode,
    editSessionApi,
    isEditMode: editing,
    onCancel: handleCancelled,
    onError,
    onSave: handleSaved,
    rowDefaults,
  });

  const editSelectedRows = useCallback(() => {
    setDialogState({ copyOption: "Selected", editing: true });
  }, []);

  const insertRows = useCallback(() => {
    setDialogState({ copyOption: "Empty", editing: true });
  }, []);

  useEffect(() => {
    if (editing && sessionDataSource) {
      showDialog(
        <DataEditingProvider editSession={editSession}>
          <BulkEditPanel
            {...bulkEditPanelProps}
            parentDs={sourceDataSource}
            rowClassNameGenerators={rowClassNameGenerators}
            sessionDs={sessionDataSource}
          />
        </DataEditingProvider>,
        title,
        [
          <EditButtons
            confirmCancel={confirmCancel}
            editSession={editSession}
            key="edit-buttons"
            onCancel={onCancel}
            onSave={onSave}
            saveLabel={saveLabel}
          />,
        ],
        true,
      );
    } else {
      closeDialog();
    }
  }, [
    bulkEditPanelProps,
    closeDialog,
    confirmCancel,
    editSession,
    editing,
    onCancel,
    onSave,
    rowClassNameGenerators,
    saveLabel,
    sessionDataSource,
    showDialog,
    sourceDataSource,
    title,
  ]);

  return {
    editSelectedRows,
    editSession,
    insertRows,
    isEditing: editing,
  };
};
