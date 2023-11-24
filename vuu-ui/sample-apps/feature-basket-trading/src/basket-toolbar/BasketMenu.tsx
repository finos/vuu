import { PopupMenu } from "@finos/vuu-popups";
import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { useMemo } from "react";
import cx from "classnames";

import "./BasketMenu.css";

const classBase = "vuuBasketMenu";

export interface BasketMenuProps {
  location?: string;
  onMenuAction: MenuActionHandler;
  onMenuClose?: () => void;
  /**
   * The id of associated component, if available
   */
  controlledComponentId?: string;
  /**
   * The Label of Tab, if available
   */
  controlledComponentTitle?: string;
}

export const BasketMenu = ({
  location,
  onMenuAction,
  onMenuClose,
}: BasketMenuProps) => {
  const [menuBuilder] = useMemo(
    (): [MenuBuilder] => [
      () => {
        const menuItems: ContextMenuItemDescriptor[] = [];
        menuItems.push(
          {
            action: "action1",
            label: "Limit to Near",
          },
          {
            action: "action2",
            label: "Limit Far",
          },
          {
            action: "action3",
            label: "Peg to Near",
          },
          {
            action: "action4",
            label: "To Algo",
          }
        );
        return menuItems;
      },
    ],
    []
  );

  return (
    <PopupMenu
      className={classBase}
      label="actions"
      menuBuilder={menuBuilder}
      menuActionHandler={onMenuAction}
      menuLocation={cx("basket-menu", location)}
      onMenuClose={onMenuClose}
      tabIndex={-1}
    />
  );
};
