import { useCallback, useRef, useSyncExternalStore } from "react";
import type {
  EditLifecycle,
  EditSession,
  EditState,
  NewRowState,
} from "./EditSession";

export interface EditSessionStateSnapshot {
  /** True when the session can be cancelled (active, or a failed save). */
  canCancel: boolean;
  /** True when there are valid, unsaved changes (or a stale save to force). */
  canSave: boolean;
  editState: EditState;
  /** The error from the most recent failed begin or end, if any. */
  error?: Error;
  /** True while a session is active, including while it is ending. */
  inEditMode: boolean;
  isActive: boolean;
  isDirty: boolean;
  isEnding: boolean;
  isStarting: boolean;
  lifecycle: EditLifecycle;
  newRowState: NewRowState;
}

const IDLE_STATE: EditSessionStateSnapshot = {
  canCancel: false,
  canSave: false,
  editState: "clean",
  inEditMode: false,
  isActive: false,
  isDirty: false,
  isEnding: false,
  isStarting: false,
  lifecycle: { status: "idle" },
  newRowState: {
    columns: [],
    draftRevision: 0,
    errors: {},
    submitting: false,
    values: {},
  },
};

const createSnapshot = (editSession: EditSession): EditSessionStateSnapshot => {
  const { editState, lifecycle, newRowState } = editSession;
  return {
    canCancel: editSession.canCancel,
    canSave: editSession.canSave,
    editState,
    error: lifecycle.status === "error" ? lifecycle.error : undefined,
    inEditMode: editSession.inEditMode,
    isActive: lifecycle.status === "active",
    isDirty: editState !== "clean",
    isEnding: lifecycle.status === "ending",
    isStarting: lifecycle.status === "starting",
    lifecycle,
    newRowState,
  };
};

/**
 * Subscribes to an EditSession and returns a single, render-safe snapshot of
 * its state: editState, lifecycle, new-row draft and the derived flags most
 * UIs need (canSave, canCancel, isDirty etc).
 *
 * Prefer this to adding `editState`/`lifecycle`/`newRow` listeners by hand.
 * Returns an idle, clean snapshot when no session is provided.
 */
export const useEditSessionState = (
  editSession: EditSession | undefined,
): EditSessionStateSnapshot => {
  const snapshotRef = useRef<{
    editSession?: EditSession;
    editState?: EditState;
    lifecycle?: EditLifecycle;
    newRowState?: NewRowState;
    snapshot: EditSessionStateSnapshot;
  }>({ snapshot: IDLE_STATE });

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!editSession) {
        return () => undefined;
      }
      editSession.on("editState", onStoreChange);
      editSession.on("lifecycle", onStoreChange);
      editSession.on("newRow", onStoreChange);
      return () => {
        editSession.removeListener("editState", onStoreChange);
        editSession.removeListener("lifecycle", onStoreChange);
        editSession.removeListener("newRow", onStoreChange);
      };
    },
    [editSession],
  );

  const getSnapshot = useCallback(() => {
    if (!editSession) {
      return IDLE_STATE;
    }
    const cached = snapshotRef.current;
    const { editState, lifecycle, newRowState } = editSession;
    if (
      cached.editSession !== editSession ||
      cached.editState !== editState ||
      cached.lifecycle !== lifecycle ||
      cached.newRowState !== newRowState
    ) {
      snapshotRef.current = {
        editSession,
        editState,
        lifecycle,
        newRowState,
        snapshot: createSnapshot(editSession),
      };
    }
    return snapshotRef.current.snapshot;
  }, [editSession]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
