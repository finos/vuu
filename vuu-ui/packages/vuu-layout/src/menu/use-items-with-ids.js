import React, { useCallback, useMemo } from "react";
import { MenuItemGroup, Separator } from "./MenuList";

export const isMenuItemGroup = (child) =>
  child.type === MenuItemGroup || !!child.props["data-group"];

export const useItemsWithIds = (sourceProp, childrenProp) => {
  const normalizeChildren = useCallback(() => {
    if (childrenProp === undefined) {
      return;
    }

    const collectChildren = (
      children,
      path = "root",
      menus = {},
      actions = {}
    ) => {
      const list = (menus[path] = []);
      let idx = 0;
      let hasSeparator = false;

      React.Children.forEach(children, (child) => {
        if (child.type === Separator) {
          hasSeparator = true;
        } else {
          const group = isMenuItemGroup(child);
          const childPath = path === "root" ? `${idx}` : `${path}.${idx}`;
          const {
            props: { action, options },
          } = child;
          const [childWithId, grandChildren] = assignId(
            child,
            childPath,
            group,
            hasSeparator
          );
          list.push(childWithId);
          if (grandChildren) {
            collectChildren(grandChildren, childPath, menus, actions);
          } else {
            actions[childPath] = { action, options };
          }
          idx += 1;
          hasSeparator = false;
        }
      });
      return [menus, actions];
    };

    const assignId = (child, path, group, hasSeparator = false) => {
      const {
        props: { children },
      } = child;
      return [
        React.cloneElement(child, {
          hasSeparator,
          id: `${path}`,
          key: path,
          children: group ? undefined : children,
        }),
        group ? children : undefined,
      ];
    };

    return collectChildren(childrenProp);
  }, [childrenProp]);

  const [children, actions] = useMemo(
    () => normalizeChildren(),
    [normalizeChildren]
  );

  return [children, actions];
};
