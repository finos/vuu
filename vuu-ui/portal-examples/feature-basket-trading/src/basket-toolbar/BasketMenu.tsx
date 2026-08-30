import { PopupMenu } from "@vuu-ui/vuu-popups";
import { useMemo } from "react";
import cx from "clsx";

import "./BasketMenu.css";
import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@vuu-ui/vuu-context-menu";

const classBase = "vuuBasketMenu";

export interface BasketMenuProps {
  className?: string;
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
  className,
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
            id: "action1",
            label: "Limit to Near",
          },
          {
            id: "action2",
            label: "Limit Far",
          },
          {
            id: "action3",
            label: "Peg to Near",
          },
          {
            id: "action4",
            label: "To Algo",
          },
        );
        return menuItems;
      },
    ],
    [],
  );

  return (
    <PopupMenu
      className={cx(classBase, className)}
      label="actions"
      menuBuilder={menuBuilder}
      menuActionHandler={onMenuAction}
      menuLocation={cx("basket-menu", location)}
      onMenuClose={onMenuClose}
      tabIndex={-1}
    />
  );
};
