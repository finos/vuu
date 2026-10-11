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
import { DataSourceStats } from "../datasource-stats/DatasourceStats";
import { TableFooter, TableFooterTray } from "../table-footer/TableFooter";
import {
  TableEditorButtons,
  TableEditorModeToggle,
  TableEditorProvider,
  type TableEditorProviderProps,
  TableEditorTable,
  type TableEditorTableProps,
} from "../table-editor";
import { useTableEditorContext } from "../table-editor/TableEditorContext";

import editableTableCss from "./EditableTable.css";

export type EditableTableMode = "view" | "edit";

export interface EditableTableProps
  extends Omit<
      TableProps,
      | "config"
      | "customHeader"
      | "dataSource"
      | "isRowSelectable"
      | "onError"
      | "selectionModel"
    >,
    Pick<
      EditableTableHookProps,
      "copyOption" | "deleteMode" | "editSessionApi" | "onError" | "rowDefaults"
    > {
  /**
   * Show a checkbox column and a Delete button in edit mode, so selected
   * rows can be deleted. Rows already marked for deletion cannot be selected.
   */
  allowDelete?: boolean;
  /** Table config used in view mode. Edit mode columns are derived from it. */
  config: TableConfig;
  /** Asked before an edit session with unsaved changes is discarded. */
  confirmCancel?: () => boolean | Promise<boolean>;
  /** The source (view) dataSource. Edits are staged in a session table. */
  dataSource: DataSource;
  /** Uncontrolled initial mode. */
  defaultEditMode?: EditableTableMode;
  /**
   * Per-column editability. When omitted every column is editable except
   * the read-only defaults (vuuCreatedTimestamp etc) and `readOnly`.
   */
  editable?: EditableColumnsConfig;
  /** Controlled mode. Pair with `onEditModeChange`. */
  editMode?: EditableTableMode;
  /** Replaces the default View/Edit toggle. */
  editModeToggle?: ReactNode;
  /** Rendered in the footer in view mode. Defaults to row count stats. */
  footer?: ReactNode;
  onCancel?: () => void;
  onEditModeChange?: (editMode: EditableTableMode) => void;
  onSave?: () => void;
  /** Columns that can never be edited. */
  readOnly?: readonly string[];
  saveLabel?: string;
  showEditModeToggle?: boolean;
  /** Show an inline row, above the column headers, for adding new rows. */
  showInlineAddRow?: boolean;
  /** Suffix appended to built-in test ids (`edit-table`, `toggle-edit` …). */
  testId?: string;
  /** Extra content rendered in the toolbar after the mode toggle. */
  toolbar?: ReactNode;
  /** Adds a column with an undo button for edited rows. */
  undoColumn?: boolean;
}

const classBase = "vuuEditableTable";

interface EditableTableLayoutProps {
  className?: string;
  editModeToggle?: ReactNode;
  footer?: ReactNode;
  saveLabel?: string;
  showEditModeToggle: boolean;
  sourceDataSource: DataSource;
  style?: CSSProperties;
  tableProps: TableEditorTableProps;
  testId: string;
  toolbar?: ReactNode;
}

const EditableTableLayout = ({
  className,
  editModeToggle,
  footer,
  saveLabel,
  showEditModeToggle,
  sourceDataSource,
  style,
  tableProps,
  testId,
  toolbar,
}: EditableTableLayoutProps) => {
  const { editableTable, mode } = useTableEditorContext("EditableTable");
  const showToolbar = showEditModeToggle || toolbar !== undefined;
  return (
    <div
      className={cx(classBase, className, {
        [`${classBase}-editing`]: mode === "edit",
      })}
      data-testid={`edit-table${testId}`}
      style={style}
    >
      {showToolbar ? (
        <div className={`${classBase}-toolbar`}>
          {showEditModeToggle
            ? (editModeToggle ?? <TableEditorModeToggle testId={testId} />)
            : null}
          {toolbar}
        </div>
      ) : null}
      <div className={`${classBase}-table`}>
        <TableEditorTable data-testid={`table${testId}`} {...tableProps} />
      </div>
      <TableFooter>
        {editableTable?.isEditSessionReady ? (
          <TableFooterTray position="center">
            <TableEditorButtons saveLabel={saveLabel} />
          </TableFooterTray>
        ) : (
          (footer ?? <DataSourceStats dataSource={sourceDataSource} />)
        )}
      </TableFooter>
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
 * This is the default layout of `TableEditorProvider editIn="table"`; compose
 * `TableEditorTable`, `TableEditorModeToggle` and `TableEditorButtons`
 * directly for a different one.
 */
export const EditableTable = ({
  allowDelete = false,
  className,
  confirmCancel,
  copyOption,
  dataSource,
  defaultEditMode = "view",
  deleteMode,
  editMode,
  editModeToggle,
  editSessionApi,
  footer,
  onCancel,
  onEditModeChange,
  onError,
  onSave,
  rowDefaults,
  saveLabel,
  showEditModeToggle = true,
  style,
  testId = "",
  toolbar,
  ...tableProps
}: EditableTableProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-editable-table",
    css: editableTableCss,
    window: targetWindow,
  });

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
      <EditableTableLayout
        className={className}
        editModeToggle={editModeToggle}
        footer={footer}
        saveLabel={saveLabel}
        showEditModeToggle={showEditModeToggle}
        sourceDataSource={dataSource}
        style={style}
        tableProps={tableProps}
        testId={testId}
        toolbar={toolbar}
      />
    </TableEditorProvider>
  );
};
