import { describe, expect, it, vi } from "vitest";
import {
  loadUserModuleAccess,
  MODULE_ACCESS_OPTIONS_RPC,
  MODULE_ACCESS_RECONCILE_RPC,
  parseUserModuleAccess,
  saveUserModuleAccess,
} from "../src/data/module-access";

const moduleResponse = {
  modules: [
    {
      clientIdentifier: "vuu-trading",
      loginRole: "trading-login",
      selectedGroupId: "trader",
      groups: [
        {
          groupId: "viewer",
          groupName: "Trading viewers",
          groupPath: "/Trading/viewers",
          roleId: "viewer-role",
          roleName: "trading-access",
          privilege: "read",
          isDefault: true,
        },
        {
          groupId: "trader",
          groupName: "Traders",
          groupPath: "/Trading/traders",
          roleId: "trader-role",
          roleName: "trading-access",
          privilege: "trade",
          isDefault: false,
        },
      ],
    },
  ],
};

describe("module access RPC contract", () => {
  it("normalizes selected module groups into assignments", () => {
    expect(parseUserModuleAccess(moduleResponse)).toEqual({
      modules: moduleResponse.modules,
      assignments: [{ loginRole: "trading-login", groupId: "trader" }],
    });
  });

  it("rejects incomplete group metadata instead of guessing", () => {
    expect(() =>
      parseUserModuleAccess({
        modules: [
          {
            ...moduleResponse.modules[0],
            groups: [{ isDefault: true }],
          },
        ],
      }),
    ).toThrow('missing "groupId"');
  });

  it("loads options through the existing data-source RPC boundary", async () => {
    const rpcRequest = vi.fn().mockResolvedValue({
      type: "SUCCESS_RESULT",
      data: moduleResponse,
    });
    await expect(loadUserModuleAccess({ rpcRequest }, "u1")).resolves.toEqual({
      modules: moduleResponse.modules,
      assignments: [{ loginRole: "trading-login", groupId: "trader" }],
    });
    expect(rpcRequest).toHaveBeenCalledWith({
      type: "RPC_REQUEST",
      rpcName: MODULE_ACCESS_OPTIONS_RPC,
      params: { userId: "u1" },
    });
  });

  it("serializes stable assignment payloads for reconciliation", async () => {
    const rpcRequest = vi.fn().mockResolvedValue({
      type: "SUCCESS_RESULT",
      data: undefined,
    });
    await saveUserModuleAccess({ rpcRequest }, "u1", [
      { loginRole: "z-login", groupId: "z-group" },
      { loginRole: "a-login", groupId: "a-group" },
    ]);
    expect(rpcRequest).toHaveBeenCalledWith({
      type: "RPC_REQUEST",
      rpcName: MODULE_ACCESS_RECONCILE_RPC,
      params: {
        userId: "u1",
        assignments: JSON.stringify([
          { loginRole: "a-login", groupId: "a-group" },
          { loginRole: "z-login", groupId: "z-group" },
        ]),
      },
    });
  });
});
