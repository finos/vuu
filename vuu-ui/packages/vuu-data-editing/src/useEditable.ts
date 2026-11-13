import type {
  CopyOption,
  DataSource,
  DeleteRowMode,
} from "@vuu-ui/vuu-data-types";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  EditSession,
  type EditSessionApi,
  type RowDefaultDataItemValues,
} from "./EditSession";
import { useEditMode } from "./EditModeProvider";
import { type EditErrorHandler, reportEditError } from "./edit-errors";
import { useEditSessionState } from "./useEditSessionState";

export interface EditableHookProps {
  /** @default "Selected" */
  copyOption?: CopyOption;
  dataSource: DataSource;
  /** @default "soft" */
  deleteMode?: DeleteRowMode;
  /** @default "createSessionDataSource" */
  editSessionApi?: EditSessionApi;
  /**
   * Controls the edit session. When omitted, edit mode is read from the
   * nearest EditModeProvider.
   */
  isEditMode?: boolean;
  onCancel: () => void;
  /** Called when begin, save or cancel fails. Defaults to console.error. */
  onError?: EditErrorHandler;
  onSave: () => void;
  /** Default column values applied to every addRow call. Pass a stable reference. */
  rowDefaults?: RowDefaultDataItemValues;
}

/**
 * Owns an EditSession for a form (or any non-table editor). The session is
 * begun when edit mode is entered and ended (without saving) when it is left.
 * Wrap the editor in a DataEditingProvider with the returned editSession.
 *
 * For a higher level API, with create mode and validation, see `useEditForm`.
 */
export const useEditable = ({
  copyOption = "Selected",
  dataSource,
  deleteMode,
  editSessionApi,
  isEditMode: isEditModeProp,
  onCancel,
  onError,
  onSave,
  rowDefaults,
}: EditableHookProps) => {
  const { isEditMode: isEditModeContext } = useEditMode();
  const isEditMode = isEditModeProp ?? isEditModeContext;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // The editSession will be made available to all the edit controls in scope
  // by wrapping the edit component with a DataEditingProvider.
  const editSession = useMemo(
    () =>
      new EditSession({
        dataSource,
        deleteMode,
        editSessionApi,
        rowDefaults,
      }),
    [dataSource, deleteMode, editSessionApi, rowDefaults],
  );

  const sessionState = useEditSessionState(editSession);

  const handleCancel = useCallback(async () => {
    try {
      await editSession.end();
      onCancel();
    } catch (error) {
      reportEditError("useEditable", onErrorRef.current, error, "cancel");
    }
  }, [editSession, onCancel]);

  const handleSave = useCallback(
    async (force = false) => {
      try {
        await editSession.end(true, force);
        onSave();
      } catch (error) {
        reportEditError("useEditable", onErrorRef.current, error, "save");
      }
    },
    [editSession, onSave],
  );

  useEffect(() => {
    const transition = isEditMode
      ? editSession.begin(copyOption)
      : editSession.end();

    void transition.catch((error) => {
      if (isEditMode) {
        reportEditError("useEditable", onErrorRef.current, error, "begin");
        handleCancel();
      } else {
        reportEditError("useEditable", onErrorRef.current, error, "cancel");
      }
    });
  }, [copyOption, editSession, isEditMode, handleCancel]);

  return {
    canCancel: sessionState.canCancel,
    canSave: sessionState.canSave,
    editSession,
    editState: sessionState.editState,
    isEditMode,
    lifecycle: sessionState.lifecycle,
    onCancel: handleCancel,
    onSave: handleSave,
  };
};
