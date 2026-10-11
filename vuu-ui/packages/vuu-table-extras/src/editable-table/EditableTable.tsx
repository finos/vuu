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
  TableEditorFooter,
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

export type EditableTableMode = "view" | "edit";

/** Props for the editing state and container, with or without `children`. */
export interface EditableTableBaseProps
  extends Pick<
    EditableTableHookProps,
    "copyOption" | "deleteMode" | "editSessionApi" | "onError" | "rowDefaults"
  > {
  /**
   * Show a checkbox column and a Delete button in edit mode, so selected
   * rows can be deleted. Rows already marked for deletion cannot be selected.
   */
  allowDelete?: boolean;
  className?: string;
  /** Asked before an edit session with unsaved changes is discarded. */
  confirmCancel?: () => boolean | Promise<boolean>;
  /** The source (view) dataSource. Edits are staged in a session table. */
  dataSource: DataSource;
  /** Uncontrolled initial mode. */
  defaultEditMode?: EditableTableMode;
  /** Controlled mode. Pair with `onEditModeChange`. */
  editMode?: EditableTableMode;
  onCancel?: () => void;
  onEditModeChange?: (editMode: EditableTableMode) => void;
  onSave?: () => void;
  style?: CSSProperties;
  /** Suffix appended to built-in test ids (`edit-table`, `toggle-edit` …). */
  testId?: string;
}

/**
 * Your own layout: compose `TableEditorTable`, `TableEditorToolbar`,
 * `TableEditorModeToggle`, `TableEditorFooter`, `TableEditorButtons` etc.
 */
export interface EditableTableComposedProps extends EditableTableBaseProps {
  children: ReactNode;
}

/** The default layout: a toolbar, the table and a footer with the buttons. */
export interface EditableTableDefaultProps
  extends EditableTableBaseProps,
    Omit<
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
  saveLabel?: string;
  showEditModeToggle?: boolean;
  /** Show an inline row, above the column headers, for adding new rows. */
  showInlineAddRow?: boolean;
  /** Adds a column with an undo button for edited rows. */
  undoColumn?: boolean;
}

export type EditableTableProps =
  | EditableTableComposedProps
  | EditableTableDefaultProps;

const classBase = "vuuEditableTable";

type DefaultContentProps = Omit<
  EditableTableDefaultProps,
  keyof EditableTableBaseProps | "children"
> & { testId: string };

const DefaultContent = ({
  saveLabel,
  showEditModeToggle = true,
  testId,
  ...tableProps
}: DefaultContentProps) => (
  <>
    {showEditModeToggle ? (
      <TableEditorToolbar>
        <TableEditorModeToggle testId={testId} />
      </TableEditorToolbar>
    ) : null}
    <div className={`${classBase}-table`}>
      <TableEditorTable data-testid={`table${testId}`} {...tableProps} />
    </div>
    <TableEditorFooter saveLabel={saveLabel} />
  </>
);

const Container = ({
  children,
  className,
  style,
  testId,
}: Pick<EditableTableBaseProps, "className" | "style"> & {
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
 * A Table with View/Edit modes. Entering edit mode starts an edit session
 * against a session copy of `dataSource`; edits are only applied when the
 * user saves. All the wiring (session lifecycle, editable columns, row
 * styling for edited/added/deleted rows, Save/Cancel/Delete buttons, the
 * inline add row) is handled internally.
 *
 * Renders a flex column container. Without `children` it holds a toolbar
 * with a View/Edit toggle, the table and a footer with Save/Cancel.
 * Otherwise it holds `children`: compose `TableEditorTable`,
 * `TableEditorToolbar`, `TableEditorModeToggle`, `TableEditorFooter` etc.
 * Read the state with `useTableEditor`.
 */
export const EditableTable = (props: EditableTableProps) => {
  const {
    allowDelete = false,
    children,
    confirmCancel,
    copyOption,
    dataSource,
    defaultEditMode = "view",
    deleteMode,
    editMode,
    editSessionApi,
    onCancel,
    onEditModeChange,
    onError,
    onSave,
    rowDefaults,
    className,
    style,
    testId = "",
    ...contentProps
  } = props;

  return (
    <TableEditorProvider
      allowDelete={allowDelete}
      confirmCancel={confirmCancel}
      copyOption={copyOption}
      dataSource={dataSource}
      defaultMode={defaultEditMode}
      deleteMode={deleteMode}
      editIn="table"
      editSessionApi={editSessionApi}
      mode={editMode}
      onCancelled={onCancel}
      onError={onError}
      onModeChange={
        onEditModeChange as TableEditorProviderProps["onModeChange"]
      }
      onSaved={onSave}
      rowDefaults={rowDefaults}
    >
      <Container className={className} style={style} testId={testId}>
        {children ?? (
          <DefaultContent
            {...(contentProps as Omit<DefaultContentProps, "testId">)}
            testId={testId}
          />
        )}
      </Container>
    </TableEditorProvider>
  );
};
