import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ModulePicker,
  type ModulePickerModuleDescriptor,
} from "../src/components/module-picker/ModulePicker";

const ModulePickerHarness = ({
  allModules,
}: {
  allModules: ModulePickerModuleDescriptor[];
}) => {
  const [selectedModules, setSelectedModules] = useState<
    ModulePickerModuleDescriptor[]
  >([]);
  return (
    <ModulePicker
      allModules={allModules}
      onSelectedModulesChange={setSelectedModules}
      selectedModules={selectedModules}
    />
  );
};

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
        <ModulePickerHarness
          allModules={[
            {
              label: "Orders",
              name: "orders-access",
              permissions: ["read", "edit"],
              selectedPermissions: [],
            },
          ]}
        />,
      );
    });

    const headers = container.querySelectorAll(
      ".vuuItemPicker-sectionHeader",
    );
    expect(headers[0]?.textContent).toContain("modules in view");
    expect(headers[1]?.textContent).toContain("available module");

    const availableItem = container.querySelector(
      '[data-name="orders-access"]',
    );
    expect(
      availableItem?.querySelector(
        '[aria-label="Orders permission group"]',
      ),
    ).toBeNull();
    const addButton = availableItem?.querySelector(
      ".vuuItemPickerListItem-action",
    );
    if (!addButton) throw new Error("Missing module add button");
    expect(addButton.textContent).toContain("Add");
    expect(addButton.querySelector('[data-icon="plus"]')).not.toBeNull();

    await act(async () => (addButton as HTMLElement).click());

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
    const permissionComboBox = selectedItem?.querySelector(
      '[aria-label="Orders permission group"]',
    ) as HTMLElement | null;
    if (!permissionComboBox) throw new Error("Missing permission ComboBox");
    const permissionInput = permissionComboBox.querySelector("input");
    if (!permissionInput) throw new Error("Missing permission ComboBox input");
    await act(async () =>
      permissionInput.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }),
      ),
    );
    expect(permissionInput.getAttribute("aria-expanded")).toBe("true");
    expect(
      document.querySelector('[role="listbox"][aria-multiselectable="true"]'),
    ).not.toBeNull();
  });

  it("accepts explicit item names", async () => {
    await act(async () => {
      root.render(
        <ModulePickerHarness
          allModules={[
            { name: "User Admin", permissions: [], selectedPermissions: [] },
            { name: "Module Admin", permissions: [], selectedPermissions: [] },
            {
              name: "Basket Trading",
              permissions: [],
              selectedPermissions: [],
            },
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

