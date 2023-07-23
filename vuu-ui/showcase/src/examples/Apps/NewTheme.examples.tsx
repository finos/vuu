import { Shell } from "@finos/vuu-shell";
import { AppSidePanel } from "app-vuu-example/src/app-sidepanel";
import { CSSProperties, useMemo } from "react";
import { useMockFeatureData } from "../utils/mock-data";
import { AutoVuuTable } from "../html/HtmlTable.examples";
import { registerComponent } from "@finos/vuu-layout";
import { ContextMenuProvider } from "@finos/vuu-popups";
import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "packages/vuu-data-types";

import "./NewTheme.examples.css";

registerComponent("AutoVuuTable", AutoVuuTable, "view");

const user = { username: "test-user", token: "test-token" };

let displaySequence = 1;

export const ShellWithNewTheme = () => {
  const { features, schemas } = useMockFeatureData();

  const [buildMenuOptions, handleMenuAction] = useMemo<
    [MenuBuilder, MenuActionHandler]
  >(() => {
    return [
      (location, options) => {
        const locations = location.split(" ");
        console.log(`BuildMenu at ${location}`);
        const menuDescriptors: ContextMenuItemDescriptor[] = [];
        if (locations.includes("main-tab")) {
          menuDescriptors.push(
            {
              label: "Save Layout",
              action: "save-layout",
              options,
            },
            {
              label: "Layout Settings",
              action: "layout-settings",
              options,
            }
          );
        }
        return menuDescriptors;
      },
      (action: unknown) => {
        console.log("menu action", {
          action,
        });
        return false;
      },
    ];
  }, []);

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
          allowAddTab: true,
          allowRenameTab: true,
          animateSelectionThumb: false,
          location: "main-tab",
        },
        preserve: true,
        active: 0,
      },
      children: [
        {
          type: "Stack",
          props: {
            active: 0,
            title: "My Instruments",
            TabstripProps: {
              allowRenameTab: true,
              allowCloseTab: true,
            },
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
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildMenuOptions}
    >
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
    </ContextMenuProvider>
  );
};

ShellWithNewTheme.displaySequence = displaySequence++;
