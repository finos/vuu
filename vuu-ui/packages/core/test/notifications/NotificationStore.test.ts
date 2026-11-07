import { describe, expect, it, vi } from "vitest";
import {
  isNotificationReadState,
  NotificationStore,
} from "../../src/notifications/NotificationStore";
import type { PortalNotification } from "../../src/notifications/notification-types";

const DAY = 24 * 60 * 60 * 1000;

const notification = (
  id: string,
  {
    connectionId = "s1",
    createdAt = 1000,
    moduleIds = ["a"],
    ...rest
  }: Partial<PortalNotification> & {
    connectionId?: string;
    moduleIds?: (string | number)[];
  } = {},
): PortalNotification => ({
  attributes: {},
  createdAt,
  expired: false,
  id,
  initial: false,
  key: `${connectionId}:${id}`,
  kind: "toast",
  level: "info",
  message: `message ${id}`,
  origin: { connectionId, moduleIds, source: "server" },
  read: false,
  receivedAt: createdAt,
  title: `title ${id}`,
  ...rest,
});

const clock = (start = 10_000) => {
  let time = start;
  return {
    advance: (ms: number) => {
      time += ms;
    },
    now: () => time,
  };
};

describe("NotificationStore", () => {
  it("adds notifications and counts unread per module, server and portal", () => {
    const store = new NotificationStore();
    store.upsert(notification("1", { moduleIds: ["a"] }));
    store.upsert(notification("2", { moduleIds: ["a", "b"] }));
    store.upsert(notification("3", { connectionId: "s2", moduleIds: [] }));
    expect(store.size).toBe(3);
    expect(store.unreadCount()).toBe(3);
    expect(store.unreadCount({ moduleIds: ["a"] })).toBe(2);
    expect(store.unreadCount({ moduleIds: ["b"] })).toBe(1);
    expect(store.unreadCount({ moduleIds: ["a", "b"] })).toBe(3);
    expect(store.unreadCount({ connectionIds: ["s1"] })).toBe(2);
    expect(store.unreadCount({ connectionIds: ["s2"] })).toBe(1);
    expect(store.unreadPortalCount).toBe(1);
  });

  it("updates in place, keeping read, initial and receivedAt", () => {
    const store = new NotificationStore();
    store.upsert(notification("1", { initial: true, receivedAt: 5 }));
    store.markRead(["s1:1"]);
    store.upsert(notification("1", { message: "changed", receivedAt: 99 }));
    const updated = store.get("s1:1");
    expect(updated).toMatchObject({
      initial: true,
      message: "changed",
      read: true,
      receivedAt: 5,
    });
    expect(store.unreadCount()).toBe(0);
  });

  it("emits only for real changes", () => {
    const store = new NotificationStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.upsert(notification("1"));
    store.upsert(notification("1"));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "added" }),
    );
    const version = store.getSnapshot();
    store.upsert(notification("1", { title: "new" }));
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "updated" }),
    );
    expect(store.getSnapshot()).toBeGreaterThan(version);
  });

  it("marks expired, and back again if the row reappears", () => {
    const store = new NotificationStore();
    store.upsert(notification("1"));
    store.expire("s1:1");
    expect(store.get("s1:1")?.expired).toBe(true);
    expect(store.query({ includeExpired: false })).toEqual([]);
    store.upsert(notification("1"));
    expect(store.get("s1:1")?.expired).toBe(false);
  });

  it("marks read and unread, individually or all", () => {
    const store = new NotificationStore();
    store.upsert(notification("1"));
    store.upsert(notification("2"));
    const listener = vi.fn();
    store.subscribe(listener);
    store.markRead(["s1:1"]);
    expect(listener).toHaveBeenLastCalledWith({
      keys: ["s1:1"],
      read: true,
      type: "read-state",
    });
    expect(store.unreadCount()).toBe(1);
    store.markRead("all");
    expect(store.unreadCount()).toBe(0);
    store.markRead(["s1:2"], false);
    expect(store.unreadCount({ moduleIds: ["a"] })).toBe(1);
  });

  it("does not re-add deleted server notifications", () => {
    const store = new NotificationStore();
    store.upsert(notification("1"));
    store.upsert(
      notification("c", {
        connectionId: undefined,
        key: "client:c",
        origin: { moduleIds: [], source: "client" },
      }),
    );
    store.delete("all");
    expect(store.size).toBe(0);
    expect(store.unreadCount()).toBe(0);
    store.upsert(notification("1"));
    expect(store.size).toBe(0);
    expect(store.getReadState().deleted).toEqual({
      "s1:1": expect.any(Number),
    });
  });

  it("marks notifications for the open module read, now and as they arrive", () => {
    const store = new NotificationStore();
    store.upsert(notification("1", { moduleIds: ["a"] }));
    store.upsert(notification("2", { moduleIds: ["b"] }));
    store.setOpenModule("a");
    expect(store.unreadCount({ moduleIds: ["a"] })).toBe(0);
    expect(store.unreadCount({ moduleIds: ["b"] })).toBe(1);
    store.upsert(notification("3", { moduleIds: ["a"] }));
    expect(store.get("s1:3")?.read).toBe(true);
    store.setOpenModule(undefined);
    store.upsert(notification("4", { moduleIds: ["a"] }));
    expect(store.get("s1:4")?.read).toBe(false);
  });

  it("leaves banners unread when their module is open", () => {
    const store = new NotificationStore();
    store.upsert(notification("1", { kind: "banner" }));
    store.setOpenModule("a");
    store.upsert(notification("2", { kind: "banner" }));
    store.reattribute(() => ["a"]);
    expect(store.unreadCount({ moduleIds: ["a"] })).toBe(2);
  });

  it("reattributes notifications and moves their counts", () => {
    const store = new NotificationStore();
    store.upsert(notification("1", { moduleIds: [] }));
    expect(store.unreadPortalCount).toBe(1);
    store.reattribute(() => ["b"]);
    expect(store.unreadPortalCount).toBe(0);
    expect(store.unreadCount({ moduleIds: ["b"] })).toBe(1);
    expect(store.get("s1:1")?.origin.moduleIds).toEqual(["b"]);
  });

  it("reattributing to the open module marks read", () => {
    const store = new NotificationStore();
    store.setOpenModule("b");
    store.upsert(notification("1", { moduleIds: [] }));
    store.reattribute(() => ["b"]);
    expect(store.get("s1:1")?.read).toBe(true);
  });

  it("queries newest first, with filters", () => {
    const store = new NotificationStore();
    store.upsert(notification("1", { createdAt: 1, level: "error" }));
    store.upsert(
      notification("2", {
        attributes: { source: "Pricing" },
        connectionId: "s2",
        createdAt: 3,
        moduleIds: ["b"],
      }),
    );
    store.upsert(notification("3", { createdAt: 2, kind: "banner" }));
    const keys = (list: readonly PortalNotification[]) =>
      list.map(({ key }) => key);
    expect(keys(store.query())).toEqual(["s2:2", "s1:3", "s1:1"]);
    expect(store.latest()?.key).toBe("s2:2");
    expect(keys(store.query({ levels: ["error"] }))).toEqual(["s1:1"]);
    expect(keys(store.query({ kinds: ["banner"] }))).toEqual(["s1:3"]);
    expect(keys(store.query({ connectionIds: ["s2"] }))).toEqual(["s2:2"]);
    expect(keys(store.query({ moduleIds: ["a"] }))).toEqual(["s1:3", "s1:1"]);
    expect(keys(store.query({ since: 2 }))).toEqual(["s2:2", "s1:3"]);
    expect(keys(store.query({ text: "pricing" }))).toEqual(["s2:2"]);
    store.markRead(["s1:1"]);
    expect(keys(store.query({ read: true }))).toEqual(["s1:1"]);
  });

  it("evicts the oldest read notifications first over the cap", () => {
    const store = new NotificationStore({ maxNotifications: 2 });
    store.upsert(notification("1", { createdAt: 1 }));
    store.upsert(notification("2", { createdAt: 2 }));
    store.markRead(["s1:2"]);
    store.upsert(notification("3", { createdAt: 3 }));
    expect(store.query().map(({ key }) => key)).toEqual(["s1:3", "s1:1"]);
    store.upsert(notification("4", { createdAt: 4 }));
    expect(store.query().map(({ key }) => key)).toEqual(["s1:4", "s1:3"]);
  });

  it("prunes expired notifications and old read state", () => {
    const { advance, now } = clock();
    const store = new NotificationStore({ now });
    store.upsert(notification("1"));
    store.upsert(notification("2"));
    store.markRead(["s1:2"]);
    store.expire("s1:1");
    advance(DAY + 1);
    store.prune();
    expect(store.get("s1:1")).toBeUndefined();
    expect(store.get("s1:2")).toBeDefined();
    advance(7 * DAY);
    expect(store.getReadState().read).toEqual({});
  });

  it("round-trips read state", () => {
    const store = new NotificationStore();
    store.upsert(notification("1"));
    store.upsert(notification("2"));
    store.markRead(["s1:1"]);
    store.delete(["s1:2"]);
    const state = store.getReadState();
    expect(isNotificationReadState(state)).toBe(true);
    expect(isNotificationReadState({ version: 2 })).toBe(false);

    const restored = new NotificationStore();
    restored.upsert(notification("1"));
    restored.upsert(notification("2"));
    restored.upsert(notification("3"));
    restored.loadReadState(state);
    expect(restored.get("s1:1")?.read).toBe(true);
    expect(restored.get("s1:2")).toBeUndefined();
    expect(restored.unreadCount()).toBe(1);

    const later = new NotificationStore();
    later.loadReadState(state);
    later.upsert(notification("1"));
    later.upsert(notification("2"));
    expect(later.get("s1:1")?.read).toBe(true);
    expect(later.get("s1:2")).toBeUndefined();
  });

  it("clears everything", () => {
    const store = new NotificationStore();
    store.upsert(notification("1"));
    store.markRead(["s1:1"]);
    store.clear();
    expect(store.size).toBe(0);
    store.upsert(notification("1"));
    expect(store.get("s1:1")?.read).toBe(false);
    expect(store.unreadCount()).toBe(1);
  });
});

