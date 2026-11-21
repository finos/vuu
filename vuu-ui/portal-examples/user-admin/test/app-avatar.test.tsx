import { PortalModuleRegistryProvider } from "@vuu-ui/core/portal";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppAvatar } from "../src/components/admin-ui/AdminUi";
import { deriveApplications } from "../src/data/applications";

const descriptors = [
  {
    accessRole: "vuu-orders-access",
    clientIdentifier: "vuu-orders",
    name: "orders",
    navIconName: "orders",
    title: "Orders",
  },
  {
    accessRole: "vuu-risk-access",
    clientIdentifier: "vuu-risk",
    name: "risk",
    navIconUrl: "http://localhost/risk.svg",
    title: "Risk",
  },
  {
    accessRole: "vuu-basket-access",
    clientIdentifier: "vuu-basket",
    name: "basket",
    title: "Basket Trading",
  },
];

const remoteModules = descriptors.map((descriptor, id) => ({
  ...descriptor,
  description: "",
  id,
  mfComponent: "Module",
  mfScope: descriptor.name,
  mfUrl: "http://localhost",
  navLocation: `/Apps/${descriptor.title}`,
  path: `/${descriptor.name}`,
  version: 1,
}));

describe("AppAvatar", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  const renderAvatar = async (name: string) => {
    const application = deriveApplications(remoteModules).applications.find(
      (app) => app.name === name,
    );
    await act(async () =>
      root.render(
        <PortalModuleRegistryProvider remoteModules={remoteModules}>
          <AppAvatar application={application} />
        </PortalModuleRegistryProvider>,
      ),
    );
    return container.querySelector<HTMLElement>(".saltAvatar")!;
  };

  it("shows the application's named navigation icon", async () => {
    const avatar = await renderAvatar("orders");
    const icon = avatar.querySelector<HTMLElement>(".vuuIcon");
    expect(icon?.dataset.icon).toBe("orders");
    expect(avatar.textContent).toBe("");
  });

  it("shows the application's navigation icon url", async () => {
    const avatar = await renderAvatar("risk");
    const icon = avatar.querySelector<HTMLElement>(".vuuIcon");
    expect(icon?.dataset.icon).toBe("custom");
    expect(icon?.style.getPropertyValue("--vuu-icon-svg")).toBe(
      "url('http://localhost/risk.svg')",
    );
  });

  it("falls back to initials without an icon", async () => {
    const avatar = await renderAvatar("basket");
    expect(avatar.querySelector(".vuuIcon")).toBeNull();
    expect(avatar.textContent).toBe("BT");
  });
});
