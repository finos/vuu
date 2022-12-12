import { ToolkitProvider } from "@heswell/uitk-core";
import { RpcResponse, useViewserver, VuuTableSchemas } from "@vuu-ui/vuu-data";
import { Dialog, registerComponent } from "@vuu-ui/vuu-layout";
import {
  Feature,
  Shell,
  ShellContextProvider,
  VuuUser,
} from "@vuu-ui/vuu-shell";
import { ReactElement, useCallback, useRef, useState } from "react";
import { AppSidePanel } from "./app-sidepanel";
import { Stack } from "./AppStack";

import "./App.css";

const { websocketUrl: serverUrl, features } = await vuuConfig;

const filteredGridUrl = "./feature-filtered-grid/index.js";

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
  const [dialogContent, setDialogContent] = useState<ReactElement>();

  // Needed because of circular ref between useViewserver and handleRpcResponse
  const tablesRef = useRef<VuuTableSchemas>();

  const { tables } = useViewserver();

  tablesRef.current = tables;

  const handleRpcResponse = useCallback((response: RpcResponse) => {
    if (response?.action?.type === "OPEN_DIALOG_ACTION") {
      const { table } = response.action;
      if (tablesRef.current) {
        const { [table.table]: schema } = tablesRef.current;
        if (schema) {
          // If we already have this table open in this viewport, ignore
          setDialogContent(
            <Feature
              height={400}
              params={{ schema }}
              url={filteredGridUrl}
              width={700}
            />
          );
        }
      }
    } else {
      console.warn(`App, handleServiceRequest ${JSON.stringify(response)}`);
    }
  }, []);

  const handleClose = () => setDialogContent(undefined);

  // TODO get Context from Shell
  return (
    <ToolkitProvider applyClassesTo="scope" density="high" mode="light">
      <ShellContextProvider value={{ handleRpcResponse }}>
        <Shell
          defaultLayout={defaultLayout}
          leftSidePanel={<AppSidePanel features={features} tables={tables} />}
          serverUrl={serverUrl}
          user={user}
        >
          <Dialog
            className="vuDialog"
            isOpen={dialogContent !== undefined}
            onClose={handleClose}
            style={{ height: 500 }}
          >
            {dialogContent}
          </Dialog>
        </Shell>
      </ShellContextProvider>
    </ToolkitProvider>
  );
};
