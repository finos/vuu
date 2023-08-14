import { PopupMenu } from "@finos/vuu-popups";
import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { useMemo } from "react";
import cx from "classnames";

import "./FilterPillMenu.css";
import {
  closeCommand,
  MenuOptions,
  renameCommand,
} from "./FilterPillMenuOptions";

const classBase = "vuuFilterPillMenu";

export interface FilterPillMenuProps {
  allowClose?: boolean;
  allowRename?: boolean;
  location?: string;
  onMenuAction: MenuActionHandler;
  onMenuClose?: () => void;
  index: number;
}

export const FilterPillMenu = ({
  allowClose = true,
  allowRename = true,
  location,
  onMenuAction,
  onMenuClose,
  index,
}: FilterPillMenuProps) => {
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
      menuLocation={cx("filter", location)}
      menuOptions={menuOptions}
      onMenuClose={onMenuClose}
      tabIndex={-1}
    />
  );
};
