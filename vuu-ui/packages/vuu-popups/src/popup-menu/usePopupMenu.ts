import {
  AriaAttributes,
  MouseEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { PopupMenuProps } from "./PopupMenu";
import { getPositionRelativeToAnchor } from "../popup/getPositionRelativeToAnchor";
import { PopupPlacement } from "../popup/Popup";
import { useContextMenu } from "@vuu-ui/vuu-context-menu";

export interface PopupMenuHookProps
  extends Pick<
    PopupMenuProps,
    | "anchorElement"
    | "aria-label"
    | "menuActionHandler"
    | "menuBuilder"
    | "menuClassName"
    | "menuOptions"
    | "onMenuClose"
    | "onMenuOpen"
  > {
  id: string;
  menuLocation: string;
  popupPlacement: PopupPlacement;
  tabIndex: number;
}

export const usePopupMenu = ({
  anchorElement,
  "aria-label": ariaLabel = "Popup menu",
  id,
  menuActionHandler,
  menuBuilder,
  menuLocation,
  menuOptions,
  onMenuClose,
  onMenuOpen,
  popupPlacement,
  tabIndex,
}: PopupMenuHookProps) => {
  const [menuOpen, _setMenuOpen] = useState(false);
  const suppressShowMenuRef = useRef(false);
  const rootRef = useRef<HTMLButtonElement>(null);

  const setMenuOpen = useCallback(
    (isOpen: boolean) => {
      _setMenuOpen(isOpen);
      if (isOpen) {
        onMenuOpen?.();
        setTimeout(() => {
          const firstOption = document.activeElement?.querySelector(
            ".saltMenuItem",
          ) as HTMLElement;
          firstOption?.focus();
        }, 40);
      } else {
        suppressShowMenuRef.current = false;
      }
    },
    [onMenuOpen],
  );

  const showContextMenu = useContextMenu(menuBuilder, menuActionHandler);

  const handleMenuOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setMenuOpen(false);
        onMenuClose?.();
      }
    },
    [onMenuClose, setMenuOpen],
  );

  const showMenu = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (suppressShowMenuRef.current) {
        suppressShowMenuRef.current = false;
      } else {
        suppressShowMenuRef.current = true;
        const anchorEl = anchorElement?.current ?? rootRef.current;
        if (anchorEl) {
          const {
            left: x,
            top: y,
            // width,
          } = getPositionRelativeToAnchor(anchorEl, popupPlacement, 0, 0);
          setMenuOpen(true);

          showContextMenu(e, menuLocation, menuOptions, {
            // className: menuClassName,
            // id: `${id}-menu`,
            onOpenChange: handleMenuOpenChange,
            x,
            y,
            // style: { width: width ? width - 2 : undefined },
          });
        }
      }
    },
    [
      anchorElement,
      popupPlacement,
      setMenuOpen,
      showContextMenu,
      menuLocation,
      menuOptions,
      handleMenuOpenChange,
    ],
  );

  const ariaAttributes: AriaAttributes = {
    "aria-controls": menuOpen ? `${id}-menu` : undefined,
    "aria-label": ariaLabel,
    "aria-expanded": menuOpen,
    "aria-haspopup": "menu",
  };

  const buttonProps = {
    id,
    onClick: showMenu,
    tabIndex,
  };

  return { ariaAttributes, buttonProps, menuOpen, rootRef };
};
