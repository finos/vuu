import { Icon } from "@vuu-ui/vuu-ui-controls";
import { Button, Menu, MenuItem, MenuPanel, MenuTrigger } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import tabMenuCss from "./TabMenu.css";
import { useGridLayoutDispatch } from "./GridLayoutContext";
import { useCallback } from "react";

export interface TabMenuProps {
  allowClose?: boolean;
  allowRename?: boolean;
  layoutItemId: string;
}

export const TabMenu = ({
  // allowClose = true,
  // allowRename = true,
  layoutItemId,
}: TabMenuProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-tab-menu",
    css: tabMenuCss,
    window: targetWindow,
  });

  const dispatch = useGridLayoutDispatch();

  const closeTab = useCallback(() => {
    dispatch({ type: "close", id: layoutItemId });
  }, [dispatch, layoutItemId]);

  return (
    <Menu>
      <MenuTrigger>
        {/* This used to be TabNextAction which no longer exists */}
        <Button
          aria-label="Settings"
          className="TabMenuButton"
          data-embedded
        >
          <Icon aria-hidden name="more-vert" />
        </Button>
      </MenuTrigger>
      <MenuPanel>
        <MenuItem
          onClick={() => {
            console.log("rename");
          }}
        >
          Rename
        </MenuItem>
        <MenuItem onClick={closeTab}>Close</MenuItem>
      </MenuPanel>
    </Menu>
  );
};
