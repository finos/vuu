import type { VuuModuleDescriptor } from "@vuu-ui/vuu-protocol-types";

export interface RemoteModuleDescriptor extends VuuModuleDescriptor {
  ComponentProps?: Record<string, unknown>;
}

export interface PortalModuleRegistry {
  modules: RemoteModuleDescriptor[];
}
