import { ContextMenuProvider, Dialog } from "@finos/vuu-popups";
import {
  LeftNav,
  Shell,
  ShellContextProvider,
  ShellProps,
  VuuUser,
} from "@finos/vuu-shell";
import { ReactElement, useCallback, useRef, useState } from "react";
import { getDefaultColumnConfig } from "./columnMetaData";
import { createPlaceholder } from "./createPlaceholder";
import { useFeatures } from "./useFeatures";
import {
  ColumnSettingsPanel,
  TableSettingsPanel,
} from "@finos/vuu-table-extras";
import {
  registerComponent,
  useLayoutContextMenuItems,
} from "@finos/vuu-layout";

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

  const [features, tableFeatures] = useFeatures({
    features: configuredFeatures,
  });

  console.log({ features, tableFeatures });

  const {
    buildMenuOptions,
    dialogContent: saveLayoutDialog,
    handleCloseDialog,
    handleMenuAction,
  } = useLayoutContextMenuItems();

  const handleClose = useCallback(() => {
    setDialogContent(undefined);
    handleCloseDialog?.();
  }, [handleCloseDialog]);

  // TODO get Context from Shell
  return (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildMenuOptions}
    >
      <ShellContextProvider value={{ getDefaultColumnConfig }}>
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
          <Dialog
            className="vuDialog"
            isOpen={
              dialogContent !== undefined || saveLayoutDialog !== undefined
            }
            onClose={handleClose}
            style={{ maxHeight: 500 }}
            title={dialogTitleRef.current}
          >
            {dialogContent ?? saveLayoutDialog}
          </Dialog>
        </Shell>
      </ShellContextProvider>
    </ContextMenuProvider>
  );
};
