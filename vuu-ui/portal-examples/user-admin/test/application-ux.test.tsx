import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { EditModeProvider, EditSession } from "@vuu-ui/vuu-data-editing";
import { PortalModuleRegistryProvider } from "@vuu-ui/core/portal";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GroupsEditForm } from "../src/components/groups-edit-form/GroupsEditForm";
import {
  buildApplicationModel,
  deriveApplications,
} from "../src/data/applications";
import { ApplicationModelContext } from "../src/data/useApplicationModel";
import {
  GroupApplicationCell,
  RoleApplicationCell,
  RoleTypeCell,
} from "../src/components/ApplicationCell";
import {
  groupScopeFilter,
  roleScopeFilter,
  userScopeFilter,
} from "../src/data/useApplicationScope";
import { ApplicationsPage } from "../src/pages/applications/ApplicationsPage";
import type { TableCellRendererProps } from "@vuu-ui/vuu-table-types";

const mocks = vi.hoisted(() => ({ notify: vi.fn() }));

vi.mock("@vuu-ui/vuu-notifications", () => ({
  useNotifications: () => ({ showNotification: mocks.notify }),
}));
vi.mock("@vuu-ui/core", () => ({
  useData: () => ({
    VuuDataSource: class {
      constructor(readonly config: unknown) {}
    },
  }),
}));
vi.mock("@vuu-ui/vuu-table", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@vuu-ui/vuu-table")>()),
  Table: () => <div>Users table</div>,
}));
vi.mock("../src/data/useFilteredCount", () => ({
  useFilteredCount: () => ({ count: 3 }),
}));
vi.mock("@salt-ds/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salt-ds/core")>();
  const React = await import("react");
  return {
    ...actual,
    Dropdown: ({
      "aria-label": ariaLabel,
      children,
      onSelectionChange,
      value,
    }: {
      "aria-label"?: string;
      children: React.ReactNode;
      onSelectionChange: (
        event: React.SyntheticEvent,
        options: unknown[],
      ) => void;
      value: string;
    }) => {
      const options = React.Children.toArray(children).flatMap((child) =>
        React.isValidElement<{ children: React.ReactNode; value: unknown }>(
          child,
        )
          ? [child.props]
          : [],
      );
      return React.createElement(
        "select",
        {
          "aria-label": ariaLabel,
          value,
          onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
            const selected = options.find(
              (option) => option.children === event.currentTarget.value,
            );
            if (selected) onSelectionChange(event, [selected.value]);
          },
        },
        React.createElement("option", { key: "", value: "" }),
        ...options.map((option) =>
          React.createElement(
            "option",
            { key: String(option.children), value: String(option.children) },
            option.children,
          ),
        ),
      );
    },
  };
});

const descriptors = [
  {
    accessRole: "basket-trading-access",
    clientIdentifier: "vuu-basket-trading",
    name: "basket-trading",
    title: "Basket Trading",
  },
  {
    accessRole: "user-admin-access",
    clientIdentifier: "vuu-user-admin",
    name: "user-admin",
    title: "User Admin",
  },
];
const remoteModules = descriptors.map((descriptor, id) => ({
  ...descriptor,
  description: "",
  id,
  mfComponent: "Module",
  mfScope: descriptor.name,
  mfUrl: "http://localhost",
  navLocation: `/Apps/${descriptor.title}`,
  path: `/${descriptor.name}`,
  version: 1,
}));
const { applications } = deriveApplications(descriptors);
const model = buildApplicationModel({
  applications,
  clients: [
    { client_id: "c-portal", client_identifier: "vuu-portal" },
    { client_id: "c-basket", client_identifier: "vuu-basket-trading" },
    { client_id: "c-admin", client_identifier: "vuu-user-admin" },
  ],
  groupRoles: [
    { group_id: "g-read", role_id: "r-basket-access" },
    { group_id: "g-read", role_id: "r-basket-viewer" },
    { group_id: "g-trade", role_id: "r-basket-trader" },
    { group_id: "g-admin", role_id: "r-admin-access" },
  ],
  groups: [
    { group_id: "g-read", group_path: "/basket-trading-read", user_count: 2 },
    { group_id: "g-trade", group_path: "/basket-trading-trade", user_count: 1 },
    { group_id: "g-admin", group_path: "/user-admin-all", user_count: 1 },
    { group_id: "g-legacy", group_path: "/legacy-users", user_count: 0 },
  ],
  roles: [
    {
      client_identifier: "vuu-portal",
      role_id: "r-basket-access",
      role_name: "basket-trading-access",
    },
    {
      client_identifier: "vuu-portal",
      role_id: "r-admin-access",
      role_name: "user-admin-access",
    },
    {
      client_identifier: "vuu-basket-trading",
      role_id: "r-basket-viewer",
      role_name: "viewer",
    },
    {
      client_identifier: "vuu-basket-trading",
      role_id: "r-basket-trader",
      role_name: "trader",
    },
  ],
});

