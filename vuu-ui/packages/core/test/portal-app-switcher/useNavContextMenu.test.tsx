import type { MenuActionHandler, MenuBuilder } from "@vuu-ui/vuu-context-menu";
import { act, type MouseEvent } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationProvider } from "../../src/auth/AuthenticationProvider";
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
import {
  MARK_MODULE_NOTIFICATIONS_READ,
  type NavContextMenuHandlers,
  SHOW_MODULE_NOTIFICATIONS,
  useNavContextMenu,
} from "../../src/portal-app-switcher/useNavContextMenu";
import { testModule } from "../connection-management/test-modules";

const menu = vi.hoisted(() => ({
  builder: undefined as MenuBuilder | undefined,
  handler: undefined as MenuActionHandler | undefined,
  show: vi.fn(),
}));

vi.mock("@vuu-ui/vuu-context-menu", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useContextMenu: (builder: MenuBuilder, handler: MenuActionHandler) => {
    menu.builder = builder;
    menu.handler = handler;
    return menu.show;
  },
}));

const modules = [testModule("m0"), testModule("m1")];

const notification = (id: string, moduleId: string): PortalNotification => ({
  attributes: {},
  createdAt: Number(id),
  expired: false,
  id,
  initial: true,
  key: `simul:${id}`,
  kind: "toast",
  level: "info",
  message: "",
  origin: { connectionId: "simul", moduleIds: [moduleId], source: "server" },
  read: false,
  receivedAt: Number(id),
  title: `title ${id}`,
});

describe("useNavContextMenu notifications", () => {
  let container: HTMLDivElement;
  let root: Root;
  let api: PortalNotificationsAPI | undefined;
  let presentation: PortalNotificationsPresentation | undefined;
  let handlers: NavContextMenuHandlers;

  const Probe = () => {
    api = usePortalNotifications();
    presentation = useNotificationPresentation();
    handlers = useNavContextMenu({
      item: { moduleId: "m0", path: "/m0", title: "M0" },
      targetWindow: window,
    });
    return null;
  };

  const render = (withNotifications: boolean) =>
    act(async () =>
      root.render(
        <MemoryRouter>
          <AuthenticationProvider mode="local" registry={{ modules }}>
            {withNotifications ? (
              <PortalNotificationsProvider>
                <Probe />
              </PortalNotificationsProvider>
            ) : (
              <Probe />
            )}
          </AuthenticationProvider>
        </MemoryRouter>,
      ),
    );

  const openMenu = () => {
    handlers.onContextMenu?.({} as MouseEvent<HTMLElement>);
    const options = menu.show.mock.lastCall?.[2];
    return menu.builder?.("portal-module", options) ?? [];
  };

  beforeEach(() => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    menu.show.mockReset();
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({}),
    );
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it("has no notification entries without notifications", async () => {
    await render(false);
    expect(openMenu().map(({ id }) => id)).not.toContain(
      SHOW_MODULE_NOTIFICATIONS,
    );
  });

  it("disables mark read while the module has nothing unread", async () => {
    await render(true);
    const items = openMenu();
    expect(items.find(({ id }) => id === SHOW_MODULE_NOTIFICATIONS)).toEqual(
      expect.objectContaining({ label: "Show notifications" }),
    );
    expect(
      items.find(({ id }) => id === MARK_MODULE_NOTIFICATIONS_READ)?.disabled,
    ).toBe(true);
  });

  it("shows the module's notifications and marks only them read", async () => {
    await render(true);
    await act(async () => {
      api?.store.upsert(notification("1", "m0"));
      api?.store.upsert(notification("2", "m1"));
    });
    expect(
      openMenu().find(({ id }) => id === MARK_MODULE_NOTIFICATIONS_READ)
        ?.disabled,
    ).toBe(false);

    await act(async () => menu.handler?.(SHOW_MODULE_NOTIFICATIONS));
    expect(presentation?.panelOpen).toBe(true);
    expect(presentation?.panelRequest).toEqual({ moduleIds: ["m0"] });

    await act(async () => menu.handler?.(MARK_MODULE_NOTIFICATIONS_READ));
    expect(api?.store.get("simul:1")?.read).toBe(true);
    expect(api?.store.get("simul:2")?.read).toBe(false);
  });
});
