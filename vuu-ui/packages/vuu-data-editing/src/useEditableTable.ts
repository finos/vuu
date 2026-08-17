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
import { EditSession } from "./EditSession";

export type EditMode = "edit" | "view";

type EditLifecycle =
  | { status: "idle" }
  | { status: "starting" }
  | { status: "active"; sessionDataSource?: DataSource }
  | { status: "ending" }
  | { status: "error"; error: Error };

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
  const [sessionDataSource, setSessionDataSource] = useState<
    DataSource | undefined
  >(undefined);
  const [selectionCount, setSelectionCount] = useState(0);
  const [deleteCount, setDeleteCount] = useState(0);
  useLayoutEffectSkipFirst(() => {
    console.warn('[useEditableTable] columns and or table changed');
  }, [columns, table]);

  const dataSource = useMemo(() => {
    if (dataSourceProp) {
      return dataSourceProp;
    } else if (table) {
      return new VuuDataSource({ columns, table });
    } else {
      throw Error(
        'useEditableTable unable to provide DataSource, neither dataSource nor table available as props',
      );
    }
  }, [VuuDataSource, columns, dataSourceProp, table]);

  // The editSession will be made available to all the edit controls in scope
  // by wrapping the edit component with a DataEditingProvider.
  const editSession = useMemo(
    () => new EditSession(dataSource as EditApi, deleteMode),
    // deleteMode is intentionally excluded — changing it mid-session is not supported
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataSource, deleteMode],
  );

  const handleCancel = useCallback(async () => {
    try {
      await editSession.end();
      setSessionDataSource(undefined);
      setSelectionCount(0);
      onCancel();
    } catch (e) {
      //
    }
  }, [editSession, onCancel]);

  const handleSave = useCallback(
    async (force = false) => {
      dataSource.resume?.();
      try {
        await editSession.end(true, force);
        if (editSession.inEditMode === false) {
          setSessionDataSource(undefined);
          setSelectionCount(0);
          onSave();
        }
      } catch (e) {
        console.log(`[useEditableTable] handleSave ${(e as Error).message}`);
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
    const syncDeleteCount = () => setDeleteCount(editSession.deleteCount);
    editSession.on("editState", syncDeleteCount);
    return () => editSession.removeListener("editState", syncDeleteCount);
  }, [editSession]);

  // useMemo(async () => {
  //   if (isEditMode) {
  //     try {
  //       const sessionDs = isCopyOption(editSessionMode)
  //         ? await editSession.begin(editSessionMode)
  //         : await editSession.begin(editSessionMode);
  //       if (sessionDs) {
  //         setSessionDataSource(sessionDs);
  //       } else {
  //         console.warn(
  //           `[useEditableTable] editSession.begin(${editSessionMode}) did not return a session DataSource`,
  //         );
  //       }
  //     } catch (e) {
  //       console.error("[useEditableTable] begin edit session failed", e);
  //       onCancel();
  //     }
  //   } else if (editSession.inEditMode) {
  //     await editSession.end();
  //     setSessionDataSource(undefined);
  //     setSelectionCount(0);
  //   }
  // }, [editSession, editSessionMode, isEditMode, onCancel]);


  const [lifecycle, setLifecycle] = useState<EditLifecycle>({
    status: "idle",
  });

  const lifecycleRef = useRef(lifecycle);
  const desiredRef = useRef({
    enabled: isEditMode,
    mode: editSessionMode,
  });

  // Serializes rapid edit/view changes and React Strict Mode effects.
  const transitionQueueRef = useRef(Promise.resolve());

  const updateLifecycle = useCallback((next: EditLifecycle) => {
    lifecycleRef.current = next;
    setLifecycle(next);
  }, []);

  useEffect(() => {
    desiredRef.current = {
      enabled: isEditMode,
      mode: editSessionMode,
    };

    transitionQueueRef.current = transitionQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        // Reconcile again when the requested mode changes during an RPC.
        while (true) {
          const desired = desiredRef.current;
          const current = lifecycleRef.current;

          if (desired.enabled) {
            if (
              current.status === "active" ||
              current.status === "starting"
            ) {
              return;
            }

            updateLifecycle({ status: "starting" });

            try {
              const sessionDataSource = await editSession.begin(desired.mode);

              // begin() may complete after the user has left edit mode.
              if (!desiredRef.current.enabled) {
                updateLifecycle({
                  status: "active",
                  sessionDataSource,
                });
                continue;
              }

              setSessionDataSource(sessionDataSource);
              updateLifecycle({
                status: "active",
                sessionDataSource,
              });
            } catch (cause) {
              const error =
                cause instanceof Error ? cause : new Error(String(cause));

              updateLifecycle({ status: "error", error });
              onCancel();
            }

            return;
          }

          if (current.status === "idle") {
            return;
          }

          updateLifecycle({ status: "ending" });

          try {
            await editSession.end();
            setSessionDataSource(undefined);
            setSelectionCount(0);
            updateLifecycle({ status: "idle" });
          } catch (cause) {
            const error =
              cause instanceof Error ? cause : new Error(String(cause));

            updateLifecycle({ status: "error", error });
          }

          return;
        }
      });
  }, [
    editSession,
    editSessionMode,
    isEditMode,
    onCancel,
    updateLifecycle,
  ]);

  const isTransitioning =
    lifecycle.status === "starting" ||
    lifecycle.status === "ending";

  const canSave =
    !isTransitioning &&
    editSession.editState === "dirty" &&
    editSession.invalidCount === 0;

  return {
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
