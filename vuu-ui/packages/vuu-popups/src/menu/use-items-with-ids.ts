import React, { ReactElement, useCallback, useMemo } from "react";
import { MenuItemGroup, Separator } from "./MenuList";

export const isMenuItemGroup = (child: ReactElement) =>
  child.type === MenuItemGroup || !!child.props["data-group"];

type Menus = { [key: string]: ReactElement[] };
type Actions = { [key: string]: { action: string; options?: unknown } };

export const useItemsWithIds = (
  childrenProp: ReactElement[]
): [Menus, Actions] => {
  const normalizeChildren = useCallback(() => {
    const collectChildren = (
      children: ReactElement[],
      path = "root",
      menus: Menus = {},
      actions: Actions = {}
    ) => {
      const list: ReactElement[] = (menus[path] = []);
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
          const { childWithId, grandChildren } = assignId(
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

    const assignId = (
      child: ReactElement,
      path: string,
      group: boolean,
      hasSeparator = false
    ) => {
      const {
        props: { children },
      } = child;
      return {
        childWithId: React.cloneElement(child, {
          hasSeparator,
          id: `${path}`,
          key: path,
          children: group ? undefined : children,
        }),
        grandChildren: group ? children : undefined,
      };
    };

    return collectChildren(childrenProp);
  }, [childrenProp]);

  const [menus, actions] = useMemo(
    () => normalizeChildren(),
    [normalizeChildren]
  );

  return [menus, actions] as [Menus, Actions];
};
