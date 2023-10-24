import React, {
  FC,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import cx from "classnames";
//TODO do we want this dependency ?
import { useId } from "@finos/vuu-layout";
import { useKeyboardNavigation } from "./use-keyboard-navigation";
import { isMenuItemGroup } from "./use-items-with-ids-next";

import "./MenuList.css";

const classBase = "vuuMenuList";

export const Separator = () => <li className="vuuMenuItem-divider" />;

export interface MenuItemGroupProps {
  children:
    | ReactElement<MenuItemProps>[]
    | [ReactElement<MenuItemLabelProps>, ...ReactElement<MenuItemProps>[]];
  label?: string;
}

export interface MenuItemProps extends HTMLAttributes<HTMLDivElement> {
  action?: string;
  idx?: number;
  options?: unknown;
}

// Purely used as markers, props will be extracted
export const MenuItemGroup: FC<MenuItemGroupProps> = () => null;
// eslint-disable-next-line no-unused-vars
export const MenuItem = ({
  children,
  idx,
  options,
  ...props
}: MenuItemProps) => {
  return <div {...props}>{children}</div>;
};

export interface MenuItemLabelProps {
  children: ReactNode;
}
const MenuItemLabel = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);
MenuItemLabel.displayName = "MenuItemLabel";
MenuItem.Label = MenuItemLabel;

const getDisplayName = (item: ReactNode) =>
  React.isValidElement(item) &&
  typeof item.type !== "string" &&
  "displayName" in item.type
    ? item.type.displayName
    : undefined;

export const isMenuItemLabel = (
  item: ReactNode
): item is ReactElement<MenuItemLabelProps> =>
  getDisplayName(item) === "MenuItemLabel";

const hasIcon = (child: ReactElement) => child.props["data-icon"];

export type MenuOpenHandler = (
  menuItemEl: HTMLElement,
  immediate?: boolean
) => void;
export interface MenuListProps extends HTMLAttributes<HTMLDivElement> {
  activatedByKeyboard?: boolean;
  children: ReactElement[];
  childMenuShowing?: string;
  defaultHighlightedIdx?: number;
  highlightedIdx?: number;
  isRoot?: boolean;
  listItemProps?: Partial<MenuItemProps>;
  onActivate?: (menuId: string) => void;
  onCloseMenu: (idx: number) => void;
  openMenu?: MenuOpenHandler;
  onHighlightMenuItem?: (idx: number) => void;
}

export const MenuList = ({
  activatedByKeyboard,
  childMenuShowing,
  children,
  className,
  defaultHighlightedIdx,
  highlightedIdx: highlightedIdxProp,
  id: idProp,
  isRoot,
  listItemProps,
  onHighlightMenuItem,
  onActivate,
  onCloseMenu,
  openMenu: onOpenMenu,
  ...props
}: MenuListProps) => {
  const id = useId(idProp);
  const root = useRef<HTMLDivElement>(null);

  // The id generation be,ongs in useIttemsWithIds
  const mapIdxToId = useMemo(() => new Map(), []);

  const handleActivate = (idx: number) => {
    const el = root.current?.querySelector(`:scope > [data-index='${idx}']`);
    el?.id && onActivate?.(el.id);
  };

  const { focusVisible, highlightedIndex, listProps } = useKeyboardNavigation({
    count: React.Children.count(children),
    defaultHighlightedIdx,
    highlightedIndex: highlightedIdxProp,
    onActivate: handleActivate,
    onHighlight: onHighlightMenuItem,
    onOpenMenu,
    onCloseMenu,
  });

  const appliedFocusVisible = childMenuShowing == undefined ? focusVisible : -1;

  useLayoutEffect(() => {
    if (childMenuShowing === undefined && activatedByKeyboard) {
      root.current?.focus();
    }
  }, [activatedByKeyboard, childMenuShowing]);

  const getActiveDescendant = () =>
    highlightedIndex === undefined || highlightedIndex === -1
      ? undefined
      : mapIdxToId.get(highlightedIndex);

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
      const subMenuShowing = hasSubMenu && childMenuShowing === itemId;
      const ariaControls = subMenuShowing ? `${id}-${itemId}` : undefined;

      list.push(
        <MenuItem
          {...props}
          {...propsCommonToAllListItems}
          {...getMenuItemProps(
            itemId,
            idx,
            child.key ?? itemId,
            highlightedIndex,
            appliedFocusVisible,
            className,
            hasSeparator
          )}
          aria-controls={ariaControls}
          aria-haspopup={hasSubMenu || undefined}
          aria-expanded={subMenuShowing || undefined}
        >
          {hasSubMenu
            ? maybeIcon(label ?? children, withIcon, iconName)
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

  return (
    <div
      {...props}
      {...listProps}
      aria-activedescendant={getActiveDescendant()}
      className={cx(classBase, className, {
        [`${classBase}-childMenuShowing`]: childMenuShowing !== undefined,
      })}
      data-root={isRoot || undefined}
      id={id}
      ref={root}
      role="menu"
    >
      {renderContent()}
    </div>
  );
};

const getMenuItemProps = (
  itemId: string,
  idx: number,
  key: string,
  highlightedIdx: number,
  focusVisible: number,
  className: string,
  hasSeparator: boolean
) => ({
  id: `menuitem-${itemId}`,
  key: key ?? idx,
  "data-index": idx,
  "data-highlighted": idx === highlightedIdx || undefined,
  className: cx("vuuMenuItem", className, {
    "vuuMenuItem-separator": hasSeparator,
    focusVisible: focusVisible === idx,
  }),
});

MenuList.displayName = "MenuList";
