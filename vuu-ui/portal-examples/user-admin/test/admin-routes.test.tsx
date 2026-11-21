import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, Link, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PortalModuleRegistryProvider,
  usePortalModuleRegistry,
} from "@vuu-ui/core/portal";
import UserAdmin from "../src/UserAdmin";
import { useEditingLock } from "../src/components/EditingContext";
import { useAdminPaths } from "../src/data/useAdminPaths";

const modal = vi.hoisted(() => ({
  closePrompt: vi.fn(),
  showPrompt: vi.fn(),
}));

const remoteModules = [
  {
    clientIdentifier: "vuu-user-admin",
    description: "Manage users",
    id: 1,
    navLocation: "/Admin/Users",
    accessRole: "user-admin-access",
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
vi.mock("@vuu-ui/core", () => ({
  useModal: () => modal,
}));
vi.mock("../src/data/ApplicationModelProvider", () => ({
  ApplicationModelProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../src/pages/overview/OverviewPage", () => ({
  OverviewPage: () => {
    const { remoteModules: modules } = usePortalModuleRegistry();
    const setEditing = useEditingLock();
    const paths = useAdminPaths();
    return (
      <div>
        Overview page
        {modules.map(({ clientIdentifier, accessRole }) => (
          <span key={clientIdentifier}>
            {clientIdentifier}:{accessRole}
          </span>
        ))}
        <button type="button" onClick={() => setEditing(true)}>
          Start editing
        </button>
        <Link to={paths.application("basket-trading")}>Basket trading</Link>
      </div>
    );
  },
}));
vi.mock("../src/pages/application/ApplicationPage", () => ({
  ApplicationPage: ({ name }: { name: string }) => (
    <div>Application page {name}</div>
  ),
}));
vi.mock("../src/pages/user/CreateUserPage", () => ({
  CreateUserPage: () => <div>New user page</div>,
}));
vi.mock("../src/pages/user/UserPage", () => ({
  UserPage: ({ userId }: { userId: string }) => <div>User page {userId}</div>,
}));

describe("embedded identity routes", () => {
  let container: HTMLDivElement;
  let root: Root;
  let style: HTMLStyleElement;
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    modal.closePrompt.mockClear();
    modal.showPrompt.mockClear();
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
  it.each(["/workspace/identity", "/custom/mount"])(
    "renders Overview by default at arbitrary mount %s",
    async (mount) => {
      const router = createMemoryRouter(
        [
          {
            path: `${mount}/*`,
            element: (
              <PortalModuleRegistryProvider remoteModules={remoteModules}>
                <UserAdmin />
              </PortalModuleRegistryProvider>
            ),
          },
        ],
        { initialEntries: [mount] },
      );

      await act(async () => root.render(<RouterProvider router={router} />));
      expect(container.textContent).toContain("Overview page");
      expect(container.textContent).toContain(
        "vuu-user-admin:user-admin-access",
      );
      expect(
        container.querySelector('nav[aria-label="Identity administration"]'),
      ).toBeNull();
      const content = container.querySelector<HTMLElement>(
        ".vuuIdentityAdmin-content",
      );
      if (!content) throw new Error("Missing content layout");
      expect(content.querySelector("main")).not.toBeNull();
      const applicationLink = container.querySelector<HTMLAnchorElement>(
        'a[href$="/applications/basket-trading"]',
      );
      expect(applicationLink?.getAttribute("href")).toBe(
        `${mount}/applications/basket-trading`,
      );
      await act(async () =>
        container.querySelector<HTMLButtonElement>("button")?.click(),
      );
      await act(async () => applicationLink?.click());
      expect(container.textContent).toContain("Overview page");
      expect(modal.showPrompt).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          cancelButtonLabel: "Cancel",
          confirmButtonLabel: "Discard changes",
          title: "Unsaved changes",
        }),
      );
      expect(content.querySelector('[role="status"]')?.textContent).toContain(
        "Save or discard",
      );
      const promptProps =
        modal.showPrompt.mock.calls[
          modal.showPrompt.mock.calls.length - 1
        ]?.[1];
      await act(async () => promptProps?.onCancel?.());
      expect(container.textContent).toContain("Overview page");
      await act(async () => applicationLink?.click());
      const confirmPromptProps =
        modal.showPrompt.mock.calls[
          modal.showPrompt.mock.calls.length - 1
        ]?.[1];
      await act(async () => confirmPromptProps?.onConfirm?.());
      expect(container.textContent).toContain(
        "Application page basket-trading",
      );
    },
  );

  const renderAt = async (entry: string) => {
    const router = createMemoryRouter(
      [
        {
          path: "/admin/*",
          element: (
            <PortalModuleRegistryProvider remoteModules={remoteModules}>
              <UserAdmin />
            </PortalModuleRegistryProvider>
          ),
        },
      ],
      { initialEntries: [entry] },
    );
    await act(async () => root.render(<RouterProvider router={router} />));
  };

  it.each([
    ["/admin/applications/basket-trading", "Application page basket-trading"],
    ["/admin/users/new", "New user page"],
    ["/admin/users/u-42", "User page u-42"],
  ])("routes %s to the workflow page", async (entry, text) => {
    await renderAt(entry);
    expect(container.textContent).toContain(text);
  });

  it.each([
    [
      "/admin/groups?application=basket-trading",
      "Application page basket-trading",
    ],
    [
      "/admin/roles?application=basket-trading",
      "Application page basket-trading",
    ],
    [
      "/admin/applications?application=basket-trading",
      "Application page basket-trading",
    ],
    ["/admin/groups", "Overview page"],
    ["/admin/applications", "Overview page"],
    ["/admin/users", "Overview page"],
  ])(
    "redirects the old %s page to its application or Overview",
    async (entry, text) => {
      await renderAt(entry);
      expect(container.textContent).toContain(text);
    },
  );
});
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
