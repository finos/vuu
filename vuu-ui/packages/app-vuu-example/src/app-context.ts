import { VuuTable } from "@vuu-ui/data-types";
import { createContext } from "react";

export type RpcResponse = {
  action: {
    type: "OPEN_DIALOG_ACTION";
    table: VuuTable;
  };
};

export interface AppContextProps {
  handleRpcResponse?: (response: RpcResponse) => void;
}

const AppContext = createContext<AppContextProps>({});

export default AppContext;
