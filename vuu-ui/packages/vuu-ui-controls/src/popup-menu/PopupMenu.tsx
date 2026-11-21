import { Button, ButtonProps, Menu, MenuTrigger } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  ContextMenuPanel,
  MenuActionHandler,
  MenuBuilder,
  useContextMenuItems,
} from "@vuu-ui/vuu-context-menu";
import cx from "clsx";
import {
  HTMLAttributes,
  RefObject,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Icon, IconButton } from "../icon-button";

import popupMenuCss from "./PopupMenu.css";

const classBase = "vuuPopupMenu";

export interface PopupMenuProps
  extends Pick<ButtonProps, "appearance" | "sentiment">,
    HTMLAttributes<HTMLButtonElement> {
  /**
   * Position the menu below this element, at least as wide as it, rather
   * than below the button.
   */
  anchorElement?: RefObject<HTMLElement | null>;
  disabled?: boolean;
  icon?: string;
  label?: string;
  menuActionHandler?: MenuActionHandler;
  /**
   * Builds the menu items when the menu opens. Items from the menuBuilders of
   * enclosing ContextMenuProviders are added after these.
   */
  menuBuilder?: MenuBuilder;
  menuClassName?: string;
  menuLocation?: string;
  menuOptions?: { [key: string]: unknown };
  onMenuClose?: () => void;
  onMenuOpen?: () => void;
}

/**
 * A button that opens a Salt Menu built from menu item descriptors.
 */
export const PopupMenu = ({
  anchorElement,
  "aria-label": ariaLabel = "Popup menu",
  appearance = "transparent",
  className,
  disabled = false,
  label,
  icon = label ? "chevron-down" : "more-vert",
  menuActionHandler,
  menuBuilder,
  menuClassName,
  menuLocation = "header",
  menuOptions,
  onMenuClose,
  onMenuOpen,
  sentiment = "neutral",
  tabIndex = 0,
  ...htmlAttributes
}: PopupMenuProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-popup-menu",
    css: popupMenuCss,
    window: targetWindow,
  });

  const [open, setOpen] = useState(false);
  const buildMenuItems = useContextMenuItems(menuBuilder, menuActionHandler);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
      if (isOpen) {
        onMenuOpen?.();
      } else {
        onMenuClose?.();
      }
    },
    [onMenuClose, onMenuOpen],
  );

  const getAnchorElement = useMemo(
    () => (anchorElement ? () => anchorElement.current : undefined),
    [anchorElement],
  );

  const menuItems = useMemo(
    () => (open ? buildMenuItems(menuLocation, menuOptions) : undefined),
    [buildMenuItems, menuLocation, menuOptions, open],
  );

  const triggerClassName = cx(classBase, className, {
    [`${classBase}-withCaption`]: label,
    "saltButton-active": open,
  });

  const trigger = label ? (
    <Button
      {...htmlAttributes}
      appearance={appearance}
      className={triggerClassName}
      disabled={disabled}
      sentiment={sentiment}
      tabIndex={tabIndex}
    >
      {icon ? <Icon name={icon} /> : null}
      {label}
    </Button>
  ) : (
    <IconButton
      {...htmlAttributes}
      appearance={appearance}
      aria-label={ariaLabel}
      className={triggerClassName}
      disabled={disabled}
      icon={icon}
      sentiment={sentiment}
      tabIndex={tabIndex}
    />
  );

  return (
    <Menu
      getVirtualElement={getAnchorElement}
      onOpenChange={handleOpenChange}
      open={open}
      placement="bottom-start"
    >
      <MenuTrigger>{trigger}</MenuTrigger>
      {menuItems ? (
        <ContextMenuPanel
          className={menuClassName}
          menuHandler={menuItems.menuHandler}
          menuItemDescriptors={menuItems.menuItemDescriptors}
          style={{ minWidth: anchorElement?.current?.offsetWidth }}
        />
      ) : null}
    </Menu>
  );
};
