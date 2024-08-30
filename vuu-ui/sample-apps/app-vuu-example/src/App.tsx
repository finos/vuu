import { VuuDataSourceProvider } from "@finos/vuu-data-react/src/datasource-provider/VuuDataSourceProvider";
import { FlexboxLayout, StackLayout } from "@finos/vuu-layout";
import {
  FeatureAndLayoutProvider,
  LeftNav,
  LocalPersistenceManager,
  PersistenceProvider,
  Shell,
  ShellContextProvider,
  ShellLayoutProps,
} from "@finos/vuu-shell";
import {
  ColumnSettingsPanel,
  TableSettingsPanel,
} from "@finos/vuu-table-extras";
import { DragDropProvider } from "@finos/vuu-ui-controls";
import type { VuuUser } from "@finos/vuu-utils";
import {
  assertComponentsRegistered,
  registerComponent,
} from "@finos/vuu-utils";
import { useMemo } from "react";
import { getDefaultColumnConfig } from "./columnMetaData";
import { useRpcResponseHandler } from "./useRpcResponseHandler";

import "./App.css";

registerComponent("ColumnSettings", ColumnSettingsPanel, "view");
registerComponent("TableSettings", TableSettingsPanel, "view");

assertComponentsRegistered([
  { componentName: "Flexbox", component: FlexboxLayout },
  { componentName: "Stack", component: StackLayout },
]);

const localPersistenceManager = new LocalPersistenceManager();

const defaultWebsocketUrl = (ssl: boolean) =>
  `${ssl ? "wss" : "ws"}://${location.hostname}:8090/websocket`;

const {
  ssl,
  websocketUrl: serverUrl = defaultWebsocketUrl(ssl),
  features,
} = await vuuConfig;

const dynamicFeatures = Object.values(features);

export const App = ({ user }: { user: VuuUser }) => {
  // this is causing full app re-render when tables are loaded
  const { handleRpcResponse } = useRpcResponseHandler();

  const dragSource = useMemo(
    () => ({
      "basket-instruments": { dropTargets: "basket-constituents" },
    }),
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
        <ShellContextProvider
          value={{ getDefaultColumnConfig, handleRpcResponse }}
        >
          <VuuDataSourceProvider>
            <FeatureAndLayoutProvider dynamicFeatures={dynamicFeatures}>
              <Shell
                shellLayoutProps={ShellLayoutProps}
                className="App"
                serverUrl={serverUrl}
                user={user}
              />
            </FeatureAndLayoutProvider>
          </VuuDataSourceProvider>
        </ShellContextProvider>
      </DragDropProvider>
    </PersistenceProvider>
  );
};
