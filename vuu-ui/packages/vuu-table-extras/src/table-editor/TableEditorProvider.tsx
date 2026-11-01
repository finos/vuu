import { SidePanelProvider } from "@salt-ds/core";
import {
  DataEditingProvider,
  DirectEditSession,
  type EditableTableHookProps,
  type EditFormValues,
  getDataRowValues,
  useEditableTable,
} from "@vuu-ui/vuu-data-editing";
import type { DataSource, DataValueDescriptor } from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import {
  TableEditorContext,
  type TableEditorContextValue,
  type TableEditorCreateStrategy,
  type TableEditorEditModel,
  type TableEditorEditStrategy,
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
   * Inline session editing: show a checkbox column, and a Delete button in
   * `TableEditorButtons`, so selected rows can be deleted.
   */
  allowDelete?: boolean;
  children: ReactNode;
  /** Asked before changes are discarded. See `useConfirmDiscard`. */
  confirmCancel?: () => boolean | Promise<boolean>;
  /** Inline session editing: rows copied into the edit session. @default "All" */
  copyOption?: EditableTableHookProps["copyOption"];
  /**
   * How rows are added. Always `form` with `editStrategy="form"`.
   * @default "inline"
   */
  createStrategy?: TableEditorCreateStrategy;
  dataSource: DataSource;
  /** Uncontrolled initial mode. @default "view" */
  defaultMode?: TableEditorMode;
  /** @default "session" */
  editModel?: TableEditorEditModel;
  /** @default "inline" */
  editStrategy?: TableEditorEditStrategy;
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

/** State shared by every variant: the table's columns and the mounted form. */
const useFormState = () => {
  const [columns, setColumns] = useState<
    readonly DataValueDescriptor[] | undefined
  >();
  const formHandleRef = useRef<TableEditorFormHandle | undefined>(undefined);
  return { columns, formHandleRef, setColumns };
};

/** Discards the mounted form, asking `confirmCancel` first if it is dirty. */
const cancelForm = async (
  form: TableEditorFormHandle | undefined,
  confirmCancel: TableEditorProviderProps["confirmCancel"],
  onNoForm: () => void,
) => {
  if (form === undefined) {
    onNoForm();
  } else if (!confirmCancel || !form.isDirty || (await confirmCancel())) {
    await form.cancel();
  }
};

/**
 * Inline editing with `createStrategy="form"`: new rows are added in a form,
 * in a side panel that is open only while creating.
 */
const useInlineCreate = ({
  createStrategy,
  mode,
  modeAfterCreate,
  setMode,
}: {
  createStrategy: TableEditorCreateStrategy;
  mode: TableEditorMode;
  /** Defaults to the mode before the new row was started. */
  modeAfterCreate?: TableEditorMode;
  setMode: (mode: TableEditorMode) => void;
}) => {
  const [createKey, setCreateKey] = useState(0);
  const modeBeforeCreateRef = useRef<TableEditorMode>("view");
  const hasCreateForm = createStrategy === "form";
  const canCreate = hasCreateForm && mode !== "create";

  // read through a ref, so startCreate is stable across mode changes
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const startCreate = useCallback(() => {
    const currentMode = modeRef.current;
    if (hasCreateForm && currentMode !== "create") {
      modeBeforeCreateRef.current = currentMode;
      setCreateKey((key) => key + 1);
      setMode("create");
    }
  }, [hasCreateForm, setMode]);

  const endCreate = useCallback(() => {
    setMode(modeAfterCreate ?? modeBeforeCreateRef.current);
  }, [modeAfterCreate, setMode]);

  return {
    canCreate,
    createKey,
    endCreate,
    panelOpen: hasCreateForm && mode === "create",
    startCreate,
  };
};

const NO_FORM_SESSION_PROPS = undefined;
const noop = () => undefined;

const Providers = ({
  children,
  value,
}: {
  children: ReactNode;
  value: TableEditorContextValue;
}) => (
  <TableEditorContext.Provider value={value}>
    <SidePanelProvider onOpenChange={value.setPanelOpen} open={value.panelOpen}>
      {children}
    </SidePanelProvider>
  </TableEditorContext.Provider>
);

const InlineSessionProvider = ({
  allowDelete = false,
  children,
  confirmCancel,
  copyOption,
  createStrategy = "inline",
  dataSource,
  deleteMode = allowDelete ? "soft" : undefined,
  editSessionApi,
  onCancelled,
  onError,
  onSaved,
  rowDefaults,
  ...modeProps
}: Omit<TableEditorProviderProps, "editModel" | "editStrategy">) => {
  const [mode, setMode] = useModeState(modeProps);
  // the session stays active while a new row is added to it
  const isEditing = mode !== "view";
  const { columns, formHandleRef, setColumns } = useFormState();

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

  // the new row joins the session, which is then saved or cancelled as a whole
  const { canCreate, createKey, endCreate, panelOpen, startCreate } =
    useInlineCreate({ createStrategy, mode, modeAfterCreate: "edit", setMode });

  const cancel = useCallback(async () => {
    if (mode === "create") {
      await cancelForm(formHandleRef.current, confirmCancel, endCreate);
    } else if (
      isEditing &&
      (!confirmCancel ||
        editSession.editState === "clean" ||
        (await confirmCancel()))
    ) {
      cancelEdit();
    }
  }, [
    cancelEdit,
    confirmCancel,
    editSession,
    endCreate,
    formHandleRef,
    isEditing,
    mode,
  ]);

  const startEdit = useCallback(() => setMode("edit"), [setMode]);

  const value = useMemo<TableEditorContextValue>(
    () => ({
      allowDelete,
      canClosePanel: false,
      canCreate,
      cancel,
      columns,
      confirmCancel,
      createKey,
      createStrategy,
      dataSource,
      editModel: "session",
      editSession,
      editStrategy: "inline",
      editableTable,
      formHandleRef,
      formSessionProps: NO_FORM_SESSION_PROPS,
      isEditing,
      mode,
      onCreateDone: endCreate,
      onEditCancelled: noop,
      onEditSaved: noop,
      onSelect: noop,
      panelOpen,
      setColumns,
      setPanelOpen: noop,
      startCreate,
      startEdit,
    }),
    [
      allowDelete,
      canCreate,
      cancel,
      columns,
      confirmCancel,
      createKey,
      createStrategy,
      dataSource,
      editSession,
      editableTable,
      endCreate,
      formHandleRef,
      isEditing,
      mode,
      panelOpen,
      setColumns,
      startCreate,
      startEdit,
    ],
  );

  return (
    <Providers value={value}>
      <DataEditingProvider editSession={editSession}>
        {children}
      </DataEditingProvider>
    </Providers>
  );
};

const InlineDirectProvider = ({
  children,
  confirmCancel,
  createStrategy = "inline",
  dataSource,
  deleteMode,
  editSessionApi,
  onCancelled,
  onError,
  onSaved,
  rowDefaults,
  ...modeProps
}: Omit<
  TableEditorProviderProps,
  "allowDelete" | "copyOption" | "editModel" | "editStrategy"
>) => {
  const [mode, setMode] = useModeState(modeProps);
  const isEditing = mode !== "view";
  const { columns, formHandleRef, setColumns } = useFormState();

  const editSession = useMemo(
    () => new DirectEditSession({ dataSource }),
    [dataSource],
  );

  const { canCreate, createKey, endCreate, panelOpen, startCreate } =
    useInlineCreate({ createStrategy, mode, setMode });

  const onCreateDone = useCallback(
    (saved = false) => {
      endCreate();
      if (saved) {
        onSaved?.();
      } else {
        onCancelled?.();
      }
    },
    [endCreate, onCancelled, onSaved],
  );

  // edits are committed as they are made, so there is nothing to discard
  const cancel = useCallback(async () => {
    if (mode === "create") {
      await cancelForm(formHandleRef.current, confirmCancel, onCreateDone);
    } else {
      setMode("view");
    }
  }, [confirmCancel, formHandleRef, mode, onCreateDone, setMode]);
  const startEdit = useCallback(() => setMode("edit"), [setMode]);

  const value = useMemo<TableEditorContextValue>(
    () => ({
      allowDelete: false,
      canClosePanel: false,
      canCreate,
      cancel,
      columns,
      confirmCancel,
      createKey,
      createStrategy,
      dataSource,
      editModel: "direct",
      editStrategy: "inline",
      formHandleRef,
      formSessionProps: { deleteMode, editSessionApi, onError, rowDefaults },
      isEditing,
      mode,
      onCreateDone,
      onEditCancelled: noop,
      onEditSaved: noop,
      onSelect: noop,
      panelOpen,
      setColumns,
      setPanelOpen: noop,
      startCreate,
      startEdit,
    }),
    [
      canCreate,
      cancel,
      columns,
      confirmCancel,
      createKey,
      createStrategy,
      dataSource,
      deleteMode,
      editSessionApi,
      formHandleRef,
      isEditing,
      mode,
      onCreateDone,
      onError,
      panelOpen,
      rowDefaults,
      setColumns,
      startCreate,
      startEdit,
    ],
  );

  return (
    <Providers value={value}>
      <DataEditingProvider editSession={editSession}>
        {children}
      </DataEditingProvider>
    </Providers>
  );
};

/** A plain snapshot of a row that, unlike a table DataRow, can be updated. */
const toRowSnapshot = (values: EditFormValues): DataRow => {
  const snapshot = { ...values };
  return {
    ...snapshot,
    hasColumn: (name: string) => name in snapshot,
  } as unknown as DataRow;
};

const FormProvider = ({
  children,
  confirmCancel,
  dataSource,
  deleteMode,
  editModel = "session",
  editSessionApi,
  onCancelled,
  onError,
  onSaved,
  panelVisibility = "on-select",
  rowDefaults,
  ...modeProps
}: Omit<
  TableEditorProviderProps,
  "allowDelete" | "copyOption" | "createStrategy" | "editStrategy"
>) => {
  const [mode, setMode] = useModeState(modeProps);
  const [selectedRow, setSelectedRow] = useState<DataRow | undefined>();
  const [createKey, setCreateKey] = useState(0);
  const [panelOpenState, setPanelOpenState] = useState(false);
  const panelOpenBeforeCreateRef = useRef(false);
  const { columns, formHandleRef, setColumns } = useFormState();

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

  // read through a ref, so startCreate is stable across mode changes
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const startCreate = useCallback(() => {
    if (modeRef.current === "view") {
      setCreateKey((key) => key + 1);
      panelOpenBeforeCreateRef.current = panelOpenState;
      setMode("create");
    }
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
    if (isEditing) {
      await cancelForm(formHandleRef.current, confirmCancel, () =>
        mode === "create" ? onCreateDone() : onEditCancelled(),
      );
    }
  }, [
    confirmCancel,
    formHandleRef,
    isEditing,
    mode,
    onCreateDone,
    onEditCancelled,
  ]);

  const value = useMemo<TableEditorContextValue>(
    () => ({
      allowDelete: false,
      canClosePanel,
      canCreate: !isEditing,
      cancel,
      columns,
      confirmCancel,
      createKey,
      createStrategy: "form",
      dataSource,
      editModel,
      editStrategy: "form",
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
      setColumns,
      setPanelOpen,
      startCreate,
      startEdit,
    }),
    [
      canClosePanel,
      cancel,
      columns,
      confirmCancel,
      createKey,
      dataSource,
      deleteMode,
      editModel,
      editSessionApi,
      formHandleRef,
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
      setColumns,
      setPanelOpen,
      startCreate,
      startEdit,
    ],
  );

  return <Providers value={value}>{children}</Providers>;
};

/**
 * Internal: the provider behind `EditableTable`. Owns the editing state
 * shared by the `TableEditor` components: the mode (view, edit or create),
 * the edit session and, with a side panel, the selected row and the panel.
 * Lay out `TableEditorTable`, `TableEditorForm`, `TableEditorButtons` etc
 * anywhere inside it; read its state with `useTableEditor`.
 *
 * - `editStrategy="inline"`: cells are edited in `TableEditorTable`. With
 *   `editModel="session"` edits are staged in a session table and applied
 *   on Save; with `editModel="direct"` each edit is sent straight to
 *   `dataSource`. With `createStrategy="form"`, new rows are added in
 *   `TableEditorCreateForm`.
 * - `editStrategy="form"`: selecting a row in `TableEditorTable` shows it in
 *   `TableEditorForm`. Row selection is locked, and the panel cannot be
 *   closed, while the form is being edited.
 *
 * A Salt `SidePanelProvider` is provided, so a `SidePanel` placed inside
 * opens and closes with the form.
 */
export const TableEditorProvider = ({
  createStrategy,
  editModel = "session",
  editStrategy = "inline",
  ...props
}: TableEditorProviderProps) =>
  editStrategy === "form" ? (
    <FormProvider {...props} editModel={editModel} />
  ) : editModel === "direct" ? (
    <InlineDirectProvider {...props} createStrategy={createStrategy} />
  ) : (
    <InlineSessionProvider {...props} createStrategy={createStrategy} />
  );
