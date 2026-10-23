import { Menu } from "@salt-ds/core";
import type { ReactNode } from "react";
import { ChromeMenuPanel } from "./ChromeMenu";

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuProps {
  children: ReactNode;
  heading?: string;
  onClose: () => void;
  /** where the menu opens, usually the pointer position, undefined if closed */
  position?: ContextMenuPosition;
}

/** A chrome styled menu, opened at a point rather than from a trigger */
export const ContextMenu = ({
  children,
  heading,
  onClose,
  position,
}: ContextMenuProps) => (
  <Menu
    getVirtualElement={() =>
      position
        ? {
            getBoundingClientRect: () =>
              DOMRect.fromRect({ height: 0, width: 0, ...position }),
          }
        : null
    }
    onOpenChange={(open) => {
      if (!open) onClose();
    }}
    open={position !== undefined}
    placement="bottom-start"
  >
    <ChromeMenuPanel heading={heading}>{children}</ChromeMenuPanel>
  </Menu>
);

export const MenuSeparator = () => (
  <div className="ShowcaseMenu-separator" role="separator" />
);

export const MenuShortcut = ({ children }: { children: ReactNode }) => (
  <span aria-hidden className="ShowcaseMenu-shortcut">
    {children}
  </span>
);
