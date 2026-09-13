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
    description: "Risk module",
    id: "risk",
    loginRole: "risk-access",
    location: "risk",
    mfComponent: "Risk",
    mfScope: "risk",
    mfUrl: "http://localhost:5002",
    name: "risk",
    path: "/risk",
    title: "Risk",
    version: 1,
  },
] satisfies readonly RemoteModuleDescriptor[];

describe("client identifier cell renderer", () => {
  it("resolves a login role to the module title", () => {
    expect(resolveClientIdentifierLabel("orders-access", remoteModules)).toBe(
      "Orders",
    );
  });

  it("falls back to the raw identifier for a client identifier", () => {
    expect(resolveClientIdentifierLabel("vuu-orders", remoteModules)).toBe(
      "vuu-orders",
    );
    expect(resolveClientIdentifierLabel("vuu-unknown", remoteModules)).toBe(
      "vuu-unknown",
    );
  });

  it("keeps shared portal client identifiers unchanged", () => {
    expect(
      resolveClientIdentifierLabel("vuu-portal", sharedPortalRemoteModules),
    ).toBe("vuu-portal");
  });
});
