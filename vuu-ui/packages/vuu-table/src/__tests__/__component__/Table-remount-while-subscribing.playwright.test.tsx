import { PwTable } from "@vuu-ui/vuu-playwright-helpers";
import { expect, test } from "../../../../../playwright/fixtures";

test.describe("Table remounted while its dataSource is subscribing", () => {
  test("THEN the Table does not throw and rows render once subscribed", async ({
    mount,
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await mount("Table/DataLoading/RemountWhileSubscribing");

    const completeSubscription = page.getByTestId("complete-subscription");
    await expect(completeSubscription).toBeEnabled();

    const toggle = page.getByTestId("toggle-table");
    await toggle.click();
    await expect(page.locator(".vuuTable")).not.toBeAttached();
    await toggle.click();
    await expect(page.locator(".vuuTable")).toBeAttached();

    await completeSubscription.click();

    const table = new PwTable(page);
    await table.dataLoaded;
    await expect(table.locateCell(2, 1)).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});
