import React, {
  FC,
  HTMLAttributes,
  ReactElement,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import cx from "classnames";
import { useIdMemo as useId } from "@salt-ds/core";
import { useKeyboardNavigation } from "./use-keyboard-navigation";
import { isMenuItemGroup } from "./use-items-with-ids";

import "./MenuList.css";

const classBase = "vuuMenuList";

export const Separator = () => <li className="vuuMenuItem-divider" />;

export interface MenuItemGroupProps {
  children: ReactElement<MenuItemProps>[];
  label: string;
}

export interface MenuItemProps extends HTMLAttributes<HTMLDivElement> {
  action?: string;
  idx?: number;
  options?: unknown;
}

// Purely used as markers, props will be extracted
export const MenuItemGroup: FC<MenuItemGroupProps> = () => null;
// eslint-disable-next-line no-unused-vars
export const MenuItem = ({ children, idx, ...props }: MenuItemProps) => {
  return <div {...props}>{children}</div>;
};

const hasIcon = (child: ReactElement) => child.props["data-icon"];

export interface MenuListProps extends HTMLAttributes<HTMLDivElement> {
  activatedByKeyboard?: boolean;
  children: ReactElement[];
  childMenuShowing?: number;
  highlightedIdx?: number;
  isRoot?: boolean;
  listItemProps?: Partial<MenuItemProps>;
  menuId?: string;
  onActivate?: (menuId: string) => void;
  onCloseMenu: (idx: number) => void;
  onOpenMenu?: (menuId: string) => void;
  onHighlightMenuItem?: (idx: number) => void;
}

const MenuList = ({
  activatedByKeyboard,
  childMenuShowing = -1,
  children,
  className,
  highlightedIdx: highlightedIdxProp,
  id: idProp,
  isRoot,
  listItemProps,
  menuId,
  onHighlightMenuItem,
  onActivate,
  onCloseMenu,
  onOpenMenu,
  ...props
}: MenuListProps) => {
  const id = useId(idProp);
  const root = useRef<HTMLDivElement>(null);

  // The id generation be,ongs in useIttemsWithIds
  const mapIdxToId = useMemo(() => new Map(), []);

  const handleOpenMenu = (idx: number) => {
    const el = root.current?.querySelector(`:scope > [data-idx='${idx}']`);
    el?.id && onOpenMenu?.(el.id);
  };

  const handleActivate = (idx: number) => {
    const el = root.current?.querySelector(`:scope > [data-idx='${idx}']`);
    el?.id && onActivate?.(el.id);
  };

  const { focusVisible, highlightedIdx, listProps } = useKeyboardNavigation({
    count: React.Children.count(children),
    highlightedIdx: highlightedIdxProp,
    onActivate: handleActivate,
    onHighlight: onHighlightMenuItem,
    onOpenMenu: handleOpenMenu,
    onCloseMenu,
  });

  const appliedFocusVisible = childMenuShowing == -1 ? focusVisible : -1;

  useLayoutEffect(() => {
    if (childMenuShowing === -1 && activatedByKeyboard) {
      root.current?.focus();
    }
  }, [activatedByKeyboard, childMenuShowing]);

  const getActiveDescendant = () =>
    highlightedIdx === undefined || highlightedIdx === -1
      ? undefined
      : mapIdxToId.get(highlightedIdx);

  return (
    <div
      {...props}
      {...listProps}
      aria-activedescendant={getActiveDescendant()}
      className={cx(classBase, className, {
        [`${classBase}-childMenuShowing`]: childMenuShowing !== -1,
      })}
      data-root={isRoot || undefined}
      id={`${id}-${menuId}`}
      ref={root}
      role="menu"
      tabIndex={0}
    >
      {renderContent()}
    </div>
  );

  function renderContent() {
    const propsCommonToAllListItems = {
      ...listItemProps,
      role: "menuitem",
    };

    const maybeIcon = (
      childElement: ReactElement,
      withIcon: boolean,
      iconName?: string
    ) =>
      withIcon
        ? [
            <span
              className="vuuIconContainer"
              data-icon={iconName}
              key="icon"
            />,
          ].concat(childElement)
        : childElement;

    function addClonedChild(
      list: ReactElement[],
      child: ReactElement,
      idx: number,
      withIcon: boolean
    ) {
      const {
        children,
        className,
        "data-icon": iconName,
        id: itemId,
        hasSeparator,
        label,
        ...props
      } = child.props;
      const hasSubMenu = isMenuItemGroup(child);
      const subMenuShowing = hasSubMenu && childMenuShowing === idx;
      const ariaControls = subMenuShowing ? `${id}-${itemId}` : undefined;

      list.push(
        <MenuItem
          {...props}
          {...propsCommonToAllListItems}
          {...getMenuItemProps(
            `${id}-${menuId}`,
            itemId,
            idx,
            child.key ?? itemId,
            highlightedIdx,
            appliedFocusVisible,
            className,
            hasSeparator
          )}
          aria-controls={ariaControls}
          aria-haspopup={hasSubMenu || undefined}
          aria-expanded={subMenuShowing || undefined}
        >
          {hasSubMenu
            ? maybeIcon(label, withIcon, iconName)
            : maybeIcon(children, withIcon, iconName)}
        </MenuItem>
      );
      // mapIdxToId.set(idx, itemId);
    }

    const listItems: ReactElement[] = [];

    if (children.length > 0) {
      const withIcon = children.some(hasIcon);

      children.forEach((child, idx) => {
        addClonedChild(listItems, child, idx, withIcon);
      });
    }

    return listItems;
  }
};

const getMenuItemProps = (
  baseId: string,
  itemId: string,
  idx: number,
  key: string,
  highlightedIdx: number,
  focusVisible: number,
  className: string,
  hasSeparator: boolean
) => ({
  id: `${baseId}-${itemId}`,
  key: key ?? idx,
  "data-idx": idx,
  "data-highlighted": idx === highlightedIdx || undefined,
  className: cx("vuuMenuItem", className, {
    "vuuMenuItem-separator": hasSeparator,
    focusVisible: focusVisible === idx,
  }),
});

MenuList.displayName = "MenuList";
export default MenuList;
