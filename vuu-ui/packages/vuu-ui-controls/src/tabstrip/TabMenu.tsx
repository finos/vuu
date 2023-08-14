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
  location?: string;
  onMenuAction: MenuActionHandler;
  onMenuClose?: () => void;
  index: number;
}

export const TabMenu = ({
  allowClose,
  allowRename,
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
        tabIndex: index,
      },
    ],
    [allowClose, allowRename, index]
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
