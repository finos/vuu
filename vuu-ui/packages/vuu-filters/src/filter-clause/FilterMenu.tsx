import { PopupMenu } from "@finos/vuu-popups";
import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { useMemo } from "react";

import { andCommand, MenuOptions, orCommand } from "./FilterMenuOptions";

const classBase = "vuuTabMenu";

export interface FilterMenuProps {
  allowAnd?: boolean;
  allowOr?: boolean;
  onMenuAction: MenuActionHandler;
  onMenuClose?: () => void;
  index: number;
}

export const FilterMenu = ({
  allowAnd = true,
  allowOr = true,
  onMenuAction,
  onMenuClose,
  index,
}: FilterMenuProps) => {
  const [menuBuilder, menuOptions] = useMemo(
    (): [MenuBuilder, MenuOptions] => [
      (_location, options) => {
        const menuItems: ContextMenuItemDescriptor[] = [];
        if (allowAnd) {
          menuItems.push(andCommand(options as MenuOptions));
        }
        if (allowOr) {
          menuItems.push(orCommand(options as MenuOptions));
        }
        return menuItems;
      },
      {
        tabIndex: index,
      },
    ],
    [allowAnd, allowOr, index]
  );

  return (
    <PopupMenu
      className={classBase}
      menuBuilder={menuBuilder}
      menuActionHandler={onMenuAction}
      menuLocation="filter-bar"
      menuOptions={menuOptions}
      onMenuClose={onMenuClose}
      tabIndex={-1}
    />
  );
};
