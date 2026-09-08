import type {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@vuu-ui/vuu-context-menu";
import { type TabContextMenuOptions, useModal } from "@vuu-ui/vuu-ui-controls";
import type { LayoutMetadataDto } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo } from "react";
import { SaveLayoutPanel } from "./SaveLayoutPanel";
import { useWorkspace } from "./WorkspaceProvider";

export const useWorkspaceContextMenuItems = () => {
  const { activeWorkspace, closeWorkspace, saveActiveWorkspaceAs } =
    useWorkspace();

  const { showDialog, closeDialog } = useModal();

  const handleCloseDialog = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  const handleSave = useCallback(
    (layoutMetadata: LayoutMetadataDto) => {
      void saveActiveWorkspaceAs(layoutMetadata.name);
      closeDialog();
    },
    [closeDialog, saveActiveWorkspaceAs],
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
              label: "Close Workspace",
              id: "close-workspace",
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
        if (menuItemId === "close-workspace" && activeWorkspace) {
          void closeWorkspace(activeWorkspace.instanceId);
          return true;
        }
        return false;
      },
    ];
  }, [
    activeWorkspace,
    closeWorkspace,
    handleCloseDialog,
    handleSave,
    showDialog,
  ]);

  return {
    buildMenuOptions,
    handleMenuAction,
  };
};
