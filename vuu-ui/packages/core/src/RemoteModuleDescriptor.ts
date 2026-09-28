import type { VuuModuleDescriptor } from "@vuu-ui/vuu-protocol-types";

export interface RemoteModuleDescriptor extends VuuModuleDescriptor {
  ComponentProps?: Record<string, unknown>;
  /**
   * Where the module appears in the portal navigation, e.g.
   * `/Trading/Baskets`. An empty location (`""` or `"/"`) marks a nested
   * module: it is registered and routed but has no navigation entry, and
   * another module renders it with `RemoteModule`.
   */
  navLocation: string;
  /**
   * Key under which the module's saved state is stored. Defaults to
   * `clientIdentifier`. Set it to keep saved state when a module is
   * re-registered with a new client identifier.
   */
  persistenceKey?: string;
}

/**
 * True for a module with no navigation location, i.e. one that is only
 * rendered from within another module.
 */
export const isNestedModule = ({
  navLocation,
}: Pick<RemoteModuleDescriptor, "navLocation">) =>
  !navLocation?.split("/").some(Boolean);

export interface PortalModuleRegistry {
  modules: RemoteModuleDescriptor[];
}
