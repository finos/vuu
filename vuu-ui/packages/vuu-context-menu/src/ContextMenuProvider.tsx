import {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";

import { ContextMenuItemDescriptor } from "./menu-utils";

export type MenuActionHandler = (
  menuItemId: string,
  options?: unknown,
) => boolean | undefined;

export type MenuBuilder<Location extends string = string, Options = unknown> = (
  location: Location,
  options: Options,
) => ContextMenuItemDescriptor[];

export interface ContextMenuContextType {
  menuBuilders: MenuBuilder[];
  menuActionHandler: MenuActionHandler;
  showContextMenu: (contextMenu: ReactElement | null) => void;
}

export const ContextMenuContext = createContext<ContextMenuContextType | null>(
  null,
);

export interface ContextMenuProviderProps<
  L extends string = string,
  O = unknown,
> {
  children: ReactNode;
  menuActionHandler?: MenuActionHandler;
  menuBuilder?: MenuBuilder<L, O>;
}

interface ProviderProps<L extends string = string, O = unknown>
  extends ContextMenuProviderProps<L, O> {
  context: ContextMenuContextType | null;
}

const Provider = <L extends string = string, O = unknown>({
  children,
  context,
  menuActionHandler,
  menuBuilder,
}: ProviderProps<L, O>) => {
  const [contextMenu, setContextMenu] = useState<ReactElement | null>(null);
  const showContextMenu = useMemo(() => {
    if (context?.showContextMenu) {
      return context.showContextMenu;
    } else {
      return (contextMenu: ReactElement | null) => {
        setContextMenu(contextMenu);
      };
    }
  }, [context]);
  const menuBuilders = useMemo(() => {
    if (context?.menuBuilders && menuBuilder) {
      // menuBuilder may have a narrower type than the inherited menuBuilders, discard this
      return context.menuBuilders.concat(menuBuilder as MenuBuilder);
    } else if (menuBuilder) {
      return [menuBuilder as MenuBuilder];
    } else {
      return context?.menuBuilders || [];
    }
  }, [context, menuBuilder]);

  const handleMenuAction = useCallback<MenuActionHandler>(
    (menuItemId, options) => {
      if (menuActionHandler?.(menuItemId, options)) {
        return true;
      }

      if (context?.menuActionHandler?.(menuItemId, options)) {
        return true;
      }
    },
    [context, menuActionHandler],
  );

  return (
    <ContextMenuContext.Provider
      value={{
        menuActionHandler: handleMenuAction,
        menuBuilders,
        showContextMenu,
      }}
    >
      {children}
      {contextMenu}
    </ContextMenuContext.Provider>
  );
};

export const ContextMenuProvider = <L extends string = string, O = unknown>({
  children,
  menuActionHandler,
  menuBuilder,
}: ContextMenuProviderProps<L, O>) => {
  return (
    <ContextMenuContext.Consumer>
      {(parentContext) => (
        <Provider<L, O>
          context={parentContext}
          menuActionHandler={menuActionHandler}
          menuBuilder={menuBuilder}
        >
          {children}
        </Provider>
      )}
    </ContextMenuContext.Consumer>
  );
};
