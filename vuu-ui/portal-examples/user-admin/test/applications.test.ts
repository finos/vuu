import { describe, expect, it } from "vitest";
import {
  applicationForGroupName,
  buildApplicationModel,
  classifyRole,
  deriveApplications,
  groupIdsFor,
  groupNameFromPath,
  idsFilter,
  moduleAccessFilter,
  roleIdsFor,
  UNASSIGNED,
} from "../src/data/applications";

const descriptor = (name: string, title = name) => ({
  accessRole: `${name}-access`,
  clientIdentifier: `vuu-${name}`,
  description: "",
  name,
  title,
});

const { applications } = deriveApplications([
  descriptor("basket-trading", "Basket Trading"),
  descriptor("user-admin", "User Admin"),
]);

const roles = [
  {
    client_identifier: "vuu-portal",
    role_id: "r-bt-access",
    role_name: "basket-trading-access",
  },
  {
    client_identifier: "vuu-basket-trading",
    role_id: "r-bt-trade",
    role_name: "basket-trading-trade",
    role_display_name: "trade",
  },
  {
    client_identifier: "vuu-basket-trading",
    role_id: "r-bt-unused",
    role_name: "basket-trading-unused",
  },
  {
    client_identifier: "vuu-portal",
    role_id: "r-ua-access",
    role_name: "user-admin-access",
  },
  {
    client_identifier: "vuu-user-admin",
    role_id: "r-ua-admin",
    role_name: "user-admin-admin",
  },
  {
    client_identifier: "vuu-portal",
    role_id: "r-orphan",
    role_name: "legacy-access",
  },
];

const groups = [
  { group_id: "g-bt-read", group_path: "/vuu/basket-trading-read", user_count: 2 },
  { group_id: "g-bt-trade", group_path: "/vuu/basket-trading-trade", user_count: 1 },
  { group_id: "g-ua-read", group_path: "/vuu/user-admin-read", user_count: 0 },
  { group_id: "g-other", group_path: "/other", user_count: 0 },
];

const groupRoles = [
  { group_id: "g-bt-read", role_id: "r-bt-access" },
  { group_id: "g-bt-trade", role_id: "r-bt-access" },
  { group_id: "g-bt-trade", role_id: "r-bt-trade" },
  { group_id: "g-bt-trade", role_id: "r-ua-admin" },
  { group_id: "g-ua-read", role_id: "r-ua-admin" },
];

const clients = [
  { client_id: "c-portal", client_identifier: "vuu-portal" },
  { client_id: "c-bt", client_identifier: "vuu-basket-trading" },
];

const model = buildApplicationModel({
  applications,
  clients,
  groupRoles,
  groups,
  roles,
});

describe("deriveApplications", () => {
  it("derives group prefixes from access roles and sorts by title", () => {
    expect(
      applications.map(({ groupPrefix, name }) => [name, groupPrefix]),
    ).toEqual([
      ["basket-trading", "basket-trading-"],
      ["user-admin", "user-admin-"],
    ]);
  });

  it("rejects access roles without the -access suffix and duplicates", () => {
    const result = deriveApplications([
      { ...descriptor("orders"), accessRole: "orders-login" },
      descriptor("basket-trading"),
      { ...descriptor("basket-trading-copy"), accessRole: "basket-trading-access" },
    ]);
    expect(result.applications.map(({ name }) => name)).toEqual([
      "basket-trading",
    ]);
    expect(result.issues.map(({ code }) => code)).toEqual([
      "invalid-access-role",
      "duplicate-application",
    ]);
  });

  it("flags prefixes that also match another application's groups", () => {
    const result = deriveApplications([
      descriptor("user-admin"),
      descriptor("user-admin-reports"),
    ]);
    expect(result.issues).toEqual([
      expect.objectContaining({
        application: "user-admin",
        code: "ambiguous-prefix",
      }),
    ]);
  });
});

