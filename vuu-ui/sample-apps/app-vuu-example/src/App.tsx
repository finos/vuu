import { VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";
import { FlexboxLayout, StackLayout } from "@vuu-ui/vuu-layout";
import {
  FeatureAndLayoutProvider,
  getRegisteredModules,
  LeftNav,
  LocalPersistenceManager,
  PersistenceProvider,
  Shell,
  ShellContextProvider,
  type ShellLayoutProps,
} from "@vuu-ui/vuu-shell";
import { useIdentityToken } from "@vuu-ui/vuu-auth";
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
  const getIdentityToken = useIdentityToken();

  const [dynamicFeatures, setDynamicFeatures] = useState<
    DynamicFeatureDescriptor[]
  >([]);
  useEffect(() => {
    const loadFeatures = async () => {
      const identityToken = await getIdentityToken();
      const { modules: features } = await getRegisteredModules(
        moduleRegistryUrl,
        identityToken,
      );
      setDynamicFeatures(
        features.map((feature) => ({
          ...feature,
          vuu: {
            connectionId: feature.vuu?.connectionId ?? "portal",
            restUrl: feature.vuu?.restUrl,
            websocketUrl: feature.vuu?.websocketUrl,
          },
        })),
      );
    };

    loadFeatures();
  }, [getIdentityToken]);

  const dragSource = useMemo(
    () => ({
      "basket-instruments": { dropTargets: "basket-constituents" },
    }),
    [],
  );

  const localPersistenceManager = useMemo(
    () => new LocalPersistenceManager("steve"),
    [],
  );

  const ShellLayoutProps = useMemo<ShellLayoutProps>(
    () => ({
      SidePanelProps: {
        children: <LeftNav />,
        sizeOpen: 240,
      },
      layoutTemplateId: "full-height",
    }),
    [],
  );

  return (
    <PersistenceProvider persistenceManager={localPersistenceManager}>
      <DragDropProvider dragSources={dragSource}>
        <ShellContextProvider value={{ getDefaultColumnConfig }}>
          <VuuDataSourceProvider>
            <FeatureAndLayoutProvider dynamicFeatures={dynamicFeatures}>
              <Shell
                shellLayoutProps={ShellLayoutProps}
                className="App"
                serverUrl={websocketUrl}
              />
            </FeatureAndLayoutProvider>
          </VuuDataSourceProvider>
        </ShellContextProvider>
      </DragDropProvider>
    </PersistenceProvider>
  );
};
