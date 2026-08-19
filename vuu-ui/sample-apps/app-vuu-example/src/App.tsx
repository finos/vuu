import { VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";
import { FlexboxLayout, StackLayout } from "@vuu-ui/vuu-layout";
import { useAuthenticatedUser, useLogout } from "@vuu-ui/core";
import {
  LocalPersistenceManager,
  PersistenceProvider,
  Shell,
  ShellContextProvider,
  type ShellLayoutProps,
} from "@vuu-ui/vuu-shell";
import { ColumnSettingsPanel } from "@vuu-ui/vuu-table-extras";
import { DragDropProvider } from "@vuu-ui/vuu-ui-controls";
import {
  assertComponentsRegistered,
  registerComponent,
} from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
import { getDefaultColumnConfig } from "./columnMetaData";
import { LegacyFeatureAndLayoutProvider } from "./legacy-feature-navigation/LegacyFeatureAndLayoutProvider";
import { LegacyLeftNav } from "./legacy-feature-navigation/LegacyLeftNav";
import type { DynamicFeatureDescriptor } from "./legacy-feature-navigation/types";
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
  websocketUrl: serverUrl = defaultWebsocketUrl(ssl),
  features,
} = (await vuuConfig) as {
  features: Record<string, DynamicFeatureDescriptor>;
  ssl: boolean;
  websocketUrl?: string;
};

const dynamicFeatures = Object.values(features);

export const App = () => {
  const user = useAuthenticatedUser();
  const logout = useLogout();
  const dragSource = useMemo(
    () => ({
      "basket-instruments": { dropTargets: "basket-constituents" },
    }),
    [],
  );

  const localPersistenceManager = useMemo(
    () => new LocalPersistenceManager(user.userName),
    [user.userName],
  );

  const ShellLayoutProps = useMemo<ShellLayoutProps>(
    () => ({
      SidePanelProps: {
        children: <LegacyLeftNav />,
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
            <LegacyFeatureAndLayoutProvider dynamicFeatures={dynamicFeatures}>
              <Shell
                shellLayoutProps={ShellLayoutProps}
                className="App"
                logout={logout}
                serverUrl={serverUrl}
              />
            </LegacyFeatureAndLayoutProvider>
          </VuuDataSourceProvider>
        </ShellContextProvider>
      </DragDropProvider>
    </PersistenceProvider>
  );
};
