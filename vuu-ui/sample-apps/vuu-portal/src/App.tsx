import { useIdentityToken } from "@vuu-ui/core";
import { ColumnSettingsPanel } from "@vuu-ui/vuu-table-extras";
import { registerComponent } from "@vuu-ui/vuu-utils";
import { useEffect, useState } from "react";
import { ConfirmSelectionPanel } from "./order-management/cancel-confirm-prompt/ConfirmSelectionPanel";
import { BrowserRouter } from "react-router-dom";
import { PortalShell, type RemoteModuleDescriptor } from "@vuu-ui/core";
import { getRegisteredModules } from "@vuu-ui/vuu-shell";

import "./App.css";

registerComponent("cancel-confirm", ConfirmSelectionPanel, "view");
registerComponent("ColumnSettings", ColumnSettingsPanel, "view");

const { moduleRegistryUrl } = await vuuConfig;

export const App = () => {
  const getIdentityToken = useIdentityToken();

  const [remoteModules, setRemoteModules] = useState<RemoteModuleDescriptor[]>(
    [],
  );

  useEffect(() => {
    const loadFeatures = async () => {
      const identityToken = await getIdentityToken();
      const { modules: features } = await getRegisteredModules(
        moduleRegistryUrl,
        identityToken,
      );
      setRemoteModules(features);
    };

    loadFeatures();
  }, [getIdentityToken]);

  return (
    <BrowserRouter>
      <PortalShell
        id="portal-demo"
        title="Portal Demo"
        remoteModules={remoteModules}
      />
    </BrowserRouter>
  );
};
