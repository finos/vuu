import { SidePanelContent, SidePanelTitle } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type {
  EditableTableHookProps,
  EditFormValidator,
} from "@vuu-ui/vuu-data-editing";
import type { DataSource, DataValueDescriptor } from "@vuu-ui/vuu-data-types";
import type { TableProps } from "@vuu-ui/vuu-table";
import type { DataRow, TableConfig } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import type { CSSProperties, ReactNode } from "react";
import {
  TableEditorCreateForm,
  type TableEditorCreateStrategy,
  TableEditorEditButton,
  type TableEditorEditModel,
  type TableEditorEditStrategy,
  TableEditorForm,
  type TableEditorMode,
  TableEditorModeToggle,
  TableEditorNewButton,
  type TableEditorPanelVisibility,
  TableEditorPlaceholder,
  TableEditorTable,
  TableEditorToolbar,
  useTableEditor,
} from "../table-editor";
import { TableEditorProvider } from "../table-editor/TableEditorProvider";

import editableTableCss from "./EditableTable.css";
import {
  EditableTableFooter,
  EditableTableMain,
  EditableTablePanel,
  EditableTablePanelHeader,
} from "./EditableTableLayout";

/** `create` is only used with a create form. */
export type EditableTableMode = TableEditorMode;

/**
 * - `session`: edits are staged in a session table and applied on Save, or
 *   discarded on Cancel.
 * - `direct`: each committed edit is sent straight to `dataSource`. There
 *   is no Save or Cancel.
 */
export type EditableTableEditModel = TableEditorEditModel;

/**
 * - `inline`: cells are edited in the table.
 * - `form`: the selected row is edited in a form in a side panel.
 */
export type EditableTableEditStrategy = TableEditorEditStrategy;

/**
 * - `inline`: new rows are added in the table (`showInlineAddRow`).
 * - `form`: new rows are added with a form in a side panel.
 */
export type EditableTableCreateStrategy = TableEditorCreateStrategy;

/**
 * - `on-select`: the side panel opens when a row is selected (or New is
 *   clicked) and closes when the selection is cleared or the panel's close
 *   button is clicked.
 * - `always`: the side panel is always visible, showing a placeholder when
 *   no row is selected.
 */
export type EditableTablePanelVisibility = TableEditorPanelVisibility;

export type EditableTableField = DataValueDescriptor;

type Never<T> = { [K in keyof T]?: never };

/** Props for every strategy and model. */
export interface EditableTableBaseProps
  extends Pick<
    EditableTableHookProps,
    "deleteMode" | "editSessionApi" | "onError" | "rowDefaults"
  > {
  className?: string;
  /** Asked before unsaved changes are discarded. See `useConfirmDiscard`. */
  confirmCancel?: () => boolean | Promise<boolean>;
  /** The source (view) dataSource. */
  dataSource: DataSource;
  /**
   * Uncontrolled initial mode. Defaults to `edit` (always editable) for
   * inline direct editing, otherwise to `view`.
   */
  defaultMode?: EditableTableMode;
  /** Controlled mode. Pair with `onModeChange`. */
  mode?: EditableTableMode;
  /** Called once changes, or a new row, have been discarded. */
  onCancelled?: () => void;
  onModeChange?: (mode: EditableTableMode) => void;
  /** Called once changes, or a new row, have been saved. */
  onSaved?: () => void;
  /** With a side panel. @default "on-select" */
  panelVisibility?: EditableTablePanelVisibility;
  style?: CSSProperties;
  /** Suffix appended to built-in test ids (`edit-table`, `toggle-edit` …). */
  testId?: string;
}

/** Inline session editing only. */
export interface EditableTableSessionOnlyProps {
  /**
   * Show a checkbox column and a Delete button in edit mode, so selected
   * rows can be deleted. Rows already marked for deletion cannot be selected.
   */
  allowDelete?: boolean;
  /** Rows copied into the edit session. @default "All" */
  copyOption?: EditableTableHookProps["copyOption"];
}

/** Inline session editing, default layout only. */
export interface EditableTableSessionLayoutProps {
  /** @default "Save" */
  saveLabel?: string;
  /** Show an inline row, above the column headers, for adding new rows. */
  showInlineAddRow?: boolean;
  /** Add a column with an undo button for edited rows. */
  undoColumn?: boolean;
}

/** Inline editing, default layout only. */
export interface EditableTableInlineLayoutProps {
  /**
   * Show a View/Edit toggle above the table. Defaults to true for session
   * editing and false (always editable) for direct editing.
   */
  showEditModeToggle?: boolean;
}

/** Form editing, default layout only. */
export interface EditableTableFormLayoutProps {
  /** Show a New button and a form for adding rows. @default true */
  allowCreate?: boolean;
  /** Fields for the edit form, in tab order. Generated when omitted. */
  fields?: readonly EditableTableField[];
  /** Title shown in the side panel header for the selected row. */
  formTitle?: string | ((dataRow: DataRow) => string);
  /** @default "Select a row to see its details" */
  placeholder?: string;
  /** Validates the edit form. */
  validate?: EditFormValidator;
}

