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

describe("client identifier cell renderer", () => {
  it("resolves a client identifier to the module title", () => {
    expect(resolveClientIdentifierLabel("vuu-orders", remoteModules)).toBe(
      "Orders",
    );
  });

  it("falls back to the raw identifier when no module matches", () => {
    expect(resolveClientIdentifierLabel("vuu-unknown", remoteModules)).toBe(
      "vuu-unknown",
    );
  });
});
