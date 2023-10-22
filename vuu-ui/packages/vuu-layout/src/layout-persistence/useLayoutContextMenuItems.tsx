import {
  LayoutMetadata,
  SaveLayoutPanel,
  useLayoutManager,
} from "@finos/vuu-shell";
import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { ReactElement, useCallback, useMemo, useState } from "react";
import { MenuActionClosePopup } from "@finos/vuu-popups";

export const useLayoutContextMenuItems = () => {
  const [dialogContent, setDialogContent] = useState<ReactElement>();

  const { saveLayout } = useLayoutManager();

  const handleCloseDialog = useCallback(() => {
    setDialogContent(undefined);
  }, []);

  const handleSave = useCallback(
    (layoutMetadata: Omit<LayoutMetadata, "id">) => {
      saveLayout(layoutMetadata);
      setDialogContent(undefined);
    },
    [saveLayout]
  );

  const [buildMenuOptions, handleMenuAction] = useMemo<
    [MenuBuilder, MenuActionHandler]
  >(() => {
    return [
      (location, options) => {
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
              componentId={action.options.controlledComponentId}
            />
          );
          return true;
        }
        return false;
      },
    ];
  }, [handleCloseDialog, handleSave]);

  return {
    buildMenuOptions,
    dialogContent,
    handleCloseDialog,
    handleMenuAction,
  };
};
