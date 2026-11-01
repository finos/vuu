import type {
  EditFormHookProps,
  EditFormValues,
  EditSession,
  useEditableTable,
} from "@vuu-ui/vuu-data-editing";
import type { DataSource, DataValueDescriptor } from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { createContext, useContext } from "react";

/**
 * How existing rows are edited.
 * - `inline`: in the table's cells.
 * - `form`: the selected row is edited in a form, in a side panel.
 */
export type TableEditorEditStrategy = "inline" | "form";

/**
 * How rows are added.
 * - `inline`: with inline editing, in the inline add row (session only).
 * - `form`: in a form, in a side panel. Always `form` with
 *   `editStrategy="form"`.
 */
export type TableEditorCreateStrategy = "inline" | "form";

/**
 * - `session`: edits are staged in an edit session and applied on Save, or
 *   discarded on Cancel.
 * - `direct`: each committed edit is validated, then sent straight to the
 *   source table. There is no Save or Cancel.
 */
export type TableEditorEditModel = "session" | "direct";

/** `create` is only used with a create form. */
export type TableEditorMode = "view" | "edit" | "create";

/**
 * With a side panel (form editing, or a create form).
 * - `on-select`: the side panel opens when a row is selected (or a new row is
 *   started) and closes when the selection is cleared or the panel is closed.
 * - `always`: the side panel is always open.
 */
export type TableEditorPanelVisibility = "on-select" | "always";

/** State and actions of the enclosing `EditableTable`. */
export interface TableEditorState {
  /**
   * Whether the side panel can be closed. False while editing and when
   * `panelVisibility` is `always`.
   */
  canClosePanel: boolean;
  /**
   * Leaves edit (or create) mode, discarding changes. Asks `confirmCancel`
   * first when there are unsaved changes. With direct editing, edits are
   * already committed, so this just makes the table read-only.
   */
  cancel: () => Promise<void>;
  /** Whether a new row can be started now, e.g. with `TableEditorNewButton`. */
  canCreate: boolean;
  createStrategy: TableEditorCreateStrategy;
  /** The dataSource passed to the provider. */
  dataSource: DataSource;
  editModel: TableEditorEditModel;
  editStrategy: TableEditorEditStrategy;
  /** True in edit and create modes. */
  isEditing: boolean;
  mode: TableEditorMode;
  /** Whether the side panel is open. */
  panelOpen: boolean;
  /**
   * Form editing: a snapshot of the selected row, updated with the saved
   * values after a successful save.
   */
  selectedRow?: DataRow;
  /** Ignored when closing while `canClosePanel` is false. */
  setPanelOpen: (open: boolean) => void;
  /** With a create form: shows an empty form for adding a row. */
  startCreate: () => void;
  /** Enters edit mode. Form editing needs a selected row. */
  startEdit: () => void;
}

/** Registered by the mounted form, so `cancel` can route through it. */
export interface TableEditorFormHandle {
  cancel: () => Promise<void> | void;
  getValues: () => EditFormValues;
  isDirty: boolean;
}

export interface TableEditorContextValue extends TableEditorState {
  allowDelete: boolean;
  /**
   * The columns of the `TableEditorTable`, registered by it. Generated forms
   * take labels, editors etc from them.
   */
  columns?: readonly DataValueDescriptor[];
  confirmCancel?: () => boolean | Promise<boolean>;
  // forms
  createKey: number;
  formHandleRef: { current: TableEditorFormHandle | undefined };
  formSessionProps?: Pick<
    EditFormHookProps,
    "deleteMode" | "editSessionApi" | "onError" | "rowDefaults"
  >;
  onCreateDone: (saved?: boolean) => void;
  onEditCancelled: () => void;
  onEditSaved: (values?: EditFormValues) => void;
  onSelect: (dataRow: DataRow | null) => void;
  setColumns: (columns: readonly DataValueDescriptor[] | undefined) => void;
  // inline session editing
  editSession?: EditSession;
  editableTable?: ReturnType<typeof useEditableTable>;
}

export const TableEditorContext = createContext<
  TableEditorContextValue | undefined
>(undefined);

export const useTableEditorContext = (componentName: string) => {
  const context = useContext(TableEditorContext);
  if (context === undefined) {
    throw Error(`${componentName} must be used within an EditableTable`);
  }
  return context;
};

/** State and actions of the enclosing `EditableTable`. */
export const useTableEditor = (): TableEditorState =>
  useTableEditorContext("useTableEditor");
