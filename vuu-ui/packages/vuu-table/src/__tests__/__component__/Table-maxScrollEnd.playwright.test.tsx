import { test } from "@playwright/experimental-ct-react";
import { expect } from "../../../../../playwright/customAssertions";
import { TableOM } from "./TableOM";
import { MaxScrollEndTable } from "../../../../../showcase/src/examples/Table/Modules/TEST.examples";

test.describe("Table maxScrollEnd", () => {
  test("pressing End stops at row 500 and shows scroll limit notice", async ({
    mount,
    page,
  }) => {
    await mount(<MaxScrollEndTable />);

    const table = new TableOM(page.getByRole("table"));

    let cell = table.locateCell(2, 1);
    await cell.click();
    await expect(cell).toBeFocused();

    await cell.press("End");

    cell = table.locateCell(501, 1);
    await expect(cell).toHaveAttribute("tabindex", "0");
    await expect(cell).toBeFocused();

    const outOfRangeCell = table.locateCell(502, 1);
    await expect(outOfRangeCell).not.toBeAttached();

    const notice = page.locator(".vuuScrollLimitNotice");
    await expect(notice).toBeVisible();
    await expect(notice).toContainText("There are 500 more rows");
    await expect(notice).toContainText(
      "we only allow scrolling through the first 500",
    );
  });
});
