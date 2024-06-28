import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { PopupMenu } from "@finos/vuu-popups";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { useMemo } from "react";
import { MenuOptions, closeCommand, renameCommand } from "./TabMenuOptions";

import tabMenuCss from "./TabMenu.css";

const classBase = "vuuTabMenu";

export interface TabMenuProps {
  allowClose: boolean;
  allowRename: boolean;
  index: number;
  location?: string;
  onMenuAction: MenuActionHandler;
  onMenuClose?: () => void;
  /**
   * The id of associated component, if available
   */
  controlledComponentId?: string;
  /**
   * The label of Tab, if available
   */
  controlledComponentTitle?: string;
}

export const TabMenu = ({
  allowClose,
  allowRename,
  controlledComponentId,
  controlledComponentTitle,
  location,
  onMenuAction,
  onMenuClose,
  index,
}: TabMenuProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-tab-menu",
    css: tabMenuCss,
    window: targetWindow,
  });

  const [menuBuilder, menuOptions] = useMemo(
    (): [MenuBuilder, MenuOptions] => [
      (_location, options) => {
        const menuItems: ContextMenuItemDescriptor[] = [];
        if (allowRename) {
          menuItems.push(renameCommand(options as MenuOptions));
        }
        if (allowClose) {
          menuItems.push(closeCommand(options as MenuOptions));
        }
        return menuItems;
      },
      {
        controlledComponentId,
        controlledComponentTitle,
        tabIndex: index,
      },
    ],
    [
      allowClose,
      allowRename,
      controlledComponentId,
      controlledComponentTitle,
      index,
    ]
  );

  return (
    <PopupMenu
      aria-label="context menu"
      className={classBase}
      data-embedded
      menuBuilder={menuBuilder}
      menuActionHandler={onMenuAction}
      menuLocation={cx("tab", location)}
      menuOptions={menuOptions}
      onMenuClose={onMenuClose}
      tabIndex={-1}
    />
  );
};
