import { MenuActionHandler, MenuBuilder } from "@vuu-ui/vuu-data-types";
import { Icon, IconButton } from "@vuu-ui/vuu-ui-controls";
import { useId } from "@vuu-ui/vuu-utils";
import { Button, ButtonProps } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, RefObject } from "react";
import { PopupPlacement } from "../popup/Popup";
import { PopupCloseReason } from "../popup/popup-service";
import { usePopupMenu } from "./usePopupMenu";

import popupMenuCss from "./PopupMenu.css";

const classBase = "vuuPopupMenu";

export type MenuCloseHandler = (reason?: PopupCloseReason) => void;

export interface PopupMenuProps extends HTMLAttributes<HTMLButtonElement> {
  anchorElement?: RefObject<HTMLElement>;
  disabled?: boolean;
  icon?: string;
  label?: string;
  menuActionHandler?: MenuActionHandler;
  menuBuilder?: MenuBuilder;
  menuClassName?: string;
  menuLocation?: string;
  menuOptions?: { [key: string]: unknown };
  onMenuClose?: MenuCloseHandler;
  onMenuOpen?: () => void;
  popupPlacement?: PopupPlacement;
  variant?: ButtonProps["variant"];
}

export const PopupMenu = ({
  anchorElement,
  className,
  disabled = false,
  label,
  icon = label ? "chevron-down" : "more-vert",
  id: idProp,
  menuActionHandler,
  menuBuilder,
  menuClassName,
  menuLocation = "header",
  menuOptions,
  onMenuClose,
  onMenuOpen,
  popupPlacement = "below-right",
  tabIndex = 0,
  variant = "secondary",
  ...htmlAttributes
}: PopupMenuProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-popup-menu",
    css: popupMenuCss,
    window: targetWindow,
  });

  const id = useId(idProp);

  const { ariaAttributes, buttonProps, menuOpen, rootRef } = usePopupMenu({
    anchorElement,
    id,
    menuActionHandler,
    menuBuilder,
    menuClassName,
    menuLocation,
    onMenuClose,
    onMenuOpen,
    menuOptions,
    popupPlacement,
    tabIndex,
  });

  if (label) {
    return (
      <Button
        {...htmlAttributes}
        {...ariaAttributes}
        {...buttonProps}
        className={cx(classBase, className, `${classBase}-withCaption`, {
          "saltButton-active": menuOpen,
        })}
        disabled={disabled}
        ref={rootRef}
        variant="secondary"
      >
        {icon ? <Icon name={icon} /> : null}
        {label}
      </Button>
    );
  } else if (icon) {
    return (
      <IconButton
        {...htmlAttributes}
        {...ariaAttributes}
        {...buttonProps}
        className={cx(classBase, className, {
          "saltButton-active": menuOpen,
        })}
        disabled={disabled}
        icon={icon}
        ref={rootRef}
        variant={variant}
      />
    );
  } else {
    console.error("PopupMenu must have a label or an icon (or both)");
    return null;
  }
};
