import type {
  NotificationInput,
  NotificationModule,
} from "@vuu-ui/vuu-data-test";

export interface LocalNotificationsDevtools {
  /** Connection ids of the local servers that publish notifications. */
  servers: () => string[];
  /**
   * Publishes a notification on a local server, as the server would. Nav
   * items of modules using that server show an unread badge. Returns the id.
   * Pass `expiresInMs` to have the server delete it after a delay.
   */
  publish: (
    connectionId: string,
    notification?: NotificationInput & { expiresInMs?: number },
  ) => string;
  /** Deletes (expires) a notification published on a local server. */
  delete: (connectionId: string, id: string) => void;
  /** Starts random notifications on one, or every, local server. */
  startSimulation: (connectionId?: string) => void;
  /** Stops random notifications on one, or every, local server. */
  stopSimulation: (connectionId?: string) => void;
}

declare global {
  interface Window {
    vuuNotifications?: LocalNotificationsDevtools;
  }
}

/**
 * Adds `window.vuuNotifications`, for creating notifications on the local
 * servers from the devtools console, e.g.
 *
 *   vuuNotifications.publish("basket", { title: "Order filled", level: "WARNING" })
 */
export const installLocalNotificationsDevtools = (
  modules: ReadonlyMap<string, NotificationModule>,
) => {
  const getModule = (connectionId: string) => {
    const module = modules.get(connectionId);
    if (!module) {
      throw Error(
        `[vuuNotifications] unknown server '${connectionId}', expected one of ${[...modules.keys()].join(", ")}`,
      );
    }
    return module;
  };
  const modulesFor = (connectionId?: string) =>
    connectionId === undefined
      ? [...modules.values()]
      : [getModule(connectionId)];

  const devtools: LocalNotificationsDevtools = {
    servers: () => [...modules.keys()],
    publish: (connectionId, { expiresInMs, ...notification } = {}) =>
      getModule(connectionId).publish({
        ...notification,
        expiryTime:
          expiresInMs === undefined
            ? notification.expiryTime
            : Date.now() + expiresInMs,
      }),
    delete: (connectionId, id) => {
      const table = getModule(connectionId).tables.notifications;
      if (table.findByKey(id)) {
        table.delete(id);
      }
    },
    startSimulation: (connectionId) => {
      for (const module of modulesFor(connectionId)) {
        module.start();
      }
    },
    stopSimulation: (connectionId) => {
      for (const module of modulesFor(connectionId)) {
        module.stop();
      }
    },
  };

  window.vuuNotifications = devtools;
  console.info(
    `[vuuNotifications] vuuNotifications.publish(connectionId, { title, message, level, type }), servers: ${devtools.servers().join(", ")}`,
  );
  return devtools;
};
