import {
  LayoutMetadataDto,
  SaveLayoutPanel,
  useLayoutManager,
} from "@finos/vuu-shell";
import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { useCallback, useMemo } from "react";
import { MenuActionClosePopup, SetDialog } from "@finos/vuu-popups";

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
                componentId={action.options.controlledComponentId}
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
