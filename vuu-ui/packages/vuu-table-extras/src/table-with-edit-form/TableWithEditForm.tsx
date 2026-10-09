import { Button } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  CreateRowForm,
  type CreateRowFormField,
  EditField,
  type EditFieldProps,
  EditForm,
  type EditFormHookProps,
  type EditFormValidator,
  type EditFormValues,
  getDataRowValues,
} from "@vuu-ui/vuu-data-editing";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import { Table, type TableProps } from "@vuu-ui/vuu-table";
import type { DataRow, TableConfig } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import { type ReactNode, useCallback, useRef, useState } from "react";

import tableWithEditFormCss from "./TableWithEditForm.css";

export type TableWithEditFormMode = "view" | "edit" | "create";

export type TableWithEditFormField = CreateRowFormField;

export interface TableWithEditFormProps
  extends Omit<
      TableProps,
      | "config"
      | "dataSource"
      | "isRowSelectable"
      | "onError"
      | "onSelect"
      | "selectionModel"
    >,
    Pick<
      EditFormHookProps,
      "deleteMode" | "editSessionApi" | "onError" | "rowDefaults"
    > {
  /** Show a New button that opens an empty form for adding a row. */
  allowCreate?: boolean;
  config: TableConfig;
  /** Asked before a form with unsaved changes is discarded. */
  confirmCancel?: () => boolean | Promise<boolean>;
  /** Fields for the create form. Defaults to `fields`. */
  createFields?: readonly TableWithEditFormField[];
  createTitle?: ReactNode;
  dataSource: DataSource;
  /** Fields for the detail form, in tab order. */
  fields: readonly TableWithEditFormField[];
  /** Title of the detail form. */
  formTitle?: ReactNode | ((dataRow: DataRow) => ReactNode);
  onModeChange?: (mode: TableWithEditFormMode) => void;
  /** Shown in the detail area when no row is selected. */
  placeholder?: ReactNode;
  testId?: string;
  /** Extra content rendered in the toolbar. */
  toolbar?: ReactNode;
  validate?: EditFormValidator;
  /** Validator for the create form. Defaults to `validate`. */
  validateCreate?: EditFormValidator;
}

const classBase = "vuuTableWithEditForm";

const NO_ROWS_SELECTABLE = () => false;

/** A plain snapshot of a row that, unlike a table DataRow, can be updated. */
const toRowSnapshot = (values: EditFormValues): DataRow => {
  const snapshot = { ...values };
  return {
    ...snapshot,
    hasColumn: (name: string) => name in snapshot,
  } as unknown as DataRow;
};

/**
 * Master–detail editing: a Table with a form showing the selected row.
 *
 * - Selecting a row shows it, read-only, in the form.
 * - Edit makes the form editable; Save/Cancel return to read-only.
 * - New (when `allowCreate`) shows an empty form; Create adds the row.
 *
 * Row selection is locked while a form is being edited, so changes cannot
 * be lost by clicking another row. Use `confirmCancel` to guard Cancel.
 */
export const TableWithEditForm = ({
  allowCreate = true,
  className,
  config,
  confirmCancel,
  createFields,
  createTitle = "New",
  dataSource,
  deleteMode,
  editSessionApi,
  fields,
  formTitle,
  onError,
  onModeChange,
  placeholder = "Select a row to see its details",
  rowDefaults,
  style,
  testId = "",
  toolbar,
  validate,
  validateCreate = validate,
  ...tableProps
}: TableWithEditFormProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table-with-edit-form",
    css: tableWithEditFormCss,
    window: targetWindow,
  });

  const [mode, setModeState] = useState<TableWithEditFormMode>("view");
  const [selectedRow, setSelectedRow] = useState<DataRow | undefined>();
  const [createKey, setCreateKey] = useState(0);
  const submittedValuesRef = useRef<EditFormValues | undefined>(undefined);

  const setMode = useCallback(
    (nextMode: TableWithEditFormMode) => {
      setModeState(nextMode);
      onModeChange?.(nextMode);
    },
    [onModeChange],
  );

  const handleSelect = useCallback((dataRow: DataRow | null) => {
    setSelectedRow(
      dataRow ? toRowSnapshot(getDataRowValues(dataRow)) : undefined,
    );
  }, []);

  const startEdit = useCallback(() => setMode("edit"), [setMode]);
  const startCreate = useCallback(() => {
    setCreateKey((key) => key + 1);
    setMode("create");
  }, [setMode]);
  const showView = useCallback(() => setMode("view"), [setMode]);

  const validateEdit = useCallback<EditFormValidator>(
    (values) => {
      // remember what is being saved, the selected row snapshot is
      // updated with these values once the save succeeds
      submittedValuesRef.current = values;
      return validate?.(values);
    },
    [validate],
  );

  const handleEditSaved = useCallback(() => {
    const values = submittedValuesRef.current;
    if (values) {
      setSelectedRow(toRowSnapshot(values));
    }
    setMode("view");
  }, [setMode]);

  const isEditing = mode !== "view";

  const renderDetail = () => {
    if (mode === "create") {
      return (
        <CreateRowForm
          confirmCancel={confirmCancel}
          data-testid={`create-form${testId}`}
          dataSource={dataSource}
          editSessionApi={editSessionApi}
          fields={createFields ?? fields}
          key={createKey}
          onCancelled={showView}
          onError={onError}
          onSaved={showView}
          rowDefaults={rowDefaults}
          title={createTitle}
          validate={validateCreate}
        />
      );
    } else if (selectedRow) {
      return (
        <EditForm
          confirmCancel={confirmCancel}
          data-testid={`edit-form${testId}`}
          dataRow={selectedRow}
          dataSource={dataSource}
          deleteMode={deleteMode}
          editSessionApi={editSessionApi}
          isEditMode={mode === "edit"}
          key={selectedRow.key}
          onCancelled={showView}
          onError={onError}
          onSaved={handleEditSaved}
          rowDefaults={rowDefaults}
          title={
            typeof formTitle === "function" ? formTitle(selectedRow) : formTitle
          }
          validate={validateEdit}
        >
          {fields.map((field) => (
            <EditField
              {...(field as EditFieldProps)}
              dataRow={selectedRow}
              key={field.name}
            />
          ))}
        </EditForm>
      );
    }
    return <div className={`${classBase}-placeholder`}>{placeholder}</div>;
  };

  return (
    <div
      className={cx(classBase, className, `${classBase}-${mode}`)}
      data-testid={`table-with-edit-form${testId}`}
      style={style}
    >
      <div className={`${classBase}-toolbar`}>
        <Button
          data-testid={`edit-button${testId}`}
          disabled={isEditing || selectedRow === undefined}
          onClick={startEdit}
        >
          Edit
        </Button>
        {allowCreate ? (
          <Button
            data-testid={`new-button${testId}`}
            disabled={isEditing}
            onClick={startCreate}
          >
            New
          </Button>
        ) : null}
        {toolbar}
      </div>
      <div className={`${classBase}-body`}>
        <div className={`${classBase}-table`}>
          <Table
            data-testid={`table${testId}`}
            renderBufferSize={10}
            {...tableProps}
            config={config}
            dataSource={dataSource}
            isRowSelectable={isEditing ? NO_ROWS_SELECTABLE : undefined}
            onSelect={handleSelect}
            selectionModel="single"
          />
        </div>
        <div className={`${classBase}-detail`}>{renderDetail()}</div>
      </div>
    </div>
  );
};
