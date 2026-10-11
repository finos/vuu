import {
  Button,
  SidePanel,
  SidePanelContent,
  SidePanelHeader,
  SidePanelTitle,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type {
  EditFormHookProps,
  EditFormValidator,
} from "@vuu-ui/vuu-data-editing";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { TableProps } from "@vuu-ui/vuu-table";
import type { DataRow, TableConfig } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import type { ReactNode } from "react";
import {
  TableEditorCreateForm,
  type TableEditorField,
  TableEditorForm,
  type TableEditorMode,
  TableEditorNewButton,
  TableEditorPanelCloseButton,
  type TableEditorPanelVisibility,
  TableEditorTable,
  useTableEditor,
} from "../table-editor";

import { TableEditorProvider } from "../table-editor/TableEditorProvider";

import tableWithEditFormCss from "./TableWithEditForm.css";

export type TableWithEditFormMode = TableEditorMode;

export type TableWithEditFormField = TableEditorField;

/**
 * - `on-select`: the side panel opens when a row is selected (or New is
 *   clicked) and closes when the selection is cleared or the panel's close
 *   button is clicked.
 * - `always`: the side panel is always visible, showing `placeholder` when
 *   no row is selected.
 */
export type TableWithEditFormPanelVisibility = TableEditorPanelVisibility;

/** Props for the editing state, whether or not `children` are given. */
export interface TableWithEditFormBaseProps
  extends Pick<
    EditFormHookProps,
    "deleteMode" | "editSessionApi" | "onError" | "rowDefaults"
  > {
  /** Asked before a form with unsaved changes is discarded. */
  confirmCancel?: () => boolean | Promise<boolean>;
  dataSource: DataSource;
  onModeChange?: (mode: TableWithEditFormMode) => void;
  /** @default "on-select" */
  panelVisibility?: TableWithEditFormPanelVisibility;
}

/**
 * Your own layout: compose `TableEditorTable`, a Salt `SidePanel` containing
 * `TableEditorForm` and `TableEditorCreateForm`, `TableEditorNewButton` etc.
 */
export interface TableWithEditFormComposedProps
  extends TableWithEditFormBaseProps {
  children: ReactNode;
}

/** The default layout: a toolbar, the table and a generated form. */
export interface TableWithEditFormDefaultProps
  extends TableWithEditFormBaseProps,
    Omit<
      TableProps,
      | "children"
      | "config"
      | "customHeader"
      | "dataSource"
      | "isRowSelectable"
      | "onError"
      | "selectionModel"
    > {
  /** Show a New button that opens an empty form for adding a row. */
  allowCreate?: boolean;
  children?: undefined;
  config: TableConfig;
  /** Fields for the create form. Defaults to `fields`. */
  createFields?: readonly TableWithEditFormField[];
  createTitle?: ReactNode;
  /** Fields for the detail form, in tab order. */
  fields?: readonly TableWithEditFormField[];
  /** Title shown in the side panel header. */
  formTitle?: ReactNode | ((dataRow: DataRow) => ReactNode);
  /** Applied to the SidePanel, e.g. to set `--saltSidePanel-width`. */
  panelClassName?: string;
  /** Shown in the side panel when no row is selected. */
  placeholder?: ReactNode;
  testId?: string;
  /** Extra content rendered in the toolbar. */
  toolbar?: ReactNode;
  validate?: EditFormValidator;
  /** Validator for the create form. Defaults to `validate`. */
  validateCreate?: EditFormValidator;
}

export type TableWithEditFormProps =
  | TableWithEditFormComposedProps
  | TableWithEditFormDefaultProps;

const classBase = "vuuTableWithEditForm";

const NO_FIELDS: readonly TableWithEditFormField[] = [];

const EditButton = ({ testId }: { testId: string }) => {
  const { isEditing, selectedRow, startEdit } = useTableEditor();
  return (
    <Button
      data-testid={`edit-button${testId}`}
      disabled={isEditing || selectedRow === undefined}
      onClick={startEdit}
    >
      Edit
    </Button>
  );
};

const PanelTitle = ({
  createTitle,
  formTitle,
}: Pick<TableWithEditFormDefaultProps, "createTitle" | "formTitle">) => {
  const { mode, selectedRow } = useTableEditor();
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

type DefaultLayoutProps = Omit<
  TableWithEditFormDefaultProps,
  keyof TableWithEditFormBaseProps
>;

const DefaultLayout = ({
  allowCreate = true,
  className,
  config,
  createFields,
  createTitle = "New",
  fields = NO_FIELDS,
  formTitle,
  panelClassName,
  placeholder = "Select a row to see its details",
  style,
  testId = "",
  toolbar,
  validate,
  validateCreate = validate,
  ...tableProps
}: DefaultLayoutProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table-with-edit-form",
    css: tableWithEditFormCss,
    window: targetWindow,
  });
  const { mode, panelOpen } = useTableEditor();

  return (
    <div
      className={cx(classBase, className, `${classBase}-${mode}`, {
        [`${classBase}-panelOpen`]: panelOpen,
      })}
      data-testid={`table-with-edit-form${testId}`}
      style={style}
    >
      <div className={`${classBase}-main`}>
        <div className={`${classBase}-toolbar`}>
          <EditButton testId={testId} />
          {allowCreate ? (
            <TableEditorNewButton data-testid={`new-button${testId}`} />
          ) : null}
          {toolbar}
        </div>
        <div className={`${classBase}-table`}>
          <TableEditorTable
            data-testid={`table${testId}`}
            {...tableProps}
            config={config}
          />
        </div>
      </div>
      <SidePanel
        className={cx(`${classBase}-panel`, panelClassName)}
        data-testid={`edit-panel${testId}`}
        position="right"
      >
        <SidePanelHeader className={`${classBase}-panelHeader`}>
          <PanelTitle createTitle={createTitle} formTitle={formTitle} />
          <TableEditorPanelCloseButton />
        </SidePanelHeader>
        <SidePanelContent className={`${classBase}-detail`}>
          <TableEditorForm
            data-testid={`edit-form${testId}`}
            fields={fields}
            placeholder={placeholder}
            validate={validate}
          />
          <TableEditorCreateForm
            data-testid={`create-form${testId}`}
            fields={createFields ?? fields}
            validate={validateCreate}
          />
        </SidePanelContent>
      </SidePanel>
    </div>
  );
};

