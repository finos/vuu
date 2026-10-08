import type { LocalVuuServer } from "@vuu-ui/core";
import {
  basketModule,
  createLocalVuuServer,
  moduleAdminModule,
  notificationsModule,
  simulModule,
  userAdminModule,
} from "@vuu-ui/vuu-data-test";

/**
 * In-browser implementations of the Vuu servers used by the remote modules in
 * the local registry. A module whose `config.json` declares a matching
 * `connectionId` gets the data context of that server instead of a
 * websocket, and the table browser lists these servers.
 *
 * `basket` and `simul` include simulated notifications, so their modules
 * show notification badges in the app switcher. Local modules are shared
 * across servers by name, so both servers publish the same notifications.
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
  createLocalVuuServer({
    connectionId: "basket",
    modules: [basketModule, notificationsModule],
  }),
  createLocalVuuServer({
    connectionId: "simul",
    modules: [simulModule, notificationsModule],
  }),
];
