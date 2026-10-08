import { act, useEffect } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Notification } from "../src/NotificationsContext";
import {
  NotificationOriginProvider,
  NotificationsProvider,
  useNotifications,
} from "../src/NotificationsProvider";

const toast: Notification = {
  header: "Saved",
  status: "success",
  type: "toast",
};

const Raise = ({ notification = toast }: { notification?: Notification }) => {
  const { showNotification } = useNotifications();
  useEffect(() => {
    showNotification(notification);
  }, [notification, showNotification]);
  return null;
};

const toasts = () => document.querySelectorAll(".vuuToastNotification");

describe("NotificationsProvider", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it("shows notifications from a nested provider once, in the outer provider", async () => {
    const interceptor = vi.fn(() => "present" as const);
    await act(async () =>
      root.render(
        <NotificationsProvider interceptor={interceptor}>
          <NotificationsProvider interceptor={() => "suppress"}>
            <Raise />
          </NotificationsProvider>
        </NotificationsProvider>,
      ),
    );
    expect(interceptor).toHaveBeenCalledTimes(1);
    expect(toasts()).toHaveLength(1);
  });

  it("does not show notifications the interceptor suppresses", async () => {
    await act(async () =>
      root.render(
        <NotificationsProvider interceptor={() => "suppress"}>
          <Raise />
        </NotificationsProvider>,
      ),
    );
    expect(toasts()).toHaveLength(0);
  });

  it("tags notifications with their origin", async () => {
    const interceptor = vi.fn(() => "suppress" as const);
    await act(async () =>
      root.render(
        <NotificationsProvider interceptor={interceptor}>
          <NotificationOriginProvider connectionId="simul" moduleId="host">
            <Raise />
            <NotificationOriginProvider connectionId="risk" moduleId="viewer">
              <Raise />
            </NotificationOriginProvider>
          </NotificationOriginProvider>
        </NotificationsProvider>,
      ),
    );
    expect(interceptor.mock.calls.map(([n]) => n.origin)).toEqual([
      { connectionId: "simul", moduleId: "host", parentModuleId: undefined },
      { connectionId: "risk", moduleId: "viewer", parentModuleId: "host" },
    ]);
  });

  it("keeps an origin the caller provides", async () => {
    const interceptor = vi.fn(() => "suppress" as const);
    const notification: Notification = { ...toast, origin: { moduleId: "x" } };
    await act(async () =>
      root.render(
        <NotificationsProvider interceptor={interceptor}>
          <NotificationOriginProvider moduleId="host">
            <Raise notification={notification} />
          </NotificationOriginProvider>
        </NotificationsProvider>,
      ),
    );
    expect(interceptor.mock.calls[0][0].origin).toEqual({ moduleId: "x" });
  });
});
