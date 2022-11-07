import React, { useLayoutEffect, useMemo, useRef } from "react";
import cx from "classnames";
import { useId } from "../utils";
import { useKeyboardNavigation } from "./use-keyboard-navigation";
import { isMenuItemGroup } from "./use-items-with-ids";

import "./MenuList.css";

const classBase = "hwMenuList";

export const Separator = () => <li className="hwMenuItem-divider" />;

// Purely used as markers, props will be extracted
export const MenuItemGroup = () => null;
// eslint-disable-next-line no-unused-vars
export const MenuItem = ({ children, idx, ...props }) => {
  return <div {...props}>{children}</div>;
};

const hasIcon = (child) => child.props["data-icon"];

const MenuList = ({
  activatedByKeyboard,
  childMenuShowing = -1,
  children,
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
}) => {
  const id = useId(idProp);
  const root = useRef(null);

  // The id generation be,ongs in useIttemsWithIds
  const mapIdxToId = useMemo(() => new Map(), []);

  const handleOpenMenu = (idx) => {
    const el = root.current.querySelector(`:scope > [data-idx='${idx}']`);
    onOpenMenu(el.id);
  };

  const handleActivate = (idx) => {
    const el = root.current.querySelector(`:scope > [data-idx='${idx}']`);
    onActivate(el.id);
  };

  const { focusVisible, highlightedIdx, listProps } = useKeyboardNavigation({
    count: children.length,
    highlightedIdx: highlightedIdxProp,
    onActivate: handleActivate,
    onHighlight: onHighlightMenuItem,
    onOpenMenu: handleOpenMenu,
    onCloseMenu,
    id,
  });

  const appliedFocusVisible = childMenuShowing == -1 ? focusVisible : -1;

  useLayoutEffect(() => {
    if (childMenuShowing === -1 && activatedByKeyboard) {
      root.current.focus();
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
      className={cx(classBase, {
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

    const maybeIcon = (children, withIcon) =>
      withIcon
        ? [<span className="hwIconContainer" key="icon" />].concat(children)
        : children;

    function addClonedChild(list, child, idx, withIcon) {
      const {
        children,
        className,
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
            child.key,
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
            ? maybeIcon(label, withIcon)
            : maybeIcon(children, withIcon)}
        </MenuItem>
      );
      // mapIdxToId.set(idx, itemId);
    }

    const listItems = [];

    if (children && children.length > 0) {
      const withIcon = children.some(hasIcon);

      children.forEach((child, idx) => {
        addClonedChild(listItems, child, idx, withIcon);
      });
    }

    return listItems;
  }
};

const getMenuItemProps = (
  baseId,
  itemId,
  idx,
  key,
  highlightedIdx,
  focusVisible,
  className,
  hasSeparator
) => ({
  id: `${baseId}-${itemId}`,
  key: key ?? idx,
  "data-idx": idx,
  "data-highlighted": idx === highlightedIdx || undefined,
  className: cx("hwMenuItem", className, {
    "hwMenuItem-separator": hasSeparator,
    focusVisible: focusVisible === idx,
  }),
});

MenuList.displayName = "MenuList";
export default MenuList;
