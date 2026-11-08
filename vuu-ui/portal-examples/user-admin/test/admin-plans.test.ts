import { describe, expect, it } from "vitest";
import {
  accessChanges,
  addToGroupsOperations,
  createGroupOperations,
  createRoleOperation,
  createUserOperations,
  groupDisplayName,
  groupSelection,
  pendingGroupOperations,
  userChange,
  groupRoleOperations,
  groupRolesFor,
  leastPrivilegedGroup,
  membershipsFrom,
  moveToGroupOperations,
  removeFromGroupOperations,
  revokeAccessOperations,
  rolesGrantedBy,
  setAccessGroups,
  toggleGroupFor,
  toggleAccessGroup,
  toggleGroupRole,
  type UserAccess,
  updateUserOperation,
  userAccessOperation,
  validateGroupSuffix,
  validateRoleSuffix,
  validateUserDetails,
} from "../src/data/admin-plans";
import { runOperations } from "../src/data/admin-rpc";
import {
  groupScopeFilter,
  roleScopeFilter,
  userScopeFilter,
} from "../src/data/useApplicationScope";
import { model } from "./fixtures/application-model";

const basket = model.byName.get("basket-trading");
if (!basket) throw new Error("Missing basket-trading fixture");
const group = (groupId: string) => {
  const found = basket.groups.find((g) => g.groupId === groupId);
  if (!found) throw new Error(`Missing group ${groupId}`);
  return found;
};
const ann = { userId: "u-ann", username: "ann" };
const bob = { userId: "u-bob", username: "bob" };
const rpcs = (operations: { params: unknown; rpcName: string }[]) =>
  operations.map(({ params, rpcName }) => ({ params, rpcName }));

