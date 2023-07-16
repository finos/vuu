import { PopupMenu } from "@finos/vuu-popups";
import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "packages/vuu-data-types";
import { useMemo } from "react";

import "./TabMenu.css";
import { closeCommand, MenuOptions, renameCommand } from "./TabMenuOptions";

const classBase = "vuuTabMenu";

export interface TabMenuProps {
  allowClose: boolean;
  onMenuAction: MenuActionHandler;
  tabIndex: number;
}

export const TabMenu = ({
  allowClose,
  onMenuAction,
  tabIndex,
}: TabMenuProps) => {
  const [menuBuilder, menuOptions] = useMemo(
    (): [MenuBuilder, MenuOptions] => [
      (_location, options) => {
        const menuItems: ContextMenuItemDescriptor[] = [
          renameCommand(options as MenuOptions),
        ];
        if (allowClose) {
          menuItems.push(closeCommand(options as MenuOptions));
        }
        return menuItems;
      },
      {
        tabIndex,
      },
    ],
    [allowClose, tabIndex]
  );

  return (
    <PopupMenu
      className={classBase}
      menuBuilder={menuBuilder}
      menuActionHandler={onMenuAction}
      menuLocation="tab"
      menuOptions={menuOptions}
    />
  );
};
