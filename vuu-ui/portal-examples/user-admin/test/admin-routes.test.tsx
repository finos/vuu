import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PortalModuleRegistryProvider,
  usePortalModuleRegistry,
} from "@vuu-ui/core/portal";
import UserAdmin from "../src/UserAdmin";
import { useEditingLock } from "../src/components/EditingContext";

const remoteModules = [
  {
    clientIdentifier: "vuu-user-admin",
    description: "Manage users",
    id: 1,
    location: "/Admin/Users",
    loginRole: "user-admin-login",
    mfComponent: "UserAdmin",
    mfScope: "userAdmin",
    mfUrl: "http://localhost:5007",
    name: "user-admin",
    path: "/users/admin",
    title: "Manage users",
    version: 1,
  },
] as const;

vi.mock("@vuu-ui/vuu-notifications", () => ({
  NotificationsProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../src/pages/overview/OverviewPage", () => ({
  OverviewPage: () => {
    const { remoteModules: modules } = usePortalModuleRegistry();
    return (
      <div>
        Overview page
        {modules.map(({ clientIdentifier, loginRole }) => (
          <span key={clientIdentifier}>
            {clientIdentifier}:{loginRole}
          </span>
        ))}
      </div>
    );
  },
}));
vi.mock("../src/pages/users/UsersPage", () => ({
  UsersPage: () => {
    const setEditing = useEditingLock();
    return (
      <div>
        Users page
        <button type="button" onClick={() => setEditing(true)}>
          Start editing
        </button>
        <button type="button" onClick={() => setEditing(false)}>
          Finish editing
        </button>
      </div>
    );
  },
}));
vi.mock("../src/pages/groups/GroupsPage", () => ({
  GroupsPage: () => <div>Groups page</div>,
}));
vi.mock("../src/pages/roles/RolesPage", () => ({
  RolesPage: () => <div>Roles page</div>,
}));

describe("embedded identity routes", () => {
  let container: HTMLDivElement;
  let root: Root;
  let style: HTMLStyleElement;
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    style = document.createElement("style");
    style.textContent = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), "../src/UserAdmin.css"),
      "utf8",
    );
    document.head.append(style);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    style.remove();
    vi.unstubAllGlobals();
  });
  it.each([
    "/workspace/identity",
    "/custom/mount",
  ])("renders Overview by default at arbitrary mount %s", async (mount) => {
    await act(async () =>
      root.render(
        <MemoryRouter initialEntries={[mount]}>
          <Routes>
            <Route
              path={`${mount}/*`}
              element={
                <PortalModuleRegistryProvider remoteModules={remoteModules}>
                  <UserAdmin />
                </PortalModuleRegistryProvider>
              }
            />
          </Routes>
        </MemoryRouter>,
      ),
    );
    expect(container.textContent).toContain("Overview page");
    expect(container.textContent).toContain("vuu-user-admin:user-admin-login");
    const rail = container.querySelector<HTMLElement>(
      'nav[aria-label="Identity administration"]',
    );
    const workspace = container.querySelector<HTMLElement>(
      ".vuuIdentityAdmin-workspace",
    );
    const content = container.querySelector<HTMLElement>(
      ".vuuIdentityAdmin-content",
    );
    if (!rail || !workspace || !content)
      throw new Error("Missing left navigation layout");
    expect(workspace.children[0]).toBe(rail);
    expect(workspace.children[1]).toBe(content);
    expect(content.querySelector("main")).not.toBeNull();
    expect(getComputedStyle(workspace).flexDirection).toBe("row");
    expect(getComputedStyle(rail).display).toBe("flex");
    expect(getComputedStyle(rail).flexDirection).toBe("column");
    expect(rail.querySelectorAll("a")).toHaveLength(4);
    expect(rail.querySelector('[aria-current="page"]')?.textContent).toBe(
      "Overview",
    );
    expect(
      container.querySelector('a[href$="/users"]')?.getAttribute("href"),
    ).toBe(`${mount}/users`);
    await act(async () =>
      container.querySelector<HTMLAnchorElement>('a[href$="/users"]')?.click(),
    );
    expect(container.textContent).toContain("Users page");
    expect(rail.querySelector('[aria-current="page"]')?.textContent).toBe(
      "Users",
    );
    await act(async () =>
      container.querySelector<HTMLButtonElement>("button")?.click(),
    );
    const groupsLink =
      rail.querySelector<HTMLAnchorElement>('a[href$="/groups"]');
    expect(groupsLink?.getAttribute("aria-disabled")).toBe("true");
    await act(async () => groupsLink?.click());
    expect(container.textContent).toContain("Users page");
    expect(content.querySelector('[role="status"]')?.textContent).toContain(
      "Save or discard",
    );
    await act(async () =>
      container.querySelectorAll<HTMLButtonElement>("button")[1]?.click(),
    );
    await act(async () =>
      container.querySelector<HTMLAnchorElement>('a[href$="/groups"]')?.click(),
    );
    expect(container.textContent).toContain("Groups page");
    await act(async () =>
      container.querySelector<HTMLAnchorElement>('a[href$="/roles"]')?.click(),
    );
    expect(container.textContent).toContain("Roles page");
  });
});
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
