import type {
  ContextMenuContextType,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { createContext, ReactNode, useCallback, useMemo } from "react";

export const ContextMenuContext = createContext<ContextMenuContextType | null>(
  null
);

export interface ContextMenuConfiguration {
  menuActionHandler?: MenuActionHandler;
  menuBuilder: MenuBuilder;
}

export interface ContextMenuProviderProps extends ContextMenuConfiguration {
  children: ReactNode;
  label?: string;
}

interface ProviderProps extends ContextMenuProviderProps {
  context: ContextMenuContextType | null;
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
    (reason) => {
      if (menuActionHandler?.(reason)) {
        return true;
      }

      if (context?.menuActionHandler?.(reason)) {
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
