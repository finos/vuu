import {
  Button,
  type ButtonProps,
  SidePanelCloseButton,
  ToggleButton,
  ToggleButtonGroup,
  type ToggleButtonGroupProps,
} from "@salt-ds/core";
import {
  EditButtons,
  EditFormButtons,
  useEditFormContext,
} from "@vuu-ui/vuu-data-editing";
import { type SyntheticEvent, forwardRef, useCallback } from "react";
import { useTableEditorContext } from "./TableEditorContext";

export interface TableEditorButtonsProps {
  hideCancel?: boolean;
  /** @default "Save", or "Create" for a new row */
  saveLabel?: string;
}

/**
 * Save and Cancel (and, for inline editing with `allowDelete`, Delete)
 * buttons for the enclosing `EditableTable`. Disabled outside edit mode.
 * Within a form, they are the form's buttons: render them within the
 * `children` of `TableEditorForm` (which then omits its own buttons), or
 * within `TableEditorCreateForm` with `showButtons={false}`. Renders nothing
 * for inline direct editing, which has nothing to save.
 */
export const TableEditorButtons = ({
  hideCancel,
  saveLabel,
}: TableEditorButtonsProps) => {
  const { allowDelete, confirmCancel, editStrategy, editableTable } =
    useTableEditorContext("TableEditorButtons");
  const form = useEditFormContext();

  if (form || editStrategy === "form") {
    return form ? (
      <EditFormButtons
        confirmCancel={confirmCancel}
        hideCancel={hideCancel}
        saveLabel={saveLabel}
      />
    ) : null;
  } else if (editableTable) {
    const {
      canCancel,
      canSave,
      editSession,
      hasSelection,
      onCancel,
      onDelete,
      onSave,
    } = editableTable;
    return (
      <EditButtons
        canCancel={canCancel}
        canSave={canSave}
        confirmCancel={confirmCancel}
        editSession={editSession}
        hasSelection={allowDelete ? hasSelection : undefined}
        onCancel={hideCancel ? undefined : onCancel}
        onDelete={allowDelete ? onDelete : undefined}
        onSave={onSave}
        saveLabel={saveLabel}
      />
    );
  }
  return null;
};

export interface TableEditorModeToggleProps
  extends Omit<ToggleButtonGroupProps, "children" | "onChange" | "value"> {
  /** Suffix appended to the `toggle-view` and `toggle-edit` test ids. */
  testId?: string;
}

/**
 * View/Edit toggle for the enclosing `EditableTable`. Switching to View
 * discards changes, asking `confirmCancel` first. It is disabled while a row
 * is being created and, when editing in a form, until a row is selected.
 */
export const TableEditorModeToggle = ({
  "aria-label": ariaLabel = "Mode",
  disabled,
  testId = "",
  ...props
}: TableEditorModeToggleProps) => {
  const { cancel, editStrategy, mode, selectedRow, startEdit } =
    useTableEditorContext("TableEditorModeToggle");

  const handleChange = useCallback(
    (e: SyntheticEvent<HTMLButtonElement>) => {
      if (e.currentTarget.value === "edit") {
        startEdit();
      } else {
        void cancel();
      }
    },
    [cancel, startEdit],
  );

  return (
    <ToggleButtonGroup
      {...props}
      aria-label={ariaLabel}
      disabled={
        disabled ||
        mode === "create" ||
        (editStrategy === "form" && selectedRow === undefined)
      }
      onChange={handleChange}
      value={mode === "edit" ? "edit" : "view"}
    >
      <ToggleButton data-testid={`toggle-view${testId}`} value="view">
        View
      </ToggleButton>
      <ToggleButton data-testid={`toggle-edit${testId}`} value="edit">
        Edit
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export type TableEditorEditButtonProps = Omit<ButtonProps, "onClick">;

/**
 * Form editing: makes the selected row's form editable. Disabled while
 * editing and when no row is selected.
 */
export const TableEditorEditButton = forwardRef<
  HTMLButtonElement,
  TableEditorEditButtonProps
>(function TableEditorEditButton(
  { children = "Edit", disabled, ...props },
  ref,
) {
  const { isEditing, selectedRow, startEdit } = useTableEditorContext(
    "TableEditorEditButton",
  );
  return (
    <Button
      {...props}
      disabled={disabled || isEditing || selectedRow === undefined}
      onClick={startEdit}
      ref={ref}
    >
      {children}
    </Button>
  );
});

export type TableEditorNewButtonProps = Omit<ButtonProps, "onClick">;

/**
 * Starts a new row, shown in `TableEditorCreateForm`, with
 * `editStrategy="form"` or `createStrategy="form"`. Disabled while a new row
 * can't be started: while editing in a form, or while already creating.
 */
export const TableEditorNewButton = forwardRef<
  HTMLButtonElement,
  TableEditorNewButtonProps
>(function TableEditorNewButton({ children = "New", disabled, ...props }, ref) {
  const { canCreate, startCreate } = useTableEditorContext(
    "TableEditorNewButton",
  );
  return (
    <Button
      {...props}
      disabled={disabled || !canCreate}
      onClick={startCreate}
      ref={ref}
    >
      {children}
    </Button>
  );
});

/**
 * A Salt `SidePanelCloseButton` that is only rendered while the side panel
 * can be closed, i.e. not while editing.
 */
export const TableEditorPanelCloseButton = forwardRef<
  HTMLButtonElement,
  ButtonProps
>(function TableEditorPanelCloseButton(props, ref) {
  const { canClosePanel } = useTableEditorContext(
    "TableEditorPanelCloseButton",
  );
  return canClosePanel ? <SidePanelCloseButton {...props} ref={ref} /> : null;
});
