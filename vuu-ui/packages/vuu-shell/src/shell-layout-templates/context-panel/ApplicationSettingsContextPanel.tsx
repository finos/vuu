import { useCallback } from "react";
import { useWorkspace } from "../../workspace-management";
import { ContextPanel } from "./ContextPanel";

export const ApplicationSettingsContextPanel = () => {
  const { getApplicationSetting, setApplicationSetting } = useWorkspace();
  const expanded =
    getApplicationSetting("applicationSettings.panelOpen") === true;
  const handleClose = useCallback(() => {
    void setApplicationSetting("applicationSettings.panelOpen", false);
  }, [setApplicationSetting]);

  return (
    <ContextPanel
      content={<div>Application settings</div>}
      expanded={expanded}
      id="vuu-context-panel"
      onClose={handleClose}
      overlay
      title="Settings"
    />
  );
};
