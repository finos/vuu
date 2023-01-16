import { createContext, ReactNode, useCallback, useMemo } from "react";

export type MenuActionHandler = (
  type: string,
  options: unknown
) => boolean | undefined;
export type MenuBuilder<L = string, O = unknown> = (
  location: L,
  options: O
) => ContextMenuItemDescriptor[];

export interface ContextMenuContext {
  menuBuilders: MenuBuilder[];
  menuActionHandler: MenuActionHandler;
}

export const ContextMenuContext = createContext<ContextMenuContext | null>(
  null
);

export interface ContextMenuItemBase {
  icon?: string;
  label: string;
  location?: string;
}

export interface ContextMenuLeafItemDescriptor extends ContextMenuItemBase {
  action: string;
  options?: unknown;
}

export interface ContextMenuGroupItemDescriptor extends ContextMenuItemBase {
  children?: ContextMenuItemDescriptor[];
}

export type ContextMenuItemDescriptor =
  | ContextMenuLeafItemDescriptor
  | ContextMenuGroupItemDescriptor;

export interface ContextMenuProviderProps {
  children: ReactNode;
  label?: string;
  menuActionHandler?: MenuActionHandler;
  menuBuilder: MenuBuilder;
}

interface ProviderProps extends ContextMenuProviderProps {
  context: ContextMenuContext | null;
}

const Provider = ({
  children,
  context,
  menuActionHandler,
  menuBuilder,
}: ProviderProps) => {
  const menuBuilders = useMemo(() => {
    if (context?.menuBuilders && menuBuilder) {
      return context.menuBuilders.concat(menuBuilder);
    } else if (menuBuilder) {
      return [menuBuilder];
    } else {
      return context?.menuBuilders || [];
    }
  }, [context, menuBuilder]);

  const handleMenuAction = useCallback(
    (type, options) => {
      if (menuActionHandler?.(type, options)) {
        return true;
      }

      if (context?.menuActionHandler?.(type, options)) {
        return true;
      }
    },
    [context, menuActionHandler]
  );

  return (
    <ContextMenuContext.Provider
      value={{
        menuActionHandler: handleMenuAction,
        menuBuilders,
      }}
    >
      {children}
    </ContextMenuContext.Provider>
  );
};

// Need an option for local menu to override higher-level menu, rather than extend
export const ContextMenuProvider = ({
  children,
  label,
  menuActionHandler,
  menuBuilder,
}: ContextMenuProviderProps) => {
  return (
    <ContextMenuContext.Consumer>
      {(parentContext) => (
        <Provider
          context={parentContext}
          label={label}
          menuActionHandler={menuActionHandler}
          menuBuilder={menuBuilder}
        >
          {children}
        </Provider>
      )}
    </ContextMenuContext.Consumer>
  );
};
