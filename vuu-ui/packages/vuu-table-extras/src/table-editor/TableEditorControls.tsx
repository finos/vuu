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
 * Save and Cancel (and, for table editing with `allowDelete`, Delete)
 * buttons for the enclosing `TableEditorProvider`. Disabled outside edit
 * mode. When editing in a form, render them within `TableEditorForm` or
 * `TableEditorCreateForm`, with `showButtons={false}` on the form.
 */
export const TableEditorButtons = ({
  hideCancel,
  saveLabel,
}: TableEditorButtonsProps) => {
  const { allowDelete, confirmCancel, editIn, editableTable } =
    useTableEditorContext("TableEditorButtons");
  const form = useEditFormContext();

  if (editIn === "form") {
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
 * View/Edit toggle for the enclosing `TableEditorProvider`. Switching to View
 * discards changes, asking `confirmCancel` first. When editing in a form it
 * is disabled until a row is selected, and while a row is being created.
 */
export const TableEditorModeToggle = ({
  "aria-label": ariaLabel = "Mode",
  disabled,
  testId = "",
  ...props
}: TableEditorModeToggleProps) => {
  const { cancel, editIn, mode, selectedRow, startEdit } =
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
        (editIn === "form" && selectedRow === undefined)
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

export type TableEditorNewButtonProps = Omit<ButtonProps, "onClick">;

/**
 * Form editing: starts a new row, shown in `TableEditorCreateForm`. Disabled
 * while editing.
 */
export const TableEditorNewButton = forwardRef<
  HTMLButtonElement,
  TableEditorNewButtonProps
>(function TableEditorNewButton({ children = "New", disabled, ...props }, ref) {
  const { isEditing, startCreate } = useTableEditorContext(
    "TableEditorNewButton",
  );
  return (
    <Button
      {...props}
      disabled={disabled || isEditing}
      onClick={startCreate}
      ref={ref}
    >
      {children}
    </Button>
  );
});

/**
 * Form editing: a Salt `SidePanelCloseButton` that is only rendered while
 * the side panel can be closed, i.e. not while editing.
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
