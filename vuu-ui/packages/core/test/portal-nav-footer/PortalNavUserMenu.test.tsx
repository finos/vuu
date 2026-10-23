import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const logout = vi.fn(async () => undefined);
const auth = vi.hoisted(() => ({
  authorizations: undefined as string[] | undefined,
  user: undefined as
    | {
        userName: string;
        firstName?: string;
        lastName?: string;
        email?: string;
      }
    | undefined,
}));
vi.mock("@vuu-ui/core", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useLogout: () => logout,
  useOptionalAuthenticatedUser: () => auth.user,
  useOptionalVuuAuthorizations: () => auth.authorizations,
}));

import {
  PortalPersistenceProvider,
  type PortalPersistenceService,
  type PortalSaveStatus,
} from "../../src/persistence";
import {
  formatSaveStatus,
  PortalNavUserMenu,
  PortalNavUserMenuItem,
  type PortalNavUserMenuProps,
  USER_MENU_CLOSE_DELAY_MS,
  USER_MENU_OPEN_DELAY_MS,
} from "../../src/portal-nav-footer/PortalNavUserMenu";
import {
  SavedStateContext,
  type SavedStateContextValue,
} from "../../src/saved-state/SavedStateContext";
import { click, hover, keyDown, unhover } from "./test-utils";

