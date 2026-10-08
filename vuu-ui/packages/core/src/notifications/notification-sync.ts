import type { NotificationStore } from "./NotificationStore";
import type { NotificationStoreEvent } from "./notification-types";

/** The parts of a `BroadcastChannel` the sync uses. */
export interface NotificationSyncChannel {
  postMessage(message: unknown): void;
  addEventListener(
    type: "message",
    listener: (event: MessageEvent) => void,
  ): void;
  removeEventListener(
    type: "message",
    listener: (event: MessageEvent) => void,
  ): void;
  close(): void;
}

/** Read, unread and deleted keys, with the time read or deleted. */
export interface NotificationSyncMessage {
  type: "vuu-notification-state";
  version: 1;
  read: Record<string, number>;
  unread: string[];
  deleted: Record<string, number>;
}

export const notificationSyncChannelName = (portalId: string, user: string) =>
  `vuu-portal-notifications:${portalId}:${user}`;

const isSyncMessage = (data: unknown): data is NotificationSyncMessage =>
  typeof data === "object" &&
  data !== null &&
  (data as NotificationSyncMessage).type === "vuu-notification-state" &&
  (data as NotificationSyncMessage).version === 1;

const timed = (keys: readonly string[], time: number) =>
  Object.fromEntries(keys.map((key) => [key, time]));

/**
 * Keeps the read and deleted state of the stores of other pages of the
 * portal (tabs and module windows) in step with this one. Changes received
 * from the channel are applied without being sent back.
 */
export const syncNotificationState = (
  store: NotificationStore,
  channel: NotificationSyncChannel,
  now: () => number = Date.now,
) => {
  let applying = false;

  const post = (changes: Partial<NotificationSyncMessage>) => {
    const message: NotificationSyncMessage = {
      deleted: {},
      read: {},
      type: "vuu-notification-state",
      unread: [],
      version: 1,
      ...changes,
    };
    try {
      channel.postMessage(message);
    } catch (error) {
      console.warn("[NotificationSync] could not post", error);
    }
  };

  const onStoreEvent = (event: NotificationStoreEvent) => {
    if (applying) {
      return;
    }
    if (event.type === "read-state") {
      const keys =
        event.keys === "all"
          ? store
              .query()
              .filter(({ read }) => read === event.read)
              .map(({ key }) => key)
          : event.keys;
      if (keys.length > 0) {
        post(event.read ? { read: timed(keys, now()) } : { unread: keys });
      }
    } else if (event.type === "removed" && event.deleted) {
      post({ deleted: timed(event.keys, now()) });
    }
  };

  const onMessage = ({ data }: MessageEvent) => {
    if (!isSyncMessage(data)) {
      return;
    }
    applying = true;
    try {
      if (
        Object.keys(data.read).length > 0 ||
        Object.keys(data.deleted).length > 0
      ) {
        store.loadReadState({
          deleted: data.deleted,
          read: data.read,
          version: 1,
        });
      }
      if (data.unread.length > 0) {
        store.markRead(data.unread, false);
      }
    } finally {
      applying = false;
    }
  };

  const unsubscribe = store.subscribe(onStoreEvent);
  channel.addEventListener("message", onMessage);
  return () => {
    unsubscribe();
    channel.removeEventListener("message", onMessage);
  };
};
