import type { RemoteModuleConnection } from "@vuu-ui/vuu-data-types";
import type { ComponentType, ReactNode } from "react";

/**
 * A Vuu server referenced by the `vuu` connection of one or more registered
 * modules. `restUrl` and `websocketUrl` are absent when the server is the
 * portal's own Vuu server.
 */
export interface VuuServerDescriptor extends RemoteModuleConnection {
  /** Titles of the registered modules that use this server. */
  moduleTitles: string[];
}

/**
 * A Vuu server simulated in the browser, used when the portal runs in local
 * mode. `DataSourceProvider` supplies the data context (serverAPI and
 * VuuDataSource) for the tables this server publishes.
 */
export interface LocalVuuServer {
  connectionId: string;
  DataSourceProvider: ComponentType<{ children: ReactNode }>;
}
