import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import workspaceStartPanelCss from "./WorkspaceStartPanel.css";

export const WorkspaceStartPanel = () => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-workspace-start-panel",
    css: workspaceStartPanelCss,
    window: targetWindow,
  });

  return (
    <div className="vuuWorkspaceStartPanel">
      <div className="vuuWorkspaceStartPanel-title">
        Start by adding a table
      </div>
      <div className="vuuWorkspaceStartPanel-text">
        To add a table, drag any of the Vuu Tables to this area
      </div>
      <div aria-hidden className="vuuWorkspaceStartPanel-addIcon">
        <Icon name="add" />
      </div>
    </div>
  );
};
