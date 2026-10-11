import type {
  EditFormHookProps,
  EditFormValues,
  EditSession,
  useEditableTable,
} from "@vuu-ui/vuu-data-editing";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { createContext, useContext } from "react";

/**
 * - `table`: rows are edited in the table's cells. The edit session covers
 *   every row (see `copyOption`).
 * - `form`: the selected row is edited in a form, typically shown in a
 *   side panel.
 */
export type TableEditorEditIn = "table" | "form";

/** `create` is only used when editing in a form. */
export type TableEditorMode = "view" | "edit" | "create";

/**
 * Form editing only.
 * - `on-select`: the side panel opens when a row is selected (or a new row is
 *   started) and closes when the selection is cleared or the panel is closed.
 * - `always`: the side panel is always open.
 */
export type TableEditorPanelVisibility = "on-select" | "always";

/** State and actions of the enclosing `EditableTable` or `TableWithEditForm`. */
export interface TableEditorState {
  /**
   * Form editing: whether the side panel can be closed. False while editing
   * and when `panelVisibility` is `always`.
   */
  canClosePanel: boolean;
  /**
   * Leaves edit (or create) mode, discarding changes. Asks `confirmCancel`
   * first when there are unsaved changes.
   */
  cancel: () => Promise<void>;
  /** The dataSource passed to the provider. */
  dataSource: DataSource;
  editIn: TableEditorEditIn;
  /** True in edit and create modes. */
  isEditing: boolean;
  mode: TableEditorMode;
  /** Form editing: whether the side panel is open. */
  panelOpen: boolean;
  /**
   * Form editing: a snapshot of the selected row, updated with the saved
   * values after a successful save.
   */
  selectedRow?: DataRow;
  /** Form editing: ignored when closing while `canClosePanel` is false. */
  setPanelOpen: (open: boolean) => void;
  /** Form editing: shows an empty form for adding a row. */
  startCreate: () => void;
  /** Enters edit mode. Form editing needs a selected row. */
  startEdit: () => void;
}

/** Registered by the mounted form, so `cancel` can route through it. */
export interface TableEditorFormHandle {
  cancel: () => Promise<void> | void;
  isDirty: boolean;
}

export interface TableEditorContextValue extends TableEditorState {
  allowDelete: boolean;
  confirmCancel?: () => boolean | Promise<boolean>;
  // form editing
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
  // table editing
  editSession?: EditSession;
  editableTable?: ReturnType<typeof useEditableTable>;
}

export const TableEditorContext = createContext<
  TableEditorContextValue | undefined
>(undefined);

export const useTableEditorContext = (componentName: string) => {
  const context = useContext(TableEditorContext);
  if (context === undefined) {
    throw Error(
      `${componentName} must be used within an EditableTable or TableWithEditForm`,
    );
  }
  return context;
};

/** State and actions of the enclosing `EditableTable` or `TableWithEditForm`. */
export const useTableEditor = (): TableEditorState =>
  useTableEditorContext("useTableEditor");
