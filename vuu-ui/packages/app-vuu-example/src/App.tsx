import { TableSchema, useViewserver } from "@vuu-ui/data-remote";
import { Dialog } from "@vuu-ui/layout";
import { Feature, Shell } from "@vuu-ui/shell";
import { useCallback, useMemo, useRef, useState } from "react";
import AppContext, { RpcResponse } from "./app-context";
import { ToolkitProvider } from "@heswell/uitk-core";
import { Stack } from "./AppStack";
import { registerComponent } from "@vuu-ui/layout";

import "./App.css";

export const serverUrl = "127.0.0.1:8090/websocket";
const filteredGridUrl = "./features/filtered-grid/index.js";
const filteredGridCss = "./features/filtered-grid/index.css";
const simpleComponentUrl = "./features/simple-component/index.js";

const metricsUrl = "./features/metrics.js";
const metricsCss = "./features/metrics.css";

registerComponent("Stack", Stack, "container");

const byModule = (schema1: TableSchema, schema2: TableSchema) => {
  const m1 = schema1.table.module.toLowerCase();
  const m2 = schema2.table.module.toLowerCase();

  if (m1 < m2) {
    return -1;
  } else if (m1 > m2) {
    return 1;
  } else if (schema1.table.table < schema2.table.table) {
    return -1;
  } else if (schema1.table.table > schema2.table.table) {
    return 1;
  } else {
    return 0;
  }
};

const capitalize = (text: string) =>
  text.length === 0 ? "" : text[0].toUpperCase() + text.slice(1);

const regexp_worfify = /(?<!(^|[A-Z]))(?=[A-Z])|(?<!^)(?=[A-Z][a-z])/;
const wordify = (text: string) => {
  const [firstWord, ...rest] = text.split(regexp_worfify);
  return `${capitalize(firstWord)} ${rest.join(" ")}`;
};

const getTables = (tables) => {
  const tableList = Object.values(tables);
  return tableList.sort(byModule).map((schema) => ({
    className: "vuFilteredGrid",
    closeable: true,
    header: true,
    label: `${schema.table.module} ${wordify(schema.table.table)}`,
    resizeable: true,
    resize: "defer",
    type: "Feature",
    props: {
      schema,
      css: filteredGridCss,
      url: filteredGridUrl,
    },
  }));
};

const getPaletteConfig = (tables) => [
  {
    label: "Features",
    items: [
      {
        header: true,
        label: "Simple Component",
        type: "Feature",
        props: {
          url: simpleComponentUrl,
        },
      },
      {
        header: true,
        label: "Metrics",
        type: "Feature",
        props: {
          css: metricsCss,
          url: metricsUrl,
        },
      },
    ],
  },
  {
    label: "Tables",
    items: getTables(tables),
  },
];

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

export const App = ({ user }) => {
  const [dialogContent, setDialogContent] = useState(null);

  // Needed because of circular ref between useViewserver and handleRpcResponse
  const tablesRef = useRef();

  const { tables } = useViewserver({ label: "App" });

  const paletteConfig = useMemo(() => {
    return getPaletteConfig(tables);
  }, [tables]);

  tablesRef.current = tables;

  const handleRpcResponse = useCallback((response: RpcResponse) => {
    if (response?.action?.type === "OPEN_DIALOG_ACTION") {
      const { table } = response.action;
      const { [table.table]: schema } = tablesRef.current;
      if (schema) {
        // If we already have this table open in this viewport, ignore
        setDialogContent(
          <Feature
            height={400}
            schema={schema}
            url={filteredGridUrl}
            width={700}
          />
        );
      }
    } else {
      console.warn(`App, handleServiceRequest ${JSON.stringify(response)}`);
    }
  }, []);

  const handleClose = () => setDialogContent(null);

  // TODO get Context from Shell
  return (
    <ToolkitProvider density="high">
      <AppContext.Provider value={{ handleRpcResponse }}>
        <Shell
          defaultLayout={defaultLayout}
          paletteConfig={paletteConfig}
          serverUrl={serverUrl}
          user={user}
        >
          <Dialog
            className="vuDialog"
            isOpen={dialogContent !== null}
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
