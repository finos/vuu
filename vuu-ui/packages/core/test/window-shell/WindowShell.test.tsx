import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationProvider } from "../../src/auth/AuthenticationProvider";
import type { PortalNotificationsAPI } from "../../src/notifications/PortalNotificationsContext";
import { usePortalNotifications } from "../../src/notifications/PortalNotificationsProvider";
import type { PortalNotification } from "../../src/notifications/notification-types";
import { WindowShell } from "../../src/window-shell/WindowShell";
import { testModule } from "../connection-management/test-modules";

const modules = [testModule("m0"), testModule("m1")];

const notification = (id: string, moduleId: string): PortalNotification => ({
  attributes: {},
  createdAt: Date.now(),
  expired: false,
  id,
  initial: false,
  key: `simul:${id}`,
  kind: "toast",
  level: "info",
  message: "",
  origin: { connectionId: "simul", moduleIds: [moduleId], source: "server" },
  read: false,
  receivedAt: Date.now(),
  title: `title ${id}`,
});

describe("WindowShell notifications", () => {
  let container: HTMLDivElement;
  let root: Root;
  let api: PortalNotificationsAPI | undefined;

  const Probe = () => {
    api = usePortalNotifications();
    return null;
  };

  beforeEach(() => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({}),
    );
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    document.querySelectorAll(".vuuToastNotification").forEach((toast) => {
      toast.remove();
    });
  });

  const toasts = () =>
    [...document.querySelectorAll(".vuuToastNotification")].map(
      (toast) => toast.textContent,
    );

  it("toasts only for the window's module, which is read while open", async () => {
    await act(async () =>
      root.render(
        <AuthenticationProvider mode="local" registry={{ modules }}>
          <WindowShell openModuleId="m0" persistence={false}>
            <Probe />
          </WindowShell>
        </AuthenticationProvider>,
      ),
    );
    expect(api).toBeDefined();
    await act(async () => {
      api?.store.upsert(notification("1", "m0"));
      api?.store.upsert(notification("2", "m1"));
    });
    expect(toasts()).toEqual([expect.stringContaining("title 1")]);
    expect(api?.store.get("simul:1")?.read).toBe(true);
    expect(api?.store.get("simul:2")?.read).toBe(false);
  });

  it("can turn notifications off", async () => {
    await act(async () =>
      root.render(
        <AuthenticationProvider mode="local" registry={{ modules }}>
          <WindowShell notifications={false} persistence={false}>
            <Probe />
          </WindowShell>
        </AuthenticationProvider>,
      ),
    );
    expect(api).toBeUndefined();
  });
});
