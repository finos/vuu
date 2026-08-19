import type { TableSchema } from "@vuu-ui/vuu-data-types";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminTable } from "../src/components/AdminTable";
import { AdminDataContext } from "../src/data/AdminDataContext";
import type { AdminConfig, AdminTableName } from "../src/data/admin-contract";

const mocks = vi.hoisted(() => ({
  table: vi.fn<(props: { config: TableConfig; dataSource: unknown }) => void>(),
  source: {
    columns: ["user_id", "email", "username"],
    filter: { filter: 'username contains "alice"' },
  },
  userSchema: {
    key: "user_id",
    table: { module: "KEYCLOAK_ADMIN", table: "users" },
    columns: [
      { name: "user_id", serverDataType: "string" },
      { name: "email", serverDataType: "string" },
      { name: "username", serverDataType: "string" },
    ],
  } satisfies TableSchema,
  usersModuleAccessSchema: {
    key: "user_id",
    table: { module: "KEYCLOAK_ADMIN", table: "users" },
    columns: [
      { name: "user_id", serverDataType: "string" },
      { name: "username", serverDataType: "string" },
      { name: "access_summary", serverDataType: "string" },
      { name: "module_access_count", serverDataType: "long" },
    ],
  } satisfies TableSchema,
  rolesSchema: {
    key: "role_id",
    table: { module: "KEYCLOAK_ADMIN", table: "roles" },
    columns: [
      { name: "role_id", serverDataType: "string" },
      { name: "role_name", serverDataType: "string" },
      { name: "public_client_name", serverDataType: "string" },
    ],
  } satisfies TableSchema,
  schema: undefined as unknown as TableSchema,
}));
vi.mock("@vuu-ui/vuu-table", () => ({
  Table: (props: { config: TableConfig; dataSource: unknown }) => {
    mocks.table(props);
    return null;
  },
}));
vi.mock("@vuu-ui/vuu-table-extras", () => ({
  DataSourceStats: () => null,
  TableFooter: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../src/data/useAdminTable", () => ({
  useAdminTable: () => ({
    schema: mocks.schema,
    dataSource: mocks.source,
    loading: false,
  }),
}));

describe("shared admin table column widths", () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.table.mockClear();
    container = document.createElement("div");
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    vi.unstubAllGlobals();
  });
  const render = async (name: AdminTableName, config: AdminConfig = {}) => {
    mocks.schema = mocks.userSchema;
    await act(async () =>
      root.render(
        <AdminDataContext.Provider value={config}>
          <AdminTable name={name} />
        </AdminDataContext.Provider>,
      ),
    );
    const props = mocks.table.mock.lastCall?.[0];
    if (!props) throw new Error("Admin table was not rendered");
    expect(props.dataSource).toBe(mocks.source);
    return props.config;
  };
  const renderWithSchema = async (
    name: AdminTableName,
    schema: TableSchema,
    config: AdminConfig = {},
  ) => {
    mocks.schema = schema;
    await act(async () =>
      root.render(
        <AdminDataContext.Provider value={config}>
          <AdminTable name={name} />
        </AdminDataContext.Provider>,
      ),
    );
    const props = mocks.table.mock.lastCall?.[0];
    if (!props) throw new Error("Admin table was not rendered");
    expect(props.dataSource).toBe(mocks.source);
    return props.config;
  };

  it.each([
    "users",
    "groups",
    "roles",
    "clients",
    "user_groups",
    "group_roles",
    "user_group_roles",
  ] as const)("sets the default to 120 and rendered email width to 150 for %s", async (name) => {
    const before = structuredClone(mocks.userSchema);
    const config = await render(name);
    expect(config.columnDefaultWidth).toBe(120);
    expect(config.columnLayout).toBe("static");
    expect(
      config.columns.find((column) => column.name === "email")?.width,
    ).toBe(150);
    expect(
      config.columns.find((column) => column.name === "username")?.width,
    ).toBeUndefined();
    expect(config.columns.every((column) => column.editable === false)).toBe(
      true,
    );
    expect(mocks.schema).toEqual(before);
    expect(mocks.source.columns).toEqual(["user_id", "email", "username"]);
    expect(mocks.source.filter.filter).toBe('username contains "alice"');
  });

  it("renders aliased users module access without adding client identifiers", async () => {
    const config = await renderWithSchema(
      "users",
      mocks.usersModuleAccessSchema,
      {
        users: { columns: { module_access: "access_summary" } },
      },
    );
    expect(config.columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "access_summary",
          type: {
            name: "string",
            renderer: { name: "vuu-portal-module-access-cell" },
          },
        }),
        expect.objectContaining({
          name: "module_access_count",
        }),
      ]),
    );
    expect(
      config.columns.some(({ name }) => name === "client_identifier"),
    ).toBe(false);
    expect(mocks.source.columns).toEqual(["user_id", "email", "username"]);
  });

  it("applies the email override to logical aliases and literal server names", async () => {
    const config = await render("users", {
      users: { columns: { email: "username", display_email: "email" } },
    });
    expect(config.columns.map(({ name, width }) => ({ name, width }))).toEqual([
      { name: "email", width: 150 },
      { name: "username", width: 150 },
    ]);
  });

  it("does not restore hidden identity or email columns when applying widths", async () => {
    const config = await render("users", {
      users: {
        columns: { email: "username" },
        columnConfig: { hidden: ["email"] },
      },
    });
    expect(config.columns).toEqual([]);
    expect(mocks.schema.columns.map(({ name }) => name)).toEqual([
      "user_id",
      "email",
      "username",
    ]);
  });

  it.each([
    "roles",
    "group_roles",
    "user_group_roles",
  ] as const)("renders client identifiers through the module renderer for %s", async (name) => {
    const config = await renderWithSchema(name, mocks.rolesSchema, {
      [name]: {
        columns: { client_identifier: "public_client_name" },
      },
    });
    const clientColumn = config.columns.find(
      ({ name: columnName }) => columnName === "public_client_name",
    );
    expect(clientColumn?.type).toEqual({
      name: "string",
      renderer: { name: "vuu-portal-client-identifier-cell" },
    });
  });
});
