import { describe, expect, it } from "vitest";
import { ModulePermissions } from "../src/components/user-edit-form/ModulePermissions";

describe("ModulePermissions", () => {
  it("creates immutable updates and recognizes a reverted selection", () => {
    const original = new ModulePermissions([
      {
        clientIdentifier: "vuu-orders",
        groupIds: ["orders-read", "orders-trade"],
        accessRole: "orders-access",
      },
      {
        clientIdentifier: "vuu-legacy",
        groupIds: ["legacy-read"],
        accessRole: "legacy-access",
      },
    ]);

    const updated = original.withSelectedModules(
      [
        {
          clientIdentifier: "vuu-orders",
          name: "orders-access",
          selectedPermissions: ["orders-admin", "orders-read"],
        },
        {
          clientIdentifier: "vuu-reports",
          defaultPermission: "reports-read",
          name: "reports-access",
          selectedPermissions: [],
        },
      ],
      ["orders-access", "reports-access"],
    );

    expect(original.toJSON()).toEqual([
      {
        clientIdentifier: "vuu-legacy",
        groupIds: ["legacy-read"],
        accessRole: "legacy-access",
      },
      {
        clientIdentifier: "vuu-orders",
        groupIds: ["orders-read", "orders-trade"],
        accessRole: "orders-access",
      },
    ]);
    expect(Object.isFrozen(original.applications)).toBe(true);
    expect(Object.isFrozen(original.applications[1].groupIds)).toBe(true);
    expect(updated.toJSON()).toEqual([
      {
        clientIdentifier: "vuu-legacy",
        groupIds: ["legacy-read"],
        accessRole: "legacy-access",
      },
      {
        clientIdentifier: "vuu-orders",
        groupIds: ["orders-admin", "orders-read"],
        accessRole: "orders-access",
      },
      {
        clientIdentifier: "vuu-reports",
        groupIds: ["reports-read"],
        accessRole: "reports-access",
      },
    ]);

    const reverted = updated.withSelectedModules(
      [
        {
          clientIdentifier: "vuu-orders",
          name: "orders-access",
          selectedPermissions: ["orders-trade", "orders-read"],
        },
      ],
      ["orders-access", "reports-access"],
    );

    expect(reverted).not.toBe(original);
    expect(reverted.equals(original)).toBe(true);
  });
});
