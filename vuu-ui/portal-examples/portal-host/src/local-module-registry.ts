import type { PortalModuleRegistry } from "@vuu-ui/core";
import registry from "./local-module-registry.json";

/**
 * Modules available to the host in local mode. Entries live in
 * local-module-registry.json, in the same format as the registry the server
 * sends with LOGIN_SUCCESS (nav icons as inline base64 data URIs).
 * An entry with an empty navLocation is not shown in the nav and is opened
 * by a direct link (e.g. the table viewer).
 */
export const localPortalModuleRegistry: PortalModuleRegistry = registry;
