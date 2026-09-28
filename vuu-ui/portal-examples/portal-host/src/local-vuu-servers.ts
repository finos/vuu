import type { LocalVuuServer } from "@vuu-ui/core";
import {
  basketModule,
  createLocalVuuServer,
  moduleAdminModule,
  simulModule,
  userAdminModule,
} from "@vuu-ui/vuu-data-test";
import { localPortalModuleRegistry } from "./local-module-registry";

const localServerModules: Record<
  string,
  Parameters<typeof createLocalVuuServer>[0]["modules"]
> = {
  admin: [userAdminModule, moduleAdminModule],
  basket: [basketModule],
  simul: [simulModule],
};

/**
 * In-browser implementations of the servers listed in the local registry.
 * A remote module rendered with `vuu={{ connectionId }}` gets the data
 * context of the matching server.
 */
export const localVuuServers: LocalVuuServer[] =
  localPortalModuleRegistry.servers.map((server) =>
    createLocalVuuServer({
      ...server,
      modules: localServerModules[server.connectionId] ?? [],
    }),
  );
