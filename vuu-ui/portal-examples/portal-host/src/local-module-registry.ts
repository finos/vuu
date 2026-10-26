import type { PortalModuleRegistry } from "@vuu-ui/core";
import registry from "./local-module-registry.json";

/**
 * Modules available to the host in local mode. Entries live in
 * local-module-registry.json; nav icons are served from public/icons.
 * An entry with an empty navLocation is not shown in the nav and is opened
 * by a direct link (e.g. the table viewer).
 */
export const localPortalModuleRegistry: PortalModuleRegistry = registry;
