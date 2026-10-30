import { AddIcon } from "@salt-ds/icons";
import { useTemplateDragState } from "@heswell/grid-layout";
import type { ReactNode } from "react";

/** Actions available to a `WorkspaceEmptyContent` render function. */
export interface WorkspaceEmptyContentActions {
  /** Opens the Panels palette. */
  openPalette: () => void;
}

/**
 * Placeholder content of an empty workspace when the Panels palette is
 * available: a node, or a function of the actions, e.g. `openPalette`, that
 * returns one.
 */
export type WorkspaceEmptyContent =
  | ReactNode
  | ((actions: WorkspaceEmptyContentActions) => ReactNode);

export interface WorkspaceDropZoneProps {
  /** Explanatory text, below the title. */
  children?: ReactNode;
  title?: ReactNode;
}

/**
 * Placeholder content of an empty workspace when the Panels palette is
 * available: invites the user to drag or click a palette row. Highlighted
 * while a template is dragged.
 */
export const WorkspaceDropZone = ({
  children = "Drag modules or tables from the Panels palette, or click one to add it.",
  title = "This workspace is empty",
}: WorkspaceDropZoneProps) => {
  const { dragging } = useTemplateDragState();
  return (
    <div
      className="vuuWorkspaceDropZone"
      data-drag-active={dragging || undefined}
    >
      <span aria-hidden className="vuuWorkspaceDropZone-icon">
        <AddIcon />
      </span>
      <h4>{title}</h4>
      <p>{children}</p>
    </div>
  );
};
