import { ToolkitProvider } from "@heswell/uitk-core";
import { useViewserver, VuuTableSchemas } from "@vuu-ui/data-remote";
import { Dialog, registerComponent } from "@vuu-ui/layout";
import { Feature, Shell, VuuUser } from "@vuu-ui/shell";
import { ReactElement, useCallback, useMemo, useRef, useState } from "react";
import AppContext, { RpcResponse } from "./app-context";
import { AppSidePanel } from "./app-sidepanel";
import { Stack } from "./AppStack";

import "./App.css";

export const serverUrl = "127.0.0.1:8090/websocket";
const filteredGridUrl = "./features/filtered-grid/index.js";
const filteredGridCss = "./features/filtered-grid/index.css";
const simpleComponentUrl = "./features/simple-component/index.js";

const metricsUrl = "./features/metrics.js";
const metricsCss = "./features/metrics.css";

registerComponent("Stack", Stack, "container");

// const getPaletteConfig = (tables: VuuTableSchemas) => [
//   {
//     label: "Features",
//     items: [
//       {
//         header: true,
//         label: "Simple Component",
//         type: "Feature",
//         props: {
//           url: simpleComponentUrl,
//         },
//       },
//       {
//         header: true,
//         label: "Metrics",
//         type: "Feature",
//         props: {
//           css: metricsCss,
//           url: metricsUrl,
//         },
//       },
//     ],
//   },
//   {
//     label: "Tables",
//     items: getTables(tables),
//   },
// ];

const defaultLayout = {
  type: "Stack",
  props: {
    style: {
      width: "100%",
      height: "100%",
    },
    showTabs: true,
    enableAddTab: true,
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
    <ToolkitProvider density="high">
      <AppContext.Provider value={{ handleRpcResponse }}>
        <Shell
          defaultLayout={defaultLayout}
          leftSidePanel={<AppSidePanel tables={tables} />}
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
      </AppContext.Provider>
    </ToolkitProvider>
  );
};
