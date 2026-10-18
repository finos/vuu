import { useConfirmDiscard } from "@vuu-ui/vuu-data-editing";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import {
  EditableTable,
  EditableTableFooter,
  type EditableTableMode,
  EditableTableTable,
  TableEditorModeToggle,
  TableEditorToolbar,
} from "@vuu-ui/vuu-table-extras";
import { ModalProvider } from "@vuu-ui/core";
import { useData } from "@vuu-ui/vuu-utils";
import { useMemo, useState } from "react";
import {
  CURRENCIES,
  INSTRUMENTS,
  instrumentColumnNames,
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
  return (
    <div style={{ height: 400, width: 900 }}>
      <EditableTable
        config={instrumentsTableConfig}
        dataSource={dataSource}
        editModel="direct"
        editable={{ description: true, lotSize: true }}
      />
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

const DirectEditWithModesTemplate = () => {
  const dataSource = useInstrumentsDataSource();
  return (
    <div style={{ height: 400, width: 900 }}>
      <EditableTable
        config={instrumentsTableConfig}
        dataSource={dataSource}
        defaultMode="view"
        editModel="direct"
        editable={{ description: true, lotSize: true }}
        showEditModeToggle
      />
    </div>
  );
};

/**
 * Pattern 4b. Direct edit with View/Edit modes. Cells are only editable in
 * Edit mode, but each edit is still sent straight to the source table, so
 * switching back to View has nothing to save or discard.
 */
export const DirectEditWithModes = () => (
  <LocalDataSourceProvider>
    <DirectEditWithModesTemplate />
  </LocalDataSourceProvider>
);

const UnsavedChangesTemplate = () => {
  const dataSource = useInstrumentsDataSource();
  const [mode, setMode] = useState<EditableTableMode>("view");
  const confirmDiscard = useConfirmDiscard();
  return (
    <div style={{ height: 400, width: 900 }}>
      <EditableTable
        confirmCancel={confirmDiscard}
        dataSource={dataSource}
        mode={mode}
        onModeChange={setMode}
      >
        <TableEditorToolbar>
          <TableEditorModeToggle />
          <span>Mode: {mode}</span>
        </TableEditorToolbar>
        <EditableTableTable
          config={instrumentsTableConfig}
          readOnly={["ric", "vuuMsg"]}
        />
        <EditableTableFooter />
      </EditableTable>
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
