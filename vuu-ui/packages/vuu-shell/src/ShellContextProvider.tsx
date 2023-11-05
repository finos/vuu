import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { RpcResponseHandler } from "@finos/vuu-data-react";
import { createContext, ReactElement, ReactNode, useContext } from "react";

export type DefaultColumnConfiguration = <T extends string = string>(
  tableName: T,
  columnName: string
) => Partial<ColumnDescriptor> | undefined;
export interface ShellContextProps {
  getDefaultColumnConfig?: DefaultColumnConfiguration;
  handleRpcResponse?: RpcResponseHandler;
}

const defaultConfig = {};

const ShellContext = createContext<ShellContextProps>(defaultConfig);

export interface ShellProviderProps {
  children: ReactNode;
  value?: ShellContextProps;
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
