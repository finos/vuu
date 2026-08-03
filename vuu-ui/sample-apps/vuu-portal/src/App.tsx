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
import { useBearerToken } from "@vuu-ui/vuu-shell/src/authentication-provider/AuthenticationProvider";
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

const userSettingsSchema: SettingsSchema = {
  properties: [
    {
      name: "themeMode",
      label: "Mode",
      values: ["light", "dark"],
      defaultValue: "light",
      type: "string",
    },
    {
      name: "showAppStatusBar",
      label: "Show Application Status Bar",
      defaultValue: false,
      type: "boolean",
    },
  ],
};

const defaultWebsocketUrl = (ssl: boolean) =>
  `${ssl ? "wss" : "ws"}://${location.hostname}:8090/websocket`;

const {
  ssl,
  moduleRegistryUrl,
  websocketUrl = defaultWebsocketUrl(ssl),
} = await vuuConfig;

export const App = () => {
  const getBearerToken = useBearerToken();

  const [dynamicFeatures, setDynamicFeatures] = useState<
    DynamicFeatureDescriptor[]
  >([]);
  useEffect(() => {
    const loadFeatures = async () => {
      const bearerToken = await getBearerToken();
      const { modules: features } = await getRegisteredModules(
        moduleRegistryUrl,
        bearerToken,
      );
      setDynamicFeatures(
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
                userSettingsSchema={userSettingsSchema}
              />
            </FeatureAndLayoutProvider>
          </VuuDataSourceProvider>
        </ShellContextProvider>
      </DragDropProvider>
    </PersistenceProvider>
  );
};
