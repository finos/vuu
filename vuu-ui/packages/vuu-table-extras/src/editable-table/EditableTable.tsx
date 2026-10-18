import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type {
  EditableColumnsConfig,
  EditableTableHookProps,
} from "@vuu-ui/vuu-data-editing";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { TableProps } from "@vuu-ui/vuu-table";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import type { CSSProperties, ReactNode } from "react";
import {
  type TableEditorEditModel,
  TableEditorModeToggle,
  TableEditorTable,
  TableEditorToolbar,
  useTableEditor,
} from "../table-editor";
import {
  TableEditorProvider,
  type TableEditorProviderProps,
} from "../table-editor/TableEditorProvider";

import editableTableCss from "./EditableTable.css";
import { EditableTableFooter } from "./EditableTableLayout";

export type EditableTableMode = "view" | "edit";

/**
 * - `session`: edits are staged in a session table and applied on Save, or
 *   discarded on Cancel.
 * - `direct`: each committed cell edit is sent straight to `dataSource`.
 *   There is no Save or Cancel.
 */
export type EditableTableEditModel = TableEditorEditModel;

interface EditableTableCommonProps {
  className?: string;
  /** The source (view) dataSource. */
  dataSource: DataSource;
  /**
   * Uncontrolled initial mode. Defaults to `view` for session editing and to
   * `edit` (always editable) for direct editing.
   */
  defaultMode?: EditableTableMode;
  /** Controlled mode. Pair with `onModeChange`. */
  mode?: EditableTableMode;
  onModeChange?: (mode: EditableTableMode) => void;
  style?: CSSProperties;
  /** Suffix appended to built-in test ids (`edit-table`, `toggle-edit` …). */
  testId?: string;
}

/** Session editing: edits are staged in a session table until Save. */
export interface EditableTableSessionProps
  extends EditableTableCommonProps,
    Pick<
      EditableTableHookProps,
      "copyOption" | "deleteMode" | "editSessionApi" | "onError" | "rowDefaults"
    > {
  /**
   * Show a checkbox column and a Delete button in edit mode, so selected
   * rows can be deleted. Rows already marked for deletion cannot be selected.
   */
  allowDelete?: boolean;
  /** Asked before an edit session with unsaved changes is discarded. */
  confirmCancel?: () => boolean | Promise<boolean>;
  /** @default "session" */
  editModel?: "session";
  /** Called once changes have been discarded. */
  onCancelled?: () => void;
  /** Called once changes have been saved. */
  onSaved?: () => void;
}

type SessionOnlyProps = Omit<
  EditableTableSessionProps,
  keyof EditableTableCommonProps | "editModel"
>;

/** Direct editing: each cell edit is sent straight to `dataSource`. */
export type EditableTableDirectProps = EditableTableCommonProps & {
  editModel: "direct";
} & { [K in keyof SessionOnlyProps]?: never };

/**
 * Your own layout: compose `TableEditorTable`, `EditableTableFooter`,
 * `TableEditorToolbar`, `TableEditorModeToggle`, `TableEditorButtons` etc.
 */
export interface EditableTableComposedProps {
  children: ReactNode;
}

/** The default layout: a toolbar, the table and a footer. */
export interface EditableTableDefaultProps
  extends Omit<
    TableProps,
    | "children"
    | "className"
    | "config"
    | "customHeader"
    | "dataSource"
    | "isRowSelectable"
    | "onError"
    | "selectionModel"
    | "style"
  > {
  children?: undefined;
  /** Table config used in view mode. Edit mode columns are derived from it. */
  config: TableConfig;
  /**
   * Per-column editability. When omitted every column is editable except
   * the read-only defaults (vuuCreatedTimestamp etc) and `readOnly`.
   */
  editable?: EditableColumnsConfig;
  /** Columns that can never be edited. */
  readOnly?: readonly string[];
  /** Session editing only. @default "Save" */
  saveLabel?: string;
  /**
   * Show a View/Edit toggle above the table. Defaults to true for session
   * editing and false (always editable) for direct editing.
   */
  showEditModeToggle?: boolean;
  /**
   * Session editing only: show an inline row, above the column headers, for
   * adding new rows.
   */
  showInlineAddRow?: boolean;
  /** Session editing only: adds a column with an undo button for edited rows. */
  undoColumn?: boolean;
}

