import { MenuRpcResponse } from "@finos/vuu-data";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { createContext, ReactElement, ReactNode, useContext } from "react";

export interface ShellContextProps {
  getDefaultColumnConfig?: (
    tableName: string,
    columnName: string
  ) => Partial<ColumnDescriptor>;
  handleRpcResponse?: (response: MenuRpcResponse) => void;
}

const defaultConfig = {};

const ShellContext = createContext<ShellContextProps>(defaultConfig);

export interface ShellProviderProps {
  children: ReactNode;
  value: ShellContextProps;
}

const Provider = ({
  children,
  context,
  inheritedContext,
}: {
  children: ReactNode;
  context?: ShellContextProps;
  inheritedContext?: ShellContextProps;
}) => {
  // TODO functions provided at multiple levels must be merged
  const mergedContext = {
    ...inheritedContext,
    ...context,
  };
  return (
    <ShellContext.Provider value={mergedContext}>
      {children}
    </ShellContext.Provider>
  );
};

export const ShellContextProvider = ({
  children,
  value,
}: ShellProviderProps): ReactElement => {
  return (
    <ShellContext.Consumer>
      {(context) => (
        <Provider context={value} inheritedContext={context}>
          {children}
        </Provider>
      )}
    </ShellContext.Consumer>
  );
};

export const useShellContext = () => {
  return useContext(ShellContext);
};
