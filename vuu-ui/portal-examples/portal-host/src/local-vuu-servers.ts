import type { LocalVuuServer } from "@vuu-ui/core";
import {
  basketModule,
  createLocalVuuServer,
  moduleAdminModule,
  type NotificationModule,
  SimulatedNotificationsModule,
  simulModule,
  userAdminModule,
} from "@vuu-ui/vuu-data-test";

/**
 * Each local server has its own NOTIFICATIONS module, so a notification
 * published on one server only badges the nav items of modules using that
 * server. `basket` and `simul` also generate random notifications; the
 * admin servers only publish notifications created from the devtools
 * console (see local-notifications-devtools.ts).
 */
export const localNotificationModules: ReadonlyMap<string, NotificationModule> =
  new Map([
    ["module-admin", SimulatedNotificationsModule({ simulate: false })],
    ["user-admin", SimulatedNotificationsModule({ simulate: false })],
    ["basket", SimulatedNotificationsModule({ simulate: false })],
    ["simul", SimulatedNotificationsModule({ simulate: false })],
  ]);

const notificationsFor = (connectionId: string) => {
  const module = localNotificationModules.get(connectionId);
  if (!module) {
    throw Error(`no notifications module for local server ${connectionId}`);
  }
  return module;
};

/**
 * In-browser implementations of the Vuu servers used by the remote modules in
 * the local registry. A module whose `config.json` declares a matching
 * `connectionId` gets the data context of that server instead of a
 * websocket, and the table browser lists these servers.
 */
export const localVuuServers: LocalVuuServer[] = [
  createLocalVuuServer({
    connectionId: "module-admin",
    modules: [moduleAdminModule, notificationsFor("module-admin")],
  }),
  createLocalVuuServer({
    connectionId: "user-admin",
    modules: [userAdminModule, notificationsFor("user-admin")],
  }),
  createLocalVuuServer({
    connectionId: "basket",
    modules: [basketModule, notificationsFor("basket")],
  }),
  createLocalVuuServer({
    connectionId: "simul",
    modules: [simulModule, notificationsFor("simul")],
  }),
];