/** With a create form, default layout only. */
export interface EditableTableCreateLayoutProps {
  /** Fields for the create form. Defaults to `fields`, or generated. */
  createFields?: readonly EditableTableField[];
  /** @default "New" */
  createTitle?: string;
  /** Applied to the SidePanel, e.g. to set `--saltSidePanel-width`. */
  panelClassName?: string;
  /** Validates the create form. Defaults to `validate`. */
  validateCreate?: EditFormValidator;
}

/** The default layout. Other `Table` props are passed to the table. */
export interface EditableTableDefaultLayoutProps
  extends Omit<
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
  /**
   * Table config. Per-column `editable` and `editor` (on each column's
   * `DataValueDescriptor`) control what can be edited, and how.
   */
  config: TableConfig;
}

/**
 * Your own layout: compose `TableEditorTable`, `EditableTableFooter`,
 * `TableEditorToolbar`, `EditableTableMain`, `EditableTablePanel`,
 * `TableEditorForm`, `TableEditorCreateForm` etc.
 */
export interface EditableTableComposedProps {
  children: ReactNode;
  config?: never;
}

type SessionModel = { editModel?: "session" };
type DirectModel = { editModel: "direct" } & Never<
  EditableTableSessionOnlyProps & EditableTableSessionLayoutProps
>;

type InlineStrategy = {
  createStrategy?: "inline";
  editStrategy?: "inline";
} & Never<EditableTableFormLayoutProps & EditableTableCreateLayoutProps>;
type InlineWithCreateForm = {
  createStrategy: "form";
  editStrategy?: "inline";
} & Never<
  EditableTableFormLayoutProps &
    Pick<EditableTableSessionLayoutProps, "showInlineAddRow">
>;
type FormStrategy = {
  createStrategy?: "form";
  editStrategy: "form";
} & Never<
  EditableTableSessionOnlyProps &
    EditableTableSessionLayoutProps &
    EditableTableInlineLayoutProps
>;

type Layout =
  | EditableTableComposedProps
  | (EditableTableDefaultLayoutProps &
      EditableTableSessionLayoutProps &
      EditableTableInlineLayoutProps &
      EditableTableFormLayoutProps &
      EditableTableCreateLayoutProps);

export type EditableTableProps = EditableTableBaseProps &
  EditableTableSessionOnlyProps &
  (SessionModel | DirectModel) &
  (InlineStrategy | InlineWithCreateForm | FormStrategy) &
  Layout;

/** Every prop, for destructuring. */
type AllProps = EditableTableBaseProps &
  EditableTableSessionOnlyProps & {
    children?: ReactNode;
    createStrategy?: EditableTableCreateStrategy;
    editModel?: EditableTableEditModel;
    editStrategy?: EditableTableEditStrategy;
  };

type ContentProps = EditableTableDefaultLayoutProps &
  EditableTableSessionLayoutProps &
  EditableTableInlineLayoutProps &
  EditableTableFormLayoutProps &
  EditableTableCreateLayoutProps & { testId: string };

const classBase = "vuuEditableTable";

