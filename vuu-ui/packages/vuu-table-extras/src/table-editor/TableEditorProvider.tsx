import { SidePanelProvider } from "@salt-ds/core";
import {
  DataEditingProvider,
  type EditableTableHookProps,
  type EditFormValues,
  getDataRowValues,
  useEditableTable,
} from "@vuu-ui/vuu-data-editing";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import {
  TableEditorContext,
  type TableEditorContextValue,
  type TableEditorEditIn,
  type TableEditorFormHandle,
  type TableEditorMode,
  type TableEditorPanelVisibility,
} from "./TableEditorContext";

export interface TableEditorProviderProps
  extends Pick<
    EditableTableHookProps,
    "deleteMode" | "editSessionApi" | "onError" | "rowDefaults"
  > {
  /**
   * Table editing: show a checkbox column, and a Delete button in
   * `TableEditorButtons`, so selected rows can be deleted.
   */
  allowDelete?: boolean;
  children: ReactNode;
  /** Asked before changes are discarded. See `useConfirmDiscard`. */
  confirmCancel?: () => boolean | Promise<boolean>;
  /** Table editing: rows copied into the edit session. @default "All" */
  copyOption?: EditableTableHookProps["copyOption"];
  dataSource: DataSource;
  /** Uncontrolled initial mode. @default "view" */
  defaultMode?: TableEditorMode;
  /** @default "table" */
  editIn?: TableEditorEditIn;
  /** Controlled mode. Pair with `onModeChange`. */
  mode?: TableEditorMode;
  /** Called once changes have been discarded. */
  onCancelled?: () => void;
  onModeChange?: (mode: TableEditorMode) => void;
  /** Called once changes (or a new row) have been saved. */
  onSaved?: () => void;
  /** Form editing: when the side panel is open. @default "on-select" */
  panelVisibility?: TableEditorPanelVisibility;
}

type ModeProps = Pick<
  TableEditorProviderProps,
  "defaultMode" | "mode" | "onModeChange"
>;

const useModeState = ({
  defaultMode = "view",
  mode: modeProp,
  onModeChange,
}: ModeProps) => {
  const [modeState, setModeState] = useState<TableEditorMode>(defaultMode);
  const isControlled = modeProp !== undefined;
  const setMode = useCallback(
    (mode: TableEditorMode) => {
      if (!isControlled) {
        setModeState(mode);
      }
      onModeChange?.(mode);
    },
    [isControlled, onModeChange],
  );
  return [modeProp ?? modeState, setMode] as const;
};

/** A plain snapshot of a row that, unlike a table DataRow, can be updated. */
const toRowSnapshot = (values: EditFormValues): DataRow => {
  const snapshot = { ...values };
  return {
    ...snapshot,
    hasColumn: (name: string) => name in snapshot,
  } as unknown as DataRow;
};

const NO_FORM: TableEditorContextValue["formHandleRef"] = {
  current: undefined,
};
const noop = () => undefined;

const TableCellEditorProvider = ({
  allowDelete = false,
  children,
  confirmCancel,
  copyOption,
  dataSource,
  deleteMode = allowDelete ? "soft" : undefined,
  editSessionApi,
  onCancelled,
  onError,
  onSaved,
  rowDefaults,
  ...modeProps
}: Omit<TableEditorProviderProps, "editIn" | "panelVisibility">) => {
  const [mode, setMode] = useModeState(modeProps);
  const isEditing = mode !== "view";

  const handleCancelled = useCallback(() => {
    setMode("view");
    onCancelled?.();
  }, [onCancelled, setMode]);

  const handleSaved = useCallback(() => {
    setMode("view");
    onSaved?.();
  }, [onSaved, setMode]);

  const editableTable = useEditableTable({
    copyOption,
    dataSource,
    deleteMode,
    editSessionApi,
    isEditMode: isEditing,
    onCancel: handleCancelled,
    onError,
    onSave: handleSaved,
    rowDefaults,
  });
  const { editSession, onCancel: cancelEdit } = editableTable;

  const cancel = useCallback(async () => {
    if (
      isEditing &&
      (!confirmCancel ||
        editSession.editState === "clean" ||
        (await confirmCancel()))
    ) {
      cancelEdit();
    }
  }, [cancelEdit, confirmCancel, editSession, isEditing]);

  const startEdit = useCallback(() => setMode("edit"), [setMode]);

  const value = useMemo<TableEditorContextValue>(
    () => ({
      allowDelete,
      canClosePanel: true,
      cancel,
      confirmCancel,
      createKey: 0,
      dataSource,
      editIn: "table",
      editSession,
      editableTable,
      formHandleRef: NO_FORM,
      isEditing,
      mode,
      onCreateDone: noop,
      onEditCancelled: noop,
      onEditSaved: noop,
      onSelect: noop,
      panelOpen: false,
      setPanelOpen: noop,
      startCreate: noop,
      startEdit,
    }),
    [
      allowDelete,
      cancel,
      confirmCancel,
      dataSource,
      editSession,
      editableTable,
      isEditing,
      mode,
      startEdit,
    ],
  );

  return (
    <TableEditorContext.Provider value={value}>
      <DataEditingProvider editSession={editSession}>
        {children}
      </DataEditingProvider>
    </TableEditorContext.Provider>
  );
};

