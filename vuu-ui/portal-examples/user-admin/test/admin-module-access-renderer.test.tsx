import { describe, expect, it } from "vitest";
import type { RemoteModuleDescriptor } from "@vuu-ui/core/portal";
import { resolveModuleAccessSummary } from "../src/components/ModuleAccessCell";

const remoteModules = [
  {
    clientIdentifier: "vuu-orders",
    description: "Orders module",
    id: "orders",
    loginRole: "orders-login",
    location: "orders",
    mfComponent: "Orders",
    mfScope: "orders",
    mfUrl: "http://localhost:5001",
    name: "orders",
    path: "/orders",
    title: "Orders",
    version: 1,
  },
  {
    clientIdentifier: "vuu-risk",
    description: "Risk module",
    id: "risk",
    loginRole: "risk-login",
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

describe("module access cell renderer", () => {
  it("maps login roles to module titles in server order", () => {
    expect(
      resolveModuleAccessSummary(
        "risk-login,orders-login,unknown-login",
        remoteModules,
      ),
    ).toBe("Risk, Orders, unknown-login");
  });

  it("renders an explicit empty summary", () => {
    expect(resolveModuleAccessSummary("", remoteModules)).toBe(
      "No module access",
    );
    expect(resolveModuleAccessSummary(null, remoteModules)).toBe(
      "No module access",
    );
  });
});
