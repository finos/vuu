import { LeftNav, Shell } from "@finos/vuu-shell";
import {
  CSSProperties,
  ReactElement,
  useCallback,
  useMemo,
  useState,
} from "react";
import { AutoTableNext } from "../Table/TableNext.examples";
import { registerComponent } from "@finos/vuu-layout";
import { TableSettingsPanel } from "@finos/vuu-table-extras";
import {
  ContextMenuProvider,
  Dialog,
  MenuActionClosePopup,
} from "@finos/vuu-popups";
import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "packages/vuu-data-types";
import { SaveLayoutPanel } from "@finos/vuu-shell";

import "./NewTheme.examples.css";

registerComponent("AutoTableNext", AutoTableNext, "view");
registerComponent("TableSettings", TableSettingsPanel, "view");

const user = { username: "test-user", token: "test-token" };

let displaySequence = 1;

export const ShellWithNewTheme = () => {
  const [dialogContent, setDialogContent] = useState<ReactElement>();
  const [buildMenuOptions, handleMenuAction] = useMemo<
    [MenuBuilder, MenuActionHandler]
  >(() => {
    return [
      (location, options) => {
        console.log({ options });
        const locations = location.split(" ");
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
      (action: MenuActionClosePopup) => {
        console.log("menu action", {
          action,
        });
        if (action.menuId === "save-layout") {
          setDialogContent(<SaveLayoutPanel />);
          return true;
        }
        return false;
      },
    ];
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogContent(undefined);
  }, []);

  //TODO what the App actually receives is an array of layouts
  const layout = useMemo(() => {
    return {
      type: "Stack",
      props: {
        className: "vuuShell-mainTabs",
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
                  type: "AutoTableNext",
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
                  type: "AutoTableNext",
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
        leftSidePanel={<LeftNav style={{ width: 240 }} />}
        loginUrl={window.location.toString()}
        user={user}
        style={
          {
            "--vuuShell-height": "100vh",
            "--vuuShell-width": "100vw",
          } as CSSProperties
        }
      >
        <Dialog
          className="vuDialog"
          isOpen={dialogContent !== undefined}
          onClose={handleCloseDialog}
          style={{ maxHeight: 500 }}
          title={"Save Layout"}
        >
          {dialogContent}
        </Dialog>
      </Shell>
    </ContextMenuProvider>
  );
};

ShellWithNewTheme.displaySequence = displaySequence++;
