import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import UserAdmin from "../src/UserAdmin";

vi.mock("@vuu-ui/vuu-notifications", () => ({
  NotificationsProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../src/pages/overview/OverviewPage", () => ({
  OverviewPage: () => <div>Overview page</div>,
}));
vi.mock("../src/pages/users/UsersPage", () => ({
  UsersPage: () => <div>Users page</div>,
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
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
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
            <Route path={`${mount}/*`} element={<UserAdmin />} />
          </Routes>
        </MemoryRouter>,
      ),
    );
    expect(container.textContent).toContain("Overview page");
    expect(
      container.querySelector('a[href$="/users"]')?.getAttribute("href"),
    ).toBe(`${mount}/users`);
    await act(async () =>
      container.querySelector<HTMLAnchorElement>('a[href$="/users"]')?.click(),
    );
    expect(container.textContent).toContain("Users page");
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