const FormEditorProvider = ({
  children,
  confirmCancel,
  dataSource,
  deleteMode,
  editSessionApi,
  onCancelled,
  onError,
  onSaved,
  panelVisibility = "on-select",
  rowDefaults,
  ...modeProps
}: Omit<TableEditorProviderProps, "allowDelete" | "copyOption" | "editIn">) => {
  const [mode, setMode] = useModeState(modeProps);
  const [selectedRow, setSelectedRow] = useState<DataRow | undefined>();
  const [createKey, setCreateKey] = useState(0);
  const [panelOpenState, setPanelOpenState] = useState(false);
  const panelOpenBeforeCreateRef = useRef(false);
  const formHandleRef = useRef<TableEditorFormHandle | undefined>(undefined);

  const isEditing = mode !== "view";
  const alwaysVisible = panelVisibility === "always";
  const canClosePanel = !alwaysVisible && !isEditing;
  const panelOpen = alwaysVisible || isEditing || panelOpenState;

  const setPanelOpen = useCallback(
    (open: boolean) => {
      // the panel stays open while a form is being edited
      if (open || canClosePanel) {
        setPanelOpenState(open);
      }
    },
    [canClosePanel],
  );

  const onSelect = useCallback((dataRow: DataRow | null) => {
    setSelectedRow(
      dataRow ? toRowSnapshot(getDataRowValues(dataRow)) : undefined,
    );
    setPanelOpenState(dataRow !== null);
  }, []);

  const startEdit = useCallback(() => {
    if (selectedRow) {
      setPanelOpenState(true);
      setMode("edit");
    }
  }, [selectedRow, setMode]);

  const startCreate = useCallback(() => {
    setCreateKey((key) => key + 1);
    panelOpenBeforeCreateRef.current = panelOpenState;
    setMode("create");
  }, [panelOpenState, setMode]);

  const onCreateDone = useCallback(
    (saved = false) => {
      // restore the panel to how it was before the new row was started
      setPanelOpenState(panelOpenBeforeCreateRef.current);
      setMode("view");
      if (saved) {
        onSaved?.();
      } else {
        onCancelled?.();
      }
    },
    [onCancelled, onSaved, setMode],
  );

  const onEditCancelled = useCallback(() => {
    setMode("view");
    onCancelled?.();
  }, [onCancelled, setMode]);

  const onEditSaved = useCallback(
    (values?: EditFormValues) => {
      if (values) {
        setSelectedRow(toRowSnapshot(values));
      }
      setMode("view");
      onSaved?.();
    },
    [onSaved, setMode],
  );

  const cancel = useCallback(async () => {
    const form = formHandleRef.current;
    if (!isEditing) {
      return;
    } else if (form === undefined) {
      if (mode === "create") {
        onCreateDone();
      } else {
        onEditCancelled();
      }
    } else if (!confirmCancel || !form.isDirty || (await confirmCancel())) {
      await form.cancel();
    }
  }, [confirmCancel, isEditing, mode, onCreateDone, onEditCancelled]);

  const value = useMemo<TableEditorContextValue>(
    () => ({
      allowDelete: false,
      canClosePanel,
      cancel,
      confirmCancel,
      createKey,
      dataSource,
      editIn: "form",
      formHandleRef,
      formSessionProps: { deleteMode, editSessionApi, onError, rowDefaults },
      isEditing,
      mode,
      onCreateDone,
      onEditCancelled,
      onEditSaved,
      onSelect,
      panelOpen,
      selectedRow,
      setPanelOpen,
      startCreate,
      startEdit,
    }),
    [
      canClosePanel,
      cancel,
      confirmCancel,
      createKey,
      dataSource,
      deleteMode,
      editSessionApi,
      isEditing,
      mode,
      onCreateDone,
      onEditCancelled,
      onEditSaved,
      onError,
      onSelect,
      panelOpen,
      rowDefaults,
      selectedRow,
      setPanelOpen,
      startCreate,
      startEdit,
    ],
  );

  return (
    <TableEditorContext.Provider value={value}>
      <SidePanelProvider onOpenChange={setPanelOpen} open={panelOpen}>
        {children}
      </SidePanelProvider>
    </TableEditorContext.Provider>
  );
};

/**
 * Internal: the provider behind `EditableTable` (`editIn="table"`) and
 * `TableWithEditForm` (`editIn="form"`). Owns the editing state shared by
 * the `TableEditor` components: the mode
 * (view, edit or create), the edit session and, when editing in a form, the
 * selected row and the side panel. Lay out `TableEditorTable`,
 * `TableEditorForm`, `TableEditorButtons` etc anywhere inside it; read its
 * state with `useTableEditor`.
 *
 * - `editIn="table"`: cells are edited in `TableEditorTable`. Edits are
 *   staged in a session table and applied on Save.
 * - `editIn="form"`: selecting a row in `TableEditorTable` shows it in
 *   `TableEditorForm`. The provider drives a Salt `SidePanelProvider`, so a
 *   `SidePanel` placed inside opens on selection. Row selection is locked,
 *   and the panel cannot be closed, while the form is being edited.
 */
export const TableEditorProvider = ({
  editIn = "table",
  ...props
}: TableEditorProviderProps) =>
  editIn === "form" ? (
    <FormEditorProvider {...props} />
  ) : (
    <TableCellEditorProvider {...props} />
  );
