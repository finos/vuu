import { AddIcon } from "@salt-ds/icons";
import { useTemplateDragState } from "@vuu-ui/grid-layout";

/**
 * Placeholder content of an empty workspace when the Panels palette is
 * available: invites the user to drag or click a palette row. Highlighted
 * while a template is dragged.
 */
export const WorkspaceDropZone = () => {
  const { dragging } = useTemplateDragState();
  return (
    <div
      className="vuuWorkspaceDropZone"
      data-drag-active={dragging || undefined}
    >
      <span aria-hidden className="vuuWorkspaceDropZone-icon">
        <AddIcon />
      </span>
      <h4>This workspace is empty</h4>
      <p>
        Drag modules or tables from the Panels palette, or click one to add it.
      </p>
    </div>
  );
};
