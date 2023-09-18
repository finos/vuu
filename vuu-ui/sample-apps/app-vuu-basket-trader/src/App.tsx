import { Dialog } from "@finos/vuu-popups";
import {
  LeftNav,
  Shell,
  ShellContextProvider,
  ShellProps,
  VuuUser,
} from "@finos/vuu-shell";
import { ReactElement, useRef, useState } from "react";
import { getDefaultColumnConfig } from "./columnMetaData";
import { createPlaceholder } from "./createPlaceholder";
import { defaultLayout } from "./defaultLayout";
import { useFeatures } from "./useFeatures";
import {
  ColumnSettingsPanel,
  TableSettingsPanel,
} from "@finos/vuu-table-extras";
import { registerComponent } from "@finos/vuu-layout";

import "./App.css";

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
  const dialogTitleRef = useRef("");
  const [dialogContent, setDialogContent] = useState<ReactElement>();
  const handleClose = () => {
    setDialogContent(undefined);
  };

  const [features, tableFeatures] = useFeatures({
    features: configuredFeatures,
  });

  console.log({ features, tableFeatures });

  // TODO get Context from Shell
  return (
    <ShellContextProvider value={{ getDefaultColumnConfig }}>
      <Shell
        LayoutProps={layoutProps}
        className="App"
        defaultLayout={defaultLayout}
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
        <Dialog
          className="vuDialog"
          isOpen={dialogContent !== undefined}
          onClose={handleClose}
          style={{ maxHeight: 500 }}
          title={dialogTitleRef.current}
        >
          {dialogContent}
        </Dialog>
      </Shell>
    </ShellContextProvider>
  );
};
