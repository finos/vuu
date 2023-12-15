import { useCallback, useMemo } from "react";
import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { MenuActionClosePopup } from "@finos/vuu-popups";

export const useFilterBarMenu = () => {
  const menuBuilder = useCallback<MenuBuilder>(() => {
    return [
      {
        label: `You have no saved filters for this table`,
        action: `no-action`,
      } as ContextMenuItemDescriptor,
    ];
  }, []);

  const menuActionHandler = useMemo<MenuActionHandler>(
    () => (action: MenuActionClosePopup) => {
      console.log(`invoke menuId `, {
        action,
      });
      return false;
    },
    []
  );

  return {
    menuBuilder,
    menuActionHandler,
  };
};
