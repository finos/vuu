import { VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";
import { FlexboxLayout, StackLayout } from "@vuu-ui/vuu-layout";
import {
  FeatureAndLayoutProvider,
  getRegisteredModules,
  LeftNav,
  LocalPersistenceManager,
  PersistenceProvider,
  type SettingsSchema,
  Shell,
  ShellContextProvider,
  type ShellLayoutProps,
} from "@vuu-ui/vuu-shell";
import { useBearerToken } from "@vuu-ui/vuu-auth";
import { ColumnSettingsPanel } from "@vuu-ui/vuu-table-extras";
import { DragDropProvider } from "@vuu-ui/vuu-ui-controls";
import {
  assertComponentsRegistered,
  type DynamicFeatureDescriptor,
  registerComponent,
} from "@vuu-ui/vuu-utils";
import { useEffect, useMemo, useState } from "react";
import { getDefaultColumnConfig } from "./columnMetaData";
import { ConfirmSelectionPanel } from "./order-management/cancel-confirm-prompt/ConfirmSelectionPanel";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PortalShell } from "./components/portal-shell/PortalShell";
import { RemoteModuleDescriptor } from "./module-federation/mf-utils";

import "./App.css";

registerComponent("cancel-confirm", ConfirmSelectionPanel, "view");
registerComponent("ColumnSettings", ColumnSettingsPanel, "view");

assertComponentsRegistered([
  { componentName: "Flexbox", component: FlexboxLayout },
  { componentName: "Stack", component: StackLayout },
]);


const defaultWebsocketUrl = (ssl: boolean) =>
  `${ssl ? "wss" : "ws"}://${location.hostname}:8090/websocket`;

const {
  ssl,
  moduleRegistryUrl,
  websocketUrl = defaultWebsocketUrl(ssl),
} = await vuuConfig;

export const App = () => {
  const getBearerToken = useBearerToken();

  const [remoteModules, setRemoteModules] = useState<
    RemoteModuleDescriptor[]
  >([]);

  useEffect(() => {
    const loadFeatures = async () => {
      const bearerToken = await getBearerToken();
      const { modules: features } = await getRegisteredModules(
        moduleRegistryUrl,
        bearerToken,
      );
      setRemoteModules(
        features.map((feature) => ({
          ...feature,
          vuu: {
            connectionId: feature.vuu?.connectionId ?? feature.mfScope,
            websocketUrl: feature.vuu?.websocketUrl ?? websocketUrl,
          },
        })),
      );
    };

    loadFeatures();
  }, [getBearerToken]);


  return (
    <BrowserRouter>
      <VuuDataSourceProvider>
        <PortalShell remoteModules={remoteModules} />
      </VuuDataSourceProvider>
    </BrowserRouter>
    // <PersistenceProvider persistenceManager={localPersistenceManager}>
    //   <DragDropProvider dragSources={dragSource}>
    //     <ShellContextProvider value={{ getDefaultColumnConfig }}>
    //       <VuuDataSourceProvider>
    //         <FeatureAndLayoutProvider dynamicFeatures={dynamicFeatures}>
    //           <Shell
    //             shellLayoutProps={ShellLayoutProps}
    //             className="App"
    //             serverUrl={websocketUrl}
    //             userSettingsSchema={userSettingsSchema}
    //           />
    //         </FeatureAndLayoutProvider>
    //       </VuuDataSourceProvider>
    //     </ShellContextProvider>
    //   </DragDropProvider>
    // </PersistenceProvider>
  );
};
