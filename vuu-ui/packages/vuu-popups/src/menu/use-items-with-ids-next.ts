import React, { ReactElement, ReactNode, useCallback, useMemo } from "react";
import { isMenuItemLabel, isMenuItemGroup, Separator } from "./MenuList";

type Menus = { [key: string]: ReactElement[] };
type Actions = { [key: string]: { action: string; options?: unknown } };

const getLabelFromChildren = (children: ReactNode) => {
  if (Array.isArray(children) && isMenuItemLabel(children[0])) {
    return children[0];
  }
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
  // If we have a leaf MenuItem, any children will be label etc
  // if we have a GroupMenuItem, firet item mat be Label
  return {
    childWithId: React.cloneElement(child, {
      hasSeparator,
      id: `${path}`,
      key: path,
      children: group ? getLabelFromChildren(children) : children,
    }),
    grandChildren: group ? children : undefined,
  };
};

export const useItemsWithIdsNext = (
  childrenProp: ReactElement[],
  rootId: string
): [Menus, Actions] => {
  const normalizeChildren = useCallback(() => {
    const collectChildren = (
      children: ReactElement[],
      path = rootId,
      menus: Menus = {},
      actions: Actions = {}
    ) => {
      const list: ReactElement[] = (menus[path] = []);
      let idx = 0;
      let hasSeparator = false;

      React.Children.forEach(children, (child) => {
        if (isMenuItemLabel(child)) {
          // do nothing
        } else if (child.type === Separator) {
          hasSeparator = true;
        } else {
          const hasChildItems = isMenuItemGroup(child);
          const childPath = `${path}-${idx}`;
          const {
            props: { action, options },
          } = child;

          const { childWithId, grandChildren } = assignId(
            child,
            childPath,
            hasChildItems,
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

    return collectChildren(childrenProp);
  }, [rootId, childrenProp]);

  const [menus, actions] = useMemo(
    () => normalizeChildren(),
    [normalizeChildren]
  );

  return [menus, actions] as [Menus, Actions];
};