const PanelTitle = ({
  createTitle,
  formTitle,
}: Pick<ContentProps, "createTitle" | "formTitle">) => {
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

const InlineContent = ({
  createFields,
  createTitle = "New",
  panelClassName,
  saveLabel,
  showEditModeToggle,
  testId,
  validateCreate,
  ...tableProps
}: ContentProps) => {
  const { createStrategy, editModel } = useTableEditor();
  const hasCreateForm = createStrategy === "form";
  const showToggle = showEditModeToggle ?? editModel === "session";
  const table = (
    <>
      {showToggle || hasCreateForm ? (
        <TableEditorToolbar>
          {showToggle ? <TableEditorModeToggle testId={testId} /> : null}
          {hasCreateForm ? (
            <TableEditorNewButton data-testid={`new-button${testId}`} />
          ) : null}
        </TableEditorToolbar>
      ) : null}
      <TableEditorTable data-testid={`table${testId}`} {...tableProps} />
      <EditableTableFooter saveLabel={saveLabel} />
    </>
  );
  return hasCreateForm ? (
    <>
      <EditableTableMain>{table}</EditableTableMain>
      <EditableTablePanel
        className={panelClassName}
        data-testid={`edit-panel${testId}`}
      >
        <EditableTablePanelHeader>
          <PanelTitle createTitle={createTitle} />
        </EditableTablePanelHeader>
        <SidePanelContent className={`${classBase}-detail`}>
          <TableEditorCreateForm
            data-testid={`create-form${testId}`}
            fields={createFields}
            validate={validateCreate}
          />
        </SidePanelContent>
      </EditableTablePanel>
    </>
  ) : (
    table
  );
};

const FormContent = ({
  allowCreate = true,
  createFields,
  createTitle = "New",
  fields,
  formTitle,
  panelClassName,
  placeholder = "Select a row to see its details",
  testId,
  validate,
  validateCreate = validate,
  ...tableProps
}: ContentProps) => (
  <>
    <EditableTableMain>
      <TableEditorToolbar>
        <TableEditorEditButton data-testid={`edit-button${testId}`} />
        {allowCreate ? (
          <TableEditorNewButton data-testid={`new-button${testId}`} />
        ) : null}
      </TableEditorToolbar>
      <TableEditorTable data-testid={`table${testId}`} {...tableProps} />
    </EditableTableMain>
    <EditableTablePanel
      className={panelClassName}
      data-testid={`edit-panel${testId}`}
    >
      <EditableTablePanelHeader>
        <PanelTitle createTitle={createTitle} formTitle={formTitle} />
      </EditableTablePanelHeader>
      <SidePanelContent className={`${classBase}-detail`}>
        <TableEditorPlaceholder>{placeholder}</TableEditorPlaceholder>
        <TableEditorForm
          data-testid={`edit-form${testId}`}
          fields={fields}
          validate={validate}
        />
        {allowCreate ? (
          <TableEditorCreateForm
            data-testid={`create-form${testId}`}
            fields={createFields ?? fields}
            validate={validateCreate}
          />
        ) : null}
      </SidePanelContent>
    </EditableTablePanel>
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
  const { createStrategy, editStrategy, mode, panelOpen } = useTableEditor();
  return (
    <div
      className={cx(classBase, className, `${classBase}-${mode}`, {
        [`${classBase}-editing`]: mode === "edit",
        [`${classBase}-panelOpen`]: panelOpen,
        [`${classBase}-withPanel`]:
          editStrategy === "form" || createStrategy === "form",
      })}
      data-testid={`edit-table${testId}`}
      style={style}
    >
      {children}
    </div>
  );
};

/**
 * A Table with editing. All the wiring (edit session, editable columns, row
 * styling, forms, Save/Cancel/Delete buttons, the inline add row) is
 * handled internally.
 *
 * - `editStrategy="inline"` (the default): cells are edited in the table.
 *   `createStrategy="form"` adds new rows with a form in a side panel.
 * - `editStrategy="form"`: selecting a row shows it in a form in a side
 *   panel; Edit makes it editable and New shows a form for a new row.
 *
 * - `editModel="session"` (the default): edits are staged in an edit
 *   session and applied when the user saves.
 * - `editModel="direct"`: each committed edit is sent straight to
 *   `dataSource`. There is no Save or Cancel.
 *
 * What can be edited, and how, comes from the server schema and each
 * column's `editable` and `editor`. Forms are generated from the schema
 * unless you pass `fields` or compose your own.
 *
 * Renders a flex container that fills its parent (a row, with the side
 * panel, when there is one). Without `children` it renders a default
 * layout. Otherwise it holds `children`: compose `TableEditorTable`,
 * `EditableTableFooter`, `EditableTableMain`, `EditableTablePanel`,
 * `TableEditorForm` etc. Read the state with `useTableEditor`.
 */
export const EditableTable = (props: EditableTableProps) => {
  const {
    allowDelete = false,
    children,
    className,
    confirmCancel,
    copyOption,
    createStrategy,
    dataSource,
    defaultMode,
    deleteMode,
    editModel = "session",
    editSessionApi,
    editStrategy = "inline",
    mode,
    onCancelled,
    onError,
    onModeChange,
    onSaved,
    panelVisibility,
    rowDefaults,
    style,
    testId = "",
    ...contentProps
  } = props as AllProps;

  const isInlineDirect = editStrategy === "inline" && editModel === "direct";

  return (
    <TableEditorProvider
      allowDelete={allowDelete}
      confirmCancel={confirmCancel}
      copyOption={copyOption}
      createStrategy={createStrategy}
      dataSource={dataSource}
      defaultMode={defaultMode ?? (isInlineDirect ? "edit" : "view")}
      deleteMode={deleteMode}
      editModel={editModel}
      editSessionApi={editSessionApi}
      editStrategy={editStrategy}
      mode={mode}
      onCancelled={onCancelled}
      onError={onError}
      onModeChange={onModeChange}
      onSaved={onSaved}
      panelVisibility={panelVisibility}
      rowDefaults={rowDefaults}
    >
      <Container className={className} style={style} testId={testId}>
        {children ??
          (editStrategy === "form" ? (
            <FormContent
              {...(contentProps as Omit<ContentProps, "testId">)}
              testId={testId}
            />
          ) : (
            <InlineContent
              {...(contentProps as Omit<ContentProps, "testId">)}
              testId={testId}
            />
          ))}
      </Container>
    </TableEditorProvider>
  );
};
