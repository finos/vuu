import type { RemoteModuleConnection } from "@vuu-ui/vuu-data-types";
import type { ComponentType, ReactNode } from "react";

/**
 * A Vuu server the portal can connect to. The portal registry may publish a
 * list of these so that modules such as the table browser can offer the user
 * a choice of server. `restUrl` and `websocketUrl` may be omitted when the
 * server is the portal's own Vuu server.
 */
export interface VuuServerDescriptor extends RemoteModuleConnection {
  description?: string;
  title: string;
}

/**
 * A Vuu server simulated in the browser, used when the portal runs in local
 * mode. `DataSourceProvider` supplies the data context (serverAPI and
 * VuuDataSource) for the tables this server publishes.
 */
export interface LocalVuuServer extends VuuServerDescriptor {
  DataSourceProvider: ComponentType<{ children: ReactNode }>;
}