describe("unreadSeverity", () => {
  it("is the worst unread level over the modules: error > warning > unread", () => {
    const store = new NotificationStore();
    expect(store.unreadSeverity(["a", "b"])).toBeUndefined();
    store.upsert(notification("1", { level: "success", moduleIds: ["a"] }));
    expect(store.unreadSeverity(["a"])).toBe("unread");
    store.upsert(notification("2", { level: "warning", moduleIds: ["b"] }));
    expect(store.unreadSeverity(["a"])).toBe("unread");
    expect(store.unreadSeverity(["a", "b"])).toBe("warning");
    store.upsert(notification("3", { level: "error", moduleIds: ["a", "c"] }));
    expect(store.unreadSeverity(["a", "b"])).toBe("error");
    expect(store.unreadSeverity(["c"])).toBe("error");
    expect(store.unreadSeverity(["d"])).toBeUndefined();
  });

  it("only counts unread notifications", () => {
    const store = new NotificationStore();
    store.upsert(notification("1", { level: "error" }));
    store.upsert(notification("2", { level: "warning" }));
    store.markRead(["s1:1"]);
    expect(store.unreadSeverity(["a"])).toBe("warning");
    store.markRead("all");
    expect(store.unreadSeverity(["a"])).toBeUndefined();
    store.markRead(["s1:1"], false);
    expect(store.unreadSeverity(["a"])).toBe("error");
  });

  it("follows level changes, reattribution, deletion and clear", () => {
    const store = new NotificationStore();
    store.upsert(notification("1", { level: "info" }));
    store.upsert(notification("1", { level: "error" }));
    expect(store.unreadSeverity(["a"])).toBe("error");
    store.reattribute(() => ["b"]);
    expect(store.unreadSeverity(["a"])).toBeUndefined();
    expect(store.unreadSeverity(["b"])).toBe("error");
    store.delete(["s1:1"]);
    expect(store.unreadSeverity(["b"])).toBeUndefined();
    store.upsert(notification("2", { level: "warning" }));
    store.clear();
    expect(store.unreadSeverity(["a"])).toBeUndefined();
  });

  it("ignores notifications attributed to the open module", () => {
    const store = new NotificationStore();
    store.setOpenModule("a");
    store.upsert(notification("1", { level: "error", moduleIds: ["a", "b"] }));
    expect(store.unreadSeverity(["b"])).toBeUndefined();
  });
});

describe("topic", () => {
  it("updates a notification whose topic changes", () => {
    const store = new NotificationStore();
    const events: string[] = [];
    store.subscribe((event) => events.push(event.type));
    store.upsert(notification("1", { topic: "orders" }));
    store.upsert(notification("1", { topic: "risk" }));
    expect(store.get("s1:1")?.topic).toBe("risk");
    expect(events).toEqual(["added", "updated"]);
  });

  it("matches the topic in text queries", () => {
    const store = new NotificationStore();
    store.upsert(notification("1", { topic: "orders" }));
    store.upsert(notification("2"));
    expect(store.query({ text: "ORDERS" }).map(({ id }) => id)).toEqual(["1"]);
  });
});
