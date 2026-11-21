import {
  ToggleButton,
  ToggleButtonGroup,
  type ToggleButtonGroupProps,
} from "@salt-ds/core";
import { type SyntheticEvent, useCallback } from "react";
import { useDataEditing } from "./DataEditingProvider";

export interface EditModeToggleProps
  extends Omit<ToggleButtonGroupProps, "children" | "onChange" | "value"> {
  /** Suffix appended to the `toggle-view` and `toggle-edit` test ids. */
  testId?: string;
}

/**
 * View/Edit toggle for the editable component inside the enclosing
 * `DataEditingModeProvider`, e.g. an `EditableTable`. It can be placed
 * anywhere inside the provider. Switching to View discards changes, in whatever way
 * the editable component does, e.g. asking for confirmation first. Disabled
 * while the editable component does not allow the mode to change.
 */
export const EditModeToggle = ({
  "aria-label": ariaLabel = "Mode",
  disabled,
  testId = "",
  ...props
}: EditModeToggleProps) => {
  const { canChangeMode, cancel, mode, startEdit } =
    useDataEditing("EditModeToggle");

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
      disabled={disabled || !canChangeMode}
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
