import { describe, expect, it } from "vitest";
import type { RemoteModuleDescriptor } from "@vuu-ui/core/portal";
import {
  resolveModuleAccessSummary,
  resolveModuleAccessValues,
} from "../src/components/ModuleAccessCell";

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
  {
    clientIdentifier: "vuu-risk",
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

describe("module access cell renderer", () => {
  it("maps login roles to module titles in server order", () => {
    expect(
      resolveModuleAccessValues(
        "risk-access,orders-access,unknown-access",
        remoteModules,
      ),
    ).toEqual(["Risk", "Orders", "unknown-access"]);
    expect(
      resolveModuleAccessSummary(
        "risk-access,orders-access,unknown-access",
        remoteModules,
      ),
    ).toBe("Risk, Orders, unknown-access");
  });

  it("renders an explicit empty summary", () => {
    expect(resolveModuleAccessValues("", remoteModules)).toEqual([
      "No module access",
    ]);
    expect(resolveModuleAccessSummary("", remoteModules)).toBe(
      "No module access",
    );
    expect(resolveModuleAccessValues(null, remoteModules)).toEqual([
      "No module access",
    ]);
    expect(resolveModuleAccessSummary(null, remoteModules)).toBe(
      "No module access",
    );
  });
});
