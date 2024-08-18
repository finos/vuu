import type { RpcResponseHandler } from "@finos/vuu-data-types";
import type {
  DefaultColumnConfiguration,
  DefaultTableConfiguration,
} from "@finos/vuu-table-types";
import { createContext, useContext } from "react";
import { LookupTableProvider } from "./feature-utils";

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
