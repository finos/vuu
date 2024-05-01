import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { useCallback, useMemo } from "react";
import { MenuActionClosePopup, SetDialog } from "@finos/vuu-popups";
import { useLayoutManager } from "./useLayoutManager";
import { LayoutMetadataDto } from "./layoutTypes";
import { SaveLayoutPanel } from "./SaveLayoutPanel";

export const useLayoutContextMenuItems = (setDialogState: SetDialog) => {
  const { saveLayout } = useLayoutManager();

  const handleCloseDialog = useCallback(() => {
    setDialogState(undefined);
  }, [setDialogState]);

  const handleSave = useCallback(
    (layoutMetadata: LayoutMetadataDto) => {
      saveLayout(layoutMetadata);
      setDialogState(undefined);
    },
    [saveLayout, setDialogState]
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
          setDialogState({
            content: (
              <SaveLayoutPanel
                onCancel={handleCloseDialog}
                onSave={handleSave}
                componentId={action.options?.controlledComponentId}
                defaultTitle={
                  action.options?.controlledComponentTitle as string
                }
              />
            ),
            title: "Save Layout",
            hideCloseButton: true,
          });
          return true;
        }
        return false;
      },
    ];
  }, [handleCloseDialog, handleSave, setDialogState]);

  return {
    buildMenuOptions,
    handleMenuAction,
  };
};
