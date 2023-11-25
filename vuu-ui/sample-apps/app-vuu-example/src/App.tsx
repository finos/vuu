import { registerComponent } from "@finos/vuu-layout";
import { useDialog } from "@finos/vuu-popups";
import {
  LayoutManagementProvider,
  LeftNav,
  Shell,
  ShellContextProvider,
  ShellProps,
  SidePanelProps,
  VuuUser,
} from "@finos/vuu-shell";
import {
  ColumnSettingsPanel,
  TableSettingsPanel,
} from "@finos/vuu-table-extras";
import { getDefaultColumnConfig } from "./columnMetaData";
import { createPlaceholder } from "./createPlaceholder";
import { useFeatures } from "./useFeatures";
import { NotificationsProvider } from "@finos/vuu-popups";

import { DragDropProvider } from "@finos/vuu-ui-controls";
import "./App.css";
import { useRpcResponseHandler } from "./useRpcResponseHandler";
import { useMemo } from "react";

registerComponent("ColumnSettings", ColumnSettingsPanel, "view");
registerComponent("TableSettings", TableSettingsPanel, "view");

// createNewChild is used when we add a new Tab to Stack
const layoutProps: ShellProps["LayoutProps"] = {
  createNewChild: createPlaceholder,
  pathToDropTarget: "#main-tabs.ACTIVE_CHILD",
};

const defaultWebsocketUrl = `wss://${location.hostname}:8090/websocket`;
const {
  websocketUrl: serverUrl = defaultWebsocketUrl,
  features: configuredFeatures,
} =
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await vuuConfig;

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
