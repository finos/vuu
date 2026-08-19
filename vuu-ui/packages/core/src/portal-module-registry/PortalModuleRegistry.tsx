import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";

export interface PortalModuleRegistryValue {
  remoteModules: readonly RemoteModuleDescriptor[];
}

const PortalModuleRegistryContext = createContext<PortalModuleRegistryValue>({
  remoteModules: [],
});

export interface PortalModuleRegistryProviderProps {
  children: ReactNode;
  remoteModules: readonly RemoteModuleDescriptor[];
}

export const PortalModuleRegistryProvider = ({
  children,
  remoteModules,
}: PortalModuleRegistryProviderProps) => {
  const value = useMemo<PortalModuleRegistryValue>(
    () => ({ remoteModules }),
    [remoteModules],
  );

  return (
    <PortalModuleRegistryContext.Provider value={value}>
      {children}
    </PortalModuleRegistryContext.Provider>
  );
};

export const usePortalModuleRegistry = () =>
  useContext(PortalModuleRegistryContext);
