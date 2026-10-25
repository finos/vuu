import { useTemplateDragState } from "@vuu-ui/grid-layout";

/**
 * While a template (e.g. a Panels palette row) is dragged over the
 * workspace, explains where it can be dropped. Render it within the
 * workspace's GridLayoutProvider, in a positioned container.
 */
export const TemplateDragHint = () => {
  const { dragging, template } = useTemplateDragState();
  if (!dragging) {
    return null;
  }
  return (
    <div className="vuuTemplateDragHint" role="status">
      {template?.label ? (
        <span>
          Add <b>{template.label}</b> —
        </span>
      ) : null}
      <span>Drop on a panel edge to split, centre to replace, header to add a tab</span>
      <span className="vuuTemplateDragHint-cancel">
        <kbd>Esc</kbd> cancel
      </span>
    </div>
  );
};