/**
 * Master–detail editing: a Table with a form for the selected row, shown in
 * a side panel.
 *
 * - Selecting a row shows it, read-only, in the form. With
 *   `panelVisibility="on-select"` (the default) this opens the side panel.
 * - Edit makes the form editable; Save/Cancel return to read-only.
 * - New shows an empty form; Create adds the row.
 *
 * Row selection is locked, and the side panel cannot be closed, while a
 * form is being edited, so changes cannot be lost by clicking another row.
 * Use `confirmCancel` to guard Cancel.
 *
 * Without `children`, renders a toolbar, the table and a form generated from
 * `fields`. With `children`, renders them instead: lay out
 * `TableEditorTable`, a Salt `SidePanel` (opened and closed for you) with
 * `TableEditorForm` and `TableEditorCreateForm`, and the other `TableEditor`
 * controls however you like. Read the state with `useTableEditor`.
 */
export const TableWithEditForm = (props: TableWithEditFormProps) => {
  const {
    children,
    confirmCancel,
    dataSource,
    deleteMode,
    editSessionApi,
    onError,
    onModeChange,
    panelVisibility = "on-select",
    rowDefaults,
    ...layoutProps
  } = props;

  return (
    <TableEditorProvider
      confirmCancel={confirmCancel}
      dataSource={dataSource}
      deleteMode={deleteMode}
      editIn="form"
      editSessionApi={editSessionApi}
      onError={onError}
      onModeChange={onModeChange}
      panelVisibility={panelVisibility}
      rowDefaults={rowDefaults}
    >
      {children ?? <DefaultLayout {...(layoutProps as DefaultLayoutProps)} />}
    </TableEditorProvider>
  );
};
