import { ValueOf } from "./ts-utils";

/**
 * The Vuu Shell creates the outermost application layout. This includes some
 * 'special' identifiers that can be targetted by layout commands to effect or
 * react to layout changes.
 */
export const VuuShellLocation = {
  ContextPanel: "context-panel",
  MultiWorkspaceContainer: "vuu-multi-workspace-container",
  SidePanel: "vuu-side-panel",
  SideToolbar: "vuu-side-toolbar",
  Workspace: "vuu-workspace",
  WorkspaceContainer: "vuu-workspace-container",
} as const;

export type VuuShellLocation = ValueOf<typeof VuuShellLocation>;
