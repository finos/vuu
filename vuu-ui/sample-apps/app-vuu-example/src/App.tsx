import { MenuRpcResponse, useVuuTables } from "@finos/vuu-data";
import { registerComponent } from "@finos/vuu-layout";
import { Dialog } from "@finos/vuu-popups";
import {
  Feature,
  Shell,
  ShellContextProvider,
  VuuUser,
} from "@finos/vuu-shell";
import { ReactElement, useCallback, useRef, useState } from "react";
import { AppSidePanel } from "./app-sidepanel";
import { Stack } from "./AppStack";
import { getDefaultColumnConfig } from "./columnMetaData";
import { SessionEditingForm } from "@finos/vuu-shell";
import { getFormConfig } from "./session-editing";

import "./App.css";
// Because we do not render the AppSidePanel directly, the css will not be included in bundle.
import "./app-sidepanel/AppSidePanel.css";

const defaultWebsocketUrl = `wss://${location.hostname}:8090/websocket`;
const { websocketUrl: serverUrl = defaultWebsocketUrl, features } =
  await vuuConfig;

//TODO how do we separate this from the feature
const vuuBlotterUrl = "./feature-vuu-blotter/index.js";
// const vuuBlotterUrl = "./feature-vuu-table/index.js";

registerComponent("Stack", Stack, "container");

const defaultLayout = {
  type: "Stack",
  props: {
    style: {
      width: "100%",
      height: "100%",
    },
    showTabs: true,
    enableAddTab: true,
    enableRemoveTab: true,
    preserve: true,
    active: 0,
  },
  children: [
    {
      type: "Placeholder",
      title: "Page 1",
    },
  ],
};

export const App = ({ user }: { user: VuuUser }) => {
  const dialogTitleRef = useRef("");
  const [dialogContent, setDialogContent] = useState<ReactElement>();
  const handleClose = () => {
    setDialogContent(undefined);
  };

  const tables = useVuuTables();

  const handleRpcResponse = useCallback(
    (response?: MenuRpcResponse) => {
      if (response?.action?.type === "OPEN_DIALOG_ACTION") {
        const { columns, dataTypes, table } = response.action;
        if (columns && dataTypes && table) {
          const formConfig = getFormConfig(response);
          dialogTitleRef.current = formConfig.config.title;
          setDialogContent(
            <SessionEditingForm {...formConfig} onClose={handleClose} />
          );
        } else if (tables && table) {
          const schema = tables.get(table.table);
          if (schema) {
            // If we already have this table open in this viewport, ignore
            setDialogContent(
              <Feature
                height={400}
                params={{ schema }}
                url={vuuBlotterUrl}
                width={700}
              />
            );
          }
        }
      } else {
        console.warn(`App, handleServiceRequest ${JSON.stringify(response)}`);
      }
    },
    [tables]
  );

  // TODO get Context from Shell
  return (
    <ShellContextProvider value={{ getDefaultColumnConfig, handleRpcResponse }}>
      <Shell
        className="App"
        defaultLayout={defaultLayout}
        leftSidePanel={<AppSidePanel features={features} tables={tables} />}
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
