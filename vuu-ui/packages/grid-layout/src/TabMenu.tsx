import { Icon } from "@vuu-ui/vuu-ui-controls";
import { Button, Menu, MenuItem, MenuPanel, MenuTrigger } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import tabMenuCss from "./TabMenu.css";
import { useGridLayoutDispatch } from "./GridLayoutContext";
import { type ReactElement, useCallback, useMemo } from "react";
import { useEditTabName } from "./useEditTabName";

export interface TabMenuProps {
  allowClose?: boolean;
  allowRename?: boolean;
  layoutItemId: string;
  tabLabel: string;
}

export const TabMenu = ({
  allowClose = true,
  allowRename = true,
  layoutItemId,
  tabLabel,
}: TabMenuProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-tab-menu",
    css: tabMenuCss,
    window: targetWindow,
  });

  const { dialog, showTabEditDialog } = useEditTabName({
    id: layoutItemId,
    mode: "edit",
    tabLabel,
  });

  const dispatch = useGridLayoutDispatch();

  const closeTab = useCallback(() => {
    dispatch({ type: "close", id: layoutItemId });
  }, [dispatch, layoutItemId]);

  const renameTab = useCallback(() => {
    showTabEditDialog();
  }, [showTabEditDialog]);

  const menuItems = useMemo<ReactElement[]>(() => {
    const items: ReactElement[] = [];
    if (allowClose) {
      items.push(
        <MenuItem key="close" onClick={closeTab}>
          Close
        </MenuItem>,
      );
    }

    if (allowRename) {
      items.push(
        <MenuItem key="rename" onClick={renameTab}>
          Rename
        </MenuItem>,
      );
    }

    return items;
  }, [allowClose, allowRename, closeTab, renameTab]);

  return (
    <>
      <Menu>
        <MenuTrigger>
          <Button aria-label="Settings" className="TabMenuButton" data-embedded>
            <Icon aria-hidden name="more-vert" />
          </Button>
        </MenuTrigger>
        <MenuPanel>{menuItems}</MenuPanel>
      </Menu>
      {dialog}
    </>
  );
};
