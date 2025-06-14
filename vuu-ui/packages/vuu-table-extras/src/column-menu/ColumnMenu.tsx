import { Menu, MenuPanel, MenuTrigger } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
import { useTableContext } from "../table-provider/TableProvider";
import cx from "clsx";
import { HTMLAttributes, MouseEventHandler, useCallback } from "react";

import columnMenuCss from "./ColumnMenu.css";
import {
  buildPinMenuItems,
  buildGroupMenu,
  buildSortMenu,
  buildVisibilityMenuItems,
  ColumnMenuActionType,
  getColumnMenuActionType,
  type MenuItemClickHandler,
  buildSettingsMenuItems,
} from "./column-menu-utils";
import { MenuActionHandler } from "@vuu-ui/vuu-context-menu";

const classBase = "vuuColumnMenu";

export interface ColumnMenuProps extends HTMLAttributes<HTMLSpanElement> {
  column: ColumnDescriptor;
  menuActionHandler?: MenuActionHandler<ColumnMenuActionType, ColumnDescriptor>;
}

export const ColumnMenu = ({
  className,
  column,
  menuActionHandler: menuActionHandlerProp,
}: ColumnMenuProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-column-menu",
    css: columnMenuCss,
    window: targetWindow,
  });

  const { dataSource, menuActionHandler } = useTableContext(true);

  const menuActionClickHandler = useCallback<MenuItemClickHandler>(
    (evt) => {
      const columnMenuActionType = getColumnMenuActionType(evt.target);
      if (menuActionHandlerProp?.(columnMenuActionType, column) !== true) {
        return menuActionHandler(columnMenuActionType, column);
      }
    },
    [column, menuActionHandler, menuActionHandlerProp],
  );

  const sortMenu = buildSortMenu(column, dataSource, menuActionClickHandler);
  const groupMenu = buildGroupMenu(column, dataSource, menuActionClickHandler);
  const visibilityMenuItems = buildVisibilityMenuItems(
    column,
    menuActionClickHandler,
  );
  const pinMenu = buildPinMenuItems(column, menuActionClickHandler);
  const settingsMenuItems = buildSettingsMenuItems(
    column,
    menuActionClickHandler,
  );

  const handleClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (evt) => {
      // Prevent sort from triggering if the click were to bubble.
      evt.stopPropagation();
    },
    [],
  );

  return (
    <Menu>
      <MenuTrigger>
        <IconButton
          appearance="transparent"
          className={cx(classBase, className)}
          data-embedded
          icon="more-vert"
          sentiment="neutral"
          aria-label="Open Column Menu"
          onClick={handleClick}
        />
      </MenuTrigger>
      <MenuPanel>
        {sortMenu}
        {groupMenu}
        {visibilityMenuItems}
        {pinMenu}
        {settingsMenuItems}
      </MenuPanel>
    </Menu>
  );
};
