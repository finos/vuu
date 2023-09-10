import { PopupMenu } from "@finos/vuu-popups";
import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "packages/vuu-data-types";
import { useMemo } from "react";
import cx from "classnames";

import "./TabMenu.css";
import { closeCommand, MenuOptions, renameCommand } from "./TabMenuOptions";

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
}

export const TabMenu = ({
  allowClose,
  allowRename,
  controlledComponentId,
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
