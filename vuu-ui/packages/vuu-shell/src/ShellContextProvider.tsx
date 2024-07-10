import {
  DefaultColumnConfiguration,
  DefaultTableConfiguration,
  ListOption,
} from "@finos/vuu-table-types";
import type { RpcResponseHandler } from "@finos/vuu-data-types";
import { createContext, ReactElement, ReactNode, useContext } from "react";
import type { VuuTable } from "@finos/vuu-protocol-types";

export type LookupTableProvider = (table: VuuTable) => ListOption[];

export interface ShellContextProps {
  getDefaultColumnConfig?: DefaultColumnConfiguration;
  getDefaultTableConfig?: DefaultTableConfiguration;
  getLookupValues?: LookupTableProvider;
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