describe("application-centred admin UX", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.notify.mockReset();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  const renderWithModel = async (children: React.ReactNode) => {
    await act(async () => {
      root.render(
        <PortalModuleRegistryProvider remoteModules={remoteModules}>
          <ApplicationModelContext.Provider value={{ loading: false, model }}>
            {children}
          </ApplicationModelContext.Provider>
        </PortalModuleRegistryProvider>,
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };

  describe("group creation", () => {
    const datasourceAddRow = vi.fn();
    const endEditSession = vi.fn();
    const dataSource = {
      createSessionDataSource: vi.fn().mockImplementation(async () => ({
        addRow: datasourceAddRow,
        endEditSession,
      })),
      rpcRequest: vi.fn(),
    } as unknown as DataSource;

    beforeEach(() => {
      datasourceAddRow.mockReset().mockResolvedValue({
        type: "SUCCESS_RESULT",
      });
      endEditSession.mockReset().mockResolvedValue({ type: "SUCCESS_RESULT" });
    });

    const renderForm = (application?: string) =>
      renderWithModel(
        <EditModeProvider isEditMode>
          <GroupsEditForm
            application={application}
            dataRow={{ key: EditSession.newRowKey } as unknown as DataRow}
            dataSource={dataSource}
          />
        </EditModeProvider>,
      );

    const typeGroupName = async (value: string) => {
      const input = container.querySelector<HTMLInputElement>(
        'input[aria-label="Group name"]',
      );
      if (!input) throw new Error("Missing group name input");
      await act(async () => {
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        )?.set?.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    };

    const submit = async () => {
      await act(async () => {
        container
          .querySelector("form")
          ?.dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
          );
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
    };

    it("names the group with the application prefix and always adds the access role", async () => {
      await renderForm("basket-trading");
      expect(container.textContent).toContain("basket-trading-");
      expect(container.textContent).toContain(
        "Includes access role basket-trading-access",
      );

      await typeGroupName("support");
      await submit();

      expect(datasourceAddRow).toHaveBeenCalledWith({
        group_name: "basket-trading-support",
        role_assignments: JSON.stringify(["r-basket-access"]),
      });
      expect(endEditSession).toHaveBeenCalledWith(true, false);
    });

    it("requires an application and rejects existing group names", async () => {
      await renderForm();
      await submit();
      expect(container.textContent).toContain("Application is required.");

      const select = container.querySelector<HTMLSelectElement>(
        'select[aria-label="Application"]',
      );
      if (!select) throw new Error("Missing application dropdown");
      await act(async () => {
        Object.getOwnPropertyDescriptor(
          HTMLSelectElement.prototype,
          "value",
        )?.set?.call(select, "Basket Trading");
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await typeGroupName("read");
      await submit();

      expect(container.textContent).toContain(
        'A group named "basket-trading-read" already exists.',
      );
      expect(datasourceAddRow).not.toHaveBeenCalled();
    });
  });

  describe("Applications page", () => {
    const renderPage = (search: string) =>
      renderWithModel(
        <MemoryRouter initialEntries={[`/admin/applications${search}`]}>
          <Routes>
            <Route path="/admin/applications" element={<ApplicationsPage />} />
          </Routes>
        </MemoryRouter>,
      );

    it("lists applications and explains how access is granted", async () => {
      await renderPage("?application=basket-trading");

      const list = container.querySelector(
        '[role="radiogroup"][aria-label="Applications"]',
      );
      expect(
        [...(list?.querySelectorAll('[role="radio"]') ?? [])].map(
          (card) =>
            card.querySelector(".vuuAdminApplications-listTitle")?.textContent,
        ),
      ).toEqual(["Basket Trading", "User Admin", "Unassigned"]);
      expect(
        list?.querySelector('[aria-checked="true"]')?.textContent,
      ).toContain("Basket Trading");

      const groups = container.querySelector(
        'table[aria-label="Application groups"]',
      );
      expect(
        [...(groups?.querySelectorAll("tbody tr") ?? [])].map((row) =>
          [...row.querySelectorAll("td")].map(({ textContent }) => textContent),
        ),
      ).toEqual([
        ["basket-trading-read", "2 members", "Accessviewer", "Healthy"],
        ["basket-trading-trade", "1 member", "trader", "Missing access role"],
      ]);
      expect(container.textContent).toContain("3 users with access");
      expect(
        container
          .querySelector<HTMLAnchorElement>(
            'nav[aria-label="Application actions"] a[href*="create=true"][href*="groups"]',
          )
          ?.getAttribute("href"),
      ).toBe("/admin/groups?application=basket-trading&create=true");
    });

    it("shows groups and roles matching no application", async () => {
      await renderPage("?application=__unassigned__");
      expect(container.textContent).toContain("Groups (1)");
      expect(container.textContent).toContain("legacy-users");
    });
  });

  it("scopes pages to an application", () => {
    expect(groupScopeFilter(model, "basket-trading")).toEqual({
      op: "in",
      column: "group_id",
      values: ["g-read", "g-trade"],
    });
    expect(roleScopeFilter(model, "basket-trading")).toEqual({
      op: "in",
      column: "role_id",
      values: ["r-basket-access", "r-basket-trader", "r-basket-viewer"],
    });
    expect(groupScopeFilter(model, "__unassigned__")).toEqual({
      op: "in",
      column: "group_id",
      values: ["g-legacy"],
    });
    expect(userScopeFilter(model, "__unassigned__")).toEqual({
      op: "=",
      column: "module_access_count",
      value: 0,
    });
    expect(userScopeFilter(model, "user-admin")).toMatchObject({
      op: "or",
      filters: expect.arrayContaining([
        { op: "=", column: "module_access", value: "user-admin-access" },
      ]),
    });
  });

  it("renders the application of groups and roles", async () => {
    const cell = (
      Cell: typeof GroupApplicationCell,
      column: string,
      dataRow: Record<string, unknown>,
    ) => (
      <Cell
        {...({
          column: { name: column },
          dataRow,
        } as unknown as TableCellRendererProps)}
      />
    );
    await renderWithModel(
      <>
        <p>
          {cell(GroupApplicationCell, "group_id", {
            group_path: "/basket-trading-read",
          })}
        </p>
        <p>
          {cell(GroupApplicationCell, "group_id", {
            group_path: "/legacy-users",
          })}
        </p>
        <p>
          {cell(RoleApplicationCell, "client_identifier", {
            client_identifier: "vuu-portal",
            role_name: "user-admin-access",
          })}
        </p>
        <p>
          {cell(RoleApplicationCell, "client_identifier", {
            client_identifier: "vuu-basket-trading",
            role_name: "trader",
          })}
        </p>
      </>,
    );
    expect(
      [...container.querySelectorAll("p")].map(
        (cell) =>
          cell.querySelector(
            ".vuuAdminApplicationCell-title, .vuuAdminApplicationCell-unassigned",
          )?.textContent,
      ),
    ).toEqual(["Basket Trading", "Unassigned", "User Admin", "Basket Trading"]);
  });

  it("marks portal access roles", async () => {
    await renderWithModel(
      <>
        {[
          { client_identifier: "vuu-portal", role_name: "user-admin-access" },
          { client_identifier: "vuu-basket-trading", role_name: "trader" },
          { client_identifier: "legacy", role_name: "legacy-role" },
        ].map((dataRow) => (
          <p key={dataRow.role_name}>
            <RoleTypeCell
              {...({
                column: { name: "role_id" },
                dataRow,
              } as unknown as TableCellRendererProps)}
            />
          </p>
        ))}
      </>,
    );
    expect(
      [...container.querySelectorAll("p")].map(
        ({ textContent }) => textContent,
      ),
    ).toEqual(["Access", "Application", "Unassigned"]);
  });
});
