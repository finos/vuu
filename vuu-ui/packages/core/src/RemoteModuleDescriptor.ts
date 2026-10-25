import type { VuuModuleDescriptor } from "@vuu-ui/vuu-protocol-types";
import type { ContextPanelPlacement } from "./context-panel/ContextPanelSlot";

export interface RemoteModuleDescriptor extends VuuModuleDescriptor {
  /**
   * Where content the module shows in the context panel is displayed.
   * Defaults to `"shell"`.
   */
  contextPanelPlacement?: ContextPanelPlacement;
  /**
   * The export of the `mfComponent` module to render. Defaults to
   * `"default"`.
   */
  mfExport?: string;
  /**
   * Where the module appears in the portal navigation, e.g.
   * `/Trading/Baskets`. An empty location (`""` or `"/"`) marks a nested
   * module: it is registered and routed but has no navigation entry, and
   * another module renders it with `RemoteModule`. A palette-only module
   * (see `isPaletteOnlyModule`) has no location.
   */
  navLocation?: string;
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

/**
 * True for a module which has a route, i.e. a `path`. A palette-only module
 * has none.
 */
export const isRoutedModule = <T extends Pick<RemoteModuleDescriptor, "path">>(
  module: T,
): module is T & { path: string } =>
  typeof module.path === "string" && module.path.length > 0;

/**
 * True for a module which is only available in the Panels palette: it has
 * `workspace` metadata, but no route (`path`) and so no navigation entry.
 */
export const isPaletteOnlyModule = (
  module: Pick<RemoteModuleDescriptor, "path" | "workspace">,
) => module.workspace !== undefined && !isRoutedModule(module);

export interface PortalModuleRegistry {
  modules: RemoteModuleDescriptor[];
}
