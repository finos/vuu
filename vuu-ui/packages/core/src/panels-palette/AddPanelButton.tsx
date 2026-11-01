import { Button, type ButtonProps } from "@salt-ds/core";
import { AddIcon } from "@salt-ds/icons";
import { useEffect } from "react";
import { usePanelsPaletteState } from "./PanelsPaletteState";

export type AddPanelButtonProps = Omit<ButtonProps, "onClick">;

/**
 * "Add panel": opens and closes the Panels palette. For the workspace header,
 * e.g. `PortalShell workspaces={{ headerActions: <AddPanelButton /> }}`.
 * Renders nothing outside a workspace. Its presence makes the palette
 * available: the workspace renders it, in the shell's context panel.
 */
export const AddPanelButton = ({
  appearance = "solid",
  children = "Add panel",
  className,
  sentiment = "accented",
  ...buttonProps
}: AddPanelButtonProps) => {
  const paletteState = usePanelsPaletteState();
  const register = paletteState?.register;
  useEffect(() => register?.(), [register]);
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
