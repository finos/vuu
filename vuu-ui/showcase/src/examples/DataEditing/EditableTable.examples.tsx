import {
  type EditFormValidator,
  useConfirmDiscard,
} from "@vuu-ui/vuu-data-editing";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import {
  EditableTable,
  EditableTableFooter,
  type EditableTableMode,
  TableEditorModeToggle,
  TableEditorTable,
  TableEditorToolbar,
} from "@vuu-ui/vuu-table-extras";
import { ModalProvider } from "@vuu-ui/core";
import type { ColumnDescriptor, TableConfig } from "@vuu-ui/vuu-table-types";
import { useData } from "@vuu-ui/vuu-utils";
import { useMemo, useState } from "react";
import {
  CURRENCIES,
  INSTRUMENTS,
  instrumentColumnNames,
  instrumentColumns,
  instrumentsTableConfig,
} from "./instruments";

/**
 * Edit options live on the column descriptors: `editable` narrows what the
 * server schema allows, `editor` says how a value is edited. They apply in
 * the table and in generated forms alike.
 */
const withColumnEditOptions = (
  options: Record<string, Pick<ColumnDescriptor, "editable" | "editor">>,
  defaultEditable?: boolean,
): TableConfig => ({
  ...instrumentsTableConfig,
  columns: instrumentColumns.map((column) => ({
    ...column,
    ...(defaultEditable === undefined
      ? undefined
      : { editable: defaultEditable }),
    ...options[column.name],
  })),
});

// ric is the key: it can be set on a new row, but not changed.
const keyColumnConfig = withColumnEditOptions({
  ric: { editable: { insert: true, update: false } },
});

const readOnlyRicConfig = withColumnEditOptions({ ric: { editable: false } });

const customEditorsConfig = withColumnEditOptions(
  {
    currency: {
      editable: true,
      editor: { name: "dropdown-cell", values: CURRENCIES },
    },
    description: { editable: true },
    lotSize: { editable: true },
  },
  false,
);

const directEditConfig = withColumnEditOptions(
  { description: { editable: true }, lotSize: { editable: true } },
  false,
);

const validateInstrument: EditFormValidator = ({ lotSize }) =>
  typeof lotSize === "number" && lotSize <= 0
    ? { lotSize: "Lot size must be greater than zero" }
    : undefined;

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
      <EditableTable config={readOnlyRicConfig} dataSource={dataSource} />
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
        config={keyColumnConfig}
        copyOption="All"
        dataSource={dataSource}
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
      <EditableTable config={customEditorsConfig} dataSource={dataSource} />
    </div>
  );
};

/**
 * Pattern 3. Per-column editors. Only the columns marked `editable` can be
 * edited; currency uses a dropdown `editor`.
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
        config={directEditConfig}
        dataSource={dataSource}
        editModel="direct"
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
        config={directEditConfig}
        dataSource={dataSource}
        defaultMode="view"
        editModel="direct"
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
        <TableEditorTable config={readOnlyRicConfig} />
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

const SessionCreateFormTemplate = () => {
  const dataSource = useInstrumentsDataSource();
  return (
    <div style={{ height: 400, width: 1100 }}>
      <EditableTable
        config={keyColumnConfig}
        createStrategy="form"
        createTitle="New instrument"
        dataSource={dataSource}
        undoColumn
        validateCreate={validateInstrument}
      />
    </div>
  );
};

/**
 * Pattern 2b. Inline session editing, with a form for new rows. New begins
 * the edit session and opens a generated form; Add puts the row in the
 * session, where it is saved or cancelled with every other change.
 */
export const SessionCreateForm = () => (
  <LocalDataSourceProvider>
    <SessionCreateFormTemplate />
  </LocalDataSourceProvider>
);

const DirectCreateFormTemplate = () => {
  const dataSource = useInstrumentsDataSource();
  return (
    <div style={{ height: 400, width: 1100 }}>
      <EditableTable
        config={keyColumnConfig}
        createStrategy="form"
        createTitle="New instrument"
        dataSource={dataSource}
        editModel="direct"
        validateCreate={validateInstrument}
      />
    </div>
  );
};

/**
 * Pattern 4c. Direct cell editing, with a form for new rows. Each cell edit
 * is committed as it is made; Create inserts the new row.
 */
export const DirectCreateForm = () => (
  <LocalDataSourceProvider>
    <DirectCreateFormTemplate />
  </LocalDataSourceProvider>
);

const FormEditingTemplate = ({
  editModel,
}: {
  editModel?: "session" | "direct";
}) => {
  const dataSource = useInstrumentsDataSource();
  return (
    <div style={{ height: 400, width: 1100 }}>
      <EditableTable
        config={keyColumnConfig}
        createTitle="New instrument"
        dataSource={dataSource}
        editModel={editModel}
        editStrategy="form"
        formTitle={(row) => `Instrument ${row.ric}`}
        validate={validateInstrument}
      />
    </div>
  );
};

/**
 * Pattern 5b. Form editing, generated. The selected row is shown in a form generated
 * from the schema and the table columns. Edit stages changes in a session,
 * applied on Save.
 */
export const FormEditing = () => (
  <LocalDataSourceProvider>
    <FormEditingTemplate />
  </LocalDataSourceProvider>
);

/**
 * Pattern 5c. Direct form editing. Each field is saved when its value is
 * committed; Done returns the form to read-only.
 */
export const DirectFormEditing = () => (
  <LocalDataSourceProvider>
    <FormEditingTemplate editModel="direct" />
  </LocalDataSourceProvider>
);
