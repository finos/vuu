import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  createMemoryRouter,
  Navigate,
  Route,
  RouterProvider,
  Routes,
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  IsolatedModuleRouter,
  isModuleLocation,
  normalizeModulePath,
} from "../../src/portal-components/IsolatedModuleRouter";
import { PortalLink } from "../../src/portal-link/PortalLink";

/** A module that routes like the admin modules do. */
const AdminModule = () => {
  // Admin modules block navigation away from unsaved edits, which needs a
  // data router.
  useBlocker(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const splat = useParams()["*"] ?? "";
  return (
    <div>
      <span data-testid="module-location">{pathname}</span>
      <span data-testid="module-splat">{splat}</span>
      <button
        data-testid="navigate-absolute"
        onClick={() => navigate("/admin/users/42")}
        type="button"
      />
      <button
        data-testid="navigate-relative"
        onClick={() => navigate("../roles", { relative: "path" })}
        type="button"
      />
      <PortalLink data-testid="module-link" to="/admin/settings">
        Settings
      </PortalLink>
      <PortalLink data-testid="portal-link" routeScope="portal" to="/home">
        Home
      </PortalLink>
      <Routes>
        <Route index element={<Navigate replace to="overview" />} />
        <Route path="overview" element={<span>Overview</span>} />
        <Route path="*" element={<span>Page</span>} />
      </Routes>
    </div>
  );
};

describe("IsolatedModuleRouter", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const text = (testId: string) =>
    container.querySelector(`[data-testid='${testId}']`)?.textContent;

  const click = (testId: string) =>
    act(() => {
      container
        .querySelector<HTMLElement>(`[data-testid='${testId}']`)
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
    });

  /** The host, as the shell routes a workspace, with a module in an item. */
  const renderInWorkspace = (
    props: {
      initialLocation?: string;
      onLocationChange?: (location: string) => void;
    } = {},
  ) => {
    const router = createMemoryRouter(
      [
        {
          element: (
            <IsolatedModuleRouter modulePath="/admin" {...props}>
              <AdminModule />
            </IsolatedModuleRouter>
          ),
          path: "/workspaces/:workspaceId/*",
        },
        { element: <span data-testid="host-home">Home</span>, path: "/home" },
      ],
      { initialEntries: ["/workspaces/ws-1"] },
    );
    act(() => root.render(<RouterProvider router={router} />));
    return router;
  };

  it("routes the module at its own path, without changing the host URL", () => {
    const router = renderInWorkspace();
    // The module's index redirect runs in its own router.
    expect(text("module-location")).toBe("/admin/overview");
    expect(text("module-splat")).toBe("overview");
    expect(router.state.location.pathname).toBe("/workspaces/ws-1");
  });

  it("keeps useNavigate and PortalLink navigation inside the module", () => {
    const router = renderInWorkspace();

    click("navigate-absolute");
    expect(text("module-location")).toBe("/admin/users/42");
    expect(router.state.location.pathname).toBe("/workspaces/ws-1");

    click("navigate-relative");
    expect(text("module-location")).toBe("/admin/users/roles");
    expect(router.state.location.pathname).toBe("/workspaces/ws-1");

    click("module-link");
    expect(text("module-location")).toBe("/admin/settings");
    expect(router.state.location.pathname).toBe("/workspaces/ws-1");
  });

  it("navigates the host for a portal-scoped PortalLink", () => {
    const router = renderInWorkspace();
    expect(
      container
        .querySelector("[data-testid='portal-link']")
        ?.getAttribute("href"),
    ).toBe("/home");
    click("portal-link");
    expect(router.state.location.pathname).toBe("/home");
    expect(text("host-home")).toBe("Home");
  });

  it("starts at a saved location and reports navigation, but not redirects", () => {
    const onLocationChange = vi.fn();
    renderInWorkspace({
      initialLocation: "/admin/users/7",
      onLocationChange,
    });
    expect(text("module-location")).toBe("/admin/users/7");
    expect(onLocationChange).not.toHaveBeenCalled();

    click("navigate-absolute");
    expect(onLocationChange).toHaveBeenLastCalledWith("/admin/users/42");
  });

  it("does not report the module's initial redirect", () => {
    const onLocationChange = vi.fn();
    renderInWorkspace({ onLocationChange });
    expect(text("module-location")).toBe("/admin/overview");
    expect(onLocationChange).not.toHaveBeenCalled();
  });

  it("ignores a saved location outside the module", () => {
    renderInWorkspace({ initialLocation: "/other/page" });
    expect(text("module-location")).toBe("/admin/overview");
  });

  it("supports data router APIs such as useBlocker", () => {
    const BlockingModule = () => {
      const blocker = useBlocker(true);
      const navigate = useNavigate();
      return (
        <>
          <span data-testid="blocker-state">{blocker.state}</span>
          <button
            data-testid="navigate-away"
            onClick={() => navigate("/admin/users")}
            type="button"
          />
        </>
      );
    };
    const router = createMemoryRouter(
      [
        {
          element: (
            <IsolatedModuleRouter modulePath="/admin">
              <BlockingModule />
            </IsolatedModuleRouter>
          ),
          path: "/workspaces/:workspaceId/*",
        },
      ],
      { initialEntries: ["/workspaces/ws-1"] },
    );
    act(() => root.render(<RouterProvider router={router} />));
    expect(text("blocker-state")).toBe("unblocked");
    click("navigate-away");
    expect(text("blocker-state")).toBe("blocked");
    expect(router.state.location.pathname).toBe("/workspaces/ws-1");
  });

  it("renders without a host router", () => {
    act(() =>
      root.render(
        <IsolatedModuleRouter modulePath="/admin/*">
          <AdminModule />
        </IsolatedModuleRouter>,
      ),
    );
    expect(text("module-location")).toBe("/admin/overview");
  });

  it("renders the same module routes on its full-page route", () => {
    const router = createMemoryRouter(
      [{ element: <AdminModule />, path: "/admin/*" }],
      { initialEntries: ["/admin"] },
    );
    act(() => root.render(<RouterProvider router={router} />));
    expect(text("module-location")).toBe("/admin/overview");
    click("navigate-absolute");
    expect(router.state.location.pathname).toBe("/admin/users/42");
  });
});

describe("module paths", () => {
  it("normalises a module path", () => {
    expect(normalizeModulePath("/admin/*")).toBe("/admin");
    expect(normalizeModulePath("admin/")).toBe("/admin");
    expect(normalizeModulePath("")).toBe("/");
  });

  it("recognises locations within a module", () => {
    expect(isModuleLocation("/admin", "/admin")).toBe(true);
    expect(isModuleLocation("/admin/users?q=1", "/admin")).toBe(true);
    expect(isModuleLocation("/admin?q=1", "/admin")).toBe(true);
    expect(isModuleLocation("/administrator", "/admin")).toBe(false);
  });
});
