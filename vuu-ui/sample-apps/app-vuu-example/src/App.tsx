import {
  registerComponent,
  useLayoutContextMenuItems,
} from "@finos/vuu-layout";
import { ContextMenuProvider, useDialog } from "@finos/vuu-popups";
import {
  LeftNav,
  Shell,
  ShellContextProvider,
  ShellProps,
  VuuUser,
} from "@finos/vuu-shell";
import {
  ColumnSettingsPanel,
  TableSettingsPanel,
} from "@finos/vuu-table-extras";
import { getDefaultColumnConfig } from "./columnMetaData";
import { createPlaceholder } from "./createPlaceholder";
import { useFeatures } from "./useFeatures";

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
  const { buildMenuOptions, handleMenuAction } =
    useLayoutContextMenuItems(setDialogState);

  const dragSource = useMemo(
    () => ({
      "basket-instruments": { dropTargets: "basket-constituents" },
    }),
    []
  );

  // TODO get Context from Shell
  return (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildMenuOptions}
    >
      <DragDropProvider dragSources={dragSource}>
        <ShellContextProvider
          value={{ getDefaultColumnConfig, handleRpcResponse }}
        >
          <Shell
            LayoutProps={layoutProps}
            className="App"
            leftSidePanelLayout="full-height"
            leftSidePanel={
              <LeftNav
                features={features}
                tableFeatures={tableFeatures}
                style={{ width: 240 }}
              />
            }
            saveUrl="https://localhost:8443/api/vui"
            serverUrl={serverUrl}
            user={user}
          >
            {dialog}
          </Shell>
        </ShellContextProvider>
      </DragDropProvider>
    </ContextMenuProvider>
  );
};
