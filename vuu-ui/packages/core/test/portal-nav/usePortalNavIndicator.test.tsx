import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NotificationStore } from "../../src/notifications/NotificationStore";
import { PortalNotificationsContext } from "../../src/notifications/PortalNotificationsContext";
import type { PortalNotification } from "../../src/notifications/notification-types";
import {
  type PortalNavIndicator,
  usePortalNavIndicator,
} from "../../src/portal-nav/usePortalNavIndicator";

const notification = (
  id: string,
  moduleIds: string[],
  level: PortalNotification["level"],
): PortalNotification => ({
  attributes: {},
  createdAt: 1000,
  expired: false,
  id,
  initial: false,
  key: `s1:${id}`,
  kind: "silent",
  level,
  message: "",
  origin: { connectionId: "s1", moduleIds, source: "server" },
  read: false,
  receivedAt: 1000,
  title: id,
});

let result: PortalNavIndicator | undefined;

const Probe = ({ moduleIds }: { moduleIds: string[] }) => {
  result = usePortalNavIndicator(moduleIds);
  return null;
};

describe("usePortalNavIndicator", () => {
  let container: HTMLDivElement;
  let root: Root;
  let store: NotificationStore;

  const render = (moduleIds: string[], withStore = true) =>
    act(async () =>
      root.render(
        withStore ? (
          <PortalNotificationsContext.Provider
            value={{ registerHost: () => undefined, store }}
          >
            <Probe moduleIds={moduleIds} />
          </PortalNotificationsContext.Provider>
        ) : (
          <Probe moduleIds={moduleIds} />
        ),
      ),
    );

  beforeEach(() => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    root = createRoot(container);
    store = new NotificationStore();
    result = undefined;
  });

  afterEach(async () => {
    await act(async () => root.unmount());
  });

  it("is undefined without unread notifications or a store", async () => {
    await render(["a"], false);
    expect(result).toBeUndefined();
    await render(["a"]);
    expect(result).toBeUndefined();
  });

  it("reports the count and worst unread severity of the modules", async () => {
    await render(["a", "b"]);
    await act(async () => store.upsert(notification("1", ["a"], "success")));
    expect(result).toEqual({ count: 1, severity: "unread" });
    await act(async () => store.upsert(notification("2", ["b"], "warning")));
    expect(result).toEqual({ count: 2, severity: "warning" });
    await act(async () => store.upsert(notification("3", ["c"], "error")));
    expect(result).toEqual({ count: 2, severity: "warning" });
    await act(async () => store.upsert(notification("4", ["a"], "error")));
    expect(result).toEqual({ count: 3, severity: "error" });
    await act(async () => store.markRead(["s1:4", "s1:2"]));
    expect(result).toEqual({ count: 1, severity: "unread" });
  });

  it("is undefined for notifications the open module claims", async () => {
    await render(["a"]);
    store.setOpenModule("b");
    await act(async () => store.upsert(notification("1", ["a", "b"], "error")));
    expect(result).toBeUndefined();
  });
});