type DirectDefaultProps = EditableTableDefaultProps & {
  saveLabel?: never;
  showInlineAddRow?: never;
  undoColumn?: never;
};

export type EditableTableProps =
  | (EditableTableSessionProps &
      (EditableTableComposedProps | EditableTableDefaultProps))
  | (EditableTableDirectProps &
      (EditableTableComposedProps | DirectDefaultProps));

/** Every prop, for destructuring. */
type AllProps = Omit<EditableTableSessionProps, "editModel"> & {
  editModel?: EditableTableEditModel;
} & Partial<EditableTableComposedProps> &
  Omit<Partial<EditableTableDefaultProps>, "children">;

const classBase = "vuuEditableTable";

type DefaultContentProps = Omit<EditableTableDefaultProps, "children"> & {
  testId: string;
};

const DefaultContent = ({
  saveLabel,
  showEditModeToggle,
  testId,
  ...tableProps
}: DefaultContentProps) => (
  <>
    {showEditModeToggle ? (
      <TableEditorToolbar>
        <TableEditorModeToggle testId={testId} />
      </TableEditorToolbar>
    ) : null}
    <TableEditorTable data-testid={`table${testId}`} {...tableProps} />
    <EditableTableFooter saveLabel={saveLabel} />
  </>
);

const Container = ({
  children,
  className,
  style,
  testId,
}: Pick<EditableTableCommonProps, "className" | "style"> & {
  children: ReactNode;
  testId: string;
}) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-editable-table",
    css: editableTableCss,
    window: targetWindow,
  });
  const { mode } = useTableEditor();
  return (
    <div
      className={cx(classBase, className, {
        [`${classBase}-editing`]: mode === "edit",
      })}
      data-testid={`edit-table${testId}`}
      style={style}
    >
      {children}
    </div>
  );
};

/**
 * A Table with View/Edit modes. All the wiring (edit session, editable
 * columns, row styling, Save/Cancel/Delete buttons, the inline add row) is
 * handled internally.
 *
 * - `editModel="session"` (the default): entering edit mode starts an edit
 *   session against a session copy of `dataSource`; edits are only applied
 *   when the user saves.
 * - `editModel="direct"`: each committed cell edit is sent straight to
 *   `dataSource`. There is no Save or Cancel; View just makes the table
 *   read-only. Always editable unless you show the mode toggle or set
 *   `defaultMode`/`mode`.
 *
 * Renders a flex column container that fills its parent. Without `children`
 * it holds an optional View/Edit toggle, the table and a footer. Otherwise
 * it holds `children`: compose `TableEditorTable`, `EditableTableFooter`,
 * `TableEditorToolbar`, `TableEditorModeToggle` etc. Read the state with
 * `useTableEditor`.
 */
export const EditableTable = (props: EditableTableProps) => {
  const {
    allowDelete = false,
    children,
    className,
    confirmCancel,
    copyOption,
    dataSource,
    defaultMode,
    deleteMode,
    editModel = "session",
    editSessionApi,
    mode,
    onCancelled,
    onError,
    onModeChange,
    onSaved,
    rowDefaults,
    style,
    testId = "",
    ...contentProps
  } = props as AllProps;

  const isDirect = editModel === "direct";

  return (
    <TableEditorProvider
      allowDelete={allowDelete}
      confirmCancel={confirmCancel}
      copyOption={copyOption}
      dataSource={dataSource}
      defaultMode={defaultMode ?? (isDirect ? "edit" : "view")}
      deleteMode={deleteMode}
      editIn="table"
      editModel={editModel}
      editSessionApi={editSessionApi}
      mode={mode}
      onCancelled={onCancelled}
      onError={onError}
      onModeChange={onModeChange as TableEditorProviderProps["onModeChange"]}
      onSaved={onSaved}
      rowDefaults={rowDefaults}
    >
      <Container className={className} style={style} testId={testId}>
        {children ?? (
          <DefaultContent
            showEditModeToggle={!isDirect}
            {...(contentProps as Omit<DefaultContentProps, "testId">)}
            testId={testId}
          />
        )}
      </Container>
    </TableEditorProvider>
  );
};
