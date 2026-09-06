import { expect, test } from "../../../../playwright/fixtures";

test.describe("FeatureList", () => {
  test("renders every grouped feature as a valid visible draggable row", async ({
    mount,
  }) => {
    const component = await mount("Shell/FeatureList/FeatureListWithGroups");
    const rows = component.locator(".vuuFeatureList-item");

    await expect(component.getByText("System Components")).toBeVisible();
    await expect(component.getByText("My Components")).toBeVisible();
    await expect(rows).toHaveCount(7);
    for (const row of await rows.all()) {
      await expect(row).toHaveAttribute("draggable", "true");
      await expect(row).toHaveAttribute(
        "data-template-component-type",
        "vuu-dynamic-feature",
      );
      await expect(row).toHaveAttribute("data-template-version", "1");
    }

    for (const label of [
      "Component 1",
      "Component 2",
      "Component 3",
      "Component 4",
      "My First Component",
      "Another component",
      "Life's a component",
    ]) {
      await expect(rows.filter({ hasText: label }).first()).toBeVisible();
    }

    await expect(rows.first()).toHaveCSS("height", "24px");
    await rows.first().dispatchEvent("dragstart");
    await rows.first().dispatchEvent("dragend");
  });

  test("renders ordinary dynamic features with the same draggable row geometry", async ({
    mount,
  }) => {
    const component = await mount("Shell/FeatureList/DefaultFeatureList");
    const rows = component.locator(".vuuFeatureList-item");

    await expect(rows).toHaveCount(4);
    for (const row of await rows.all()) {
      await expect(row).toBeVisible();
      await expect(row).toHaveCSS("height", "24px");
      await expect(row).toHaveAttribute("draggable", "true");
    }
  });
});
