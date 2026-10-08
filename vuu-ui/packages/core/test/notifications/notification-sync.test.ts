import { describe, expect, it, vi } from "vitest";
import { NotificationStore } from "../../src/notifications/NotificationStore";
import {
  type NotificationSyncChannel,
  notificationSyncChannelName,
  syncNotificationState,
} from "../../src/notifications/notification-sync";
import type { PortalNotification } from "../../src/notifications/notification-types";

const notification = (
  id: string,
  rest: Partial<PortalNotification> = {},
): PortalNotification => ({
  attributes: {},
  createdAt: Number(id),
  expired: false,
  id,
  initial: true,
  key: `s1:${id}`,
  kind: "toast",
  level: "info",
  message: "",
  origin: { connectionId: "s1", moduleIds: ["a"], source: "server" },
  read: false,
  receivedAt: Number(id),
  title: `title ${id}`,
  ...rest,
});

/** Channels with the same name deliver to each other, but not to themselves. */
class FakeBroadcastChannel implements NotificationSyncChannel {
  static channels: FakeBroadcastChannel[] = [];
  readonly #listeners = new Set<(event: MessageEvent) => void>();
  readonly posted: unknown[] = [];

  constructor(readonly name: string) {
    FakeBroadcastChannel.channels.push(this);
  }

  postMessage(message: unknown) {
    this.posted.push(message);
    for (const channel of FakeBroadcastChannel.channels) {
      if (channel !== this && channel.name === this.name) {
        const data = structuredClone(message);
        for (const listener of channel.#listeners) {
          listener(new MessageEvent("message", { data }));
        }
      }
    }
  }

  addEventListener(_type: "message", listener: (event: MessageEvent) => void) {
    this.#listeners.add(listener);
  }

  removeEventListener(
    _type: "message",
    listener: (event: MessageEvent) => void,
  ) {
    this.#listeners.delete(listener);
  }

  close() {
    FakeBroadcastChannel.channels = FakeBroadcastChannel.channels.filter(
      (channel) => channel !== this,
    );
  }
}

const createPage = (name = notificationSyncChannelName("portal", "steve")) => {
  const store = new NotificationStore();
  const channel = new FakeBroadcastChannel(name);
  const stop = syncNotificationState(store, channel);
  return { channel, stop, store };
};

describe("syncNotificationState", () => {
  it("shares read, unread and delete between pages, without echoes", () => {
    FakeBroadcastChannel.channels = [];
    const tab = createPage();
    const window = createPage();
    for (const store of [tab.store, window.store]) {
      store.upsert(notification("1"));
      store.upsert(notification("2"));
    }

    tab.store.markRead(["s1:1"]);
    expect(window.store.get("s1:1")?.read).toBe(true);
    expect(tab.channel.posted).toHaveLength(1);
    expect(window.channel.posted).toHaveLength(0);

    window.store.markRead(["s1:1"], false);
    expect(tab.store.get("s1:1")?.read).toBe(false);

    window.store.delete(["s1:2"]);
    expect(tab.store.get("s1:2")).toBeUndefined();
    expect(tab.channel.posted).toHaveLength(1);
  });

  it("applies changes to notifications a page does not have yet", () => {
    FakeBroadcastChannel.channels = [];
    const tab = createPage();
    const window = createPage();
    tab.store.upsert(notification("1"));
    tab.store.upsert(notification("2"));
    tab.store.markRead(["s1:1"]);
    tab.store.delete(["s1:2"]);

    window.store.upsert(notification("1"));
    window.store.upsert(notification("2"));
    expect(window.store.get("s1:1")?.read).toBe(true);
    expect(window.store.get("s1:2")).toBeUndefined();
  });

  it("sends the keys marked by mark all read", () => {
    FakeBroadcastChannel.channels = [];
    const tab = createPage();
    const window = createPage();
    tab.store.upsert(notification("1"));
    window.store.upsert(notification("1"));
    window.store.upsert(
      notification("3", {
        origin: { connectionId: "s2", moduleIds: ["b"], source: "server" },
      }),
    );
    tab.store.markRead("all");
    expect(window.store.get("s1:1")?.read).toBe(true);
    expect(window.store.get("s1:3")?.read).toBe(false);
  });

  it("does not send evictions, and ignores other portals and messages", () => {
    FakeBroadcastChannel.channels = [];
    const tab = createPage();
    const other = createPage(notificationSyncChannelName("other", "steve"));
    other.store.upsert(notification("1"));
    tab.store.upsert(notification("1", { expired: true }));
    tab.store.clear();
    expect(tab.channel.posted).toEqual([]);

    const listener = vi.fn();
    tab.store.subscribe(listener);
    tab.channel.postMessage("hello");
    const page = createPage();
    page.channel.postMessage({ type: "unknown" });
    expect(listener).not.toHaveBeenCalled();
    tab.store.markRead("all");
    expect(other.store.get("s1:1")?.read).toBe(false);
  });

  it("stops syncing", () => {
    FakeBroadcastChannel.channels = [];
    const tab = createPage();
    const window = createPage();
    window.store.upsert(notification("1"));
    window.stop();
    tab.store.upsert(notification("1"));
    tab.store.markRead(["s1:1"]);
    expect(window.store.get("s1:1")?.read).toBe(false);
  });
});
