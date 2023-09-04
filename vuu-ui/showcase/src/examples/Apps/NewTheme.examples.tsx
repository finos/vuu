import {
  CSSProperties,
  ReactElement,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  LayoutMetadata,
  LeftNav,
  SaveLayoutPanel,
  Shell,
  LayoutManagementProvider,
  useLayoutManager
} from "@finos/vuu-shell";
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
} from "@finos/vuu-data-types";
import { AutoTableNext } from "../Table/TableNext.examples";

import "./NewTheme.examples.css";
registerComponent("AutoTableNext", AutoTableNext, "view");
registerComponent("TableSettings", TableSettingsPanel, "view");

const user = { username: "test-user", token: "test-token" };

let displaySequence = 1;

const ShellWithNewTheme = () => {
  const [dialogContent, setDialogContent] = useState<ReactElement>();

  const handleCloseDialog = useCallback(() => {
    setDialogContent(undefined);
  }, []);

  const { saveLayout } = useLayoutManager();

  const handleSave = useCallback((layoutMetadata: Omit<LayoutMetadata, "id">) => {
    console.log(`Save layout as ${layoutMetadata.name} to group ${layoutMetadata.group}`);
    saveLayout(layoutMetadata)
    setDialogContent(undefined)
  }, []);

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
          setDialogContent(
            <SaveLayoutPanel
              onCancel={handleCloseDialog}
              onSave={handleSave}
            />
          );
          return true;
        }
        return false;
      },
    ];
  }, [handleCloseDialog, handleSave]);

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
        saveLocation="local"
        style={
          {
            "--vuuShell-height": "100vh",
            "--vuuShell-width": "100vw",
          } as CSSProperties
        }
      >
        <Dialog
          isOpen={dialogContent !== undefined}
          onClose={handleCloseDialog}
          style={{ maxHeight: 500, borderColor: "#6d188b" }}
          title={"Save Layout"}
          hideCloseButton
          headerProps={{ className: "dialogHeader" }}
        >
          {dialogContent}
        </Dialog>
      </Shell>
    </ContextMenuProvider>
  );
};

export const ShellWithNewThemeAndLayoutManagement = () => {
  return (
    <LayoutManagementProvider>
      <ShellWithNewTheme />
    </LayoutManagementProvider>
  )
}

ShellWithNewThemeAndLayoutManagement.displaySequence = displaySequence++;
