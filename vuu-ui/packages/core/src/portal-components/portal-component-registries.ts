import {
  createWorkspaceComponentRegistries,
  type WorkspaceComponentRegistration,
  type WorkspaceComponentRegistries,
} from "../workspace/workspace-component-registry";
import {
  createPortalModuleComponentRegistration,
  type PortalModuleComponentOptions,
} from "./portal-module-component";
import {
  createVuuTableComponentRegistration,
  type VuuTableComponentOptions,
} from "./vuu-table-component";

export interface PortalComponentRegistriesOptions
  extends VuuTableComponentOptions,
    PortalModuleComponentOptions {
  /**
   * Further component types the host renders in workspaces. A type that is
   * already registered, including `portal-module` and `vuu-table`, throws.
   */
  // biome-ignore lint/suspicious/noExplicitAny: registrations differ in settings type
  additional?: readonly WorkspaceComponentRegistration<any>[];
}

/**
 * Builds the GridLayout settings codecs and renderers for portal
 * workspaces, with the `portal-module` and `vuu-table` component types
 * registered. Pass the result to `GridLayoutProvider` (or `WorkspaceHost`)
 * as `settingsCodecs` and `componentRenderers`.
 */
export const createPortalComponentRegistries = ({
  additional = [],
  renderModule,
  ...vuuTableOptions
}: PortalComponentRegistriesOptions = {}): WorkspaceComponentRegistries =>
  createWorkspaceComponentRegistries<unknown>([
    createPortalModuleComponentRegistration({
      renderModule,
    }) as WorkspaceComponentRegistration<unknown>,
    createVuuTableComponentRegistration(
      vuuTableOptions,
    ) as WorkspaceComponentRegistration<unknown>,
    ...additional,
  ]);
