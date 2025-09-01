import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@vuu-ui/vuu-context-menu";
import { TabContextMenuOptions, useModal } from "@vuu-ui/vuu-ui-controls";
import { type LayoutMetadataDto } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo } from "react";
import { SaveLayoutPanel } from "./SaveLayoutPanel";
import { useWorkspace } from "./WorkspaceProvider";

export const useWorkspaceContextMenuItems = () => {
  const { saveLayout } = useWorkspace();

  const { showDialog, closeDialog } = useModal();

  const handleCloseDialog = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  const handleSave = useCallback(
    (layoutMetadata: LayoutMetadataDto) => {
      saveLayout(layoutMetadata);
      closeDialog();
    },
    [saveLayout, closeDialog],
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
              id: "save-layout",
              options,
            },
            {
              label: "Layout Settings",
              id: "layout-settings",
              options,
            },
          );
        }
        return menuDescriptors;
      },
      (menuItemId, options) => {
        if (menuItemId === "save-layout") {
          showDialog(
            <SaveLayoutPanel
              onCancel={handleCloseDialog}
              onSave={handleSave}
              componentId={
                (options as TabContextMenuOptions)?.controlledComponentId
              }
              defaultTitle={
                (options as TabContextMenuOptions)?.controlledComponentTitle
              }
            />,
            "Save Layout",
            [],
            true,
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
