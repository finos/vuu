import type { Page } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";

const items = (page: Page) => page.locator(".vuuNotificationsPanel-item");

const closePanel = (page: Page) =>
  page.getByRole("button", { name: "Close notifications" }).click();

test.describe("NotificationsPanel open requests", () => {
  test("shows one application's notifications, then all of them from the bell", async ({
    mount,
  }) => {
    const component = await mount("VuuPortal/NotificationsPanel/OpenRequests");
    const page = component.page();
    await expect(items(page)).toHaveCount(9);

    await closePanel(page);
    await page
      .getByRole("button", { name: "Open for Order Management" })
      .click();
    await expect(
      page.getByRole("button", { name: "Remove Order Management filter" }),
    ).toBeVisible();
    await expect(items(page)).toHaveCount(4);

    await closePanel(page);
    await page.getByRole("button", { name: "Open notifications" }).click();
    await expect(
      page.getByRole("button", { name: "Remove Order Management filter" }),
    ).toHaveCount(0);
    await expect(items(page)).toHaveCount(9);
  });

  test("clears filters that would hide the notification it opens at", async ({
    mount,
  }) => {
    const component = await mount("VuuPortal/NotificationsPanel/OpenRequests");
    const page = component.page();
    await page
      .getByLabel("Levels")
      .locator(".vuuNotificationsPanel-levelPill", { hasText: "Error" })
      .click();
    await expect(items(page)).toHaveCount(2);

    await closePanel(page);
    await page.getByRole("button", { name: "Open at Market Status" }).click();
    await expect(items(page)).toHaveCount(9);
    await expect(
      page.locator('[data-notification-key="vuu-emea:n4"]'),
    ).toBeFocused();
  });
});
