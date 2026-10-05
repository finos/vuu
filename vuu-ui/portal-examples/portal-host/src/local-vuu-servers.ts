import type { LocalVuuServer } from "@vuu-ui/core";
import {
  basketModule,
  createLocalVuuServer,
  moduleAdminModule,
  simulModule,
  userAdminModule,
} from "@vuu-ui/vuu-data-test";

/**
 * In-browser implementations of the Vuu servers used by the remote modules in
 * the local registry. A module whose `config.json` declares a matching
 * `connectionId` gets the data context of that server instead of a
 * websocket, and the table browser lists these servers.
 */
export const localVuuServers: LocalVuuServer[] = [
  createLocalVuuServer({
    connectionId: "module-admin",
    modules: [moduleAdminModule],
  }),
  createLocalVuuServer({
    connectionId: "user-admin",
    modules: [userAdminModule],
  }),
  createLocalVuuServer({ connectionId: "basket", modules: [basketModule] }),
  createLocalVuuServer({ connectionId: "simul", modules: [simulModule] }),
];
