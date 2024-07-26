import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { useCallback, useMemo } from "react";
import { MenuActionClosePopup, useDialogContext } from "@finos/vuu-popups";
import { useLayoutManager } from "./LayoutManagementProvider";
import { LayoutMetadataDto } from "./layoutTypes";
import { SaveLayoutPanel } from "./SaveLayoutPanel";

export const useLayoutContextMenuItems = () => {
  const { saveLayout } = useLayoutManager();

  const { showDialog, closeDialog } = useDialogContext();

  const handleCloseDialog = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  const handleSave = useCallback(
    (layoutMetadata: LayoutMetadataDto) => {
      saveLayout(layoutMetadata);
      closeDialog();
    },
    [saveLayout, closeDialog]
  );

  const [buildMenuOptions, handleMenuAction] = useMemo<
    [MenuBuilder, MenuActionHandler]
  >(() => {
    return [
      (location, options) => {
        const locations = location.split(" ");
        const menuDescriptors: ContextMenuItemDescriptor[] = [];
        if (locations.includes("workspace-tab")) {
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
        if (action.menuId === "save-layout") {
          showDialog(
            <SaveLayoutPanel
              onCancel={handleCloseDialog}
              onSave={handleSave}
              componentId={action.options?.controlledComponentId}
              defaultTitle={action.options?.controlledComponentTitle as string}
            />,
            "Save Layout",
            [],
            true
          );
          return true;
        }
        return false;
      },
    ];
  }, [handleCloseDialog, handleSave, showDialog]);

  return {
    buildMenuOptions,
    handleMenuAction,
  };
};
