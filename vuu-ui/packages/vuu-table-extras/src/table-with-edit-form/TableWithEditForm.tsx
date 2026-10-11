import {
  Button,
  SidePanel,
  SidePanelCloseButton,
  SidePanelContent,
  SidePanelHeader,
  SidePanelProvider,
  SidePanelTitle,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  CreateRowForm,
  type CreateRowFormField,
  EditField,
  type EditFieldProps,
  EditForm,
  type EditFormHookProps,
  type EditFormHookResult,
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

/**
 * - `on-select`: the side panel opens when a row is selected (or New is
 *   clicked) and closes when the selection is cleared or the panel's close
 *   button is clicked.
 * - `always`: the side panel is always visible, showing `placeholder` when
 *   no row is selected.
 */
export type TableWithEditFormPanelVisibility = "on-select" | "always";

export interface TableWithEditFormPanelState {
  /** The selected row, undefined in create mode or when nothing is selected. */
  dataRow?: DataRow;
  mode: TableWithEditFormMode;
}

export interface TableWithEditFormContentProps {
  dataRow: DataRow;
  /** State of the form: edit mode, dirty, errors, the edit session etc. */
  form: EditFormHookResult;
  mode: TableWithEditFormMode;
}

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
  /**
   * Fields for the detail form, in tab order. Not needed for the edit form
   * when `renderFormContent` is provided; still used by the create form
   * unless `createFields` is provided.
   */
  fields?: readonly TableWithEditFormField[];
  /** Title shown in the side panel header. */
  formTitle?: ReactNode | ((dataRow: DataRow) => ReactNode);
  onModeChange?: (mode: TableWithEditFormMode) => void;
  /** Applied to the SidePanel, e.g. to set `--saltSidePanel-width`. */
  panelClassName?: string;
  /**
   * Replaces the default side panel header (a title from `formTitle` or
   * `createTitle`). The close button is still rendered when the panel can
   * be closed.
   */
  panelHeader?: ReactNode | ((state: TableWithEditFormPanelState) => ReactNode);
  /** @default "on-select" */
  panelVisibility?: TableWithEditFormPanelVisibility;
  /** Shown in the side panel when no row is selected. */
  placeholder?: ReactNode;
  /**
   * Renders the body of the edit form in place of `fields`, e.g. to lay
   * fields out in tabs or include custom editors. Render `EditField`s with
   * the supplied `dataRow`; they are editable while `form.isEditMode` is
   * true.
   */
  renderFormContent?: (props: TableWithEditFormContentProps) => ReactNode;
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

const NO_FIELDS: readonly TableWithEditFormField[] = [];

/**
 * Master–detail editing: a Table with a form for the selected row, shown in
 * a side panel.
 *
 * - Selecting a row shows it, read-only, in the form. With
 *   `panelVisibility="on-select"` (the default) this opens the side panel.
 * - Edit makes the form editable; Save/Cancel return to read-only.
 * - New (when `allowCreate`) shows an empty form; Create adds the row.
 *
 * Row selection is locked, and the side panel cannot be closed, while a
 * form is being edited, so changes cannot be lost by clicking another row.
 * Use `confirmCancel` to guard Cancel.
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
  fields = NO_FIELDS,
  formTitle,
  onError,
  onModeChange,
  panelClassName,
  panelHeader,
  panelVisibility = "on-select",
  placeholder = "Select a row to see its details",
  renderFormContent,
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
  const [panelOpen, setPanelOpen] = useState(panelVisibility === "always");
  const panelOpenBeforeCreateRef = useRef(panelOpen);
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
    setPanelOpen(dataRow !== null);
  }, []);

  const startEdit = useCallback(() => {
    setPanelOpen(true);
    setMode("edit");
  }, [setMode]);
  const startCreate = useCallback(() => {
    setCreateKey((key) => key + 1);
    panelOpenBeforeCreateRef.current = panelOpen;
    setPanelOpen(true);
    setMode("create");
  }, [panelOpen, setMode]);
  const showView = useCallback(() => setMode("view"), [setMode]);
  const handleCreateDone = useCallback(() => {
    // restore the panel to how it was before New was clicked
    setPanelOpen(panelOpenBeforeCreateRef.current);
    setMode("view");
  }, [setMode]);

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
  const alwaysVisible = panelVisibility === "always";
  const canClosePanel = !alwaysVisible && !isEditing;
  const isPanelOpen = alwaysVisible || isEditing || panelOpen;

  const handlePanelOpenChange = useCallback(
    (open: boolean) => {
      // the panel stays open while a form is being edited
      if (open || canClosePanel) {
        setPanelOpen(open);
      }
    },
    [canClosePanel],
  );

  const renderHeader = () => {
    if (panelHeader !== undefined) {
      return typeof panelHeader === "function"
        ? panelHeader({
            dataRow: mode === "create" ? undefined : selectedRow,
            mode,
          })
        : panelHeader;
    }
    const title =
      mode === "create"
        ? createTitle
        : selectedRow
          ? typeof formTitle === "function"
            ? formTitle(selectedRow)
            : formTitle
          : null;
    return title ? <SidePanelTitle>{title}</SidePanelTitle> : null;
  };

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
          onCancelled={handleCreateDone}
          onError={onError}
          onSaved={handleCreateDone}
          rowDefaults={rowDefaults}
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
          validate={validateEdit}
        >
          {renderFormContent
            ? (form: EditFormHookResult) =>
                renderFormContent({ dataRow: selectedRow, form, mode })
            : fields.map((field) => (
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
    <SidePanelProvider onOpenChange={handlePanelOpenChange} open={isPanelOpen}>
      <div
        className={cx(classBase, className, `${classBase}-${mode}`, {
          [`${classBase}-panelOpen`]: isPanelOpen,
        })}
        data-testid={`table-with-edit-form${testId}`}
        style={style}
      >
        <div className={`${classBase}-main`}>
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
        </div>
        <SidePanel
          className={cx(`${classBase}-panel`, panelClassName)}
          data-testid={`edit-panel${testId}`}
          position="right"
        >
          <SidePanelHeader className={`${classBase}-panelHeader`}>
            {renderHeader()}
            {canClosePanel ? <SidePanelCloseButton /> : null}
          </SidePanelHeader>
          <SidePanelContent className={`${classBase}-detail`}>
            {renderDetail()}
          </SidePanelContent>
        </SidePanel>
      </div>
    </SidePanelProvider>
  );
};
