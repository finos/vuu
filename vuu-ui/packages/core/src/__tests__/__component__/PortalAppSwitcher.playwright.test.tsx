import { expect, test } from "../../../../../playwright/fixtures";

test.describe("PortalAppSwitcher", () => {
  test("rebuilds navigation when menuStyle changes", async ({ mount }) => {
    const story = "VuuPortal/AppSwitcher/NestedAppSwitcher";
    const component = await mount(story, { menuStyle: "two-level" });

    await expect(component.getByText("Trading", { exact: true })).toBeVisible();
    await expect(
      component.getByText("Trading: Orders", { exact: true }),
    ).toHaveCount(0);

    await mount(story, { menuStyle: "single-level" });

    await expect(
      component.getByText("Trading: Orders", { exact: true }),
    ).toBeVisible();
    await expect(component.getByText("Trading", { exact: true })).toHaveCount(
      0,
    );
  });

  test("navigates between nested modules and marks the active item", async ({
    mount,
  }) => {
    const component = await mount("VuuPortal/AppSwitcher/NestedAppSwitcher");

    await component.getByRole("button", { name: "Trading" }).click();
    const positions = component.getByRole("link", { name: "Positions" });
    await expect(positions).toBeVisible();
    await positions.click();

    await expect(
      component.locator(".saltVerticalNavigationItemContent-active"),
    ).toContainText("Positions");
  });

  test("navigates from the icon-only switcher", async ({ mount }) => {
    const component = await mount("VuuPortal/AppSwitcher/IconOnlyAppSwitcher");
    const orders = component.getByRole("link", { name: "Orders" });

    await expect(orders).toBeVisible();
    await orders.click();

    await expect(orders).toHaveClass(/vuuIconNavItem-active/);
    await expect(component.locator(".vuuIconNavItem")).toHaveCount(3);
  });
});
