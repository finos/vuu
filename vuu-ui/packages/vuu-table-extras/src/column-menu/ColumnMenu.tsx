import { Menu, MenuPanel, MenuTrigger } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { MenuActionHandler } from "@vuu-ui/vuu-context-menu";
import {
  ColumnDescriptor,
  ColumnMenuPermissions,
} from "@vuu-ui/vuu-table-types";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import { HTMLAttributes, MouseEventHandler, useCallback } from "react";
import { defaultTableSettingsPermissions } from "../table-column-settings/TableSettingsPanel";
import { useTableContext } from "../table-provider/TableProvider";
import {
  buildAggregationMenuItems,
  buildGroupMenu,
  buildPinMenuItems,
  buildSettingsMenuItems,
  buildSortMenu,
  buildVisibilityMenuItems,
  ColumnMenuActionType,
  getColumnMenuActionType,
  type MenuItemClickHandler,
} from "./column-menu-utils";

import columnMenuCss from "./ColumnMenu.css";

const classBase = "vuuColumnMenu";

const defaultColumnMenuPermissions: Readonly<ColumnMenuPermissions> = {
  allowSort: true,
  allowGroup: true,
  allowAggregation: true,
  allowHide: true,
  allowRemove: true,
  allowPin: true,
  allowColumnSettings: true,
  allowTableSettings: defaultTableSettingsPermissions,
};

export interface ColumnMenuProps extends HTMLAttributes<HTMLSpanElement> {
  column: ColumnDescriptor;
  menuActionHandler?: MenuActionHandler<ColumnMenuActionType, ColumnDescriptor>;
  menuPermissions?: ColumnMenuPermissions;
}

export const ColumnMenu = ({
  className,
  column,
  menuActionHandler: menuActionHandlerProp,
  menuPermissions: {
    allowSort,
    allowGroup,
    allowAggregation,
    allowHide,
    allowRemove,
    allowPin,
    allowColumnSettings,
    allowTableSettings,
  } = defaultColumnMenuPermissions,
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

  const sortMenu = buildSortMenu(
    column,
    dataSource,
    menuActionClickHandler,
    allowSort,
  );
  const groupMenu = buildGroupMenu(
    column,
    dataSource,
    menuActionClickHandler,
    allowGroup,
  );
  const aggregationMenu = buildAggregationMenuItems(
    column,
    dataSource,
    menuActionClickHandler,
    allowAggregation,
  );
  const visibilityMenuItems = buildVisibilityMenuItems(
    column,
    menuActionClickHandler,
    allowHide,
    allowRemove,
  );
  const pinMenu = buildPinMenuItems(column, menuActionClickHandler, allowPin);
  const settingsMenuItems = buildSettingsMenuItems(
    column,
    menuActionClickHandler,
    allowColumnSettings,
    allowTableSettings,
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
        {aggregationMenu}
        {visibilityMenuItems}
        {pinMenu}
        {settingsMenuItems}
      </MenuPanel>
    </Menu>
  );
};
