import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUserEditForm } from "../src/components/user-edit-form/useUserEditForm";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";

const mocks = vi.hoisted(() => ({
  loadUserModuleAccess: vi.fn(),
  notify: vi.fn(),
  remoteModules: [
    {
      accessRole: "trading-access",
      clientIdentifier: "vuu-trading",
      title: "Trading",
    },
  ],
}));

vi.mock("@vuu-ui/core/portal", () => ({
  usePortalModuleRegistry: () => ({ remoteModules: mocks.remoteModules }),
}));

vi.mock("@vuu-ui/vuu-notifications", () => ({
  NotificationType: { Toast: "toast" },
  useNotifications: () => ({ showNotification: mocks.notify }),
}));

vi.mock("../src/data/module-access", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/data/module-access")>()),
  loadUserModuleAccess: mocks.loadUserModuleAccess,
}));

const dataRow: DataRow = {
  childCount: 0,
  depth: 0,
  hasColumn: () => false,
  index: 0,
  isExpanded: false,
  isLeaf: true,
  isSelected: true,
  key: "u1",
  renderIndex: 0,
  user_id: "u1",
} as unknown as DataRow;

const dataSource = {} as DataSource;
const editSession = {
  commit: vi.fn(),
};

const UserEditFormHarness = () => {
  const { allModules } = useUserEditForm(dataRow, dataSource, editSession);
  return <output>{JSON.stringify(allModules)}</output>;
};

describe("useUserEditForm", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.loadUserModuleAccess.mockReset();
    mocks.notify.mockReset();
    mocks.remoteModules.splice(
      0,
      mocks.remoteModules.length,
      {
        accessRole: "trading-access",
        clientIdentifier: "vuu-trading",
        title: "Trading",
      },
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("restores every selected permission group for a module", async () => {
    mocks.loadUserModuleAccess.mockResolvedValue({
      assignments: [
        { accessRole: "trading-access", groupId: "read" },
        { accessRole: "trading-access", groupId: "trade" },
      ],
      modules: [
        {
          accessRole: "trading-access",
          clientIdentifier: "vuu-trading",
          selectedGroupIds: ["read", "trade"],
          groups: [
            {
              groupId: "read",
              groupDisplayName: "Read",
              isDefault: true,
            },
            {
              groupId: "trade",
              groupDisplayName: "Trade",
              isDefault: false,
            },
          ],
        },
      ],
    });

    await act(async () => {
      root.render(<UserEditFormHarness />);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(
      JSON.parse(container.querySelector("output")?.textContent ?? "[]"),
    ).toMatchObject([
      {
        name: "trading-access",
        selectedPermissions: ["read", "trade"],
      },
    ]);
  });

  it("maps local User Admin and basket assignments to their matching modules", async () => {
    mocks.remoteModules.splice(
      0,
      mocks.remoteModules.length,
      {
        accessRole: "user-admin-access",
        clientIdentifier: "local-user-admin",
        title: "User administration",
      },
      {
        accessRole: "basket-trading-access",
        clientIdentifier: "local-basket-trading",
        title: "Basket Trading",
      },
    );
    mocks.loadUserModuleAccess.mockResolvedValue({
      assignments: [
        {
          accessRole: "user-admin-access",
          groupId: "group-user-admin-read",
        },
        {
          accessRole: "basket-trading-access",
          groupId: "group-basket-trading-read",
        },
      ],
      modules: [
        {
          accessRole: "user-admin-access",
          clientIdentifier: "local-user-admin",
          selectedGroupIds: ["group-user-admin-read"],
          groups: [
            {
              groupId: "group-user-admin-read",
              groupDisplayName: "Read",
              isDefault: true,
            },
          ],
        },
        {
          accessRole: "basket-trading-access",
          clientIdentifier: "local-basket-trading",
          selectedGroupIds: ["group-basket-trading-read"],
          groups: [
            {
              groupId: "group-basket-trading-read",
              groupDisplayName: "Read",
              isDefault: true,
            },
          ],
        },
      ],
    });

    await act(async () => {
      root.render(<UserEditFormHarness />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(
      JSON.parse(container.querySelector("output")?.textContent ?? "[]"),
    ).toMatchObject([
      {
        name: "user-admin-access",
        selectedPermissions: ["group-user-admin-read"],
      },
      {
        name: "basket-trading-access",
        selectedPermissions: ["group-basket-trading-read"],
      },
    ]);
  });

  it("shows an error toast when permissions cannot be loaded", async () => {
    mocks.loadUserModuleAccess.mockRejectedValue(new Error("RPC unavailable"));

    await act(async () => {
      root.render(<UserEditFormHarness />);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mocks.notify).toHaveBeenCalledWith({
      type: "toast",
      status: "error",
      header: "Unable to load user permissions",
      content: "RPC unavailable",
    });
  });
});
