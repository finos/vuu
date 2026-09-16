import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  PortalModuleRegistryProvider,
  type RemoteModuleDescriptor,
} from "@vuu-ui/core/portal";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModulePicker } from "../src/components/module-picker/ModulePicker";

const remoteModules = [
  {
    clientIdentifier: "vuu-orders",
    description: "Orders module",
    id: "orders",
    location: "orders",
    loginRole: "orders-access",
    mfComponent: "Orders",
    mfScope: "orders",
    mfUrl: "http://localhost:5001",
    name: "orders",
    path: "/orders",
    title: "Orders",
    version: 1,
  },
] satisfies readonly RemoteModuleDescriptor[];

describe("ModulePicker", () => {
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

  it("renders available modules first and selected modules without a drag handle", async () => {
    await act(async () => {
      root.render(
        <PortalModuleRegistryProvider remoteModules={remoteModules}>
          <ModulePicker />
        </PortalModuleRegistryProvider>,
      );
    });

    const headers = container.querySelectorAll(
      ".vuuItemPicker-sectionHeader",
    );
    expect(headers[0]?.textContent).toContain("available module");
    expect(headers[1]?.textContent).toContain("modules in view");

    const availableItem = container.querySelector(
      '[data-name="orders-access"]',
    );
    expect(
      availableItem?.querySelector(
        '[aria-label="Orders permission group"]',
      ),
    ).not.toBeNull();
    const permissionDropdown = availableItem?.querySelector(
      '[aria-label="Orders permission group"]',
    ) as HTMLButtonElement | null;
    if (!permissionDropdown) throw new Error("Missing permission dropdown");
    await act(async () => permissionDropdown.click());
    expect(permissionDropdown.getAttribute("aria-expanded")).toBe("true");
    const addButton = availableItem?.querySelector(
      ".vuuItemPickerListItem-action",
    );
    if (!addButton) throw new Error("Missing module add button");
    expect(addButton.textContent).toContain("Add");
    expect(addButton.querySelector('[data-icon="plus"]')).not.toBeNull();

    await act(async () => addButton.click());

    const selectedItem = container.querySelector(
      '.vuuItemPicker-selectedList [data-name="orders-access"]',
    );
    expect(selectedItem).not.toBeNull();
    expect(selectedItem?.querySelector('[data-icon="draggable"]')).toBeNull();
    expect(
      selectedItem?.querySelector('[data-icon="cross"]'),
    ).not.toBeNull();
    expect(
      selectedItem?.querySelector(
        '[aria-label="Orders permission group"]',
      ),
    ).not.toBeNull();
  });

  it("accepts explicit item names", async () => {
    await act(async () => {
      root.render(
        <ModulePicker
          allItems={[
            { name: "User Admin" },
            { name: "Module Admin" },
            { name: "Basket Trading" },
          ]}
        />,
      );
    });

    expect(
      Array.from(
        container.querySelectorAll(
          ".vuuItemPicker-availableList [data-name]",
        ),
      ).map((item) => item.getAttribute("data-name")),
    ).toEqual(["Basket Trading", "Module Admin", "User Admin"]);
  });
});
