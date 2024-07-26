/**
 * The Vuu Shell creates the outermost application layout. This includes some
 * 'special' identifiers that can be targetted by layout commands to effect or
 * react to layout changes.
 */
export const VuuShellLocation = {
  ContextPanel: "context-panel",
  SidePanel: "vuu-side-panel",
  Workspace: "vuu-workspace",
  WorkspaceContainer: "vuu-workspace-container",
} as const;

export type VuuShellLocation =
  (typeof VuuShellLocation)[keyof typeof VuuShellLocation];
