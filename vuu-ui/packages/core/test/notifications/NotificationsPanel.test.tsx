import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationProvider } from "../../src/auth/AuthenticationProvider";
import { NotificationsPanel } from "../../src/notifications/NotificationsPanel";
import type {
  PortalNotificationsAPI,
  PortalNotificationsPresentation,
} from "../../src/notifications/PortalNotificationsContext";
import {
  PortalNotificationsProvider,
  useNotificationPresentation,
  usePortalNotifications,
} from "../../src/notifications/PortalNotificationsProvider";
import type { PortalNotification } from "../../src/notifications/notification-types";
import { testModule } from "../connection-management/test-modules";

const modules = [testModule("m0"), testModule("m1")];

const notification = (
  id: string,
  rest: Partial<PortalNotification> = {},
): PortalNotification => ({
  attributes: {},
  createdAt: Date.now() - Number(id) * 1000,
  expired: false,
  id,
  initial: true,
  key: `simul:${id}`,
  kind: "toast",
  level: "info",
  message: `message ${id}`,
  origin: { connectionId: "simul", moduleIds: ["m0"], source: "server" },
  read: false,
  receivedAt: Date.now(),
  title: `title ${id}`,
  ...rest,
});

describe("NotificationsPanel", () => {
  let container: HTMLDivElement;
  let root: Root;
  let api: PortalNotificationsAPI | undefined;
  let presentation: PortalNotificationsPresentation | undefined;

  const Probe = () => {
    api = usePortalNotifications();
    presentation = useNotificationPresentation();
    return null;
  };

  beforeEach(async () => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({}),
    );
    await act(async () =>
      root.render(
        <MemoryRouter>
          <AuthenticationProvider mode="local" registry={{ modules }}>
            <PortalNotificationsProvider>
              <Probe />
              <NotificationsPanel />
            </PortalNotificationsProvider>
          </AuthenticationProvider>
        </MemoryRouter>,
      ),
    );
    await act(async () => {
      api?.store.upsert(notification("1"));
      api?.store.upsert(
        notification("2", {
          level: "error",
          origin: {
            connectionId: "simul",
            moduleIds: ["m1"],
            source: "server",
          },
        }),
      );
      api?.store.upsert(notification("3", { read: true }));
      api?.store.upsert(notification("4", { expired: true }));
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  const panel = () => document.querySelector(".vuuNotificationsPanel-content");
  const keys = () =>
    [...document.querySelectorAll("[data-notification-key]")].map((item) =>
      item.getAttribute("data-notification-key"),
    );
  const item = (key: string) =>
    document.querySelector<HTMLElement>(`[data-notification-key="${key}"]`);
  const button = (label: string, scope: ParentNode = document) =>
    [...scope.querySelectorAll<HTMLButtonElement>("button")].find(
      (b) => b.getAttribute("aria-label") === label || b.textContent === label,
    );
  const click = (element: Element | null | undefined) =>
    act(async () => (element as HTMLElement).click());
  const open = (
    request?: Parameters<PortalNotificationsPresentation["openPanel"]>[0],
  ) => act(async () => presentation?.openPanel(request));

  it("is closed until opened, newest first, hiding expired", async () => {
    expect(panel()).toBeNull();
    await open();
    expect(panel()).not.toBeNull();
    expect(keys()).toEqual(["simul:1", "simul:2", "simul:3"]);
  });

  it("filters to the requested applications", async () => {
    await open({ moduleIds: ["m1"] });
    expect(keys()).toEqual(["simul:2"]);
    await click(button("Clear filters"));
    expect(keys()).toEqual(["simul:1", "simul:2", "simul:3"]);
  });

  it("selects and focuses the requested notification, marking it read", async () => {
    await open({ focusKey: "simul:2" });
    expect(document.activeElement).toBe(item("simul:2"));
    expect(item("simul:2")?.getAttribute("aria-expanded")).toBe("true");
    expect(api?.store.get("simul:2")?.read).toBe(false);
    await click(item("simul:1"));
    expect(api?.store.get("simul:1")?.read).toBe(true);
  });

  it("marks read, unread and deletes single notifications", async () => {
    await open();
    await click(button("Mark read", item("simul:1") as HTMLElement));
    expect(api?.store.get("simul:1")?.read).toBe(true);
    await click(button("Mark unread", item("simul:1") as HTMLElement));
    expect(api?.store.get("simul:1")?.read).toBe(false);
    await click(button("Delete", item("simul:2") as HTMLElement));
    expect(keys()).toEqual(["simul:1", "simul:3"]);
  });

  it("marks all read, then deletes the read notifications", async () => {
    await open();
    await click(button("Mark all read"));
    expect(api?.store.get("simul:2")?.read).toBe(true);
    // the expired notification is filtered out of the panel
    expect(api?.store.get("simul:4")?.read).toBe(false);
    await click(button("Delete read"));
    expect(keys()).toEqual([]);
    expect(
      document.querySelector(".vuuNotificationsPanel-empty"),
    ).not.toBeNull();
  });

  it("closes from the close button and Escape", async () => {
    await open();
    await click(button("Close notifications"));
    expect(presentation?.panelOpen).toBe(false);
    await open();
    await act(async () =>
      panel()?.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }),
      ),
    );
    expect(presentation?.panelOpen).toBe(false);
  });

  it("toggles do not disturb from the footer", async () => {
    await open();
    const dnd = document.querySelector<HTMLInputElement>(
      ".vuuNotificationsPanel-footer input[type=checkbox]",
    );
    await click(dnd);
    expect(presentation?.doNotDisturb).toBe(true);
  });
});
