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
      accessRole: "trading-login",
      selectedGroupId: "trader",
      groups: [
        {
          groupId: "viewer",
          groupName: "Trading viewers",
          groupDisplayName: "Viewers",
          groupPath: "/Trading/viewers",
          roleId: "viewer-role",
          roleName: "trading-access",
          roleDisplayName: "Trading access",
          privilege: "read",
          isDefault: true,
        },
        {
          groupId: "trader",
          groupName: "Traders",
          groupDisplayName: "Traders",
          groupPath: "/Trading/traders",
          roleId: "trader-role",
          roleName: "trading-access",
          roleDisplayName: "Trading access",
          privilege: "trade",
          isDefault: false,
        },
      ],
    },
  ],
};

const parsedModule = {
  ...moduleResponse.modules[0],
  selectedGroupIds: ["trader"],
};

describe("module access RPC contract", () => {
  it("normalizes selected module groups into assignments", () => {
    expect(parseUserModuleAccess(moduleResponse)).toEqual({
      modules: [parsedModule],
      assignments: [{ accessRole: "trading-login", groupId: "trader" }],
    });
  });

  it("retains every selected group for a module as an assignment", () => {
    const response = {
      modules: [
        {
          ...moduleResponse.modules[0],
          selectedGroupIds: ["viewer", "trader"],
        },
      ],
    };

    expect(parseUserModuleAccess(response)).toEqual({
      modules: response.modules,
      assignments: [
        { accessRole: "trading-login", groupId: "viewer" },
        { accessRole: "trading-login", groupId: "trader" },
      ],
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

  it("rejects the legacy loginRole response field", () => {
    const { accessRole: _accessRole, ...legacyModule } =
      moduleResponse.modules[0];

    expect(() => parseUserModuleAccess({ modules: [legacyModule] })).toThrow(
      'missing "accessRole"',
    );
  });

  it("loads options through the existing data-source RPC boundary", async () => {
    const rpcRequest = vi.fn().mockResolvedValue({
      type: "SUCCESS_RESULT",
      data: moduleResponse,
    });
    await expect(loadUserModuleAccess({ rpcRequest }, "u1")).resolves.toEqual({
      modules: [parsedModule],
      assignments: [{ accessRole: "trading-login", groupId: "trader" }],
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
      { accessRole: "z-login", groupId: "z-group" },
      { accessRole: "a-login", groupId: "a-group" },
    ]);
    expect(rpcRequest).toHaveBeenCalledWith({
      type: "RPC_REQUEST",
      rpcName: MODULE_ACCESS_RECONCILE_RPC,
      params: {
        userId: "u1",
        assignments: JSON.stringify([
          { accessRole: "a-login", groupId: "a-group" },
          { accessRole: "z-login", groupId: "z-group" },
        ]),
      },
    });
  });
});
