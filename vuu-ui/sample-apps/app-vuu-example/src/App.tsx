import { StackLayout } from "@finos/vuu-layout";
import { NotificationsProvider, useDialog } from "@finos/vuu-popups";
import {
  LayoutManagementProvider,
  LeftNav,
  Shell,
  ShellContextProvider,
  ShellProps,
  SidePanelProps,
} from "@finos/vuu-shell";
import {
  ColumnSettingsPanel,
  TableSettingsPanel,
} from "@finos/vuu-table-extras";
import { DragDropProvider } from "@finos/vuu-ui-controls";
import type { VuuUser } from "@finos/vuu-utils";
import { assertComponentRegistered, registerComponent } from "@finos/vuu-utils";
import { useMemo } from "react";
import { getDefaultColumnConfig } from "./columnMetaData";
import { createPlaceholder } from "./createPlaceholder";
import { useFeatures } from "./useFeatures";
import { useRpcResponseHandler } from "./useRpcResponseHandler";

import "./App.css";

registerComponent("ColumnSettings", ColumnSettingsPanel, "view");
registerComponent("TableSettings", TableSettingsPanel, "view");

assertComponentRegistered("Stack", StackLayout);

// createNewChild is used when we add a new Tab to Stack
const layoutProps: ShellProps["LayoutProps"] = {
  createNewChild: createPlaceholder,
  pathToDropTarget: "#main-tabs.ACTIVE_CHILD",
};

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

  const { dialog, setDialogState } = useDialog();
  const { handleRpcResponse } = useRpcResponseHandler(setDialogState);

  const dragSource = useMemo(
    () => ({
      "basket-instruments": { dropTargets: "basket-constituents" },
    }),
    []
  );

  const leftSidePanelProps = useMemo<SidePanelProps>(
    () => ({
      children: <LeftNav features={features} tableFeatures={tableFeatures} />,
      sizeOpen: 240,
    }),
    [features, tableFeatures]
  );

  return (
    <NotificationsProvider>
      <LayoutManagementProvider>
        <DragDropProvider dragSources={dragSource}>
          <ShellContextProvider
            value={{ getDefaultColumnConfig, handleRpcResponse }}
          >
            <Shell
              LayoutProps={layoutProps}
              LeftSidePanelProps={leftSidePanelProps}
              className="App"
              leftSidePanelLayout="full-height"
              saveUrl="https://localhost:8443/api/vui"
              serverUrl={serverUrl}
              user={user}
            >
              {dialog}
            </Shell>
          </ShellContextProvider>
        </DragDropProvider>
      </LayoutManagementProvider>
    </NotificationsProvider>
  );
};
