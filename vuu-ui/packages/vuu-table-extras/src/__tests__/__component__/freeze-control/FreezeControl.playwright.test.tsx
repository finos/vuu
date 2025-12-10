import {
  test,
  expect,
  type MountResult,
} from "@playwright/experimental-ct-react";
import type { Locator } from "@playwright/experimental-ct-core";
import {
  DefaultFreezeControl,
  FrozenFreezeControl,
} from "../../../../../../showcase/src/examples/TableExtras/FreezeControl.examples";

// Section below just to improve test readability
type ComponentFixture = MountResult;
type LocatorType = Locator;

const verifyBadgeEquals = async (badge: LocatorType, expectedValue: number) => {
  await expect(badge).toHaveText(String(expectedValue));
};

const verifyNoOverflow = async (badge: LocatorType) => {
  await expect(badge).not.toHaveAttribute("data-overflow", "true");
  await expect(badge).not.toHaveClass("vuuFreezeControl-customBadge-overflow");
};

const verifyPlusSignNotVisible = async (component: ComponentFixture) => {
  await expect(component.locator(".vuuFreezeControl-plus")).not.toBeVisible();
};

test.describe("Given a FreezeControl", () => {
  test("THEN it loads with Freeze and Active buttons, with Active selected", async ({
    mount,
  }) => {
    const component = await mount(<DefaultFreezeControl />);

    const activeButton = component.locator('button[value="live"]');
    const freezeButton = component.locator('button[value="frozen"]');

    await expect(activeButton).toBeVisible();
    await expect(freezeButton).toBeVisible();

    const buttonGroup = component.locator(".saltToggleButtonGroup");
    await expect(buttonGroup).toBeVisible();

    const activeWrapper = component
      .locator(".vuuFreezeControl-buttonWrapper-active")
      .first();
    await expect(activeWrapper).toBeVisible();
  });

  test("WHEN frozen THEN New Orders section appears with counter at 0", async ({
    mount,
  }) => {
    const component = await mount(<FrozenFreezeControl />);

    const newOrdersSection = component.locator(".vuuFreezeControl-newOrders");
    await expect(newOrdersSection).toBeVisible();
    await expect(newOrdersSection).toContainText("New Orders");

    const badge = component.locator(".vuuFreezeControl-customBadge");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("0");
  });

  test("WHEN badge value is 99 or less THEN it displays the exact number", async ({
    mount,
  }) => {
    const component = await mount(<FrozenFreezeControl />);

    const badge = component.locator(".vuuFreezeControl-customBadge");
    await expect(badge).toBeVisible();

    await verifyBadgeEquals(badge, 0);
    await verifyNoOverflow(badge);
    await verifyPlusSignNotVisible(component);
  });
});
