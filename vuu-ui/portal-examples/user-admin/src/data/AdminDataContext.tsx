import { createContext, useContext } from "react";
import type { RemoteModuleDescriptor } from "@vuu-ui/core/portal";
import { EMPTY_CONFIG, type AdminConfig } from "./admin-contract";

export interface AdminDataContextValue {
  remoteModules: readonly RemoteModuleDescriptor[];
}

export const AdminDataContext = createContext<AdminConfig>(EMPTY_CONFIG);
export const AdminRemoteModulesContext = createContext<AdminDataContextValue>({
  remoteModules: [],
});
export const useAdminConfig = () => useContext(AdminDataContext);
export const useAdminModules = () =>
  useContext(AdminRemoteModulesContext).remoteModules;