const fakePersistence = (status: PortalSaveStatus) => {
  const listeners = new Set<() => void>();
  let current = status;
  const service = {
    dispose: vi.fn(),
    flushAll: vi.fn(async () => undefined),
    getSaveStatus: () => current,
    isDisposed: () => false,
    subscribeSaveStatus: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return {
    service,
    setStatus: (next: PortalSaveStatus) => {
      current = next;
      for (const listener of listeners) listener();
    },
  };
};

describe("formatSaveStatus", () => {
  const now = 1_000_000_000;
  it.each<[PortalSaveStatus | undefined, string | undefined]>([
    [undefined, undefined],
    [{ saving: false }, undefined],
    [{ saving: true, lastSavedAt: now }, "Saving…"],
    [{ saving: false, lastSavedAt: now - 30_000 }, "Saved just now"],
    [{ saving: false, lastSavedAt: now - 2 * 60_000 }, "Saved 2m ago"],
    [{ saving: false, lastSavedAt: now - 3 * 3_600_000 }, "Saved 3h ago"],
  ])("%j is %s", (status, text) => {
    expect(formatSaveStatus(status, now)).toBe(text);
  });
});

describe("PortalNavUserMenu", () => {
  let container: HTMLDivElement;
  let root: Root;
  let savedState: SavedStateContextValue;

  beforeEach(() => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    logout.mockClear();
    auth.user = {
      email: "jane.doe@example.com",
      firstName: "Jane",
      lastName: "Doe",
      userName: "jdoe",
    };
    auth.authorizations = ["trader", "risk-viewer"];
    savedState = {
      applicationKeyForModule: () => undefined,
      notify: vi.fn(),
      open: vi.fn(),
      reportCarryForward: vi.fn(),
    };
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  const render = async (
    props: Partial<PortalNavUserMenuProps> = {},
    {
      persistence,
      withSavedState = true,
    }: {
      persistence?: PortalPersistenceService;
      withSavedState?: boolean;
    } = {},
  ) => {
    await act(async () => {
      root.render(
        <PortalPersistenceProvider service={persistence}>
          <SavedStateContext.Provider
            value={withSavedState ? savedState : null}
          >
            <PortalNavUserMenu variant="expanded" {...props} />
          </SavedStateContext.Provider>
        </PortalPersistenceProvider>,
      );
    });
  };

  const trigger = () =>
    container.querySelector<HTMLButtonElement>(".vuuPortalNavUserMenu-trigger");
  const menu = () => container.querySelector<HTMLElement>('[role="menu"]');
  const menuItem = (name: string) =>
    [
      ...container.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'),
    ].find((item) => item.textContent?.startsWith(name));
  const itemNames = () =>
    [...container.querySelectorAll('[role="menuitem"]')].map(
      (item) =>
        item.querySelector(".vuuPortalNavUserMenu-itemLabel")?.textContent,
    );

  it("shows the user's name and account in the expanded trigger", async () => {
    await render({ account: "EQ-LDN-01" });
    expect(trigger()?.textContent).toContain("Jane Doe");
    expect(trigger()?.textContent).toContain("EQ-LDN-01");
    expect(trigger()?.getAttribute("aria-haspopup")).toBe("menu");
  });

  it("shows the avatar only in the rail", async () => {
    await render({ variant: "rail" });
    expect(trigger()?.textContent).not.toContain("Jane Doe");
    expect(trigger()?.getAttribute("aria-label")).toBe("User menu: Jane Doe");
  });

  it("falls back to the user name", async () => {
    auth.user = { userName: "jdoe" };
    await render();
    expect(trigger()?.textContent).toContain("jdoe");
  });

  it("opens on click with identity, Saved state, app items and Log out", async () => {
    await render(
      {
        account: "EQ-LDN-01",
        children: <PortalNavUserMenuItem>Help</PortalNavUserMenuItem>,
      },
      { withSavedState: true },
    );
    await click(trigger());

    expect(menu()).not.toBeNull();
    expect(menu()?.getAttribute("aria-labelledby")).toBeTruthy();
    const identity = container.querySelector(".vuuPortalNavUserMenu-identity");
    expect(identity?.textContent).toContain("Jane Doe");
    expect(identity?.textContent).toContain("jane.doe@example.com");
    expect(identity?.textContent).toContain("EQ-LDN-01");
    expect(
      [...container.querySelectorAll(".vuuPortalNavUserMenu-role")].map(
        (role) => role.textContent,
      ),
    ).toEqual(["trader", "risk-viewer"]);
    expect(itemNames()).toEqual(["Saved state…", "Help", "Log out"]);
    expect(document.activeElement).toBe(menuItem("Saved state…"));
  });

  it("prefers roles passed as a prop", async () => {
    await render({ roles: ["admin"] });
    await click(trigger());
    expect(
      [...container.querySelectorAll(".vuuPortalNavUserMenu-role")].map(
        (role) => role.textContent,
      ),
    ).toEqual(["admin"]);
  });

  it("omits Saved state outside a saved-state provider", async () => {
    await render({}, { withSavedState: false });
    await click(trigger());
    expect(itemNames()).toEqual(["Log out"]);
  });

  it("opens the Saved state dialog and closes", async () => {
    await render();
    await click(trigger());
    await click(menuItem("Saved state…"));
    expect(savedState.open).toHaveBeenCalledTimes(1);
    expect(savedState.open).toHaveBeenCalledWith();
    expect(menu()).toBeNull();
  });

  it("logs out, writing saved state first", async () => {
    const { service } = fakePersistence({ saving: false });
    await render(
      {},
      { persistence: service as unknown as PortalPersistenceService },
    );
    await click(trigger());
    await act(async () => menuItem("Log out")?.click());
    expect(service.flushAll).toHaveBeenCalled();
    expect(service.dispose).toHaveBeenCalled();
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("runs app items and lets them keep the menu open", async () => {
    const onHelp = vi.fn();
    await render({
      children: (
        <>
          <PortalNavUserMenuItem onClick={onHelp}>Help</PortalNavUserMenuItem>
          <PortalNavUserMenuItem onClick={(e) => e.preventDefault()}>
            Stay
          </PortalNavUserMenuItem>
          <PortalNavUserMenuItem disabled onClick={onHelp}>
            Disabled
          </PortalNavUserMenuItem>
        </>
      ),
    });
    await click(trigger());
    await click(menuItem("Disabled"));
    expect(onHelp).not.toHaveBeenCalled();
    await click(menuItem("Stay"));
    expect(menu()).not.toBeNull();
    await click(menuItem("Help"));
    expect(onHelp).toHaveBeenCalledTimes(1);
    expect(menu()).toBeNull();
  });

  it("shows the save status next to Saved state", async () => {
    const { service, setStatus } = fakePersistence({
      lastSavedAt: Date.now() - 2 * 60_000,
      saving: false,
    });
    await render(
      {},
      { persistence: service as unknown as PortalPersistenceService },
    );
    await click(trigger());
    expect(menuItem("Saved state…")?.textContent).toContain("Saved 2m ago");
    await act(async () => setStatus({ saving: true }));
    expect(menuItem("Saved state…")?.textContent).toContain("Saving…");
  });

  it("moves focus with the arrow keys, Home and End", async () => {
    await render({
      children: <PortalNavUserMenuItem>Help</PortalNavUserMenuItem>,
    });
    await click(trigger());
    await keyDown(document.activeElement, "ArrowDown");
    expect(document.activeElement).toBe(menuItem("Help"));
    await keyDown(document.activeElement, "End");
    expect(document.activeElement).toBe(menuItem("Log out"));
    await keyDown(document.activeElement, "ArrowDown");
    expect(document.activeElement).toBe(menuItem("Saved state…"));
    await keyDown(document.activeElement, "ArrowUp");
    expect(document.activeElement).toBe(menuItem("Log out"));
    await keyDown(document.activeElement, "Home");
    expect(document.activeElement).toBe(menuItem("Saved state…"));
  });

  it("opens from the keyboard and closes on Escape", async () => {
    await render();
    trigger()?.focus();
    await keyDown(trigger(), "ArrowDown");
    expect(menu()).not.toBeNull();
    expect(document.activeElement).toBe(menuItem("Saved state…"));
    await keyDown(document.activeElement, "Escape");
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("opens 300ms after hovering and closes 400ms after leaving", async () => {
    vi.useFakeTimers();
    await render();
    await hover(trigger() as HTMLElement);
    await act(() => vi.advanceTimersByTime(USER_MENU_OPEN_DELAY_MS - 1));
    expect(menu()).toBeNull();
    await act(() => vi.advanceTimersByTime(1));
    expect(menu()).not.toBeNull();
    // Hover doesn't take focus.
    expect(document.activeElement).toBe(document.body);

    await unhover(trigger() as HTMLElement);
    await act(() => vi.advanceTimersByTime(USER_MENU_CLOSE_DELAY_MS - 1));
    expect(menu()).not.toBeNull();
    await act(() => vi.advanceTimersByTime(1));
    expect(menu()).toBeNull();
  });

  it("stays open while the pointer is over the menu", async () => {
    vi.useFakeTimers();
    await render();
    await hover(trigger() as HTMLElement);
    await act(() => vi.advanceTimersByTime(USER_MENU_OPEN_DELAY_MS));
    await unhover(trigger() as HTMLElement);
    await hover(menu() as HTMLElement);
    await act(() => vi.advanceTimersByTime(USER_MENU_CLOSE_DELAY_MS * 2));
    expect(menu()).not.toBeNull();
  });
});
