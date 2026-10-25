import { Button, type ButtonProps } from "@salt-ds/core";
import { AddIcon } from "@salt-ds/icons";
import { usePanelsPaletteState } from "./PanelsPaletteState";

export type AddPanelButtonProps = Omit<ButtonProps, "onClick">;

/**
 * "Add panel": opens and closes the Panels palette. For the workspace header,
 * e.g. `PortalShell workspaces={{ headerActions: <AddPanelButton /> }}`.
 * Renders nothing outside a workspace.
 */
export const AddPanelButton = ({
  appearance = "solid",
  children = "Add panel",
  className,
  sentiment = "accented",
  ...buttonProps
}: AddPanelButtonProps) => {
  const paletteState = usePanelsPaletteState();
  if (!paletteState) {
    return null;
  }
  return (
    <Button
      {...buttonProps}
      appearance={appearance}
      aria-pressed={paletteState.open}
      className={
        className ? `vuuAddPanelButton ${className}` : "vuuAddPanelButton"
      }
      onClick={paletteState.toggleOpen}
      sentiment={sentiment}
    >
      <AddIcon aria-hidden />
      {children}
    </Button>
  );
};
