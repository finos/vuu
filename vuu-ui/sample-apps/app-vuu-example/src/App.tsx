import { FlexboxLayout, StackLayout } from "@finos/vuu-layout";
import {
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
import { useFeatures } from "./useFeatures";
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
  features: configuredFeatures,
} = await vuuConfig;

export const App = ({ user }: { user: VuuUser }) => {
  const [features, tableFeatures] = useFeatures({
    features: configuredFeatures,
  });

  const { handleRpcResponse } = useRpcResponseHandler();

  const dragSource = useMemo(
    () => ({
      "basket-instruments": { dropTargets: "basket-constituents" },
    }),
    []
  );

  const ShellLayoutProps = useMemo<ShellLayoutProps>(
    () => ({
      LeftSidePanelProps: {
        children: <LeftNav features={features} tableFeatures={tableFeatures} />,
        sizeOpen: 240,
      },
      layoutTemplateId: "full-height",
    }),
    [features, tableFeatures]
  );

  return (
    <PersistenceProvider persistenceManager={localPersistenceManager}>
      <DragDropProvider dragSources={dragSource}>
        <ShellContextProvider
          value={{ getDefaultColumnConfig, handleRpcResponse }}
        >
          <Shell
            ShellLayoutProps={ShellLayoutProps}
            className="App"
            serverUrl={serverUrl}
            user={user}
          />
        </ShellContextProvider>
      </DragDropProvider>
    </PersistenceProvider>
  );
};
