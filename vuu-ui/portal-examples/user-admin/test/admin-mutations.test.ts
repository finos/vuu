import { describe, expect, it, vi } from "vitest";
import {
  buildMutation,
  saveAdminEntity,
  saveAdminRelationship,
} from "../src/data/admin-mutations";

describe("persistent identity RPC mapping", () => {
  it("maps user schema fields to the concrete backend parameters", () => {
    expect(
      buildMutation(
        "users",
        {
          username: "alice",
          first_name: "Alice",
          last_name: "Example",
          email: "alice@example.com",
          enabled: true,
          temporary_password: "one-time",
          group_count: 20,
          password_update_required: true,
        },
        {},
      ),
    ).toEqual({
      type: "RPC_REQUEST",
      rpcName: "addUser",
      params: {
        username: "alice",
        firstName: "Alice",
        lastName: "Example",
        email: "alice@example.com",
        enabled: true,
        temporary_password: "one-time",
      },
    });
  });
  it("updates only changed, supported scalar fields using stable IDs", () => {
    expect(
      buildMutation(
        "users",
        { login: "alice", mail: "" },
        {
          users: {
            columns: { user_id: "id", username: "login", email: "mail" },
          },
        },
        { id: "u1", login: "alice", mail: "old@example.com" },
      ),
    ).toMatchObject({
      rpcName: "updateUser",
      params: { userId: "u1", email: "" },
    });
  });
  it("creates client roles rather than realm roles", () => {
    expect(
      buildMutation(
        "roles",
        {
          role_name: "Trader",
          client_id: "c1",
          client_identifier: "vuu-portal",
        },
        {},
      ),
    ).toMatchObject({
      rpcName: "addClientRole",
      params: { name: "Trader", clientId: "c1" },
    });
    expect(() => buildMutation("roles", { role_name: "Trader" }, {})).toThrow(
      "clientId is required",
    );
  });
  it("retains owning client context when updating a role", () => {
    expect(
      buildMutation(
        "roles",
        { role_name: "Trading" },
        {},
        {
          role_id: "r1",
          client_id: "c1",
          client_identifier: "vuu-portal",
          role_name: "Trader",
        },
      ),
    ).toMatchObject({
      rpcName: "updateRole",
      params: { roleId: "r1", clientId: "c1", name: "Trading" },
    });
  });
  it.each([
    "account",
    "realm-management",
    "VUU-portal",
    "app-vuu-portal",
    "",
  ])("rejects role create/edit for %j before sending an RPC", async (identifier) => {
    const source = { rpcRequest: vi.fn() };
    const values = {
      role_name: "Trader",
      client_id: "c1",
      client_identifier: identifier,
    };
    await expect(saveAdminEntity(source, "roles", values, {})).rejects.toThrow(
      "Only Vuu portal clients",
    );
    await expect(
      saveAdminEntity(
        source,
        "roles",
        values,
        {},
        { ...values, role_id: "r1" },
      ),
    ).rejects.toThrow("Only Vuu portal clients");
    expect(source.rpcRequest).not.toHaveBeenCalled();
  });
  it("honors mapped scope metadata without sending it as a mutable role field", () => {
    expect(
      buildMutation(
        "roles",
        { role: "Trader", client: "opaque-uuid", identifier: "vuu-portal" },
        {
          roles: {
            columns: {
              role_name: "role",
              client_id: "client",
              client_identifier: "identifier",
            },
          },
        },
      ),
    ).toEqual({
      type: "RPC_REQUEST",
      rpcName: "addClientRole",
      params: { name: "Trader", clientId: "opaque-uuid" },
    });
  });
  it.each([
    "add",
    "remove",
  ] as const)("validates Vuu client scope for group-role %s operations", async (action) => {
    const source = {
      rpcRequest: vi.fn().mockResolvedValue({ type: "SUCCESS_RESULT" }),
    };
    for (const clientIdentifier of ["account", undefined]) {
      await expect(
        saveAdminRelationship(
          source,
          "groups",
          {},
          {
            action,
            id: "r1",
            label: "Admin",
            clientId: "opaque-uuid",
            clientIdentifier,
          },
          { group_id: "g1" },
        ),
      ).rejects.toThrow("Only Vuu portal clients");
    }
    expect(source.rpcRequest).not.toHaveBeenCalled();
    await saveAdminRelationship(
      source,
      "groups",
      {},
      {
        action,
        id: "r1",
        label: "Admin",
        clientId: "opaque-uuid",
        clientIdentifier: "vuu-portal",
      },
      { group_id: "g1" },
    );
    expect(source.rpcRequest).toHaveBeenCalledWith({
      type: "RPC_REQUEST",
      rpcName: action === "add" ? "assignGroupRole" : "removeGroupRole",
      params: { groupId: "g1", roleId: "r1", clientId: "opaque-uuid" },
    });
  });
  it("does not attempt unsupported group hierarchy writes", () => {
    expect(
      buildMutation(
        "groups",
        {
          group_name: "Traders",
          group_path: "/Traders",
          parent_group_id: "g0",
        },
        {},
      ),
    ).toMatchObject({
      rpcName: "addGroup",
      params: { name: "Traders" },
    });
  });
});
