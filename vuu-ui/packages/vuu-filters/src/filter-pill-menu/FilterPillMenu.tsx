import { PopupMenu } from "@vuu-ui/vuu-popups";
import { useMemo } from "react";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import filterPillMenuCss from "./FilterPillMenu.css";
import {
  closeCommand,
  deleteCommand,
  editCommand,
  MenuOptions,
  renameCommand,
} from "./FilterPillMenuOptions";
import { Filter } from "@vuu-ui/vuu-filter-types";
import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@vuu-ui/vuu-context-menu";

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
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-pill-menu",
    css: filterPillMenuCss,
    window: targetWindow,
  });

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
    [allowClose, allowDelete, allowEdit, allowRename, filter],
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
