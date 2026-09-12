import { PortalModuleRegistryProvider } from "@vuu-ui/core/portal";
import { describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { RemoteModuleDescriptor } from "@vuu-ui/core/portal";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import {
  ModuleAccessCell,
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

  it("renders resolved values in a Salt ListBox", () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(
        <PortalModuleRegistryProvider remoteModules={remoteModules}>
          <ModuleAccessCell
            column={{
              name: "module_access",
              ariaColIndex: 1,
              label: "Module access",
              valueFormatter: String,
              width: 120,
            }}
            dataRow={
              {
                module_access: "risk-access,orders-access",
                childCount: 0,
                depth: 0,
                index: 0,
                isExpanded: false,
                isSelected: false,
                isLeaf: true,
                key: "user-1",
                renderIndex: 0,
                hasColumn: () => true,
              } as unknown as DataRow
            }
          />
        </PortalModuleRegistryProvider>,
      );
    });

    expect(container.querySelector('[role="listbox"]')).not.toBeNull();
    expect(container.textContent).toContain("Risk");
    expect(container.textContent).toContain("Orders");
    root.unmount();
  });
});
