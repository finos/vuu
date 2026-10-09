import {
  DataEditingProvider,
  DirectEditSession,
  useConfirmDiscard,
  useEditableColumns,
} from "@vuu-ui/vuu-data-editing";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { Table } from "@vuu-ui/vuu-table";
import {
  EditableTable,
  type EditableTableMode,
} from "@vuu-ui/vuu-table-extras";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { ModalProvider } from "@vuu-ui/vuu-ui-controls";
import { useData } from "@vuu-ui/vuu-utils";
import { useMemo, useState } from "react";
import {
  CURRENCIES,
  INSTRUMENTS,
  instrumentColumnNames,
  instrumentColumns,
  instrumentsTableConfig,
} from "./instruments";

const useInstrumentsDataSource = () => {
  const { VuuDataSource } = useData();
  return useMemo(
    () =>
      new VuuDataSource({
        columns: instrumentColumnNames,
        table: INSTRUMENTS,
      }),
    [VuuDataSource],
  );
};

const ViewEditToggleTemplate = () => {
  const dataSource = useInstrumentsDataSource();
  return (
    <div style={{ height: 400, width: 900 }}>
      <EditableTable
        config={instrumentsTableConfig}
        dataSource={dataSource}
        readOnly={["ric", "vuuMsg"]}
      />
    </div>
  );
};

/**
 * Pattern 1. Toggle between View and Edit. Edits are staged in a session
 * table and only applied on Save.
 */
export const ViewEditToggle = () => (
  <LocalDataSourceProvider>
    <ViewEditToggleTemplate />
  </LocalDataSourceProvider>
);

const InsertUpdateDeleteTemplate = () => {
  const dataSource = useInstrumentsDataSource();
  return (
    <div style={{ height: 400, width: 1000 }}>
      <EditableTable
        allowDelete
        config={instrumentsTableConfig}
        copyOption="All"
        dataSource={dataSource}
        editable={{
          "*": true,
          // the key column can be set on new rows, but not changed
          ric: { insert: true, update: false },
          vuuMsg: false,
        }}
        showInlineAddRow
        undoColumn
      />
    </div>
  );
};

/**
 * Pattern 2. Insert (inline add row), update, and soft delete with undo.
 */
export const InsertUpdateDelete = () => (
  <LocalDataSourceProvider>
    <InsertUpdateDeleteTemplate />
  </LocalDataSourceProvider>
);

const CustomEditorsTemplate = () => {
  const dataSource = useInstrumentsDataSource();
  return (
    <div style={{ height: 400, width: 900 }}>
      <EditableTable
        config={instrumentsTableConfig}
        dataSource={dataSource}
        editable={{
          currency: { renderer: "dropdown-cell", values: CURRENCIES },
          description: true,
          lotSize: true,
        }}
      />
    </div>
  );
};

/**
 * Pattern 3. Per-column editors. Only the columns listed in `editable` can
 * be edited; currency uses a dropdown.
 */
export const CustomEditors = () => (
  <LocalDataSourceProvider>
    <CustomEditorsTemplate />
  </LocalDataSourceProvider>
);

const DirectEditTemplate = () => {
  const dataSource = useInstrumentsDataSource();
  const editSession = useMemo(
    () => new DirectEditSession({ dataSource }),
    [dataSource],
  );
  const columns = useEditableColumns({
    columns: instrumentColumns,
    editable: { description: true, lotSize: true },
    isEditing: true,
  });
  const config = useMemo<TableConfig>(
    () => ({ ...instrumentsTableConfig, columns }),
    [columns],
  );
  return (
    <div style={{ height: 400, width: 900 }}>
      <DataEditingProvider editSession={editSession}>
        <Table config={config} dataSource={dataSource} />
      </DataEditingProvider>
    </div>
  );
};

/**
 * Pattern 4. Direct edit. Each committed cell edit is sent straight to the
 * source table; there is no session table and no Save/Cancel. Use when the
 * service supports editCell on the source table and edits are independent.
 */
export const DirectEdit = () => (
  <LocalDataSourceProvider>
    <DirectEditTemplate />
  </LocalDataSourceProvider>
);

const UnsavedChangesTemplate = () => {
  const dataSource = useInstrumentsDataSource();
  const [editMode, setEditMode] = useState<EditableTableMode>("view");
  const confirmDiscard = useConfirmDiscard();
  return (
    <div style={{ height: 400, width: 900 }}>
      <EditableTable
        config={instrumentsTableConfig}
        confirmCancel={confirmDiscard}
        dataSource={dataSource}
        editMode={editMode}
        onEditModeChange={setEditMode}
        readOnly={["ric", "vuuMsg"]}
        toolbar={<span>Mode: {editMode}</span>}
      />
    </div>
  );
};

/**
 * Pattern 10. Unsaved changes. Cancelling a dirty session asks for
 * confirmation. Edit mode is controlled by the parent. When a save is
 * rejected as stale, Save becomes "Save (force)".
 */
export const UnsavedChanges = () => (
  <LocalDataSourceProvider>
    <ModalProvider>
      <UnsavedChangesTemplate />
    </ModalProvider>
  </LocalDataSourceProvider>
);
