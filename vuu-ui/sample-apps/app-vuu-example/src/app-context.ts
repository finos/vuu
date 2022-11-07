import { RpcResponse } from "@vuu-ui/vuu-data";
import { createContext } from "react";

export interface AppContextProps {
  handleRpcResponse?: (response: RpcResponse) => void;
}

const AppContext = createContext<AppContextProps>({});

export default AppContext;
