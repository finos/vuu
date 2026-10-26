import type { Mode } from "@salt-ds/core";
import { useModuleRegistry } from "@vuu-ui/core";
import {
  AddPanelButton,
  createPortalComponentRegistries,
  PortalShell,
  type PortalWorkspacesOptions,
} from "@vuu-ui/core/portal";
import { ColumnSettingsPanel } from "@vuu-ui/vuu-table-extras";
import { registerComponent } from "@vuu-ui/vuu-utils";
import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useState,
} from "react";
import { ConfirmSelectionPanel } from "./order-management/cancel-confirm-prompt/ConfirmSelectionPanel";
import { PortalDemoNav } from "./PortalDemoNav";

import "./App.css";

registerComponent("cancel-confirm", ConfirmSelectionPanel, "view");
registerComponent("ColumnSettings", ColumnSettingsPanel, "view");

const { renderers, settingsCodecs } = createPortalComponentRegistries();

const workspaces: PortalWorkspacesOptions = {
  componentRenderers: renderers,
  headerActions: <AddPanelButton />,
  // The portal example offers Vuu tables only, not modules.
  palette: { tabs: ["tables"] },
  settingsCodecs,
};

const THEME_MODE_KEY = "portal-demo-theme-mode";

const loadThemeMode = (): Mode => {
  try {
    return localStorage.getItem(THEME_MODE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

const saveThemeMode = (mode: Mode) => {
  try {
    localStorage.setItem(THEME_MODE_KEY, mode);
  } catch {
    // Storage unavailable: the choice lasts for this page only.
  }
};

export interface AppProps {
  DataSourceProvider?: ComponentType<{ children: ReactNode }>;
}

export const App = ({ DataSourceProvider }: AppProps) => {
  const { modules: remoteModules } = useModuleRegistry();
  const [themeMode, setThemeMode] = useState<Mode>(loadThemeMode);
  const onThemeModeChange = useCallback((mode: Mode) => {
    setThemeMode(mode);
    saveThemeMode(mode);
  }, []);

  return (
    <PortalShell
      contextPanel={{ placement: "inline" }}
      DataSourceProvider={DataSourceProvider}
      density="high"
      header={false}
      id="portal-demo"
      mode={themeMode}
      remoteModules={remoteModules}
      title="Portal Demo"
      workspaces={workspaces}
    >
      <PortalDemoNav
        onThemeModeChange={onThemeModeChange}
        remoteModules={remoteModules}
        themeMode={themeMode}
      />
    </PortalShell>
  );
};
