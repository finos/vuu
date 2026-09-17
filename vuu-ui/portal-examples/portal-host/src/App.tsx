import { useModuleRegistry } from "@vuu-ui/core";
import { ColumnSettingsPanel } from "@vuu-ui/vuu-table-extras";
import { registerComponent } from "@vuu-ui/vuu-utils";
import { ConfirmSelectionPanel } from "./order-management/cancel-confirm-prompt/ConfirmSelectionPanel";
import { BrowserRouter } from "react-router-dom";
import { PortalShell } from "@vuu-ui/core/portal";
import type { ComponentType, ReactNode } from "react";

import "./App.css";

registerComponent("cancel-confirm", ConfirmSelectionPanel, "view");
registerComponent("ColumnSettings", ColumnSettingsPanel, "view");

export interface AppProps {
  DataSourceProvider?: ComponentType<{ children: ReactNode }>;
}

export const App = ({ DataSourceProvider }: AppProps) => {
  const { modules: remoteModules } = useModuleRegistry();

  return (
    <BrowserRouter>
      <PortalShell
        id="portal-demo"
        title="Portal Demo"
        remoteModules={remoteModules}
        DataSourceProvider={DataSourceProvider}
      />
    </BrowserRouter>
  );
};
