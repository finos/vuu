import { describe, expect, it } from "vitest";
import type { RemoteModuleDescriptor } from "@vuu-ui/core/portal";
import { resolveClientIdentifierLabel } from "../src/components/ClientIdentifierCell";

const remoteModules = [
  {
    clientIdentifier: "vuu-orders",
    description: "Orders module",
    id: "orders",
    loginRole: "orders-access",
    location: "orders",
    mfComponent: "Orders",
    mfScope: "orders",
    mfUrl: "http://localhost:5001",
    name: "orders",
    path: "/orders",
    title: "Orders",
    version: 1,
  },
] satisfies readonly RemoteModuleDescriptor[];

const sharedPortalRemoteModules = [
  {
    clientIdentifier: "vuu-portal",
    description: "Basket Trading module",
    id: "basket-trading",
    loginRole: "basket-trading-access",
    location: "basket-trading",
    mfComponent: "BasketTrading",
    mfScope: "basket-trading",
    mfUrl: "http://localhost:5004",
    name: "basket-trading",
    path: "/basket-trading",
    title: "Basket Trading",
    version: 1,
  },
  {
    clientIdentifier: "vuu-portal",
    description: "Module admin module",
    id: "module-admin",
    loginRole: "module-admin-access",
    location: "module-admin",
    mfComponent: "ModuleAdmin",
    mfScope: "module-admin",
    mfUrl: "http://localhost:5003",
    name: "module-admin",
    path: "/module-admin",
    title: "Module Admin",
    version: 1,
  },
  {
    clientIdentifier: "vuu-portal",
    description: "User admin module",
    id: "user-admin",
    loginRole: "user-admin-access",
    location: "user-admin",
    mfComponent: "UserAdmin",
    mfScope: "user-admin",
    mfUrl: "http://localhost:5004",
    name: "user-admin",
    path: "/user-admin",
    title: "User Admin",
    version: 1,
  },
] satisfies readonly RemoteModuleDescriptor[];

describe("client identifier cell renderer", () => {
  it("resolves a role name to the module client identifier", () => {
    expect(
      resolveClientIdentifierLabel(
        "vuu-orders",
        "orders-access",
        remoteModules,
      ),
    ).toBe("vuu-orders");
  });

  it("keeps shared portal client identifiers unchanged for every access role", () => {
    for (const roleName of [
      "basket-trading-access",
      "module-admin-access",
      "user-admin-access",
    ]) {
      expect(
        resolveClientIdentifierLabel(
          "vuu-portal",
          roleName,
          sharedPortalRemoteModules,
        ),
      ).toBe("vuu-portal");
    }
  });

  it("uses the raw client identifier when the role has no module", () => {
    expect(
      resolveClientIdentifierLabel(
        "vuu-unknown",
        "unknown-access",
        remoteModules,
      ),
    ).toBe("vuu-unknown");
    expect(
      resolveClientIdentifierLabel(
        "vuu-portal",
        "unknown-access",
        sharedPortalRemoteModules,
      ),
    ).toBe("vuu-portal");
  });

  it("renders the Roles row values without leaking a module title", () => {
    const roleRow = {
      role_name: "basket-trading-access",
      client_identifier: "vuu-portal",
    };
    expect(
      resolveClientIdentifierLabel(
        roleRow.client_identifier,
        roleRow.role_name,
        sharedPortalRemoteModules,
      ),
    ).toBe("vuu-portal");
  });
});
