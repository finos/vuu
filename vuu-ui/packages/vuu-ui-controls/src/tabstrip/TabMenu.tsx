import { PopupMenu } from "@finos/vuu-popups";
import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "packages/vuu-data-types";
import { useMemo } from "react";

import "./TabMenu.css";

const classBase = "vuuTabMenu";

export interface TabMenuProps {
  allowClose: boolean;
  onMenuAction: MenuActionHandler;
  tabIndex: number;
}

export type MenuOptions = { [key: string]: unknown };

const closeCommand = (options?: MenuOptions) =>
  ({
    label: `Close`,
    location: "tab",
    action: `close-tab`,
    options,
  } as ContextMenuItemDescriptor);

const renameCommand = (options?: MenuOptions) =>
  ({
    label: `Rename`,
    location: "tab",
    action: `rename-tab`,
    options,
  } as ContextMenuItemDescriptor);

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
