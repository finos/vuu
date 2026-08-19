import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";

export const WINDOW_HOST_ROUTE = "/window/:moduleId/*";

export const getWindowHostPath = (moduleId: RemoteModuleDescriptor["id"]) =>
  `/window/${encodeURIComponent(String(moduleId))}`;
