import { ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  DataEditingProvider,
  type EditableColumnsConfig,
  type EditableTableHookProps,
  EditButtons,
  useEditableColumns,
  useEditableTable,
} from "@vuu-ui/vuu-data-editing";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import { Table, type TableProps } from "@vuu-ui/vuu-table";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import {
  type ReactNode,
  type SyntheticEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { DataSourceStats } from "../datasource-stats/DatasourceStats";
import { InlineAddRow } from "../inline-add-row";
import { TableFooter, TableFooterTray } from "../table-footer/TableFooter";

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

/**
 * A Table with View/Edit modes. Entering edit mode starts an edit session
 * against a session copy of `dataSource`; edits are only applied when the
 * user saves. All the wiring (session lifecycle, editable columns, row
 * styling for edited/added/deleted rows, Save/Cancel/Delete buttons, the
 * inline add row) is handled internally.
 */
export const EditableTable = ({
  allowDelete = false,
  className,
  config,
  confirmCancel,
  copyOption,
  dataSource: sourceDataSource,
  defaultEditMode = "view",
  deleteMode = allowDelete ? "soft" : undefined,
  editMode: editModeProp,
  editModeToggle,
  editSessionApi,
  editable,
  footer,
  onCancel,
  onEditModeChange,
  onError,
  onSave,
  readOnly,
  rowDefaults,
  saveLabel,
  showEditModeToggle = true,
  showInlineAddRow = false,
  style,
  testId = "",
  toolbar,
  undoColumn = false,
  ...tableProps
}: EditableTableProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-editable-table",
    css: editableTableCss,
    window: targetWindow,
  });

  const [editModeState, setEditModeState] =
    useState<EditableTableMode>(defaultEditMode);
  const isControlled = editModeProp !== undefined;
  const editMode = isControlled ? editModeProp : editModeState;

  const setEditMode = useCallback(
    (nextMode: EditableTableMode) => {
      if (!isControlled) {
        setEditModeState(nextMode);
      }
      onEditModeChange?.(nextMode);
    },
    [isControlled, onEditModeChange],
  );

  const handleCancel = useCallback(() => {
    setEditMode("view");
    onCancel?.();
  }, [onCancel, setEditMode]);

  const handleSaved = useCallback(() => {
    setEditMode("view");
    onSave?.();
  }, [onSave, setEditMode]);

  const {
    canCancel,
    canSave,
    columnsDiverge,
    dataSource,
    editSchema,
    editSession,
    hasSelection,
    isEditSessionReady,
    isRowSelectable,
    onCancel: cancelEdit,
    onDelete,
    onSave: saveEdit,
    rowClassNameGenerators,
  } = useEditableTable({
    copyOption,
    dataSource: sourceDataSource,
    deleteMode,
    editSessionApi,
    isEditMode: editMode === "edit",
    onCancel: handleCancel,
    onError,
    onSave: handleSaved,
    rowDefaults,
  });

  const columns = useEditableColumns({
    actionColumn: allowDelete ? "hidden" : false,
    columns: config.columns,
    columnsDiverge,
    editSchema,
    editable,
    isEditing: isEditSessionReady,
    readOnly,
    undoColumn,
  });

  const tableConfig = useMemo<TableConfig>(
    () => ({
      ...config,
      columns,
      rowClassNameGenerators: isEditSessionReady
        ? (config.rowClassNameGenerators ?? []).concat(
            rowClassNameGenerators ?? [],
          )
        : config.rowClassNameGenerators,
    }),
    [columns, config, isEditSessionReady, rowClassNameGenerators],
  );

  const handleToggleEditMode = useCallback(
    (e: SyntheticEvent<HTMLButtonElement>) => {
      const nextMode = (e.currentTarget as HTMLButtonElement)
        .value as EditableTableMode;
      if (nextMode === "view" && editMode === "edit") {
        // route through the edit session so confirmCancel/onCancel apply
        void (async () => {
          if (
            !confirmCancel ||
            editSession.editState === "clean" ||
            (await confirmCancel())
          ) {
            cancelEdit();
          }
        })();
      } else {
        setEditMode(nextMode);
      }
    },
    [cancelEdit, confirmCancel, editMode, editSession, setEditMode],
  );

  const showToolbar = showEditModeToggle || toolbar !== undefined;

  return (
    <div
      className={cx(classBase, className, {
        [`${classBase}-editing`]: editMode === "edit",
      })}
      data-testid={`edit-table${testId}`}
      style={style}
    >
      {showToolbar ? (
        <div className={`${classBase}-toolbar`}>
          {showEditModeToggle
            ? (editModeToggle ?? (
                <ToggleButtonGroup
                  onChange={handleToggleEditMode}
                  value={editMode}
                >
                  <ToggleButton
                    data-testid={`toggle-view${testId}`}
                    value="view"
                  >
                    View
                  </ToggleButton>
                  <ToggleButton
                    data-testid={`toggle-edit${testId}`}
                    value="edit"
                  >
                    Edit
                  </ToggleButton>
                </ToggleButtonGroup>
              ))
            : null}
          {toolbar}
        </div>
      ) : null}
      <div className={`${classBase}-table`}>
        <DataEditingProvider editSession={editSession}>
          <Table
            data-testid={`table${testId}`}
            renderBufferSize={10}
            {...tableProps}
            config={tableConfig}
            customHeader={
              isEditSessionReady && showInlineAddRow ? InlineAddRow : undefined
            }
            dataSource={dataSource}
            isRowSelectable={
              isEditSessionReady && allowDelete ? isRowSelectable : undefined
            }
            selectionModel={
              isEditSessionReady && allowDelete ? "checkbox" : "none"
            }
          />
        </DataEditingProvider>
      </div>
      <TableFooter>
        {!isEditSessionReady ? (
          (footer ?? <DataSourceStats dataSource={sourceDataSource} />)
        ) : (
          <TableFooterTray position="center">
            <EditButtons
              canCancel={canCancel}
              canSave={canSave}
              confirmCancel={confirmCancel}
              editSession={editSession}
              hasSelection={allowDelete ? hasSelection : undefined}
              onCancel={cancelEdit}
              onDelete={allowDelete ? onDelete : undefined}
              onSave={saveEdit}
              saveLabel={saveLabel}
            />
          </TableFooterTray>
        )}
      </TableFooter>
    </div>
  );
};
