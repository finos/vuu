import { expect, test } from "../../../../../playwright/fixtures";
import { PwTable } from "@vuu-ui/vuu-playwright-helpers";

test.describe("Table maxScrollEnd after remount", () => {
  test("a Table remounted on an existing dataSource still applies maxRangeEnd", async ({
    browserName,
    mount,
    page,
  }) => {
    await mount("Table/Modules/TEST/MaxScrollEndTableRemount");

    const table = new PwTable(page);
    await expect(table.locateCell(2, 1)).toBeVisible();

    const toggle = page.getByTestId("toggle-table");
    await toggle.click();
    await expect(page.locator(".vuuTable")).not.toBeAttached();
    await toggle.click();

    let cell = table.locateCell(2, 1);
    await cell.click();
    await expect(cell).toBeFocused();

    await cell.press("End");

    cell = table.locateCell(501, 1);
    if (browserName === "chromium") {
      await expect(cell).toBeFocused();
    }
    await expect(table.locateCell(502, 1)).not.toBeAttached();

    const notice = page.locator(".vuuScrollLimitNotice");
    await expect(notice).toBeVisible();
    await expect(notice).toContainText("There are 500 more rows");
  });
});
