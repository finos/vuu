import { VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";
import {
  useAuthenticatedUser,
  useIdentityToken,
  useLogout,
} from "@vuu-ui/core";
import {
  FeatureAndLayoutProvider,
  PersistenceProvider,
  Shell,
  ShellContextProvider,
} from "@vuu-ui/vuu-shell";
import { ColumnSettingsPanel } from "@vuu-ui/vuu-table-extras";
import { DragDropProvider } from "@vuu-ui/vuu-ui-controls";
import {
  registerComponent,
  type DynamicFeatureDescriptor,
} from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
import {
  createWorkspacePersistenceService,
  defaultWorkspacePersistence,
  type AppConfig,
} from "./app-config";
import { getDefaultColumnConfig } from "./columnMetaData";
import { ConfirmSelectionPanel } from "./order-management/cancel-confirm-prompt/ConfirmSelectionPanel";
import { sampleWorkspaceRegistries } from "./sample-workspace";

import "./App.css";

registerComponent("cancel-confirm", ConfirmSelectionPanel, "view");
registerComponent("ColumnSettings", ColumnSettingsPanel, "view");

const defaultWebsocketUrl = (ssl: boolean) =>
  `${ssl ? "wss" : "ws"}://${location.hostname}:8090/websocket`;

const {
  ssl,
  websocketUrl: serverUrl = defaultWebsocketUrl(ssl),
  features = {},
  workspacePersistence = defaultWorkspacePersistence,
} = (await vuuConfig) as AppConfig;

const dynamicFeatures: DynamicFeatureDescriptor[] = Object.entries(
  features,
).map(([id, feature]) => ({
  ...feature,
  description: feature.description ?? feature.title,
  id: feature.id ?? id,
  leftNavLocation:
    feature.leftNavLocation ??
    (feature.featureProps?.vuuTables ? "vuu-tables" : "vuu-features"),
  location: feature.location ?? "vuu-features",
  mfComponent: feature.mfComponent ?? "default",
  mfScope: feature.mfScope ?? feature.name,
  mfUrl: feature.mfUrl ?? feature.url ?? "",
  path: feature.path ?? id,
  version: feature.version ?? 1,
}));

export const App = () => {
  const user = useAuthenticatedUser();
  const getIdentityToken = useIdentityToken();
  const logout = useLogout();
  const dragSource = useMemo(
    () => ({
      "basket-instruments": { dropTargets: "basket-constituents" },
    }),
    [],
  );

  const workspacePersistenceService = useMemo(
    () =>
      createWorkspacePersistenceService(workspacePersistence, user.userName, {
        getIdentityToken,
      }),
    [getIdentityToken, user.userName],
  );

  return (
    <PersistenceProvider
      workspacePersistenceService={workspacePersistenceService}
    >
      <DragDropProvider dragSources={dragSource}>
        <ShellContextProvider value={{ getDefaultColumnConfig }}>
          <VuuDataSourceProvider>
            <FeatureAndLayoutProvider dynamicFeatures={dynamicFeatures}>
              <Shell
                className="App"
                leftNavWidth={240}
                logout={logout}
                serverUrl={serverUrl}
                workspaceProps={{
                  componentRenderers: sampleWorkspaceRegistries.renderers,
                  settingsCodecs: sampleWorkspaceRegistries.settingsCodecs,
                }}
              />
            </FeatureAndLayoutProvider>
          </VuuDataSourceProvider>
        </ShellContextProvider>
      </DragDropProvider>
    </PersistenceProvider>
  );
};
