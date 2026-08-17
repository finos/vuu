import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type { TableSchema } from "@vuu-ui/vuu-data-types";
import {
  DataEditingProvider,
  EDIT_ACTION_ROW_CLASS_NAME_GENERATOR,
  EditButtons,
  type EditSession,
  UNDO_CELL_RENDERER,
} from "@vuu-ui/vuu-data-editing";
import { Table } from "@vuu-ui/vuu-table";
import type {
  ColumnDescriptor,
  DataRow,
  TableConfig,
} from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import type { HTMLAttributes } from "react";
import { useCallback, useMemo } from "react";
import { TableFooter, TableFooterTray } from "../../table-footer/TableFooter";
import css from "./DataUploadPreview.css";
import {
  getSessionDataSource,
  useDataUploadPreview,
} from "./useDataUploadPreview";

const classBase = "vuuDataUploadPreview";

const undoColumn: ColumnDescriptor = {
  name: "undo",
  source: "client",
  width: 80,
  type: {
    name: "string",
    renderer: {
      name: UNDO_CELL_RENDERER,
    },
  },
};

const rowClassNameGenerators = [EDIT_ACTION_ROW_CLASS_NAME_GENERATOR];

export interface DataUploadPreviewProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  editSession: EditSession;
  onClose: () => void;
  saveLabel?: string;
  tableSchema: TableSchema;
}

export const DataUploadPreview = ({
  className,
  editSession,
  onClose,
  saveLabel = "Submit",
  tableSchema,
  ...htmlAttributes
}: DataUploadPreviewProps) => {
  const dataSource = useMemo(
    () => getSessionDataSource(editSession),
    [editSession],
  );
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-data-upload-preview",
    css,
    window: targetWindow,
  });

  const {
    canCancel,
    canSave,
    hasSelection,
    onCancel,
    onDelete,
    onSave,
    sessionError,
  } = useDataUploadPreview({ dataSource, editSession, onClose });

  const isRowSelectable = useCallback(
    (dataRow: DataRow) => dataRow.vuu_action !== "deleteRow",
    [],
  );
  const config = useMemo<TableConfig>(() => {
    const columns = tableSchema.columns.map<ColumnDescriptor>((column) =>
      column.name === "vuuMsg"
        ? {
            ...column,
            editable: false,
            hidden: false,
            label: "Error",
            width: 300,
          }
        : {
            ...column,
            editable: true,
          },
    );
    if (!columns.some(({ name }) => name === "vuuMsg")) {
      columns.push({
        editable: false,
        label: "Error",
        name: "vuuMsg",
        serverDataType: "string",
        width: 300,
      });
    }

    return {
      columns: columns.concat({ hidden: true, name: "vuu_action" }, undoColumn),
      columnDefaultWidth: 150,
      rowClassNameGenerators,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, [tableSchema.columns]);

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      {sessionError ? <div role="alert">{sessionError}</div> : null}
      <div className={`${classBase}-content`}>
        <DataEditingProvider editSession={editSession}>
          <Table
            config={config}
            data-viewport={dataSource.viewport}
            dataSource={dataSource}
            isRowSelectable={isRowSelectable}
            renderBufferSize={10}
            selectionModel="checkbox"
          />
        </DataEditingProvider>
      </div>
      <TableFooter>
        <TableFooterTray position="center">
          <EditButtons
            canCancel={canCancel}
            canSave={canSave}
            editSession={editSession}
            hasSelection={hasSelection}
            onCancel={onCancel}
            onDelete={onDelete}
            onSave={onSave}
            saveLabel={saveLabel}
          />
        </TableFooterTray>
      </TableFooter>
    </div>
  );
};
