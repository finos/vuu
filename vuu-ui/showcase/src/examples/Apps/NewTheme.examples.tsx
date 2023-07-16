import { Shell } from "@finos/vuu-shell";
import { AppSidePanel } from "app-vuu-example/src/app-sidepanel";
import { CSSProperties, useMemo } from "react";
import { useMockFeatureData } from "../utils/mock-data";

import { AutoVuuTable } from "../html/HtmlTable.examples";
import { registerComponent } from "@finos/vuu-layout";

import "./NewTheme.examples.css";

registerComponent("AutoVuuTable", AutoVuuTable, "view");

const user = { username: "test-user", token: "test-token" };

let displaySequence = 1;

export const ShellWithNewTheme = () => {
  const { features, schemas } = useMockFeatureData();

  //TODO what the App actually receives is an array of layouts
  const layout = useMemo(() => {
    return {
      type: "Stack",
      props: {
        className: "vuuShell-mainTabs",
        style: {
          border: "solid 1px #D6D7DA",
          borderRadius: 6,
          padding: "36px 8px 8px 8px",
          width: "100%",
          height: "100%",
        },
        TabstripProps: {
          showActivationIndicator: false,
        },
        showTabs: true,
        enableAddTab: true,
        preserve: true,
        active: 0,
      },
      children: [
        {
          type: "Stack",
          props: {
            active: 0,
            showTabs: true,
            title: "My Instruments",
          },
          children: [
            {
              type: "View",
              props: {
                title: "European Stock",
              },
              style: { height: "calc(100% - 6px)" },
              children: [
                {
                  type: "AutoVuuTable",
                },
              ],
            },
            {
              type: "View",
              props: {
                title: "Other Stock",
              },
              style: { height: "calc(100% - 6px)" },
              children: [
                {
                  type: "AutoVuuTable",
                },
              ],
            },
          ],
        },
      ],
    };
  }, []);

  return (
    <Shell
      defaultLayout={layout}
      leftSidePanelLayout="full-height"
      leftSidePanel={<AppSidePanel features={features} tables={schemas} />}
      loginUrl={window.location.toString()}
      user={user}
      style={
        {
          "--vuuShell-height": "100vh",
          "--vuuShell-width": "100vw",
        } as CSSProperties
      }
    />
  );
};

ShellWithNewTheme.displaySequence = displaySequence++;
