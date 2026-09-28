import type { VuuModuleDescriptor } from "@vuu-ui/vuu-protocol-types";
import type { VuuServerDescriptor } from "./VuuServerDescriptor";

export interface RemoteModuleDescriptor extends VuuModuleDescriptor {
  ComponentProps?: Record<string, unknown>;
  /**
   * Key under which the module's saved state is stored. Defaults to
   * `clientIdentifier`. Set it to keep saved state when a module is
   * re-registered with a new client identifier.
   */
  persistenceKey?: string;
}

export interface PortalModuleRegistry {
  modules: RemoteModuleDescriptor[];
  /**
   * The Vuu servers available to the user. When omitted, `useVuuServers`
   * falls back to the servers referenced by module `vuu` connections.
   */
  servers?: VuuServerDescriptor[];
}
