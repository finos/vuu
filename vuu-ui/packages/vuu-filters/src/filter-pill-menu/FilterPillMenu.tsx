import { PopupMenu } from "@finos/vuu-popups";
import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { useMemo } from "react";
import cx from "clsx";

import "./FilterPillMenu.css";
import {
  closeCommand,
  deleteCommand,
  editCommand,
  MenuOptions,
  renameCommand,
} from "../filter-pill/FilterPillMenuOptions";
import { Filter } from "@finos/vuu-filter-types";

const classBase = "vuuFilterPillMenu";

export interface FilterMenuOptions extends MenuOptions {
  filter: Filter;
}

export interface FilterPillMenuProps {
  allowClose?: boolean;
  allowDelete?: boolean;
  allowEdit?: boolean;
  allowRename?: boolean;
  filter: Filter;
  location?: string;
  onMenuAction: MenuActionHandler;
  onMenuClose?: () => void;
}

export const FilterPillMenu = ({
  allowClose = true,
  allowDelete = true,
  allowEdit = true,
  allowRename = true,
  filter,
  location,
  onMenuAction,
  onMenuClose,
}: FilterPillMenuProps) => {
  const [menuBuilder, menuOptions] = useMemo(
    (): [MenuBuilder, FilterMenuOptions] => [
      (_location, options) => {
        const menuItems: ContextMenuItemDescriptor[] = [];
        if (allowRename) {
          menuItems.push(renameCommand(options as MenuOptions));
        }
        if (allowEdit) {
          menuItems.push(editCommand(options as MenuOptions));
        }
        if (allowClose) {
          menuItems.push(closeCommand(options as MenuOptions));
        }
        if (allowDelete) {
          menuItems.push(deleteCommand(options as MenuOptions));
        }
        return menuItems;
      },
      {
        filter,
      },
    ],
    [allowClose, allowDelete, allowEdit, allowRename, filter]
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
