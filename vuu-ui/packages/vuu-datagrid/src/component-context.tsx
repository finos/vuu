import React, { ReactNode } from "react";

type ComponentsType = { [key: string]: unknown };

const ComponentContext = React.createContext<ComponentsType | null>(null);

export interface ComponentProviderProps {
  children: ReactNode;
  components: ComponentsType;
}

export const ComponentProvider = ({
  children,
  components = {},
}: ComponentProviderProps) => {
  return (
    <ComponentContext.Consumer>
      {(parentContext) => (
        <ComponentContext.Provider value={{ ...parentContext, ...components }}>
          {children}
        </ComponentContext.Provider>
      )}
    </ComponentContext.Consumer>
  );
};

export default ComponentContext;
