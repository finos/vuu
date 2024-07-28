import { RpcResponseHandler } from "packages/vuu-data-types";
import { LookupTableProvider } from "packages/vuu-shell/src";
import {
  DefaultColumnConfiguration,
  DefaultTableConfiguration,
} from "packages/vuu-table-types";
import { createContext, useContext } from "react";

export interface ShellContextProps {
  getDefaultColumnConfig?: DefaultColumnConfiguration;
  getDefaultTableConfig?: DefaultTableConfiguration;
  getLookupValues?: LookupTableProvider;
  handleRpcResponse?: RpcResponseHandler;
}

const defaultConfig = {};

export const ShellContext = createContext<ShellContextProps>(defaultConfig);

export const useShellContext = () => {
  return useContext(ShellContext);
};