describe("application scope filters", () => {
  it("scopes groups, roles and users to an application", () => {
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
});

describe("groups and roles", () => {
  it("turns role changes into assign and remove calls", () => {
    const saved = groupRolesFor(basket);
    const draft = toggleGroupRole(
      toggleGroupRole(saved, "g-trade", "r-basket-access"),
      "g-read",
      "r-basket-viewer",
    );
    expect(rpcs(groupRoleOperations(basket, saved, draft))).toEqual([
      {
        params: {
          clientId: "vuu-basket-trading",
          groupId: "g-read",
          roleId: "r-basket-viewer",
        },
        rpcName: "removeGroupRole",
      },
      {
        params: {
          clientId: "vuu-portal",
          groupId: "g-trade",
          roleId: "r-basket-access",
        },
        rpcName: "assignGroupRole",
      },
    ]);
    expect(groupRoleOperations(basket, saved, saved)).toEqual([]);
  });

  it("validates new group names", () => {
    expect(validateGroupSuffix(model, basket, "")).toBe(
      "Group name is required.",
    );
    expect(validateGroupSuffix(model, basket, "a b")).toMatch(/spaces/);
    expect(validateGroupSuffix(model, basket, "read")).toBe(
      'A group named "basket-trading-read" already exists.',
    );
    expect(validateGroupSuffix(model, basket, "support")).toBeUndefined();
  });

  it("creates a group with the access role, chosen roles and members, by name", () => {
    expect(
      rpcs(
        createGroupOperations(basket, {
          description: "Supports basket traders",
          roleIds: ["r-basket-trader"],
          suffix: "support",
          users: [ann],
        }),
      ),
    ).toEqual([
      {
        params: {
          description: "Supports basket traders",
          name: "basket-trading-support",
        },
        rpcName: "addGroup",
      },
      {
        params: {
          clientId: "vuu-portal",
          groupName: "basket-trading-support",
          roleId: "r-basket-access",
        },
        rpcName: "assignGroupRole",
      },
      {
        params: {
          clientId: "vuu-basket-trading",
          groupName: "basket-trading-support",
          roleId: "r-basket-trader",
        },
        rpcName: "assignGroupRole",
      },
      {
        params: { groupName: "basket-trading-support", userId: "u-ann" },
        rpcName: "assignUserToGroup",
      },
    ]);
  });

  it("creates roles on the application's client with its prefix", () => {
    expect(validateRoleSuffix(basket, "")).toBe("Role name is required.");
    expect(createRoleOperation(basket, "approver", "Approves baskets")).toEqual(
      {
        label: "Create role basket-trading-approver",
        params: {
          clientId: "vuu-basket-trading",
          description: "Approves baskets",
          name: "basket-trading-approver",
        },
        rpcName: "addClientRole",
      },
    );
  });
});

describe("batch membership changes", () => {
  const memberships = membershipsFrom(
    [
      { group_id: "g-read", user_id: "u-ann" },
      { group_id: "g-trade", user_id: "u-ann" },
      { group_id: "g-admin", user_id: "u-ann" },
      { group_id: "g-read", user_id: "u-bob" },
    ],
    new Set(["g-read", "g-trade"]),
  );

  it("keeps only the application's groups", () => {
    expect(memberships.get("u-ann")).toEqual(new Set(["g-read", "g-trade"]));
  });

  it("adds only missing memberships", () => {
    expect(
      rpcs(addToGroupsOperations([ann, bob], [group("g-trade")], memberships)),
    ).toEqual([
      {
        params: { groupId: "g-trade", userId: "u-bob" },
        rpcName: "assignUserToGroup",
      },
    ]);
  });

  it("removes only existing memberships", () => {
    expect(
      rpcs(
        removeFromGroupOperations([ann, bob], group("g-trade"), memberships),
      ),
    ).toEqual([
      {
        params: { groupId: "g-trade", userId: "u-ann" },
        rpcName: "removeUserFromGroup",
      },
    ]);
  });

  it("moves users into one group and out of the others", () => {
    expect(
      rpcs(
        moveToGroupOperations(
          basket,
          [ann, bob],
          group("g-trade"),
          memberships,
        ),
      ),
    ).toEqual([
      {
        params: { groupId: "g-read", userId: "u-ann" },
        rpcName: "removeUserFromGroup",
      },
      {
        params: { groupId: "g-trade", userId: "u-bob" },
        rpcName: "assignUserToGroup",
      },
      {
        params: { groupId: "g-read", userId: "u-bob" },
        rpcName: "removeUserFromGroup",
      },
    ]);
  });

  it("revokes access by leaving every application group", () => {
    expect(revokeAccessOperations(basket, [ann], memberships)).toHaveLength(2);
  });
});

describe("access dialog pending groups", () => {
  const memberships = membershipsFrom(
    [
      { group_id: "g-read", user_id: "u-ann" },
      { group_id: "g-trade", user_id: "u-ann" },
      { group_id: "g-read", user_id: "u-bob" },
    ],
    new Set(["g-read", "g-trade"]),
  );
  const cat = { userId: "u-cat", username: "cat" };
  const dan = { userId: "u-dan", username: "dan" };
  const toggle = (
    userIds: string[],
    groupId: string,
    pending: ReturnType<typeof toggleGroupFor> = new Map(),
  ) => toggleGroupFor(basket, userIds, groupId, pending, memberships);
  const change = (userId: string, pending: ReturnType<typeof toggle>) =>
    userChange(basket, userId, pending, memberships);

  it("shows a user without access in no group", () => {
    expect(
      groupSelection(basket, ["u-cat"], new Map(), memberships).get("g-read"),
    ).toEqual({ count: 0, state: "unchecked" });
  });

  it("marks users given an access group as new", () => {
    let pending = toggle(["u-cat"], "g-read");
    pending = toggle(["u-dan"], "g-read", pending);
    expect(change("u-cat", pending)).toBe("new");
    expect(change("u-dan", pending)).toBe("new");
    expect(
      rpcs(pendingGroupOperations(basket, [cat, dan], pending, memberships)),
    ).toEqual([
      {
        params: { groupId: "g-read", userId: "u-cat" },
        rpcName: "assignUserToGroup",
      },
      {
        params: { groupId: "g-read", userId: "u-dan" },
        rpcName: "assignUserToGroup",
      },
    ]);
  });

  it("marks existing users as updated or revoked", () => {
    let pending = toggle(["u-bob"], "g-trade");
    pending = toggle(["u-ann"], "g-read", pending);
    expect(change("u-bob", pending)).toBe("updated");
    expect(change("u-ann", pending)).toBe("revoked");
  });

  it("forgets a change that is undone", () => {
    const pending = toggle(["u-bob"], "g-trade", toggle(["u-bob"], "g-trade"));
    expect(pending.size).toBe(0);
    expect(change("u-bob", pending)).toBe("unchanged");
  });

  it("shows mixed groups and fills them for every selected user", () => {
    const selected = ["u-ann", "u-bob", "u-cat"];
    const before = groupSelection(basket, selected, new Map(), memberships);
    expect(before.get("g-read")).toEqual({ count: 2, state: "mixed" });
    expect(before.get("g-trade")).toEqual({ count: 1, state: "mixed" });
    const pending = toggle(selected, "g-read");
    expect(
      groupSelection(basket, selected, pending, memberships).get("g-read"),
    ).toEqual({ count: 3, state: "checked" });
    // Each user keeps their other groups.
    expect(pending.get("u-cat")).toEqual(new Set(["g-read"]));
    expect(pending.has("u-ann")).toBe(false);
    expect(change("u-cat", pending)).toBe("new");
  });
});

describe("user access", () => {
  it("defaults to the least-privileged group that grants access", () => {
    expect(leastPrivilegedGroup(basket)?.groupId).toBe("g-read");
    expect(rolesGrantedBy(basket, ["g-read"]).map((r) => r.roleName)).toEqual([
      "viewer",
    ]);
  });

  it("tracks group changes per application", () => {
    const saved: UserAccess = new Map([
      ["basket-trading-access", new Set(["g-read"])],
    ]);
    const draft = setAccessGroups(
      toggleAccessGroup(saved, "basket-trading-access", "g-trade"),
      "user-admin-access",
      ["g-admin"],
    );
    expect(accessChanges(saved, draft)).toEqual([
      { accessRole: "basket-trading-access", added: ["g-trade"], removed: [] },
      { accessRole: "user-admin-access", added: ["g-admin"], removed: [] },
    ]);
    expect(userAccessOperation(ann, draft).params).toEqual({
      assignments: JSON.stringify([
        { accessRole: "basket-trading-access", groupId: "g-read" },
        { accessRole: "basket-trading-access", groupId: "g-trade" },
        { accessRole: "user-admin-access", groupId: "g-admin" },
      ]),
      userId: "u-ann",
    });
  });

  const details = {
    email: "ann@example.com",
    enabled: true,
    firstName: "Ann",
    lastName: "Lee",
    temporaryPassword: "secret",
    username: "ann",
  };

  it("validates user details", () => {
    expect(
      validateUserDetails({ ...details, username: "" }, { isNew: true }),
    ).toEqual({ username: "Username is required." });
    expect(
      validateUserDetails({ ...details, email: "nope" }, { isNew: false }),
    ).toEqual({ email: "Enter a valid email address." });
    expect(validateUserDetails(details, { isNew: true })).toEqual({});
  });

  it("creates a user, then adds them to groups by username", () => {
    const access: UserAccess = new Map([
      ["basket-trading-access", new Set(["g-read"])],
    ]);
    expect(rpcs(createUserOperations(model, details, access))).toEqual([
      {
        params: {
          email: "ann@example.com",
          enabled: true,
          firstName: "Ann",
          lastName: "Lee",
          temporary_password: "secret",
          username: "ann",
        },
        rpcName: "addUser",
      },
      {
        params: { groupId: "g-read", username: "ann" },
        rpcName: "assignUserToGroup",
      },
    ]);
    expect(updateUserOperation("u-ann", details).params).not.toHaveProperty(
      "username",
    );
  });
});

describe("runOperations", () => {
  it("stops at the first failure and keeps the rest for a retry", async () => {
    const operations = createGroupOperations(basket, {
      roleIds: [],
      suffix: "support",
      users: [ann],
    });
    const calls: string[] = [];
    const result = await runOperations(async (rpcName) => {
      calls.push(rpcName);
      if (rpcName === "assignGroupRole") throw new Error("denied");
    }, operations);
    expect(calls).toEqual(["addGroup", "assignGroupRole"]);
    expect(result.completed).toHaveLength(1);
    expect(result.failed?.error).toBe("denied");
    expect(result.remaining.map(({ rpcName }) => rpcName)).toEqual([
      "assignGroupRole",
      "assignUserToGroup",
    ]);
  });
});

describe("groupDisplayName", () => {
  it("upper-cases the part after the application prefix", () => {
    expect(groupDisplayName("basket-trading-read", "basket-trading-")).toBe(
      "basket-trading-READ",
    );
  });

  it("leaves names that do not match the prefix unchanged", () => {
    expect(groupDisplayName("traders", "basket-trading-")).toBe("traders");
    expect(groupDisplayName("basket-trading-", "basket-trading-")).toBe(
      "basket-trading-",
    );
  });
});
