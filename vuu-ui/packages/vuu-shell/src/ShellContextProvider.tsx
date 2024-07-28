import type { VuuTable } from "@finos/vuu-protocol-types";
import { ListOption } from "@finos/vuu-table-types";
import { ShellContext, ShellContextProps } from "@finos/vuu-utils";
import { ReactElement, ReactNode } from "react";

export type LookupTableProvider = (table: VuuTable) => ListOption[];

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
