import { PopupMenu } from "@finos/vuu-popups";
import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { useMemo } from "react";
import cx from "classnames";
import { closeCommand, MenuOptions, renameCommand } from "./TabMenuOptions";

import "./TabMenu.css";

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
    [allowClose, allowRename, controlledComponentId, index]
  );

  return (
    <PopupMenu
      className={classBase}
      menuBuilder={menuBuilder}
      menuActionHandler={onMenuAction}
      menuLocation={cx("tab", location)}
      menuOptions={menuOptions}
      onMenuClose={onMenuClose}
      tabIndex={-1}
    />
  );
};