describe("matching", () => {
  it("reads the group name from the last path segment", () => {
    expect(groupNameFromPath("/vuu/basket-trading-read")).toBe(
      "basket-trading-read",
    );
    expect(groupNameFromPath("/solo")).toBe("solo");
    expect(groupNameFromPath(undefined)).toBeUndefined();
  });

  it("uses the longest matching group prefix", () => {
    const { applications: nested } = deriveApplications([
      descriptor("user-admin"),
      descriptor("user-admin-reports"),
    ]);
    expect(
      applicationForGroupName(nested, "user-admin-reports-read")?.name,
    ).toBe("user-admin-reports");
    expect(applicationForGroupName(nested, "user-admin-read")?.name).toBe(
      "user-admin",
    );
    expect(applicationForGroupName(nested, "user-admin-")).toBeUndefined();
  });

  it("classifies access roles and application roles", () => {
    expect(
      classifyRole(applications, "basket-trading-access", "vuu-portal"),
    ).toMatchObject({ application: { name: "basket-trading" }, kind: "access" });
    expect(
      classifyRole(applications, "anything", "vuu-basket-trading"),
    ).toMatchObject({
      application: { name: "basket-trading" },
      kind: "application",
    });
    expect(
      classifyRole(applications, "basket-trading-trade", "vuu-portal"),
    ).toBeUndefined();
  });
});

describe("buildApplicationModel", () => {
  it("assigns groups and roles to applications", () => {
    const basketTrading = model.byName.get("basket-trading");
    expect(basketTrading?.accessRole?.roleId).toBe("r-bt-access");
    expect(basketTrading?.client?.clientId).toBe("c-bt");
    expect(basketTrading?.roles.map(({ roleId }) => roleId)).toEqual([
      "r-bt-trade",
      "r-bt-unused",
    ]);
    expect(basketTrading?.groups.map(({ groupId }) => groupId)).toEqual([
      "g-bt-read",
      "g-bt-trade",
    ]);
    expect(model.unmatchedGroups.map(({ groupId }) => groupId)).toEqual([
      "g-other",
    ]);
    expect(model.unmatchedRoles.map(({ roleId }) => roleId)).toEqual([
      "r-orphan",
    ]);
  });

  it("reports configuration issues", () => {
    expect(
      model.issues.map(({ application, code }) => [application, code]),
    ).toEqual([
      ["basket-trading", "group-foreign-roles"],
      ["basket-trading", "unused-role"],
      ["user-admin", "missing-client"],
      ["user-admin", "group-missing-access-role"],
      [undefined, "unmatched-group"],
      [undefined, "unmatched-role"],
    ]);
  });

  it("reports applications without Keycloak objects", () => {
    const { applications: [orders] } = deriveApplications([
      descriptor("orders"),
    ]);
    const empty = buildApplicationModel({
      applications: [orders],
      clients: [],
      groupRoles: [],
      groups: [],
      roles: [],
    });
    expect(empty.issues.map(({ code }) => code)).toEqual([
      "missing-access-role",
      "missing-client",
      "no-groups",
    ]);
  });

  it("lists group and role IDs for filters", () => {
    expect(groupIdsFor(model, "basket-trading")).toEqual([
      "g-bt-read",
      "g-bt-trade",
    ]);
    expect(groupIdsFor(model, UNASSIGNED)).toEqual(["g-other"]);
    expect(roleIdsFor(model, "basket-trading")).toEqual([
      "r-bt-access",
      "r-bt-trade",
      "r-bt-unused",
    ]);
    expect(roleIdsFor(model, UNASSIGNED)).toEqual(["r-orphan"]);
  });
});

describe("filters", () => {
  it("matches module access exactly within the comma-separated column", () => {
    expect(moduleAccessFilter("trading-access")).toEqual({
      op: "or",
      filters: [
        { op: "=", column: "module_access", value: "trading-access" },
        { op: "starts", column: "module_access", value: "trading-access," },
        { op: "ends", column: "module_access", value: ",trading-access" },
        { op: "contains", column: "module_access", value: ",trading-access," },
      ],
    });
  });

  it("builds ID filters that match nothing when empty", () => {
    expect(idsFilter("group_id", ["a", "b"])).toEqual({
      op: "in",
      column: "group_id",
      values: ["a", "b"],
    });
    expect(idsFilter("group_id", [])).toEqual({
      op: "=",
      column: "group_id",
      value: "__no_match__",
    });
    expect(() => idsFilter("group_id", ['bad"id'])).toThrow();
  });
});
