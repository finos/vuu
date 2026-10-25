import { useModuleRegistry } from "@vuu-ui/core";
import {
  AddPanelButton,
  createPortalComponentRegistries,
  PortalHeader,
  PortalNav,
  type PortalNavItem,
  PortalNavVuuServers,
  PortalShell,
  type PortalWorkspacesOptions,
} from "@vuu-ui/core/portal";
import { VuuLogo } from "@vuu-ui/vuu-icons";
import { ColumnSettingsPanel } from "@vuu-ui/vuu-table-extras";
import { registerComponent } from "@vuu-ui/vuu-utils";
import type { ComponentType, ReactNode } from "react";
import { ConfirmSelectionPanel } from "./order-management/cancel-confirm-prompt/ConfirmSelectionPanel";

import "./App.css";

registerComponent("cancel-confirm", ConfirmSelectionPanel, "view");
registerComponent("ColumnSettings", ColumnSettingsPanel, "view");

/** The module whose nav item lists the Vuu servers to browse. */
const TABLE_BROWSER_MODULE_ID = "vuu-table-browser";

const { renderers, settingsCodecs } = createPortalComponentRegistries();

const workspaces: PortalWorkspacesOptions = {
  componentRenderers: renderers,
  headerActions: <AddPanelButton />,
  settingsCodecs,
};

const renderItemChildren = (item: PortalNavItem) =>
  item.moduleId === TABLE_BROWSER_MODULE_ID ? (
    <PortalNavVuuServers basePath={item.href} />
  ) : null;

const Brand = <VuuLogo />;

export interface AppProps {
  DataSourceProvider?: ComponentType<{ children: ReactNode }>;
}

export const App = ({ DataSourceProvider }: AppProps) => {
  const { modules: remoteModules } = useModuleRegistry();

  return (
    <PortalShell
      contextPanel={{ placement: "inline" }}
      DataSourceProvider={DataSourceProvider}
      id="portal-demo"
      remoteModules={remoteModules}
      title="Portal Demo"
      workspaces={workspaces}
    >
      <PortalNav
        brand={Brand}
        remoteModules={remoteModules}
        renderItemChildren={renderItemChildren}
        sections="collapsible"
      />
      <PortalHeader />
    </PortalShell>
  );
};
